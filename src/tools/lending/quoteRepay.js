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
 * Registers the 'quoteRepay' tool for quoting debt repayments.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function quoteRepay (server) {
  const lendingChains = server.getLendingChains()

  if (lendingChains.length === 0) return

  server.registerTool(
    'quoteRepay',
    {
      title: 'Quote Repay Debt',
      description: `Get a quote for repaying borrowed tokens without executing.

This tool retrieves an estimated gas fee for repaying debt to a DeFi lending protocol like Aave. No transaction is broadcast. This is a read-only operation.

Args:
  - chain (REQUIRED): The blockchain where the lending pool is
  - token (REQUIRED): The token symbol to repay (must be registered)
  - amount (REQUIRED): The amount in human-readable units (e.g., "100" for 100 tokens)
  - onBehalfOf (OPTIONAL): Address whose debt to repay (defaults to wallet address)

Returns:
  JSON format:
  {
    "protocol": "aave",
    "chain": "ethereum",
    "token": "USDT",
    "amount": "100",
    "fee": "21000000000000"
  }

Examples:
  - Use when: "How much will it cost to repay 100 USDT?"
  - Use when: "What are the fees for paying back my loan?"
  - Don't use when: User wants to execute the repay (use repay instead)

Error Handling:
  - Returns error if no lending protocol registered for the chain
  - Returns error if token symbol is not registered`,
      inputSchema: z.object({
        chain: z.enum(lendingChains).describe('The blockchain where the lending pool is'),
        token: z.string().describe('The token symbol to repay (e.g., "USDT")'),
        amount: z.string().describe('The amount in human-readable units (e.g., "100")'),
        onBehalfOf: z.string().optional().describe('Address whose debt to repay (defaults to wallet address)')
      }),
      outputSchema: z.object({
        protocol: z.string().describe('The lending protocol used'),
        chain: z.string().describe('Blockchain'),
        token: z.string().describe('Token symbol'),
        amount: z.string().describe('Amount to repay'),
        fee: z.string().describe('Estimated gas fee')
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
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

        const options = {
          token: tokenInfo.address,
          amount: baseAmount,
          onBehalfOf: onBehalfOf || await account.getAddress()
        }

        const quote = await lendingProtocol.quoteRepay(options)

        const result = {
          protocol: label,
          chain,
          token,
          amount,
          fee: quote.fee.toString()
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          structuredContent: result
        }
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error quoting repay: ${error.message}` }]
        }
      }
    }
  )
}
