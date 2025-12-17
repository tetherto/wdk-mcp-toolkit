'use strict'

import { z } from 'zod'

export const VerifyInputSchema = z.object({
  message: z.string().describe('The original message'),
  signature: z.string().describe('The signature to verify')
})

export const VerifyOutputSchema = z.object({
  valid: z.boolean().describe('True if the signature is valid')
})