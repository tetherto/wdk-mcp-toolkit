'use strict'

import { z } from 'zod'

export const SendTransactionInputSchema = z.object({
  to: z.string().describe('The recipient address'),
  value: z.string().describe('The amount to send in base unit (satoshis for Bitcoin, wei for Ethereum, etc.)')
})

export const SendTransactionOutputSchema = z.object({
  hash: z.string().describe('Transaction hash'),
  fee: z.string().describe('Actual transaction fee paid in base unit')
})