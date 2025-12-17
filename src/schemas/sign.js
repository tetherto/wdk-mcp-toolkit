'use strict'

import { z } from 'zod'

export const SignInputSchema = z.object({
  message: z.string().describe('The message to sign')
})

export const SignOutputSchema = z.object({
  signature: z.string().describe('The message signature')
})