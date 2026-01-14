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
 * Registers the 'sign' tool for signing messages.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function sign (server) {
  const chains = server.getChains()

  server.registerTool(
    'sign',
    {
      title: 'Sign Message',
      description: `Sign a message using the wallet's private key.

This tool signs an arbitrary message using the wallet's private key, producing a cryptographic signature that can be verified later. The signature proves ownership of the wallet without revealing the private key.

Args:
  - chain (REQUIRED): The blockchain to use for signing
  - message (REQUIRED): The message to sign (string)

Returns:
  Text format: "Message signed. Signature: {signature}"
  
  Structured output:
  {
    "signature": "0xabc123..."
  }

Examples:
  - Use when: "Sign the message 'Hello World' with my ethereum wallet"
  - Use when: "Create a signature for 'I agree to terms'"
  - Don't use when: You want to verify a signature (use verify instead)

Error Handling:
  - Returns error if wallet is not registered for the specified chain
  - Returns error if message is empty`,
      inputSchema: z.object({
        chain: z.enum(chains).describe('The blockchain to use for signing'),
        message: z.string().describe('The message to sign')
      }),
      outputSchema: z.object({
        signature: z.string().describe('The message signature')
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ chain, message }) => {
      try {
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
            text: `Error signing message on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}
