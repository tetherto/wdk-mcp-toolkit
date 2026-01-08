'use strict'

import { z } from 'zod'

export function quoteBuy (server) {
  const fiatChains = server.getFiatChains()

  if (fiatChains.length === 0) return

  server.registerTool(
    'quoteBuy',
    {
      title: 'Quote Buy Crypto',
      description: `Get a quote for purchasing cryptocurrency with fiat currency.

This tool retrieves a quote from the fiat on-ramp provider (e.g., MoonPay) showing how much crypto you'll receive for a given fiat amount, or how much fiat is needed for a given crypto amount. No transaction is executed. This is a read-only operation.

Args:
  - chain (REQUIRED): The blockchain for the fiat protocol
  - cryptoAsset (REQUIRED): The crypto asset code to buy (e.g., "eth", "btc", "usdt")
  - fiatCurrency (REQUIRED): The fiat currency code (e.g., "USD", "EUR")
  - amount (REQUIRED): The amount to quote
  - amountType (REQUIRED): Whether amount is in crypto or fiat

Returns:
  JSON format:
  {
    "protocol": "moonpay",
    "cryptoAsset": "eth",
    "fiatCurrency": "USD",
    "cryptoAmount": "1000000000000000000",
    "fiatAmount": "350000",
    "fee": "1750",
    "rate": "3500.00"
  }

Examples:
  - Use when: "How much ETH can I buy with $100?"
  - Use when: "What's the price to buy 0.5 ETH?"
  - Use when: User wants to preview an on-ramp transaction
  - Don't use when: User wants to execute the purchase (use buy instead)

Error Handling:
  - Returns error if no fiat protocol registered for the chain
  - Returns error if crypto asset or fiat currency not supported`,
      inputSchema: z.object({
        chain: z.enum(fiatChains).describe('The blockchain for the fiat protocol'),
        cryptoAsset: z.string().describe('The crypto asset code to buy (e.g., "eth", "btc")'),
        fiatCurrency: z.string().describe('The fiat currency code (e.g., "USD", "EUR")'),
        amount: z.string().describe('The amount to quote'),
        amountType: z.enum(['crypto', 'fiat']).describe('Whether amount is in crypto or fiat')
      }),
      outputSchema: z.object({
        protocol: z.string().describe('The fiat protocol used'),
        cryptoAsset: z.string().describe('Crypto asset code'),
        fiatCurrency: z.string().describe('Fiat currency code'),
        cryptoAmount: z.string().describe('Crypto amount in base units'),
        fiatAmount: z.string().describe('Fiat amount in smallest units (e.g., cents)'),
        fee: z.string().describe('Total fee in fiat smallest units'),
        rate: z.string().describe('Exchange rate (1 crypto = X fiat)')
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ chain, cryptoAsset, fiatCurrency, amount, amountType }) => {
      try {
        const protocols = server.getFiatProtocols(chain)

        if (protocols.length === 0) {
          return {
            isError: true,
            content: [{ type: 'text', text: `No fiat protocol registered for ${chain}.` }]
          }
        }

        const label = protocols[0]
        const account = await server.wdk.getAccount(chain, 0)
        const fiatProtocol = account.getFiatProtocol(label)

        const options = {
          cryptoAsset,
          fiatCurrency
        }

        if (amountType === 'crypto') {
          options.cryptoAmount = BigInt(amount)
        } else {
          options.fiatAmount = BigInt(amount)
        }

        const quote = await fiatProtocol.quoteBuy(options)

        const result = {
          protocol: label,
          cryptoAsset,
          fiatCurrency,
          cryptoAmount: quote.cryptoAmount.toString(),
          fiatAmount: quote.fiatAmount.toString(),
          fee: quote.fee.toString(),
          rate: quote.rate
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          structuredContent: result
        }
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error quoting buy: ${error.message}` }]
        }
      }
    }
  )
}