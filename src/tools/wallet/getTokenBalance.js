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
import { formatBaseUnitsToAmount } from '../../utils/index.js'

/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */

/**
 * Registers the 'getTokenBalance' tool for retrieving token balances.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getTokenBalance (server) {
  const chains = server.getChains()

  server.registerTool(
    'getTokenBalance',
    {
      title: 'Get Token Balance',
      description: `Get the token balance for a specific token.

This tool retrieves the balance of a token for the wallet. You must specify the token by its registered symbol. The balance is returned in human-readable format (e.g., 94.428840 USDT). This is a read-only operation.

Args:
  - chain (REQUIRED): The blockchain to check
  - token (REQUIRED): Token symbol (e.g., "USDT", "USDC")

Returns:
  Text format: "Balance: {amount} {symbol} ({rawAmount} base units)"
  
  Structured output:
  {
    "balance": "94.428840",
    "balanceRaw": "94428840"
  }
  
  Example: "Balance: 94.428840 USDT (94428840 base units)"

Examples:
  - Use when: "What's my USDT balance on ethereum?"
  - Use when: "How many USDC tokens do I have?"
  - Use when: "Check my DAI balance on polygon"
  - Don't use when: You need native token balance (use getBalance instead)
  - Don't use when: Token symbol is not registered

Error Handling:
  - Returns error if wallet is not registered for the specified chain
  - Returns error if token symbol is not registered (shows available tokens)
  - Returns error if token contract doesn't exist on chain`,
      inputSchema: z.object({
        chain: z.enum(chains).describe('The blockchain to check'),
        token: z.string().describe('Token symbol (e.g., "USDT", "USDC", "DAI")')
      }),
      outputSchema: z.object({
        balance: z.string().describe('Token balance in human-readable format'),
        balanceRaw: z.string().describe('Token balance in base units')
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ chain, token }) => {
      try {
        const tokenSymbol = token.toUpperCase()
        const tokenInfo = server.getTokenInfo(chain, tokenSymbol)

        if (!tokenInfo) {
          const available = server.getRegisteredTokens(chain)
          throw new Error(
            `Token symbol "${token}" not registered for ${chain}. ` +
            `Available tokens: ${available.length > 0 ? available.join(', ') : 'none'}`
          )
        }

        const { address: tokenAddress, decimals } = tokenInfo

        const account = await server.wdk.getAccount(chain, 0)
        const balance = await account.getTokenBalance(tokenAddress)

        const rawBalance = balance.toString()
        const humanReadable = formatBaseUnitsToAmount(BigInt(balance), decimals)

        return {
          content: [{
            type: 'text',
            text: `Balance: ${humanReadable} ${tokenSymbol} (${rawBalance} base units)`
          }],
          structuredContent: {
            balance: humanReadable,
            balanceRaw: rawBalance
          }
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Error getting token balance on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}
