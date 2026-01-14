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
 * Registers the 'getTokenTransfers' tool for querying token transfer history.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getTokenTransfers (server) {
  server.registerTool(
    'getTokenTransfers',
    {
      title: 'Get Token Transfers',
      description: `Get token transfer history for an address using the WDK Indexer API.

This tool retrieves the token transfer history for a specific address on a given blockchain. Returns a list of transfers including transaction hashes, amounts, timestamps, and sender/recipient addresses.

Supported blockchains: ${BLOCKCHAINS.join(', ')}
Supported tokens: ${TOKENS.join(', ')}

Args:
  - blockchain (REQUIRED): The blockchain to query
  - token (REQUIRED): The token to query (usdt, xaut, btc)
  - address (REQUIRED): The wallet address to get transfers for
  - limit (OPTIONAL): Number of transfers to return (1-1000, default: 10)
  - fromTs (OPTIONAL): Start timestamp (unix seconds)
  - toTs (OPTIONAL): End timestamp (unix seconds)
  - sort (OPTIONAL): Sort order - "asc" or "desc" (default: "desc")

Returns:
  JSON format:
  {
    "transfers": [
      {
        "blockchain": "ethereum",
        "blockNumber": 12345678,
        "transactionHash": "0xabc...",
        "token": "usdt",
        "amount": "1000000",
        "timestamp": 1699900000,
        "from": "0x123...",
        "to": "0x456..."
      }
    ]
  }

Examples:
  - Use when: "Get the last 50 USDT transfers for address 0x..."
  - Use when: Querying transfer history`,
      inputSchema: z.object({
        blockchain: z.enum(BLOCKCHAINS).describe('The blockchain to query'),
        token: z.enum(TOKENS).describe('The token to query (usdt, xaut, btc)'),
        address: z.string().min(1).describe('The wallet address to get transfers for'),
        limit: z.number().int().min(1).max(1000).optional().describe('Number of transfers to return (1-1000, default: 10)'),
        fromTs: z.number().int().optional().describe('Start timestamp (unix seconds)'),
        toTs: z.number().int().optional().describe('End timestamp (unix seconds)'),
        sort: z.enum(['asc', 'desc']).optional().describe('Sort order (default: desc)')
      }),
      outputSchema: z.object({
        transfers: z.array(z.object({
          blockchain: z.string(),
          blockNumber: z.number(),
          transactionHash: z.string(),
          transferIndex: z.number().optional(),
          token: z.string(),
          amount: z.string(),
          timestamp: z.number(),
          transactionIndex: z.number().optional(),
          logIndex: z.number().optional(),
          from: z.string(),
          to: z.string()
        }))
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ blockchain, token, address, limit, fromTs, toTs, sort }) => {
      try {
        const data = await server.indexerClient.getTokenTransfers(
          blockchain,
          token,
          address,
          { limit, fromTs, toTs, sort }
        )

        const count = data.transfers?.length || 0
        const summary = count === 0
          ? `No transfers found for ${address} on ${blockchain}`
          : `Found ${count} ${token.toUpperCase()} transfer(s) on ${blockchain}`

        return {
          content: [{
            type: 'text',
            text: `${summary}\n\n${JSON.stringify(data, null, 2)}`
          }],
          structuredContent: data
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Error getting token transfers: ${error.message}`
          }]
        }
      }
    }
  )
}