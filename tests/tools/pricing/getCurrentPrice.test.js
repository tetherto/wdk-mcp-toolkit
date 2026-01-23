'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { getCurrentPrice } from '../../../src/tools/pricing/getCurrentPrice.js'

describe('getCurrentPrice', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      pricingClient: {
        getCurrentPrice: jest.fn()
      }
    }
  })

  test('should register tool with name getCurrentPrice', () => {
    getCurrentPrice(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'getCurrentPrice',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getCurrentPrice(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    test('should uppercase base currency', async () => {
      server.pricingClient.getCurrentPrice.mockResolvedValue(42150.50)

      await handler({ base: 'btc', quote: 'USD' })

      expect(server.pricingClient.getCurrentPrice).toHaveBeenCalledWith('BTC', 'USD')
    })

    test('should uppercase quote currency', async () => {
      server.pricingClient.getCurrentPrice.mockResolvedValue(42150.50)

      await handler({ base: 'BTC', quote: 'usd' })

      expect(server.pricingClient.getCurrentPrice).toHaveBeenCalledWith('BTC', 'USD')
    })

    test('should call pricingClient.getCurrentPrice with uppercased currencies', async () => {
      server.pricingClient.getCurrentPrice.mockResolvedValue(42150.50)

      await handler({ base: 'btc', quote: 'usd' })

      expect(server.pricingClient.getCurrentPrice).toHaveBeenCalledWith('BTC', 'USD')
    })

    test('should return price in text content', async () => {
      server.pricingClient.getCurrentPrice.mockResolvedValue(42150.50)

      const result = await handler({ base: 'BTC', quote: 'USD' })

      expect(result.content[0].text).toBe('BTC/USD: 42150.5')
    })

    test('should return structured content with base, quote, and price', async () => {
      server.pricingClient.getCurrentPrice.mockResolvedValue(42150.50)

      const result = await handler({ base: 'BTC', quote: 'USD' })

      expect(result.structuredContent).toEqual({
        base: 'BTC',
        quote: 'USD',
        price: 42150.50
      })
    })

    test('should return error with message on exception', async () => {
      server.pricingClient.getCurrentPrice.mockRejectedValue(new Error('Pair not supported'))

      const result = await handler({ base: 'XYZ', quote: 'USD' })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error getting current price: Pair not supported')
    })
  })
})
