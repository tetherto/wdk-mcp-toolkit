'use strict'

import { z } from 'zod'

export function quoteBridge (server) {
  const bridgeChains = server.getBridgeChains()

  if (bridgeChains.length === 0) return

  server.registerTool(
    'quoteBridge',
    {
      title: 'Quote Bridge',
      description: `Get a quote for bridging tokens to another blockchain without executing.

This tool retrieves an estimated bridge quote from the registered bridge protocol. It returns the expected gas fee and bridge protocol fee. No transaction is broadcast. This is a read-only operation.

Args:
  - chain (REQUIRED): The source blockchain to bridge from
  - targetChain (REQUIRED): The destination blockchain to bridge to
  - token (REQUIRED): The token symbol to bridge (must be registered)
  - amount (REQUIRED): The amount in human-readable units (e.g., "100" for 100 tokens)
  - recipient (OPTIONAL): The recipient address on the target chain (defaults to wallet address)

Returns:
  JSON format:
  {
    "protocol": "usdt0",
    "sourceChain": "ethereum",
    "targetChain": "arbitrum",
    "token": "USDT",
    "amount": "100",
    "fee": "21000000000000",
    "bridgeFee": "500000000000000"
  }

Examples:
  - Use when: "How much will it cost to bridge 100 USDT to Arbitrum?"
  - Use when: "What are the fees for bridging USDT from Ethereum to Polygon?"
  - Use when: Comparing bridge costs before executing
  - Use when: User wants to preview a bridge operation
  - Don't use when: User wants to execute the bridge (use bridge instead)

Error Handling:
  - Returns error if no bridge protocol registered for the chain
  - Returns error if token symbol is not registered
  - Returns error if target chain is not supported by the protocol`,
      inputSchema: z.object({
        chain: z.enum(bridgeChains).describe('The source blockchain to bridge from'),
        targetChain: z.string().describe('The destination blockchain to bridge to'),
        token: z.string().describe('The token symbol to bridge (e.g., "USDT")'),
        amount: z.string().describe('The amount in human-readable units (e.g., "100")'),
        recipient: z.string().optional().describe('Recipient address on target chain (defaults to wallet address)')
      }),
      outputSchema: z.object({
        protocol: z.string().describe('The bridge protocol used'),
        sourceChain: z.string().describe('Source blockchain'),
        targetChain: z.string().describe('Destination blockchain'),
        token: z.string().describe('Token symbol'),
        amount: z.string().describe('Amount to bridge'),
        fee: z.string().describe('Estimated gas fee'),
        bridgeFee: z.string().describe('Bridge protocol fee')
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ chain, targetChain, token, amount, recipient }) => {
      try {
        const protocols = server.getBridgeProtocols(chain)

        if (protocols.length === 0) {
          return {
            isError: true,
            content: [{ type: 'text', text: `No bridge protocol registered for ${chain}.` }]
          }
        }

        const tokenInfo = server.getTokenInfo(chain, token)
        if (!tokenInfo) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Token ${token} not registered for ${chain}.` }]
          }
        }

        const label = protocols[0]
        const account = await server.wdk.getAccount(chain, 0)
        const bridgeProtocol = account.getBridgeProtocol(label)

        const baseAmount = BigInt(Math.floor(parseFloat(amount) * (10 ** tokenInfo.decimals)))

        const options = {
          targetChain,
          token: tokenInfo.address,
          amount: baseAmount,
          recipient: recipient || await account.getAddress()
        }

        const quote = await bridgeProtocol.quoteBridge(options)

        const result = {
          protocol: label,
          sourceChain: chain,
          targetChain,
          token,
          amount,
          fee: quote.fee.toString(),
          bridgeFee: quote.bridgeFee.toString()
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          structuredContent: result
        }
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error quoting bridge: ${error.message}` }]
        }
      }
    }
  )
}