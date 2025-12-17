'use strict'

import { z } from 'zod'

export const QuoteSendTransactionInputSchema = z.object({
  to: z.string().describe('The recipient address'),
  value: z.string().describe('The amount to send in base unit (satoshis for Bitcoin, wei for Ethereum, etc.)')
})

export const QuoteSendTransactionOutputSchema = z.object({
  fee: z.string().describe('Estimated transaction fee in base unit')
})