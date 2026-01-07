'use strict'

import { z } from 'zod'

export function swap (server) {
  const swapChains = server.getSwapChains()

  if (swapChains.length === 0) return

  server.registerTool(
    'swap',
    {
      title: 'Swap Tokens',
      description: `Swap tokens using a decentralized exchange protocol.

This tool executes a token swap on the specified blockchain using the registered DEX protocol. Before executing, it quotes the swap to show expected output and fees, shows you a confirmation dialog with all details, waits for your explicit approval, and only then broadcasts the transaction. This is a DESTRUCTIVE operation that will spend funds from your wallet.

Args:
  - chain (REQUIRED): The blockchain to perform the swap on
  - tokenIn (REQUIRED): The token symbol to sell (must be registered)
  - tokenOut (REQUIRED): The token symbol to buy (must be registered)
  - amount (REQUIRED): The amount in human-readable units (e.g., "100" for 100 tokens)
  - side (REQUIRED): Whether amount is input ("sell") or output ("buy")
  - to (OPTIONAL): Recipient address for output tokens (defaults to wallet address)

Returns:
  Text format: "Swap executed! Hash: {hash}"
  
  Structured output:
  {
    "success": true,
    "protocol": "velora",
    "hash": "0x123...",
    "tokenIn": "USDT",
    "tokenOut": "USDC",
    "tokenInAmount": "100",
    "tokenOutAmount": "99.85",
    "fee": "21000000000000"
  }

Examples:
  - Use when: "Swap 100 USDT for USDC"
  - Use when: "Exchange my ETH for USDT on ethereum"
  - Use when: "Trade 50 USDC for ETH"
  - Use when: "Buy 1 ETH with USDT"
  - Don't use when: User only wants a quote (use quoteSwap instead)

Notes:
  - Token approval may be required before swapping (use approve tool)
  - Slippage and fees are handled by the underlying protocol

Error Handling:
  - Returns error if no swap protocol registered for the chain
  - Returns error if token symbols are not registered
  - Returns error if insufficient balance or allowance
  - Returns error if DEX execution fails
  - Returns "Swap cancelled" if user declines confirmation`,
      inputSchema: z.object({
        chain: z.enum(swapChains).describe('The blockchain to perform the swap on'),
        tokenIn: z.string().describe('The token symbol to sell (e.g., "USDT")'),
        tokenOut: z.string().describe('The token symbol to buy (e.g., "USDC")'),
        amount: z.string().describe('The amount in human-readable units (e.g., "100")'),
        side: z.enum(['sell', 'buy']).describe('Whether amount is input (sell) or output (buy)'),
        to: z.string().optional().describe('Recipient address (defaults to wallet address)')
      }),
      outputSchema: z.object({
        success: z.boolean().describe('Whether the swap succeeded'),
        protocol: z.string().describe('The DEX protocol used'),
        hash: z.string().describe('Transaction hash'),
        tokenIn: z.string().describe('Input token symbol'),
        tokenOut: z.string().describe('Output token symbol'),
        tokenInAmount: z.string().describe('Amount of input tokens'),
        tokenOutAmount: z.string().describe('Amount of output tokens'),
        fee: z.string().describe('Transaction fee paid')
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ chain, tokenIn, tokenOut, amount, side, to }) => {
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

        if (to) {
          options.to = to
        }

        const quote = await swapProtocol.quoteSwap(options)

        const quotedInAmount = Number(quote.tokenInAmount) / (10 ** tokenInInfo.decimals)
        const quotedOutAmount = Number(quote.tokenOutAmount) / (10 ** tokenOutInfo.decimals)

        const confirmationMessage = `⚠️  SWAP CONFIRMATION REQUIRED

Protocol: ${label}
Sell: ${quotedInAmount} ${tokenIn}
Buy: ${quotedOutAmount} ${tokenOut}
Estimated Fee: ${quote.fee.toString()}
${to ? `Recipient: ${to}` : ''}

This swap is IRREVERSIBLE once broadcast to the ${chain} network.

Do you want to proceed with this swap?`

        const confirmation = await server.server.elicitInput({
          message: confirmationMessage,
          requestedSchema: {
            type: 'object',
            properties: {
              confirmed: {
                type: 'boolean',
                title: 'Confirm Swap',
                description: 'Check to confirm and execute swap'
              }
            },
            required: ['confirmed']
          }
        })

        if (confirmation.action !== 'accept' || !confirmation.content?.confirmed) {
          return {
            content: [{ type: 'text', text: 'Swap cancelled by user. No funds were spent.' }]
          }
        }

        const swapResult = await swapProtocol.swap(options)

        const tokenInAmount = Number(swapResult.tokenInAmount) / (10 ** tokenInInfo.decimals)
        const tokenOutAmount = Number(swapResult.tokenOutAmount) / (10 ** tokenOutInfo.decimals)

        const result = {
          success: true,
          protocol: label,
          hash: swapResult.hash,
          tokenIn,
          tokenOut,
          tokenInAmount: tokenInAmount.toString(),
          tokenOutAmount: tokenOutAmount.toString(),
          fee: swapResult.fee.toString()
        }

        return {
          content: [{ type: 'text', text: `Swap executed! Hash: ${swapResult.hash}` }],
          structuredContent: result
        }
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error executing swap: ${error.message}` }]
        }
      }
    }
  )
}