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
import { BLOCKCHAINS, TOKENS } from '@tetherto/wdk-indexer-http'

/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */

/**
 * Registers the 'getIndexerTokenBalance' tool for querying indexed token balances.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getIndexerTokenBalance (server) {
  server.registerTool(
    'getIndexerTokenBalance',
    {
      title: 'Get Indexed Token Balance',
      description: `Get token balance for an address using the WDK Indexer API.

This tool retrieves the current token balance for a specific address on a given blockchain via the Indexer API. This is useful for querying balances for ANY address across multiple chains.

Note: This queries the indexed balance which may have slight delay compared to real-time blockchain state.

Supported blockchains: ${BLOCKCHAINS.join(', ')}
Supported tokens: ${TOKENS.join(', ')}

Args:
  - blockchain (REQUIRED): The blockchain to query
  - token (REQUIRED): The token to query (usdt, xaut, btc)
  - address (REQUIRED): The wallet address to get balance for

Returns:
  Text format: "Balance: {amount} {token} on {blockchain}"

Examples:
  - Use when: "What's the USDT balance of 0x... on ethereum?"
  - Use when: "Check XAUT balance for this address on polygon"
  - Use when: "How much BTC does address bc1... have?"
  - Use when: Querying balance of an external address (not the user's wallet)
  
  - Don't use when: User asks for THEIR OWN balance without specifying an address
    → Use getBalance for native tokens (ETH, BTC, etc.)
    → Use getTokenBalance for ERC20/tokens (USDT, USDC, etc.)`,
      inputSchema: z.object({
        blockchain: z.enum(BLOCKCHAINS).describe('The blockchain to query'),
        token: z.enum(TOKENS).describe('The token to query (usdt, xaut, btc)'),
        address: z.string().min(1).describe('The wallet address to get balance for')
      }),
      outputSchema: z.object({
        tokenBalance: z.object({
          blockchain: z.string(),
          token: z.string(),
          amount: z.string()
        })
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ blockchain, token, address }) => {
      try {
        const data = await server.indexerClient.getTokenBalance(blockchain, token, address)
        const balance = data.tokenBalance?.amount || '0'

        return {
          content: [{
            type: 'text',
            text: `Balance: ${balance} ${token.toUpperCase()} on ${blockchain}`
          }],
          structuredContent: data
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Error getting indexed token balance: ${error.message}`
          }]
        }
      }
    }
  )
}
