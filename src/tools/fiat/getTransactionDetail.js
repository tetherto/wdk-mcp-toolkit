'use strict'

import { z } from 'zod'

export function getTransactionDetail (server) {
  const fiatChains = server.getFiatChains()

  if (fiatChains.length === 0) return

  server.registerTool(
    'getFiatTransactionDetail',
    {
      title: 'Get Fiat Transaction Detail',
      description: `Get details of a fiat on-ramp or off-ramp transaction.

This tool retrieves the current status and details of a fiat transaction from the provider. Use this to check if a buy or sell transaction has completed. This is a read-only operation.

Args:
  - chain (REQUIRED): The blockchain for the fiat protocol
  - txId (REQUIRED): The transaction ID from the fiat provider
  - direction (OPTIONAL): Whether this was a "buy" or "sell" transaction (defaults to "buy")

Returns:
  JSON format:
  {
    "protocol": "moonpay",
    "txId": "abc123",
    "status": "completed",
    "cryptoAsset": "eth",
    "fiatCurrency": "USD"
  }

Status values:
  - "in_progress": Transaction is being processed
  - "completed": Transaction completed successfully
  - "failed": Transaction failed

Examples:
  - Use when: "Check the status of my MoonPay transaction"
  - Use when: "Did my crypto purchase complete?"
  - Use when: "What happened to my off-ramp transaction?"

Error Handling:
  - Returns error if no fiat protocol registered for the chain
  - Returns error if transaction ID not found`,
      inputSchema: z.object({
        chain: z.enum(fiatChains).describe('The blockchain for the fiat protocol'),
        txId: z.string().describe('The transaction ID from the fiat provider'),
        direction: z.enum(['buy', 'sell']).optional().describe('Transaction direction (defaults to "buy")')
      }),
      outputSchema: z.object({
        protocol: z.string().describe('The fiat protocol used'),
        txId: z.string().describe('Transaction ID'),
        status: z.enum(['in_progress', 'completed', 'failed']).describe('Transaction status'),
        cryptoAsset: z.string().describe('Crypto asset code'),
        fiatCurrency: z.string().describe('Fiat currency code')
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ chain, txId, direction = 'buy' }) => {
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

        const detail = await fiatProtocol.getTransactionDetail(txId, direction)

        const result = {
          protocol: label,
          txId,
          status: detail.status,
          cryptoAsset: detail.cryptoAsset,
          fiatCurrency: detail.fiatCurrency
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          structuredContent: result
        }
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error getting transaction detail: ${error.message}` }]
        }
      }
    }
  )
}