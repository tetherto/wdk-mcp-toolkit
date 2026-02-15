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
 * Registers the 'repay' tool for repaying borrowed assets.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function repay (server) {
  const lendingChains = server.getLendingChains()

  if (lendingChains.length === 0) return

  server.registerTool(
    'repay',
    {
      title: 'Repay Debt',
      description: `Repay borrowed tokens to a DeFi lending pool.

This tool repays debt to a lending protocol like Aave, burning the equivalent debt tokens. Before executing, it quotes the transaction to show expected fees, shows you a confirmation dialog with all details, waits for your explicit approval, and only then broadcasts the transaction. This is a DESTRUCTIVE operation that will spend funds from your wallet.

Args:
  - chain (REQUIRED): The blockchain where the lending pool is
  - token (REQUIRED): The token symbol to repay (must be registered)
  - amount (REQUIRED): The amount in human-readable units (e.g., "100" for 100 tokens)
  - onBehalfOf (OPTIONAL): Address whose debt to repay (defaults to wallet address)

Returns:
  Text format: "Repay successful! Hash: {hash}"
  
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
  - Use when: "Repay 100 USDT to Aave"
  - Use when: "Pay back my loan"
  - Use when: "Clear my debt"
  - Don't use when: User only wants a quote (use quoteRepay instead)

Notes:
  - Token approval may be required before repaying (use approve tool)
  - Repaying reduces your debt and improves health factor
  - You can repay on behalf of another address

Error Handling:
  - Returns error if no lending protocol registered for the chain
  - Returns error if token symbol is not registered
  - Returns error if insufficient token balance
  - Returns "Repay cancelled" if user declines confirmation`,
      inputSchema: z.object({
        chain: z.enum(lendingChains).describe('The blockchain where the lending pool is'),
        token: z.string().describe('The token symbol to repay (e.g., "USDT")'),
        amount: z.string().describe('The amount in human-readable units (e.g., "100")'),
        onBehalfOf: z.string().optional().describe('Address whose debt to repay (defaults to wallet address)')
      }),
      outputSchema: z.object({
        success: z.boolean().describe('Whether the repay succeeded'),
        protocol: z.string().describe('The lending protocol used'),
        hash: z.string().describe('Transaction hash'),
        chain: z.string().describe('Blockchain'),
        token: z.string().describe('Token symbol'),
        amount: z.string().describe('Amount repaid'),
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

        const quote = await lendingProtocol.quoteRepay(options)

        const confirmationMessage = `⚠️  REPAY CONFIRMATION REQUIRED

Protocol: ${label}
Chain: ${chain}
Token: ${token}
Amount: ${amount}
Repaying for: ${onBehalfOfAddress}
Estimated Fee: ${quote.fee.toString()}

This will reduce your debt and improve your health factor. This transaction is IRREVERSIBLE once broadcast.

Do you want to proceed with this repayment?`

        const confirmation = await server.requestConfirmation(confirmationMessage, {
          type: 'object',
          properties: {
            confirmed: {
              type: 'boolean',
              title: 'Confirm Repay',
              description: 'Check to confirm and execute repayment'
            }
          },
          required: ['confirmed']
        })

        if (confirmation.action !== 'accept' || !confirmation.content?.confirmed) {
          return {
            content: [{ type: 'text', text: 'Repay cancelled by user. No funds were spent.' }]
          }
        }

        const repayResult = await lendingProtocol.repay(options)

        const result = {
          success: true,
          protocol: label,
          hash: repayResult.hash,
          chain,
          token,
          amount,
          fee: repayResult.fee.toString()
        }

        return {
          content: [{ type: 'text', text: `Repay successful! Hash: ${repayResult.hash}` }],
          structuredContent: result
        }
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error executing repay: ${error.message}` }]
        }
      }
    }
  )
}
