'use strict'

import { GetAddressInputSchema, GetAddressOutputSchema } from '../schemas/getAddress.js'

export function registerGetAddress (server, chain) {
  server.registerTool(
    `${chain}_getAddress`,
    {
      title: `Get ${chain.charAt(0).toUpperCase() + chain.slice(1)} Address`,
      description: `Get the wallet address on ${chain}.

This tool retrieves the public wallet address derived from the seed phrase for the ${chain} blockchain. The address is used to receive funds and identify the wallet. This is a read-only operation that does NOT modify the wallet or perform any transactions.

Args:
  - None

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
  - Use when: "What's my ${chain} address?"
  - Use when: "Show me the wallet address for ${chain}"
  - Use when: "Where can I receive ${chain} tokens?"
  - Don't use when: You need to check balance (use ${chain}.getBalance instead)
  - Don't use when: You need to send funds (use ${chain}.transfer instead)

Error Handling:
  - Returns error if ${chain} wallet is not registered
  - Returns error if account derivation fails`,
      inputSchema: GetAddressInputSchema,
      outputSchema: GetAddressOutputSchema,
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
            text: `❌ Error getting address on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}