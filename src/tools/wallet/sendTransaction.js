// Copyright 2025 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict'

import { z } from 'zod'

/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */

/**
 * Registers the 'sendTransaction' tool for sending native currency transactions.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function sendTransaction (server) {
  const chains = server.getChains()

  server.registerTool(
    'sendTransaction',
    {
      title: 'Send Transaction',
      description: `Send a native currency transaction (BTC, ETH, etc.).

This tool sends a native currency transaction on the blockchain. Before executing, it quotes the transaction to calculate fees, shows you a confirmation dialog with all details, waits for your explicit approval, and only then broadcasts the transaction. This is a DESTRUCTIVE operation that will spend funds from your wallet.

Args:
  - chain (REQUIRED): The blockchain to send on
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
  - Don't use when: You just want to check fees (use quoteSendTransaction instead)
  - Don't use when: Sending tokens (use transfer instead)

Error Handling:
  - Returns error if wallet is not registered for the specified chain
  - Returns error if recipient address is invalid
  - Returns error if amount is invalid or zero
  - Returns error if insufficient balance to cover amount + fees
  - Returns "Transaction cancelled" if user declines confirmation`,
      inputSchema: z.object({
        chain: z.enum(chains).describe('The blockchain to send on'),
        to: z.string().describe('The recipient address'),
        value: z.string().describe('The amount to send in base unit (satoshis for Bitcoin, wei for Ethereum, etc.)')
      }),
      outputSchema: z.object({
        hash: z.string().describe('Transaction hash'),
        fee: z.string().describe('Actual transaction fee paid in base unit')
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ chain, to, value }) => {
      try {
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
              text: 'Transaction cancelled by user. No funds were spent.'
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
            text: `Error sending transaction on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}
