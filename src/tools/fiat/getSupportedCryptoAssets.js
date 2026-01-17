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
 * Registers the 'getSupportedCryptoAssets' tool for listing supported crypto assets.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getSupportedCryptoAssets (server) {
  const fiatChains = server.getFiatChains()

  if (fiatChains.length === 0) return

  server.registerTool(
    'getSupportedCryptoAssets',
    {
      title: 'Get Supported Crypto Assets',
      description: `Get the list of crypto assets supported by the fiat on/off-ramp provider.

This tool retrieves all crypto assets that can be bought or sold through the fiat provider. Use this to check if a specific asset is supported before attempting a transaction. This is a read-only operation.

Args:
  - chain (REQUIRED): The blockchain for the fiat protocol

Returns:
  JSON array of supported assets:
  [
    {
      "code": "eth",
      "name": "Ethereum",
      "networkCode": "ethereum",
      "decimals": 18
    },
    ...
  ]

Examples:
  - Use when: "What crypto can I buy with MoonPay?"
  - Use when: "Is USDT supported for purchase?"
  - Use when: "List all available cryptocurrencies"

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

        const assets = await fiatProtocol.getSupportedCryptoAssets()

        const result = assets.map(asset => ({
          code: asset.code,
          name: asset.name,
          networkCode: asset.networkCode,
          decimals: asset.decimals
        }))

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          structuredContent: result
        }
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error getting supported crypto assets: ${error.message}` }]
        }
      }
    }
  )
}
