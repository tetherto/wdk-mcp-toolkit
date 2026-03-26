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
 * Registers the 'transfer' tool for transferring tokens.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function transfer (server) {
  const chains = server.getChains()

  server.registerTool(
    'transfer',
    {
      title: 'Transfer Token',
      description: `Transfer tokens on a blockchain.

This tool transfers tokens on the blockchain. Before executing, it quotes the transaction to calculate fees, shows you a confirmation dialog with all details, waits for your explicit approval, and only then broadcasts the transaction. This is a DESTRUCTIVE operation that will spend funds from your wallet.

Args:
  - chain (REQUIRED): The blockchain to transfer on
  - token (REQUIRED): Token symbol (e.g., "USDT", "USDC")
  - to (REQUIRED): The recipient's address (string)
  - amount (REQUIRED): The amount to transfer in HUMAN-READABLE format (string)
    * Examples: "10" means 10 USDT, "0.5" means 0.5 DAI
    * DO NOT use base units - tool handles conversion automatically

Returns:
  Text format: "Transfer sent! Hash: {hash} Fee: {fee}"
  
  Structured output:
  {
    "hash": "0xabc123...",
    "fee": "21000000000000"
  }

Examples:
  - Use when: "Transfer 10 USDT to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7 on ethereum"
  - Don't use when: You just want to check fees (use quoteTransfer instead)
  - Don't use when: Sending native currency (use sendTransaction instead)

Error Handling:
  - Returns error if wallet is not registered for the specified chain
  - Returns error if token symbol is not registered
  - Returns error if recipient address is invalid
  - Returns error if amount is invalid or zero
  - Returns "Transfer cancelled" if user declines confirmation`,
      inputSchema: z.object({
        chain: z.enum(chains).describe('The blockchain to transfer on'),
        token: z.string().describe('Token symbol (e.g., "USDT", "USDC", "DAI")'),
        to: z.string().describe('The recipient address'),
        amount: z.string().describe('The amount to transfer in human-readable format (e.g., "10" or "0.5")')
      }),
      outputSchema: z.object({
        hash: z.string().describe('Transaction hash'),
        fee: z.string().describe('Actual transaction fee paid in base units')
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ chain, token, to, amount }) => {
      try {
        const tokenSymbol = token.toUpperCase()
        const tokenInfo = server.getTokenInfo(chain, tokenSymbol)

        if (!tokenInfo) {
          const available = server.getRegisteredTokens(chain)
          throw new Error(
            `Token "${token}" not registered for ${chain}. ` +
            `Available tokens: ${available.length > 0 ? available.join(', ') : 'none'}`
          )
        }

        const { address: tokenAddress, decimals } = tokenInfo

        const baseUnitAmount = parseAmountToBaseUnits(amount, decimals)

        if (baseUnitAmount === 0n) {
          throw new Error('Amount must be greater than zero')
        }

        const account = await server.wdk.getAccount(chain, 0)

        const quote = await account.quoteTransfer({
          token: tokenAddress,
          recipient: to,
          amount: baseUnitAmount
        })

        const confirmationMessage = `⚠️  TOKEN TRANSFER CONFIRMATION REQUIRED

Token: ${tokenSymbol}
To: ${to}
Amount: ${amount} ${tokenSymbol} (${baseUnitAmount.toString()} base units)
Estimated Fee: ${quote.fee.toString()}

This transfer is IRREVERSIBLE once broadcast to the ${chain} network.

Do you want to proceed with this transfer?`

        const result = await server.requestConfirmation(confirmationMessage, {
          type: 'object',
          properties: {
            confirmed: {
              type: 'boolean',
              title: 'Confirm Transfer',
              description: 'Check to confirm and send transfer'
            }
          },
          required: ['confirmed']
        })

        if (result.action !== 'accept' || !result.content?.confirmed) {
          return {
            content: [{
              type: 'text',
              text: 'Transfer cancelled by user. No funds were spent.'
            }]
          }
        }

        const txResult = await account.transfer({
          token: tokenAddress,
          recipient: to,
          amount: baseUnitAmount
        })

        return {
          content: [{
            type: 'text',
            text: `Transfer sent! Hash: ${txResult.hash} Fee: ${txResult.fee.toString()}`
          }],
          structuredContent: {
            hash: txResult.hash,
            fee: txResult.fee.toString()
          }
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Error transferring token on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}
