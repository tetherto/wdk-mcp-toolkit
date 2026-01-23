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
 * Registers the 'quoteSell' tool for quoting crypto-to-fiat sales.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function quoteSell (server) {
  const fiatChains = server.getFiatChains()

  if (fiatChains.length === 0) return

  server.registerTool(
    'quoteSell',
    {
      title: 'Quote Sell Crypto',
      description: `Get a quote for selling cryptocurrency for fiat currency.

This tool retrieves a quote from the fiat off-ramp provider (e.g., MoonPay) showing how much fiat you'll receive for a given crypto amount. No transaction is executed. This is a read-only operation.

Args:
  - chain (REQUIRED): The blockchain for the fiat protocol
  - cryptoAsset (REQUIRED): The crypto asset code to sell (e.g., "eth", "btc", "usdt")
  - fiatCurrency (REQUIRED): The fiat currency code (e.g., "USD", "EUR")
  - cryptoAmount (REQUIRED): The crypto amount in base units to sell

Returns:
  JSON format:
  {
    "protocol": "moonpay",
    "cryptoAsset": "eth",
    "fiatCurrency": "USD",
    "cryptoAmount": "1000000000000000000",
    "fiatAmount": "345000",
    "fee": "1725",
    "rate": "3500.00"
  }

Examples:
  - Use when: "How much USD will I get for 1 ETH?"
  - Use when: "What's the sell price for 0.5 BTC?"
  - Use when: User wants to preview an off-ramp transaction
  - Don't use when: User wants to execute the sale (use sell instead)

Error Handling:
  - Returns error if no fiat protocol registered for the chain
  - Returns error if crypto asset or fiat currency not supported`,
      inputSchema: z.object({
        chain: z.enum(fiatChains).describe('The blockchain for the fiat protocol'),
        cryptoAsset: z.string().describe('The crypto asset code to sell (e.g., "eth", "btc")'),
        fiatCurrency: z.string().describe('The fiat currency code (e.g., "USD", "EUR")'),
        cryptoAmount: z.string().describe('The crypto amount in base units to sell')
      }),
      outputSchema: z.object({
        protocol: z.string().describe('The fiat protocol used'),
        cryptoAsset: z.string().describe('Crypto asset code'),
        fiatCurrency: z.string().describe('Fiat currency code'),
        cryptoAmount: z.string().describe('Crypto amount in base units'),
        fiatAmount: z.string().describe('Fiat amount in smallest units (e.g., cents)'),
        fee: z.string().describe('Total fee in fiat smallest units'),
        rate: z.string().describe('Exchange rate (1 crypto = X fiat)')
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ chain, cryptoAsset, fiatCurrency, cryptoAmount }) => {
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

        const quote = await fiatProtocol.quoteSell({
          cryptoAsset,
          fiatCurrency,
          cryptoAmount: BigInt(cryptoAmount)
        })

        const result = {
          protocol: label,
          cryptoAsset,
          fiatCurrency,
          cryptoAmount: quote.cryptoAmount.toString(),
          fiatAmount: quote.fiatAmount.toString(),
          fee: quote.fee.toString(),
          rate: quote.rate
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          structuredContent: result
        }
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error quoting sell: ${error.message}` }]
        }
      }
    }
  )
}
