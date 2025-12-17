'use strict'

import { SignInputSchema, SignOutputSchema } from '../schemas/sign.js'

export function registerSign (server, chain) {
  server.registerTool(
    `${chain}_sign`,
    {
      title: `Sign ${chain.charAt(0).toUpperCase() + chain.slice(1)} Message`,
      description: `Sign a message on ${chain}.

This tool signs an arbitrary message using the wallet's private key, producing a cryptographic signature that can be verified later.

Args:
  - message (REQUIRED): The message to sign (string)

Returns:
  Text format: "Message signed. Signature: {signature}"
  
  Structured output:
  {
    "signature": "0xabc123..."
  }

Examples:
  - Use when: "Sign the message 'Hello World'"
  - Use when: "Create a signature for 'I agree to terms'"
  - Don't use when: You want to verify a signature (use ${chain}_verify instead)

Error Handling:
  - Returns error if ${chain} wallet is not registered
  - Returns error if message is empty`,
      inputSchema: SignInputSchema,
      outputSchema: SignOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (args) => {
      try {
        const { message } = args

        if (!message || message.trim().length === 0) {
          throw new Error('Message cannot be empty')
        }

        const account = await server.wdk.getAccount(chain, 0)
        const signature = await account.sign(message)

        return {
          content: [{
            type: 'text',
            text: `Message signed. Signature: ${signature}`
          }],
          structuredContent: {
            signature
          }
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `❌ Error signing message on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}