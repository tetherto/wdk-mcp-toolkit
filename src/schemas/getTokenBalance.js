'use strict'

import { z } from 'zod'

export const GetTokenBalanceInputSchema = z.object({
  token: z.string().describe('Token symbol (e.g., "USDT", "USDC", "DAI")')
})

export const GetTokenBalanceOutputSchema = z.object({
  balance: z.string().describe('Token balance in human-readable format'),
  balanceRaw: z.string().describe('Token balance in base units')
})