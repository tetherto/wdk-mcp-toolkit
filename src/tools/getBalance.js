'use strict'

import { GetBalanceInputSchema, GetBalanceOutputSchema } from '../schemas/getBalance.js'

export function registerGetBalance (server, chain) {
  server.registerTool(
    `${chain}_getBalance`,
    {
      title: `Get ${chain.charAt(0).toUpperCase() + chain.slice(1)} Balance`,
      description: `Get the native token balance for ${chain}.

This tool retrieves the current balance of the native token (BTC for Bitcoin, ETH for Ethereum, etc.) for the wallet address on ${chain}. The balance is returned in the chain's smallest unit (satoshis for Bitcoin, wei for Ethereum, etc.). This is a read-only operation that does NOT modify the wallet.

Args:
  - None

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
  - Use when: "What's my ${chain} balance?"
  - Use when: "How much ${chain} do I have?"
  - Use when: "Check my wallet balance on ${chain}"
  - Use when: Verifying funds before sending a transaction
  - Don't use when: You need the wallet address (use ${chain}_getAddress instead)
  - Don't use when: You need fee estimates (use ${chain}_getFeeRates instead)

Error Handling:
  - Returns error if ${chain} wallet is not registered
  - Returns error if account derivation fails
  - Returns error if balance query fails`,
      inputSchema: GetBalanceInputSchema,
      outputSchema: GetBalanceOutputSchema,
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
            text: `❌ Error getting balance on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}