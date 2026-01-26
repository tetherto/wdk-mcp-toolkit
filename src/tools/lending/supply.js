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
 * Registers the 'supply' tool for supplying tokens to lending pools.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function supply (server) {
  const lendingChains = server.getLendingChains()

  if (lendingChains.length === 0) return

  server.registerTool(
    'supply',
    {
      title: 'Supply to Lending Pool',
      description: `Supply tokens to a DeFi lending pool to earn interest.

This tool supplies tokens to a lending protocol like Aave. Before executing, it quotes the transaction to show expected fees, shows you a confirmation dialog with all details, waits for your explicit approval, and only then broadcasts the transaction. This is a DESTRUCTIVE operation that will spend funds from your wallet.

Args:
  - chain (REQUIRED): The blockchain where the lending pool is
  - token (REQUIRED): The token symbol to supply (must be registered)
  - amount (REQUIRED): The amount in human-readable units (e.g., "100" for 100 tokens)
  - onBehalfOf (OPTIONAL): Address to receive the aTokens (defaults to wallet address)

Returns:
  Text format: "Supply successful! Hash: {hash}"
  
  Structured output:
  {
    "success": true,
    "protocol": "aave",
    "hash": "0x123...",
    "chain": "ethereum",
    "token": "USDT",
    "amount": "100",
    "fee": "21000000000000"
  }

Examples:
  - Use when: "Supply 100 USDT to Aave"
  - Use when: "Deposit my USDT into the lending pool"
  - Use when: "Lend 500 USDT on Ethereum"
  - Don't use when: User only wants a quote (use quoteSupply instead)

Notes:
  - Token approval may be required before supplying (use approve tool)
  - Supplied tokens earn interest over time
  - You receive aTokens representing your deposit

Error Handling:
  - Returns error if no lending protocol registered for the chain
  - Returns error if token symbol is not registered
  - Returns error if insufficient balance or allowance
  - Returns "Supply cancelled" if user declines confirmation`,
      inputSchema: z.object({
        chain: z.enum(lendingChains).describe('The blockchain where the lending pool is'),
        token: z.string().describe('The token symbol to supply (e.g., "USDT")'),
        amount: z.string().describe('The amount in human-readable units (e.g., "100")'),
        onBehalfOf: z.string().optional().describe('Address to receive aTokens (defaults to wallet address)')
      }),
      outputSchema: z.object({
        success: z.boolean().describe('Whether the supply succeeded'),
        protocol: z.string().describe('The lending protocol used'),
        hash: z.string().describe('Transaction hash'),
        chain: z.string().describe('Blockchain'),
        token: z.string().describe('Token symbol'),
        amount: z.string().describe('Amount supplied'),
        fee: z.string().describe('Gas fee paid')
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ chain, token, amount, onBehalfOf }) => {
      try {
        const protocols = server.getLendingProtocols(chain)

        if (protocols.length === 0) {
          return {
            isError: true,
            content: [{ type: 'text', text: `No lending protocol registered for ${chain}.` }]
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
        const lendingProtocol = account.getLendingProtocol(label)

        const baseAmount = parseAmountToBaseUnits(amount, tokenInfo.decimals)
        const onBehalfOfAddress = onBehalfOf || await account.getAddress()

        const options = {
          token: tokenInfo.address,
          amount: baseAmount,
          onBehalfOf: onBehalfOfAddress
        }

        const quote = await lendingProtocol.quoteSupply(options)

        const confirmationMessage = `⚠️  SUPPLY CONFIRMATION REQUIRED

Protocol: ${label}
Chain: ${chain}
Token: ${token}
Amount: ${amount}
Recipient (aTokens): ${onBehalfOfAddress}
Estimated Fee: ${quote.fee.toString()}

You will receive aTokens representing your deposit. This transaction is IRREVERSIBLE once broadcast.

Do you want to proceed with this supply?`

        const confirmation = await server.server.elicitInput({
          message: confirmationMessage,
          requestedSchema: {
            type: 'object',
            properties: {
              confirmed: {
                type: 'boolean',
                title: 'Confirm Supply',
                description: 'Check to confirm and execute supply'
              }
            },
            required: ['confirmed']
          }
        })

        if (confirmation.action !== 'accept' || !confirmation.content?.confirmed) {
          return {
            content: [{ type: 'text', text: 'Supply cancelled by user. No funds were spent.' }]
          }
        }

        const supplyResult = await lendingProtocol.supply(options)

        const result = {
          success: true,
          protocol: label,
          hash: supplyResult.hash,
          chain,
          token,
          amount,
          fee: supplyResult.fee.toString()
        }

        return {
          content: [{ type: 'text', text: `Supply successful! Hash: ${supplyResult.hash}` }],
          structuredContent: result
        }
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error executing supply: ${error.message}` }]
        }
      }
    }
  )
}
