'use strict'

import { z } from 'zod'

export const GetMaxSpendableInputSchema = z.object({})

export const GetMaxSpendableOutputSchema = z.object({
  amount: z.string().describe('Maximum spendable amount in satoshis'),
  fee: z.string().describe('Estimated transaction fee in satoshis'),
  changeValue: z.string().describe('Expected change output in satoshis')
})