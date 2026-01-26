// Copyright 2025 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict'

import { z } from 'zod'
import { parseAmountToBaseUnits } from '../../utils/index.js'

/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */

/**
 * Registers the 'bridge' tool for executing cross-chain bridge operations.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function bridge (server) {
  const bridgeChains = server.getBridgeChains()

  if (bridgeChains.length === 0) return

  server.registerTool(
    'bridge',
    {
      title: 'Bridge Tokens',
      description: `Bridge tokens to another blockchain using a cross-chain bridge protocol.

This tool executes a token bridge operation from the source blockchain to the target blockchain. Before executing, it quotes the bridge to show expected fees, shows you a confirmation dialog with all details, waits for your explicit approval, and only then broadcasts the transaction. This is a DESTRUCTIVE operation that will spend funds from your wallet.

Args:
  - chain (REQUIRED): The source blockchain to bridge from
  - targetChain (REQUIRED): The destination blockchain to bridge to
  - token (REQUIRED): The token symbol to bridge (must be registered)
  - amount (REQUIRED): The amount in human-readable units (e.g., "100" for 100 tokens)
  - recipient (OPTIONAL): The recipient address on the target chain (defaults to wallet address)

Returns:
  Text format: "Bridge initiated! Hash: {hash}"
  
  Structured output:
  {
    "success": true,
    "protocol": "usdt0",
    "hash": "0x123...",
    "sourceChain": "ethereum",
    "targetChain": "arbitrum",
    "token": "USDT",
    "amount": "100",
    "fee": "21000000000000",
    "bridgeFee": "500000000000000"
  }

Examples:
  - Use when: "Bridge 100 USDT to Arbitrum"
  - Use when: "Send my USDT from Ethereum to Polygon"
  - Use when: "Move 50 USDT to Arbitrum for 0x123..."
  - Don't use when: User only wants a quote (use quoteBridge instead)

Notes:
  - Token approval may be required before bridging (use approve tool)
  - Bridge finality varies by target chain (may take minutes to hours)
  - Fees include both gas fee and bridge protocol fee

Error Handling:
  - Returns error if no bridge protocol registered for the chain
  - Returns error if token symbol is not registered
  - Returns error if target chain is not supported
  - Returns error if insufficient balance or allowance
  - Returns "Bridge cancelled" if user declines confirmation`,
      inputSchema: z.object({
        chain: z.enum(bridgeChains).describe('The source blockchain to bridge from'),
        targetChain: z.string().describe('The destination blockchain to bridge to'),
        token: z.string().describe('The token symbol to bridge (e.g., "USDT")'),
        amount: z.string().describe('The amount in human-readable units (e.g., "100")'),
        recipient: z.string().optional().describe('Recipient address on target chain (defaults to wallet address)')
      }),
      outputSchema: z.object({
        success: z.boolean().describe('Whether the bridge succeeded'),
        protocol: z.string().describe('The bridge protocol used'),
        hash: z.string().describe('Transaction hash'),
        sourceChain: z.string().describe('Source blockchain'),
        targetChain: z.string().describe('Destination blockchain'),
        token: z.string().describe('Token symbol'),
        amount: z.string().describe('Amount bridged'),
        fee: z.string().describe('Gas fee paid'),
        bridgeFee: z.string().describe('Bridge protocol fee paid')
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ chain, targetChain, token, amount, recipient }) => {
      try {
        const protocols = server.getBridgeProtocols(chain)

        if (protocols.length === 0) {
          return {
            isError: true,
            content: [{ type: 'text', text: `No bridge protocol registered for ${chain}.` }]
          }
        }

        const tokenInfo = server.getTokenInfo(chain, token)
        if (!tokenInfo) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Token ${token} not registered for ${chain}.` }]
          }
        }

        const label = protocols[0]
        const account = await server.wdk.getAccount(chain, 0)
        const bridgeProtocol = account.getBridgeProtocol(label)

        const baseAmount = parseAmountToBaseUnits(amount, tokenInfo.decimals)
        const recipientAddress = recipient || await account.getAddress()

        const options = {
          targetChain,
          token: tokenInfo.address,
          amount: baseAmount,
          recipient: recipientAddress
        }

        const quote = await bridgeProtocol.quoteBridge(options)

        const totalFee = BigInt(quote.fee) + BigInt(quote.bridgeFee)

        const confirmationMessage = `⚠️  BRIDGE CONFIRMATION REQUIRED

Protocol: ${label}
From: ${chain}
To: ${targetChain}
Token: ${token}
Amount: ${amount}
Recipient: ${recipientAddress}
Gas Fee: ${quote.fee.toString()}
Bridge Fee: ${quote.bridgeFee.toString()}
Total Fee: ${totalFee.toString()}

This bridge is IRREVERSIBLE once broadcast. Tokens will arrive on ${targetChain} after confirmation (may take minutes to hours).

Do you want to proceed with this bridge?`

        const confirmation = await server.server.elicitInput({
          message: confirmationMessage,
          requestedSchema: {
            type: 'object',
            properties: {
              confirmed: {
                type: 'boolean',
                title: 'Confirm Bridge',
                description: 'Check to confirm and execute bridge'
              }
            },
            required: ['confirmed']
          }
        })

        if (confirmation.action !== 'accept' || !confirmation.content?.confirmed) {
          return {
            content: [{ type: 'text', text: 'Bridge cancelled by user. No funds were spent.' }]
          }
        }

        const bridgeResult = await bridgeProtocol.bridge(options)

        const result = {
          success: true,
          protocol: label,
          hash: bridgeResult.hash,
          sourceChain: chain,
          targetChain,
          token,
          amount,
          fee: bridgeResult.fee.toString(),
          bridgeFee: bridgeResult.bridgeFee.toString()
        }

        return {
          content: [{ type: 'text', text: `Bridge initiated! Hash: ${bridgeResult.hash}` }],
          structuredContent: result
        }
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error executing bridge: ${error.message}` }]
        }
      }
    }
  )
}
