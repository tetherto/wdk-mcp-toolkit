'use strict'

import { VerifyInputSchema, VerifyOutputSchema } from '../schemas/verify.js'

export function registerVerify (server, chain) {
  server.registerTool(
    `${chain}_verify`,
    {
      title: `Verify ${chain.charAt(0).toUpperCase() + chain.slice(1)} Message Signature`,
      description: `Verify a message signature on ${chain}.

This tool verifies that a signature was created by this wallet's private key for a given message. This is a read-only operation that does NOT use the private key or modify anything.

Args:
  - message (REQUIRED): The original message (string)
  - signature (REQUIRED): The signature to verify (string)

Returns:
  Text format: "Signature is valid: {true/false}"
  
  Structured output:
  {
    "valid": true
  }

Examples:
  - Use when: "Verify signature 0xabc... for message 'Hello World'"
  - Use when: "Check if this signature is valid"
  - Don't use when: You want to create a signature (use ${chain}_sign instead)

Error Handling:
  - Returns error if ${chain} wallet is not registered
  - Returns error if message or signature is empty
  - Returns valid: false if signature is invalid`,
      inputSchema: VerifyInputSchema,
      outputSchema: VerifyOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (args) => {
      try {
        const { message, signature } = args

        if (!message || message.trim().length === 0) {
          throw new Error('Message cannot be empty')
        }

        if (!signature || signature.trim().length === 0) {
          throw new Error('Signature cannot be empty')
        }

        const account = await server.wdk.getAccount(chain, 0)
        const valid = await account.verify(message, signature)

        return {
          content: [{
            type: 'text',
            text: `Signature is valid: ${valid}`
          }],
          structuredContent: {
            valid
          }
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `❌ Error verifying signature on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}