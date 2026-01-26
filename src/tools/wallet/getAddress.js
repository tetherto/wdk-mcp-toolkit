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
 * Registers the 'getAddress' tool for retrieving wallet addresses.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getAddress (server) {
  const chains = server.getChains()

  server.registerTool(
    'getAddress',
    {
      title: 'Get Wallet Address',
      description: `Get the wallet address for a blockchain.

This tool retrieves the public wallet address derived from the seed phrase. The address is used to receive funds and identify the wallet. This is a read-only operation that does NOT modify the wallet or perform any transactions.

Args:
  - chain (REQUIRED): The blockchain to get the address for

Returns:
  Text format: "Address: {address}"
  
  Structured output:
  {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7"
  }
  
  Example formats by chain:
  - Ethereum: "Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  - Bitcoin: "Address: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
  - TON: "Address: EQD..."

Examples:
  - Use when: "What's my ethereum address?"
  - Use when: "Show me the wallet address for bitcoin"
  - Use when: "Where can I receive tokens?"
  - Don't use when: You need to check balance (use getBalance instead)
  - Don't use when: You need to send funds (use sendTransaction or transfer instead)

Error Handling:
  - Returns error if wallet is not registered for the specified chain
  - Returns error if account derivation fails`,
      inputSchema: z.object({
        chain: z.enum(chains).describe('The blockchain to get the address for')
      }),
      outputSchema: z.object({
        address: z.string().describe('The wallet address for the blockchain')
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
        const account = await server.wdk.getAccount(chain, 0)
        const address = await account.getAddress()

        return {
          content: [{ type: 'text', text: `Address: ${address}` }],
          structuredContent: { address }
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Error getting address on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}
