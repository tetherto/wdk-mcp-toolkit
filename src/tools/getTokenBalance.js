'use strict'

import { GetTokenBalanceInputSchema, GetTokenBalanceOutputSchema } from '../schemas/getTokenBalance.js'

export function registerGetTokenBalance (server, chain) {
  const registeredTokens = server.getRegisteredTokens(chain)
  const tokenList = registeredTokens.length > 0 
    ? `Registered tokens: ${registeredTokens.join(', ')}`
    : 'No tokens registered yet'

  server.registerTool(
    `${chain}_getTokenBalance`,
    {
      title: `Get ${chain.charAt(0).toUpperCase() + chain.slice(1)} Token Balance`,
      description: `Get the token balance for a specific token on ${chain}.

This tool retrieves the balance of an ERC-20 token (or equivalent token standard) for the wallet. You must specify the token by its registered symbol. The balance is returned in human-readable format (e.g., 94.428840 USDT). This is a read-only operation.

${tokenList}

Args:
  - token (REQUIRED): Token symbol (e.g., "USDT", "USDC", "DAI")

Returns:
  Text format: "Balance: {amount} {symbol} ({rawAmount} base units)"
  
  Structured output:
  {
    "balance": "94.428840",
    "balanceRaw": "94428840"
  }
  
  Example: "Balance: 94.428840 USDT (94428840 base units)"

Examples:
  - Use when: "What's my USDT balance?"
  - Use when: "How many USDC tokens do I have?"
  - Use when: "Check my DAI balance"
  - Don't use when: You need native token balance (use ${chain}_getBalance instead)
  - Don't use when: Token symbol is not in the registered list above

Error Handling:
  - Returns error if ${chain} wallet is not registered
  - Returns error if token symbol is not registered (shows available tokens)
  - Returns error if token contract doesn't exist on chain`,
      inputSchema: GetTokenBalanceInputSchema,
      outputSchema: GetTokenBalanceOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (args) => {
      try {
        const { token } = args
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
        
        const account = await server.wdk.getAccount(chain, 0)
        const balance = await account.getTokenBalance(tokenAddress)

        const rawBalance = balance.toString()
        const humanReadable = Number(balance) / (10 ** decimals)

        return {
          content: [{ 
            type: 'text', 
            text: `Balance: ${humanReadable} ${tokenSymbol} (${rawBalance} base units)`
          }],
          structuredContent: {
            balance: humanReadable.toString(),
            balanceRaw: rawBalance
          }
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `❌ Error getting token balance on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}