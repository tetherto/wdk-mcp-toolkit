'use strict'

import { z } from 'zod'

export function quoteSwap (server) {
  const swapChains = server.getSwapChains()

  if (swapChains.length === 0) return

  server.registerTool(
    'quoteSwap',
    {
      title: 'Quote Token Swap',
      description: `Get a quote for swapping tokens without executing the trade.

This tool retrieves an estimated swap quote from the registered DEX protocol. It returns the expected input/output amounts and estimated fees. No transaction is broadcast. This is a read-only operation.

Args:
  - chain (REQUIRED): The blockchain to perform the swap on
  - tokenIn (REQUIRED): The token symbol to sell (must be registered)
  - tokenOut (REQUIRED): The token symbol to buy (must be registered)
  - amount (REQUIRED): The amount in human-readable units (e.g., "100" for 100 tokens)
  - side (REQUIRED): Whether amount is input ("sell") or output ("buy")

Returns:
  JSON format:
  {
    "protocol": "velora",
    "tokenIn": "USDT",
    "tokenOut": "USDC",
    "tokenInAmount": "100",
    "tokenOutAmount": "99.85",
    "fee": "21000000000000"
  }

Examples:
  - Use when: "How much USDC will I get for 100 USDT?"
  - Use when: "What's the swap rate for ETH to USDT?"
  - Use when: Comparing rates before executing a swap
  - Use when: User wants to preview a trade
  - Don't use when: User wants to execute the swap (use swap instead)

Error Handling:
  - Returns error if no swap protocol registered for the chain
  - Returns error if token symbols are not registered
  - Returns error if DEX API fails or pair not available`,
      inputSchema: z.object({
        chain: z.enum(swapChains).describe('The blockchain to perform the swap on'),
        tokenIn: z.string().describe('The token symbol to sell (e.g., "USDT")'),
        tokenOut: z.string().describe('The token symbol to buy (e.g., "USDC")'),
        amount: z.string().describe('The amount in human-readable units (e.g., "100")'),
        side: z.enum(['sell', 'buy']).describe('Whether amount is input (sell) or output (buy)')
      }),
      outputSchema: z.object({
        protocol: z.string().describe('The DEX protocol used'),
        tokenIn: z.string().describe('Input token symbol'),
        tokenOut: z.string().describe('Output token symbol'),
        tokenInAmount: z.string().describe('Amount of input tokens'),
        tokenOutAmount: z.string().describe('Amount of output tokens'),
        fee: z.string().describe('Estimated transaction fee')
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ chain, tokenIn, tokenOut, amount, side }) => {
      try {
        const protocols = server.getSwapProtocols(chain)

        if (protocols.length === 0) {
          return {
            isError: true,
            content: [{ type: 'text', text: `No swap protocol registered for ${chain}.` }]
          }
        }

        const tokenInInfo = server.getTokenInfo(chain, tokenIn)
        if (!tokenInInfo) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Token ${tokenIn} not registered for ${chain}.` }]
          }
        }

        const tokenOutInfo = server.getTokenInfo(chain, tokenOut)
        if (!tokenOutInfo) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Token ${tokenOut} not registered for ${chain}.` }]
          }
        }

        const label = protocols[0]
        const account = await server.wdk.getAccount(chain, 0)
        const swapProtocol = account.getSwapProtocol(label)

        const options = {
          tokenIn: tokenInInfo.address,
          tokenOut: tokenOutInfo.address
        }

        const decimals = side === 'sell' ? tokenInInfo.decimals : tokenOutInfo.decimals
        const baseAmount = BigInt(Math.floor(parseFloat(amount) * (10 ** decimals)))

        if (side === 'sell') {
          options.tokenInAmount = baseAmount
        } else {
          options.tokenOutAmount = baseAmount
        }

        const quote = await swapProtocol.quoteSwap(options)

        const tokenInAmount = Number(quote.tokenInAmount) / (10 ** tokenInInfo.decimals)
        const tokenOutAmount = Number(quote.tokenOutAmount) / (10 ** tokenOutInfo.decimals)

        const result = {
          protocol: label,
          tokenIn,
          tokenOut,
          tokenInAmount: tokenInAmount.toString(),
          tokenOutAmount: tokenOutAmount.toString(),
          fee: quote.fee.toString()
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          structuredContent: result
        }
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error quoting swap: ${error.message}` }]
        }
      }
    }
  )
}