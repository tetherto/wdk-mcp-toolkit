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
 * Registers the 'getHistoricalPrice' tool for fetching historical price data.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getHistoricalPrice (server) {
  server.registerTool(
    'getHistoricalPrice',
    {
      title: 'Get Historical Price',
      description: `Get historical price series for a trading pair.

This tool fetches historical candle data for a base/quote currency pair from Bitfinex. Returns a time series of price data points, automatically downscaled to ≤100 points if the range is large.

Args:
  - from (REQUIRED): Base currency symbol (e.g., "BTC", "ETH", "XAU")
  - to (REQUIRED): Quote currency symbol (e.g., "USD", "EUR", "USDT")
  - start (OPTIONAL): Start timestamp in milliseconds (unix epoch)
  - end (OPTIONAL): End timestamp in milliseconds (unix epoch)

Returns:
  Text format: Summary with data points count
  
  Structured output:
  {
    "from": "BTC",
    "to": "USD",
    "start": 1709906400000,
    "end": 1709913600000,
    "points": [
      [timestamp, open, close, high, low, volume],
      ...
    ]
  }

Notes:
  - If no start/end provided, returns recent historical data
  - Long time ranges are automatically downscaled to ≤100 data points
  - Each point contains: [timestamp, open, close, high, low, volume]

Examples:
  - Use when: "Show me Bitcoin price history for the last week"
  - Use when: "Get ETH/USD historical data from January 1 to January 31"
  - Don't use when: You need current spot price (use getCurrentPrice instead)

Error Handling:
  - Returns error if the trading pair is not supported
  - Returns error if timestamps are invalid
  - Returns error if the API request fails`,
      inputSchema: z.object({
        from: z.string().describe('Base currency symbol (e.g., "BTC", "ETH")'),
        to: z.string().describe('Quote currency symbol (e.g., "USD", "USDT")'),
        start: z.number().int().optional().describe('Start timestamp in milliseconds (unix epoch)'),
        end: z.number().int().optional().describe('End timestamp in milliseconds (unix epoch)')
      }),
      outputSchema: z.object({
        from: z.string(),
        to: z.string(),
        start: z.number().optional(),
        end: z.number().optional(),
        points: z.array(z.array(z.number()))
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ from, to, start, end }) => {
      try {
        const fromUpper = from.toUpperCase()
        const toUpper = to.toUpperCase()

        const series = await server.pricingClient.getHistoricalPrice({
          from: fromUpper,
          to: toUpper,
          start,
          end
        })

        const pointCount = Array.isArray(series) ? series.length : 0

        const result = {
          from: fromUpper,
          to: toUpper,
          ...(start !== undefined && { start }),
          ...(end !== undefined && { end }),
          points: series
        }

        return {
          content: [{
            type: 'text',
            text: `${fromUpper}/${toUpper} historical data: ${pointCount} data points\n\n${JSON.stringify(result, null, 2)}`
          }],
          structuredContent: result
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Error getting historical price: ${error.message}`
          }]
        }
      }
    }
  )
}
