'use strict'

import { SendTransactionInputSchema, SendTransactionOutputSchema } from '../schemas/sendTransaction.js'

export function registerSendTransaction (server, chain) {
  server.registerTool(
    `${chain}_sendTransaction`,
    {
      title: `Send ${chain.charAt(0).toUpperCase() + chain.slice(1)} Transaction`,
      description: `Send a transaction on ${chain}.

This tool sends a native currency transaction (BTC, ETH, etc.) on the ${chain} blockchain. Before executing, it quotes the transaction to calculate fees, shows you a confirmation dialog with all details, waits for your explicit approval, and only then broadcasts the transaction. This is a DESTRUCTIVE operation that will spend funds from your wallet.

Args:
  - to (REQUIRED): The recipient's blockchain address (string)
  - value (REQUIRED): The amount to send in base unit (string)
    * Bitcoin: satoshis (1 BTC = 100,000,000 satoshis)
    * Ethereum: wei (1 ETH = 1,000,000,000,000,000,000 wei)

Returns:
  Text format: "Transaction sent! Hash: {hash} Fee: {fee}"
  
  Structured output:
  {
    "hash": "0xabc123...",
    "fee": "21000000000000"
  }

Examples:
  - Use when: "Send 100000 satoshis to bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
  - Use when: "Transfer 500000000000000000 wei to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7"
  - Don't use when: You just want to check fees (use ${chain}_quoteSendTransaction instead)
  - Don't use when: Sending tokens (use ${chain}_transfer instead)

Error Handling:
  - Returns error if ${chain} wallet is not registered
  - Returns error if recipient address is invalid
  - Returns error if amount is invalid or zero
  - Returns error if insufficient balance to cover amount + fees
  - Returns "Transaction cancelled" if user declines confirmation`,
      inputSchema: SendTransactionInputSchema,
      outputSchema: SendTransactionOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (args) => {
      try {
        const { to, value } = args
        const valueAmount = BigInt(value)

        if (valueAmount <= 0n) {
          throw new Error('Amount must be greater than zero')
        }

        const account = await server.wdk.getAccount(chain, 0)
        const quote = await account.quoteSendTransaction({
          to,
          value: valueAmount
        })

        const totalAmount = valueAmount + quote.fee

        const confirmationMessage = `⚠️  TRANSACTION CONFIRMATION REQUIRED

To: ${to}
Amount: ${valueAmount.toString()}
Estimated Fee: ${quote.fee.toString()}
Total: ${totalAmount.toString()}

This transaction is IRREVERSIBLE once broadcast to the ${chain} network.

Do you want to proceed with this transaction?`

        const result = await server.server.elicitInput({
          mode: 'form',
          message: confirmationMessage,
          requestedSchema: {
            type: 'object',
            properties: {
              confirmed: {
                type: 'boolean',
                title: 'Confirm Transaction',
                description: 'Check to confirm and send transaction'
              }
            },
            required: ['confirmed']
          }
        })

        if (result.action !== 'accept' || !result.content?.confirmed) {
          return {
            content: [{
              type: 'text',
              text: '❌ Transaction cancelled by user. No funds were spent.'
            }]
          }
        }

        const txResult = await account.sendTransaction({
          to,
          value: valueAmount
        })

        return {
          content: [{
            type: 'text',
            text: `Transaction sent! Hash: ${txResult.hash} Fee: ${txResult.fee.toString()}`
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
            text: `❌ Error sending transaction on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}