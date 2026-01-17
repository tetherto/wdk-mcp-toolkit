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

/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */

/**
 * Registers the 'buy' tool for purchasing crypto with fiat currency.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function buy (server) {
  const fiatChains = server.getFiatChains()

  if (fiatChains.length === 0) return

  server.registerTool(
    'buy',
    {
      title: 'Buy Crypto with Fiat',
      description: `Generate a URL to purchase cryptocurrency with fiat currency.

This tool generates a widget URL from the fiat on-ramp provider (e.g., MoonPay) where the user can complete their crypto purchase with a credit card, bank transfer, or other payment method. The user must open the URL to complete the transaction.

Args:
  - chain (REQUIRED): The blockchain for the fiat protocol
  - cryptoAsset (REQUIRED): The crypto asset code to buy (e.g., "eth", "btc", "usdt")
  - fiatCurrency (REQUIRED): The fiat currency code (e.g., "USD", "EUR")
  - amount (REQUIRED): The amount to purchase
  - amountType (REQUIRED): Whether amount is in crypto or fiat
  - recipient (OPTIONAL): Wallet address to receive crypto (defaults to wallet address)

Returns:
  JSON format:
  {
    "protocol": "moonpay",
    "buyUrl": "https://buy.moonpay.com/..."
  }

Examples:
  - Use when: "Buy $100 worth of ETH"
  - Use when: "Purchase 0.5 BTC with USD"
  - Use when: "I want to buy crypto with my credit card"
  - Don't use when: User only wants a quote (use quoteBuy instead)

Notes:
  - Returns a URL that user must open to complete purchase
  - KYC verification may be required by the provider
  - Payment methods vary by provider and region

Error Handling:
  - Returns error if no fiat protocol registered for the chain
  - Returns error if crypto asset or fiat currency not supported`,
      inputSchema: z.object({
        chain: z.enum(fiatChains).describe('The blockchain for the fiat protocol'),
        cryptoAsset: z.string().describe('The crypto asset code to buy (e.g., "eth", "btc")'),
        fiatCurrency: z.string().describe('The fiat currency code (e.g., "USD", "EUR")'),
        amount: z.string().describe('The amount to purchase'),
        amountType: z.enum(['crypto', 'fiat']).describe('Whether amount is in crypto or fiat'),
        recipient: z.string().optional().describe('Wallet address to receive crypto (defaults to wallet address)')
      }),
      outputSchema: z.object({
        protocol: z.string().describe('The fiat protocol used'),
        buyUrl: z.string().describe('URL to complete the purchase')
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ chain, cryptoAsset, fiatCurrency, amount, amountType, recipient }) => {
      try {
        const protocols = server.getFiatProtocols(chain)

        if (protocols.length === 0) {
          return {
            isError: true,
            content: [{ type: 'text', text: `No fiat protocol registered for ${chain}.` }]
          }
        }

        const label = protocols[0]
        const account = await server.wdk.getAccount(chain, 0)
        const fiatProtocol = account.getFiatProtocol(label)

        const options = {
          cryptoAsset,
          fiatCurrency,
          recipient: recipient || await account.getAddress()
        }

        if (amountType === 'crypto') {
          options.cryptoAmount = BigInt(amount)
        } else {
          options.fiatAmount = BigInt(amount)
        }

        const buyResult = await fiatProtocol.buy(options)

        const result = {
          protocol: label,
          buyUrl: buyResult.buyUrl
        }

        return {
          content: [{
            type: 'text',
            text: `Open this URL to complete your purchase:\n\n${buyResult.buyUrl}`
          }],
          structuredContent: result
        }
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error generating buy URL: ${error.message}` }]
        }
      }
    }
  )
}