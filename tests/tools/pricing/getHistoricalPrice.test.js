'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { getHistoricalPrice } from '../../../src/tools/pricing/getHistoricalPrice.js'

describe('getHistoricalPrice', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      pricingClient: {
        getHistoricalPrice: jest.fn()
      }
    }
  })

  test('should register tool with name getHistoricalPrice', () => {
    getHistoricalPrice(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'getHistoricalPrice',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    const MOCK_SERIES = [
      [1709906400000, 42000, 42100, 42200, 41900, 1000],
      [1709910000000, 42100, 42050, 42150, 42000, 800]
    ]

    beforeEach(() => {
      getHistoricalPrice(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    test('should uppercase from currency', async () => {
      server.pricingClient.getHistoricalPrice.mockResolvedValue(MOCK_SERIES)

      await handler({ from: 'btc', to: 'USD' })

      expect(server.pricingClient.getHistoricalPrice).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'BTC' })
      )
    })

    test('should uppercase to currency', async () => {
      server.pricingClient.getHistoricalPrice.mockResolvedValue(MOCK_SERIES)

      await handler({ from: 'BTC', to: 'usd' })

      expect(server.pricingClient.getHistoricalPrice).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'USD' })
      )
    })

    test('should pass start and end timestamps when provided', async () => {
      server.pricingClient.getHistoricalPrice.mockResolvedValue(MOCK_SERIES)

      const start = 1709906400000
      const end = 1709913600000

      await handler({ from: 'BTC', to: 'USD', start, end })

      expect(server.pricingClient.getHistoricalPrice).toHaveBeenCalledWith({
        from: 'BTC',
        to: 'USD',
        start,
        end
      })
    })

    test('should not include start and end in result when not provided', async () => {
      server.pricingClient.getHistoricalPrice.mockResolvedValue(MOCK_SERIES)

      const result = await handler({ from: 'BTC', to: 'USD' })

      expect(result.structuredContent.start).toBeUndefined()
      expect(result.structuredContent.end).toBeUndefined()
    })

    test('should include start and end in result when provided', async () => {
      server.pricingClient.getHistoricalPrice.mockResolvedValue(MOCK_SERIES)

      const start = 1709906400000
      const end = 1709913600000

      const result = await handler({ from: 'BTC', to: 'USD', start, end })

      expect(result.structuredContent.start).toBe(start)
      expect(result.structuredContent.end).toBe(end)
    })

    test('should return data points count in text content', async () => {
      server.pricingClient.getHistoricalPrice.mockResolvedValue(MOCK_SERIES)

      const result = await handler({ from: 'BTC', to: 'USD' })

      expect(result.content[0].text).toContain('2 data points')
    })

    test('should return points in structured content', async () => {
      server.pricingClient.getHistoricalPrice.mockResolvedValue(MOCK_SERIES)

      const result = await handler({ from: 'BTC', to: 'USD' })

      expect(result.structuredContent.points).toEqual(MOCK_SERIES)
    })

    test('should return 0 data points when series is empty', async () => {
      server.pricingClient.getHistoricalPrice.mockResolvedValue([])

      const result = await handler({ from: 'BTC', to: 'USD' })

      expect(result.content[0].text).toContain('0 data points')
    })

    test('should return error with message on exception', async () => {
      server.pricingClient.getHistoricalPrice.mockRejectedValue(new Error('Invalid time range'))

      const result = await handler({ from: 'BTC', to: 'USD' })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error getting historical price: Invalid time range')
    })
  })
})
