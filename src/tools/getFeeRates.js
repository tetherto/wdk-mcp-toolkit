'use strict'

import { GetFeeRatesInputSchema, GetFeeRatesOutputSchema } from '../schemas/getFeeRates.js'

/**
 * Register getFeeRates tool for a specific chain
 * @param {import('../WdkMcpServerReadonly.js').WdkMcpServerReadonly} server - MCP server instance
 * @param {string} chain - Chain name
 */
export function registerGetFeeRates (server, chain) {
  server.registerTool(
    `${chain}_getFeeRates`,
    {
      title: `Get ${chain.charAt(0).toUpperCase() + chain.slice(1)} Fee Rates`,
      description: `Get current network fee rates for ${chain}.

This tool retrieves the current fee rates for transactions on the ${chain} blockchain. Fee rates are returned in the chain's base unit (satoshis for Bitcoin, wei for Ethereum, etc.) and include three speed tiers: slow, medium, and fast. Higher fees result in faster transaction confirmation. This is a read-only operation.

Args:
  - None

Returns:
  JSON format with three fee tiers:
  {
    "slow": "5000",    // Lower fee, slower confirmation
    "medium": "10000", // Balanced fee and speed
    "fast": "20000"    // Higher fee, faster confirmation
  }
  
  Units by chain:
  - Bitcoin: satoshis per byte
  - Ethereum: wei (gwei = wei / 1,000,000,000)
  - Other chains: chain-specific base unit

Examples:
  - Use when: "What are the current ${chain} fees?"
  - Use when: "How much will a ${chain} transaction cost?"
  - Use when: "What's the gas price on ${chain}?"
  - Use when: Preparing to send a transaction and need fee estimation
  - Don't use when: You need account balance (use ${chain}_getAddress instead)

Error Handling:
  - Returns error if ${chain} wallet is not registered
  - Returns error if fee rate data is unavailable`,
      inputSchema: GetFeeRatesInputSchema,
      outputSchema: GetFeeRatesOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async () => {
      try {
        const feeRates = await server.wdk.getFeeRates(chain)

        const serializedFeeRates = {}
        for (const [key, value] of Object.entries(feeRates)) {
          serializedFeeRates[key] = typeof value === 'bigint' ? value.toString() : value
        }

        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify(serializedFeeRates, null, 2)
          }],
          structuredContent: serializedFeeRates
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `❌ Error getting fee rates on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}