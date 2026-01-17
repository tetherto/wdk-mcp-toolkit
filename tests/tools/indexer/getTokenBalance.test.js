'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { getIndexerTokenBalance } from '../../../src/tools/indexer/getTokenBalance.js'

describe('getIndexerTokenBalance', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      indexerClient: {
        getTokenBalance: jest.fn()
      }
    }
  })

  test('should register tool with name getIndexerTokenBalance', () => {
    getIndexerTokenBalance(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'getIndexerTokenBalance',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    const ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'

    beforeEach(() => {
      getIndexerTokenBalance(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    test('should call indexerClient.getTokenBalance with blockchain, token, and address', async () => {
      server.indexerClient.getTokenBalance.mockResolvedValue({
        tokenBalance: { blockchain: 'ethereum', token: 'usdt', amount: '1000000' }
      })

      await handler({ blockchain: 'ethereum', token: 'usdt', address: ADDRESS })

      expect(server.indexerClient.getTokenBalance).toHaveBeenCalledWith('ethereum', 'usdt', ADDRESS)
    })

    test('should return balance in text content', async () => {
      server.indexerClient.getTokenBalance.mockResolvedValue({
        tokenBalance: { blockchain: 'ethereum', token: 'usdt', amount: '1000000' }
      })

      const result = await handler({ blockchain: 'ethereum', token: 'usdt', address: ADDRESS })

      expect(result.content[0].text).toBe('Balance: 1000000 USDT on ethereum')
    })

    test('should return 0 if tokenBalance.amount is undefined', async () => {
      server.indexerClient.getTokenBalance.mockResolvedValue({
        tokenBalance: { blockchain: 'ethereum', token: 'usdt' }
      })

      const result = await handler({ blockchain: 'ethereum', token: 'usdt', address: ADDRESS })

      expect(result.content[0].text).toBe('Balance: 0 USDT on ethereum')
    })

    test('should return indexer response as structured content', async () => {
      const mockResponse = {
        tokenBalance: { blockchain: 'ethereum', token: 'usdt', amount: '1000000' }
      }
      server.indexerClient.getTokenBalance.mockResolvedValue(mockResponse)

      const result = await handler({ blockchain: 'ethereum', token: 'usdt', address: ADDRESS })

      expect(result.structuredContent).toEqual(mockResponse)
    })

    test('should return error with message on exception', async () => {
      server.indexerClient.getTokenBalance.mockRejectedValue(new Error('API error'))

      const result = await handler({ blockchain: 'ethereum', token: 'usdt', address: ADDRESS })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error getting indexed token balance: API error')
    })
  })
})
