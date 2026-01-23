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
 * Registers the 'quoteTransfer' tool for quoting token transfer fees.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function quoteTransfer (server) {
  const chains = server.getChains()

  server.registerTool(
    'quoteTransfer',
    {
      title: 'Quote Token Transfer Fee',
      description: `Get fee estimate for transferring a token.

This tool calculates the estimated network fee for transferring a token without actually executing the transfer. This allows you to preview costs before executing a token transfer. This is a read-only operation that does NOT modify the wallet or transfer any tokens.

IMPORTANT: This tool requires the exact recipient address and exact amount to provide an accurate fee quote. If the user has not provided these values, you MUST ask them for:
  1. The exact recipient address
  2. The exact amount they want to transfer

Args:
  - chain (REQUIRED): The blockchain to quote on
  - token (REQUIRED): Token symbol (e.g., "USDT", "USDC")
  - recipient (REQUIRED): The recipient's address (string)
  - amount (REQUIRED): The amount to transfer in HUMAN-READABLE format (string)
    * Examples: "10" means 10 USDT, "0.5" means 0.5 DAI, "100.25" means 100.25 USDC
    * DO NOT use base units - tool handles conversion automatically
    * Use decimal notation for fractional amounts

Returns:
  Text format: "Estimated fee for transferring {amount} {token}: {fee}"
  
  Structured output:
  {
    "fee": "21000000000000000"
  }

Examples:
  - Use when: "How much will it cost to send 10 USDT to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7?"
    → chain: "ethereum", token: "USDT", amount: "10", recipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7"
  
  - Use when: "Estimate gas for transferring 0.5 DAI to 0xabc..."
    → chain: "ethereum", token: "DAI", amount: "0.5", recipient: "0xabc..."
  
  - Don't use when: User asks "how much does it cost to send tokens?" without providing address or amount
  - Don't use when: You want to actually transfer tokens (this is quote only)

If user asks for fee estimate without providing address and amount:
    DON'T call this tool
    DO ask: "To provide an accurate fee quote, I need the recipient address and the exact amount you want to transfer."

Error Handling:
  - Returns error if wallet is not registered for the specified chain
  - Returns error if token symbol is not registered (shows available tokens)
  - Returns error if recipient address is invalid
  - Returns error if amount is invalid or cannot be parsed
  - Returns error if insufficient balance`,
      inputSchema: z.object({
        chain: z.enum(chains).describe('The blockchain to quote on'),
        token: z.string().describe('Token symbol (e.g., "USDT", "USDC", "DAI")'),
        recipient: z.string().describe('The recipient address'),
        amount: z.string().describe('The amount to transfer in human-readable format (e.g., "10" or "0.5")')
      }),
      outputSchema: z.object({
        fee: z.string().describe('Estimated transaction fee in base units')
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ chain, token, recipient, amount }) => {
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

        const baseUnitAmount = parseAmountToBaseUnits(amount, decimals)

        if (baseUnitAmount === 0n) {
          throw new Error('Amount must be greater than zero')
        }

        const account = await server.wdk.getAccount(chain, 0)
        const result = await account.quoteTransfer({
          token: tokenAddress,
          recipient,
          amount: baseUnitAmount
        })

        const feeStr = result.fee.toString()

        return {
          content: [{
            type: 'text',
            text: `Estimated fee for transferring ${amount} ${tokenSymbol}: ${feeStr}`
          }],
          structuredContent: {
            fee: feeStr
          }
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Error quoting transfer on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}
