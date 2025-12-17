'use strict'

import { z } from 'zod'

export const TransferInputSchema = z.object({
  token: z.string().describe('The token symbol (e.g., USDT, USDC, DAI)'),
  to: z.string().describe('The recipient address'),
  amount: z.string().describe('The amount to transfer in token base units')
})

export const TransferOutputSchema = z.object({
  hash: z.string().describe('Transaction hash'),
  fee: z.string().describe('Actual transaction fee paid in base unit')
})