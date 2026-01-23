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
 * Registers the 'getSupportedFiatCurrencies' tool for listing supported fiat currencies.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getSupportedFiatCurrencies (server) {
  const fiatChains = server.getFiatChains()

  if (fiatChains.length === 0) return

  server.registerTool(
    'getSupportedFiatCurrencies',
    {
      title: 'Get Supported Fiat Currencies',
      description: `Get the list of fiat currencies supported by the on/off-ramp provider.

This tool retrieves all fiat currencies that can be used to buy or sell crypto through the provider. Use this to check if a specific currency is supported. This is a read-only operation.

Args:
  - chain (REQUIRED): The blockchain for the fiat protocol

Returns:
  JSON array of supported currencies:
  [
    {
      "code": "USD",
      "name": "United States Dollar",
      "decimals": 2
    },
    ...
  ]

Examples:
  - Use when: "What currencies can I use to buy crypto?"
  - Use when: "Is EUR supported?"
  - Use when: "List all available fiat currencies"

Error Handling:
  - Returns error if no fiat protocol registered for the chain`,
      inputSchema: z.object({
        chain: z.enum(fiatChains).describe('The blockchain for the fiat protocol')
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ chain }) => {
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

        const currencies = await fiatProtocol.getSupportedFiatCurrencies()

        const result = currencies.map(currency => ({
          code: currency.code,
          name: currency.name,
          decimals: currency.decimals
        }))

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          structuredContent: result
        }
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error getting supported fiat currencies: ${error.message}` }]
        }
      }
    }
  )
}
