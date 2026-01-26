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
 * Registers the 'withdraw' tool for withdrawing from lending pools.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function withdraw (server) {
  const lendingChains = server.getLendingChains()

  if (lendingChains.length === 0) return

  server.registerTool(
    'withdraw',
    {
      title: 'Withdraw from Lending Pool',
      description: `Withdraw tokens from a DeFi lending pool.

This tool withdraws tokens from a lending protocol like Aave, burning the equivalent aTokens. Before executing, it quotes the transaction to show expected fees, shows you a confirmation dialog with all details, waits for your explicit approval, and only then broadcasts the transaction. This is a DESTRUCTIVE operation.

Args:
  - chain (REQUIRED): The blockchain where the lending pool is
  - token (REQUIRED): The token symbol to withdraw (must be registered)
  - amount (REQUIRED): The amount in human-readable units (e.g., "100" for 100 tokens)
  - to (OPTIONAL): Address to receive the withdrawn tokens (defaults to wallet address)

Returns:
  Text format: "Withdraw successful! Hash: {hash}"
  
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
  - Use when: "Withdraw 100 USDT from Aave"
  - Use when: "Take my USDT out of the lending pool"
  - Use when: "Remove 500 USDT from lending"
  - Don't use when: User only wants a quote (use quoteWithdraw instead)

Notes:
  - Your aTokens will be burned in exchange for the underlying tokens
  - Withdrawing may affect your health factor if used as collateral

Error Handling:
  - Returns error if no lending protocol registered for the chain
  - Returns error if token symbol is not registered
  - Returns error if insufficient aToken balance
  - Returns "Withdraw cancelled" if user declines confirmation`,
      inputSchema: z.object({
        chain: z.enum(lendingChains).describe('The blockchain where the lending pool is'),
        token: z.string().describe('The token symbol to withdraw (e.g., "USDT")'),
        amount: z.string().describe('The amount in human-readable units (e.g., "100")'),
        to: z.string().optional().describe('Address to receive tokens (defaults to wallet address)')
      }),
      outputSchema: z.object({
        success: z.boolean().describe('Whether the withdraw succeeded'),
        protocol: z.string().describe('The lending protocol used'),
        hash: z.string().describe('Transaction hash'),
        chain: z.string().describe('Blockchain'),
        token: z.string().describe('Token symbol'),
        amount: z.string().describe('Amount withdrawn'),
        fee: z.string().describe('Gas fee paid')
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ chain, token, amount, to }) => {
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
        const toAddress = to || await account.getAddress()

        const options = {
          token: tokenInfo.address,
          amount: baseAmount,
          to: toAddress
        }

        const quote = await lendingProtocol.quoteWithdraw(options)

        const confirmationMessage = `⚠️  WITHDRAW CONFIRMATION REQUIRED

Protocol: ${label}
Chain: ${chain}
Token: ${token}
Amount: ${amount}
Recipient: ${toAddress}
Estimated Fee: ${quote.fee.toString()}

Your aTokens will be burned in exchange for the underlying tokens. This transaction is IRREVERSIBLE once broadcast.

Do you want to proceed with this withdrawal?`

        const confirmation = await server.server.elicitInput({
          message: confirmationMessage,
          requestedSchema: {
            type: 'object',
            properties: {
              confirmed: {
                type: 'boolean',
                title: 'Confirm Withdraw',
                description: 'Check to confirm and execute withdrawal'
              }
            },
            required: ['confirmed']
          }
        })

        if (confirmation.action !== 'accept' || !confirmation.content?.confirmed) {
          return {
            content: [{ type: 'text', text: 'Withdraw cancelled by user. No funds were spent.' }]
          }
        }

        const withdrawResult = await lendingProtocol.withdraw(options)

        const result = {
          success: true,
          protocol: label,
          hash: withdrawResult.hash,
          chain,
          token,
          amount,
          fee: withdrawResult.fee.toString()
        }

        return {
          content: [{ type: 'text', text: `Withdraw successful! Hash: ${withdrawResult.hash}` }],
          structuredContent: result
        }
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error executing withdraw: ${error.message}` }]
        }
      }
    }
  )
}
