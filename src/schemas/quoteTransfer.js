'use strict'

import { z } from 'zod'

export const QuoteTransferInputSchema = z.object({
  token: z.string().describe('Token symbol (e.g., "USDT", "USDC", "DAI")'),
  recipient: z.string().describe('The recipient address'),
  amount: z.string().describe('The amount to transfer in human-readable format (e.g., "10" for 10 USDT, "0.5" for 0.5 DAI)')
})

export const QuoteTransferOutputSchema = z.object({
  fee: z.string().describe('Estimated transaction fee in base unit')
})