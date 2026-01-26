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
 * Registers the 'sell' tool for selling crypto for fiat currency.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function sell (server) {
  const fiatChains = server.getFiatChains()

  if (fiatChains.length === 0) return

  server.registerTool(
    'sell',
    {
      title: 'Sell Crypto for Fiat',
      description: `Generate a URL to sell cryptocurrency for fiat currency.

This tool generates a widget URL from the fiat off-ramp provider (e.g., MoonPay) where the user can complete their crypto sale and receive fiat to their bank account. The user must open the URL to complete the transaction.

Args:
  - chain (REQUIRED): The blockchain for the fiat protocol
  - cryptoAsset (REQUIRED): The crypto asset code to sell (e.g., "eth", "btc", "usdt")
  - fiatCurrency (REQUIRED): The fiat currency code (e.g., "USD", "EUR")
  - cryptoAmount (REQUIRED): The crypto amount in base units to sell
  - refundAddress (OPTIONAL): Wallet address for refunds if sale fails (defaults to wallet address)

Returns:
  JSON format:
  {
    "protocol": "moonpay",
    "sellUrl": "https://sell.moonpay.com/..."
  }

Examples:
  - Use when: "Sell 1 ETH for USD"
  - Use when: "Cash out my BTC to my bank account"
  - Use when: "I want to off-ramp my crypto"
  - Don't use when: User only wants a quote (use quoteSell instead)

Notes:
  - Returns a URL that user must open to complete sale
  - KYC verification may be required by the provider
  - Payout methods vary by provider and region

Error Handling:
  - Returns error if no fiat protocol registered for the chain
  - Returns error if crypto asset or fiat currency not supported`,
      inputSchema: z.object({
        chain: z.enum(fiatChains).describe('The blockchain for the fiat protocol'),
        cryptoAsset: z.string().describe('The crypto asset code to sell (e.g., "eth", "btc")'),
        fiatCurrency: z.string().describe('The fiat currency code (e.g., "USD", "EUR")'),
        cryptoAmount: z.string().describe('The crypto amount in base units to sell'),
        refundAddress: z.string().optional().describe('Wallet address for refunds (defaults to wallet address)')
      }),
      outputSchema: z.object({
        protocol: z.string().describe('The fiat protocol used'),
        sellUrl: z.string().describe('URL to complete the sale')
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ chain, cryptoAsset, fiatCurrency, cryptoAmount, refundAddress }) => {
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

        const sellResult = await fiatProtocol.sell({
          cryptoAsset,
          fiatCurrency,
          cryptoAmount: BigInt(cryptoAmount),
          refundAddress: refundAddress || await account.getAddress()
        })

        const result = {
          protocol: label,
          sellUrl: sellResult.sellUrl
        }

        return {
          content: [{
            type: 'text',
            text: `Open this URL to complete your sale:\n\n${sellResult.sellUrl}`
          }],
          structuredContent: result
        }
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error generating sell URL: ${error.message}` }]
        }
      }
    }
  )
}
