'use strict'

import { TransferInputSchema, TransferOutputSchema } from '../schemas/transfer.js'

export function registerTransfer (server, chain) {
  server.registerTool(
    `${chain}_transfer`,
    {
      title: `Transfer ${chain.charAt(0).toUpperCase() + chain.slice(1)} Token`,
      description: `Transfer tokens on ${chain}.

This tool transfers tokens on the ${chain} blockchain. Before executing, it quotes the transaction to calculate fees, shows you a confirmation dialog with all details, waits for your explicit approval, and only then broadcasts the transaction. This is a DESTRUCTIVE operation that will spend funds from your wallet.

Args:
  - token (REQUIRED): Token symbol (e.g., "USDT", "USDC", "DAI")
  - to (REQUIRED): The recipient's address (string)
  - amount (REQUIRED): The amount to transfer in HUMAN-READABLE format (string)
    * Examples: "10" means 10 USDT, "0.5" means 0.5 DAI
    * DO NOT use base units - tool handles conversion automatically

Returns:
  Text format: "Transfer sent! Hash: {hash} Fee: {fee}"
  
  Structured output:
  {
    "hash": "0xabc123...",
    "fee": "21000000000000"
  }

Examples:
  - Use when: "Transfer 10 USDT to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7"
  - Don't use when: You just want to check fees (use ${chain}_quoteTransfer instead)
  - Don't use when: Sending native currency (use ${chain}_sendTransaction instead)

Error Handling:
  - Returns error if ${chain} wallet is not registered
  - Returns error if token symbol is not registered
  - Returns error if recipient address is invalid
  - Returns error if amount is invalid or zero
  - Returns "Transfer cancelled" if user declines confirmation`,
      inputSchema: TransferInputSchema,
      outputSchema: TransferOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (args) => {
      try {
        const { token, to, amount } = args
        const tokenSymbol = token.toUpperCase()

        const tokenInfo = server.getTokenInfo(chain, tokenSymbol)
        if (!tokenInfo) {
          const available = server.getRegisteredTokens(chain)
          throw new Error(
            `Token "${token}" not registered for ${chain}. ` +
            `Available tokens: ${available.length > 0 ? available.join(', ') : 'none'}`
          )
        }

        const { address: tokenAddress, decimals } = tokenInfo
        
        const humanAmount = parseFloat(amount)
        if (isNaN(humanAmount) || humanAmount <= 0) {
          throw new Error(`Invalid amount: "${amount}". Please provide a positive number`)
        }
        
        const baseUnitAmount = BigInt(Math.floor(humanAmount * (10 ** decimals)))

        const account = await server.wdk.getAccount(chain, 0)
        
        const quote = await account.quoteTransfer({
          token: tokenAddress,
          recipient: to,
          amount: baseUnitAmount
        })

        const confirmationMessage = `⚠️  TOKEN TRANSFER CONFIRMATION REQUIRED

        Token: ${tokenSymbol}
        To: ${to}
        Amount: ${humanAmount} ${tokenSymbol} (${baseUnitAmount.toString()} base units)
        Estimated Fee: ${quote.fee.toString()}

        This transfer is IRREVERSIBLE once broadcast to the ${chain} network.

        Do you want to proceed with this transfer?`

        const result = await server.server.elicitInput({
          mode: 'form',
          message: confirmationMessage,
          requestedSchema: {
            type: 'object',
            properties: {
              confirmed: {
                type: 'boolean',
                title: 'Confirm Transfer',
                description: 'Check to confirm and send transfer'
              }
            },
            required: ['confirmed']
          }
        })

        if (result.action !== 'accept' || !result.content?.confirmed) {
          return {
            content: [{
              type: 'text',
              text: '❌ Transfer cancelled by user. No funds were spent.'
            }]
          }
        }

        const txResult = await account.transfer({
          token: tokenAddress,
          recipient: to,
          amount: baseUnitAmount
        })

        return {
          content: [{
            type: 'text',
            text: `Transfer sent! Hash: ${txResult.hash} Fee: ${txResult.fee.toString()}`
          }],
          structuredContent: {
            hash: txResult.hash,
            fee: txResult.fee.toString()
          }
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `❌ Error transferring token on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}