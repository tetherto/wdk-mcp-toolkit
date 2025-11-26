'use strict'

import { QuoteTransferInputSchema, QuoteTransferOutputSchema } from '../schemas/quoteTransfer.js'

/**
 * Register quoteTransfer tool for a specific chain
 * @param {import('../WdkMcpServer.js').WdkMcpServer} server - MCP server instance
 * @param {string} chain - Chain name
 */
export function registerQuoteTransfer (server, chain) {
  const registeredTokens = server.getRegisteredTokens(chain)
  const tokenList = registeredTokens.length > 0 
    ? `Registered tokens: ${registeredTokens.join(', ')}`
    : 'No tokens registered yet'

  server.registerTool(
    `${chain}_quoteTransfer`,
    {
      title: `Quote ${chain.charAt(0).toUpperCase() + chain.slice(1)} Token Transfer`,
      description: `Get fee estimate for transferring an ERC-20 token on ${chain}.

This tool calculates the estimated network fee (gas cost) for transferring an ERC-20 token without actually executing the transfer. This allows you to preview costs before executing a token transfer. The fee is returned in wei for Ethereum. This is a read-only operation that does NOT modify the wallet or transfer any tokens.

${tokenList}

IMPORTANT: This tool requires the exact recipient address and exact amount to provide an accurate fee quote. If the user has not provided these values, you MUST ask them for:
  1. The exact recipient address
  2. The exact amount they want to transfer in HUMAN-READABLE format

Args:
  - token (REQUIRED): Token symbol (e.g., "USDT", "USDC", "DAI")
  - recipient (REQUIRED): The recipient's address (string)
  - amount (REQUIRED): The amount to transfer in HUMAN-READABLE format (string)
    * Examples: "10" means 10 USDT, "0.5" means 0.5 DAI, "100.25" means 100.25 USDC
    * DO NOT use base units - tool handles conversion automatically
    * Use decimal notation for fractional amounts

Returns:
  Text format: "Estimated fee for transferring {amount} {token}: {fee} wei"
  
  Structured output:
  {
    "fee": "21000000000000000"
  }

Examples:
  - Use when: "How much will it cost to send 10 USDT to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7?"
    → token: "USDT", amount: "10", recipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7"
  
  - Use when: "Estimate gas for transferring 0.5 DAI to 0xabc..."
    → token: "DAI", amount: "0.5", recipient: "0xabc..."
  
  - Don't use when: User asks "how much does it cost to send tokens?" without providing address or amount
  - Don't use when: You want to actually transfer tokens (this is quote only)

If user asks for fee estimate without providing address and amount:
    DON'T call this tool
    DO ask: "To provide an accurate fee quote, I need the recipient address and the exact amount you want to transfer."

Error Handling:
  - Returns error if ${chain} wallet is not registered
  - Returns error if token symbol is not registered (shows available tokens)
  - Returns error if recipient address is invalid
  - Returns error if amount is invalid or cannot be parsed
  - Returns error if insufficient balance`,
      inputSchema: QuoteTransferInputSchema,
      outputSchema: QuoteTransferOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (args) => {
      try {
        const { token, recipient, amount } = args
        const tokenSymbol = token.toUpperCase()

        const tokenInfo = server.getTokenInfo(chain, tokenSymbol)
        
        if (!tokenInfo) {
          const available = server.getRegisteredTokens(chain)
          throw new Error(
            `Token symbol "${token}" not registered for ${chain}. ` +
            `Available tokens: ${available.length > 0 ? available.join(', ') : 'none'}`
          )
        }

        const { address: tokenAddress, decimals } = tokenInfo
        
        const humanAmount = parseFloat(amount)
        if (isNaN(humanAmount) || humanAmount <= 0) {
          throw new Error(`Invalid amount: "${amount}". Please provide a positive number (e.g., "10" or "0.5")`)
        }
        
        const baseUnitAmount = BigInt(Math.floor(humanAmount * (10 ** decimals)))
        
        const account = await server.wdk.getAccount(chain, 0)
        const result = await account.quoteTransfer({
          token: tokenAddress,
          recipient,
          amount: baseUnitAmount
        })

        const feeStr = result.fee.toString()

        return {
          content: [{
            type: 'text',
            text: `Estimated fee for transferring ${amount} ${tokenSymbol}: ${feeStr} wei`
          }],
          structuredContent: {
            fee: feeStr
          }
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `❌ Error quoting transfer on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}