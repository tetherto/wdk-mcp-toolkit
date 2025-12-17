'use strict'

import { z } from 'zod'

export const GetAddressInputSchema = z.object({})

export const GetAddressOutputSchema = z.object({
  address: z.string().describe('The wallet address for the blockchain')
})
