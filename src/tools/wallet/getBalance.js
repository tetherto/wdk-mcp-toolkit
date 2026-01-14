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
 * Registers the 'getBalance' tool for retrieving native token balances.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getBalance (server) {
  const chains = server.getChains()

  server.registerTool(
    'getBalance',
    {
      title: 'Get Native Token Balance',
      description: `Get the native token balance for a blockchain.

This tool retrieves the current balance of the native token (BTC for Bitcoin, ETH for Ethereum, etc.) for the wallet address. The balance is returned in the chain's smallest unit (satoshis for Bitcoin, wei for Ethereum, etc.). This is a read-only operation that does NOT modify the wallet.

Args:
  - chain (REQUIRED): The blockchain to get the balance for

Returns:
  Text format: "Balance: {amount} {unit}"
  
  Structured output:
  {
    "balance": "1000000000000000000"
  }
  
  Example by chain:
  - Bitcoin: "Balance: 100000000 satoshis" (1 BTC = 100,000,000 satoshis)
  - Ethereum: "Balance: 1000000000000000000 wei" (1 ETH = 10^18 wei)
  - Other chains: Chain-specific base unit

Examples:
  - Use when: "What's my ethereum balance?"
  - Use when: "How much bitcoin do I have?"
  - Use when: "Check my wallet balance"
  - Use when: Verifying funds before sending a transaction
  - Don't use when: You need the wallet address (use getAddress instead)
  - Don't use when: You need fee estimates (use getFeeRates instead)

Error Handling:
  - Returns error if wallet is not registered for the specified chain
  - Returns error if account derivation fails
  - Returns error if balance query fails`,
      inputSchema: z.object({
        chain: z.enum(chains).describe('The blockchain to get the balance for')
      }),
      outputSchema: z.object({
        balance: z.string().describe('The balance in base units')
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
        const balance = await account.getBalance()

        const balanceStr = balance.toString()
        const unit = chain === 'bitcoin' ? 'satoshis' : chain === 'ethereum' ? 'wei' : 'base units'

        return {
          content: [{
            type: 'text',
            text: `Balance: ${balanceStr} ${unit}`
          }],
          structuredContent: { balance: balanceStr }
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Error getting balance on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}
