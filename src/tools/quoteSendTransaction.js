'use strict'

import { QuoteSendTransactionInputSchema, QuoteSendTransactionOutputSchema } from '../schemas/quoteSendTransaction.js'

export function registerQuoteSendTransaction (server, chain) {
  server.registerTool(
    `${chain}_quoteSendTransaction`,
    {
      title: `Quote ${chain.charAt(0).toUpperCase() + chain.slice(1)} Transaction`,
      description: `Get fee estimate for a transaction on ${chain}.

This tool calculates the estimated network fee for sending a transaction without actually broadcasting it. This allows you to preview costs before executing a transaction. The fee is returned in the chain's base unit (satoshis for Bitcoin, wei for Ethereum, etc.).

IMPORTANT: This tool requires BOTH the exact recipient address (to) and exact amount (value) to provide an accurate fee quote. If the user has not provided these values, you MUST ask them for:
  1. The exact recipient address
  2. The exact amount they want to send (in the appropriate unit)

Without both parameters, the fee estimate cannot be calculated.

Args:
  - to (REQUIRED): The recipient's address (string)
  - value (REQUIRED): The amount to send in base unit (string) - satoshis for Bitcoin, wei for Ethereum, etc.

Returns:
  JSON format:
  {
    "fee": "5000"
  }

Example values by chain:
  - Bitcoin: value in satoshis (e.g., "100000000" = 1 BTC)
  - Ethereum: value in wei (e.g., "1000000000000000000" = 1 ETH)

Examples:
  - Use when: "How much will it cost to send 0.1 BTC to bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh?"
  - Use when: User provides exact address and amount for fee estimation
  - Don't use when: User asks "how much does it cost to send?" without providing address and amount
  - Don't use when: You want current network fees only (use ${chain}_getFeeRates instead)
  - Don't use when: You want to actually send the transaction (this is quote only)

If user asks for fee estimate without providing address and amount:
  DON'T call this tool
  DO ask: "To provide an accurate fee quote, I need the recipient address and the exact amount you want to send."

Error Handling:
  - Returns error if ${chain} wallet is not registered
  - Returns error if recipient address is invalid
  - Returns error if amount is invalid or below dust limit
  - Returns error if insufficient balance to cover amount + fees`,
      inputSchema: QuoteSendTransactionInputSchema,
      outputSchema: QuoteSendTransactionOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (args) => {
      try {
        const { to, value } = args

        const account = await server.wdk.getAccount(chain, 0)
        const result = await account.quoteSendTransaction({
          to,
          value: BigInt(value)
        })

        const serialized = {
          fee: result.fee.toString()
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
            text: `❌ Error quoting transaction on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}