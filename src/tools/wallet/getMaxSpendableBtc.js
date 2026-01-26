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
 * Registers the 'getMaxSpendableBtc' tool for calculating maximum spendable Bitcoin.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getMaxSpendableBtc (server) {
  server.registerTool(
    'getMaxSpendableBtc',
    {
      title: 'Get Maximum Spendable Amount',
      description: `Get the maximum spendable amount for Bitcoin.

This tool calculates the maximum amount of Bitcoin that can be sent in a single transaction, after subtracting estimated network fees. The result includes the spendable amount, estimated fee, and any change value. This accounts for UTXO limitations (max 200 inputs per transaction). This is a read-only operation.

Args:
  - None

Returns:
  JSON format:
  {
    "amount": "95000000",
    "fee": "5000",
    "changeValue": "0"
  }

Notes:
  - The max spendable may be less than total balance due to:
    * Transaction fees required for sending
    * UTXO dust limits (546 satoshis minimum)
    * Maximum 200 UTXOs per transaction limit
  - If wallet has many small UTXOs, not all balance may be spendable in one transaction

Examples:
  - Use when: "What's the maximum Bitcoin I can send?"
  - Use when: "How much can I spend after fees?"
  - Use when: Planning to send maximum available funds
  - Use when: Need to calculate available balance minus fees
  - Don't use when: You just need the total balance (use getBalance instead)

Error Handling:
  - Returns error if Bitcoin wallet is not registered
  - Returns error if account derivation fails
  - Returns zero values if insufficient balance or only dust UTXOs`,
      inputSchema: z.object({}),
      outputSchema: z.object({
        amount: z.string().describe('Maximum spendable amount in satoshis'),
        fee: z.string().describe('Estimated transaction fee in satoshis'),
        changeValue: z.string().describe('Expected change output in satoshis')
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async () => {
      try {
        const account = await server.wdk.getAccount('bitcoin', 0)
        const result = await account.getMaxSpendable()

        const serialized = {
          amount: result.amount.toString(),
          fee: result.fee.toString(),
          changeValue: result.changeValue.toString()
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(serialized, null, 2)
          }],
          structuredContent: serialized
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Error getting max spendable: ${error.message}`
          }]
        }
      }
    }
  )
}
