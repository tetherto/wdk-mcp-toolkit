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
 * Registers the 'getFeeRates' tool for retrieving network fee rates.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getFeeRates (server) {
  const chains = server.getChains()

  server.registerTool(
    'getFeeRates',
    {
      title: 'Get Network Fee Rates',
      description: `Get current network fee rates for a blockchain.

This tool retrieves the current fee rates for transactions. Fee rates are returned in the chain's base unit (satoshis for Bitcoin, wei for Ethereum, etc.) and include two speed tiers: normal and fast. Higher fees result in faster transaction confirmation. This is a read-only operation.

Args:
  - chain (REQUIRED): The blockchain to get the fee rates for

Returns:
  JSON format with two fee tiers:
  {
    "normal": "10000", // Balanced fee and speed
    "fast": "20000"    // Higher fee, faster confirmation
  }
  
  Units by chain:
  - Bitcoin: satoshis per byte
  - Ethereum: wei (gwei = wei / 1,000,000,000)
  - Other chains: chain-specific base unit

Examples:
  - Use when: "What are the current ethereum fees?"
  - Use when: "How much will a bitcoin transaction cost?"
  - Use when: "What's the gas price?"
  - Use when: Preparing to send a transaction and need fee estimation
  - Don't use when: You need account balance (use getBalance instead)

Error Handling:
  - Returns error if wallet is not registered for the specified chain
  - Returns error if fee rate data is unavailable`,
      inputSchema: z.object({
        chain: z.enum(chains).describe('The blockchain to get fee rates for')
      }),
      outputSchema: z.object({
        normal: z.string().describe('Normal fee rate'),
        fast: z.string().describe('Fast fee rate')
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
        const feeRates = await server.wdk.getFeeRates(chain)

        const serializedFeeRates = {}
        for (const [key, value] of Object.entries(feeRates)) {
          serializedFeeRates[key] = typeof value === 'bigint' ? value.toString() : value
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(serializedFeeRates, null, 2)
          }],
          structuredContent: serializedFeeRates
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Error getting fee rates on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}
