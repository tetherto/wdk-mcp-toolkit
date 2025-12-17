'use strict'

import { GetMaxSpendableInputSchema, GetMaxSpendableOutputSchema } from '../schemas/getMaxSpendable.js'

export function registerGetMaxSpendable (server, chain) {
  server.registerTool(
    `${chain}_getMaxSpendable`,
    {
      title: `Get ${chain.charAt(0).toUpperCase() + chain.slice(1)} Max Spendable`,
      description: `Get the maximum spendable amount for ${chain}.

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
  - Don't use when: You just need the total balance (use ${chain}_getBalance instead)

Error Handling:
  - Returns error if ${chain} wallet is not registered
  - Returns error if account derivation fails
  - Returns zero values if insufficient balance or only dust UTXOs`,
      inputSchema: GetMaxSpendableInputSchema,
      outputSchema: GetMaxSpendableOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async () => {
      try {
        const account = await server.wdk.getAccount(chain, 0)
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
            text: `❌ Error getting max spendable on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}