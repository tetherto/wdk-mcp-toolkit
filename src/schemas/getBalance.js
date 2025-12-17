'use strict'

import { z } from 'zod'

export const GetBalanceInputSchema = z.object({})

export const GetBalanceOutputSchema = z.object({
  balance: z.string().describe('The balance in base units')
})