'use strict'

import { z } from 'zod'

export const GetFeeRatesInputSchema = z.object({})

export const GetFeeRatesOutputSchema = z.object({
  slow: z.string().describe('Slow fee rate'),
  medium: z.string().describe('Medium fee rate'),
  fast: z.string().describe('Fast fee rate')
})