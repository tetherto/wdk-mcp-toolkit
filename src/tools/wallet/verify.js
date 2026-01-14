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
 * Registers the 'verify' tool for verifying message signatures.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function verify (server) {
  const chains = server.getChains()

  server.registerTool(
    'verify',
    {
      title: 'Verify Message Signature',
      description: `Verify a message signature.

This tool verifies that a signature was created by this wallet's private key for a given message. This is a read-only operation that does NOT use the private key or modify anything.

Args:
  - chain (REQUIRED): The blockchain to use for verification
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
  - Don't use when: You want to create a signature (use sign instead)

Error Handling:
  - Returns error if wallet is not registered for the specified chain
  - Returns error if message or signature is empty
  - Returns valid: false if signature is invalid`,
      inputSchema: z.object({
        chain: z.enum(chains).describe('The blockchain to use for verification'),
        message: z.string().describe('The original message'),
        signature: z.string().describe('The signature to verify')
      }),
      outputSchema: z.object({
        valid: z.boolean().describe('True if the signature is valid')
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ chain, message, signature }) => {
      try {
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
            text: `Error verifying signature on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}
