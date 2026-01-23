'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { getTokenTransfers } from '../../../src/tools/indexer/getTokenTransfers.js'

describe('getTokenTransfers', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      indexerClient: {
        getTokenTransfers: jest.fn()
      }
    }
  })

  test('should register tool with name getTokenTransfers', () => {
    getTokenTransfers(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'getTokenTransfers',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    const ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
    const MOCK_TRANSFERS = {
      transfers: [
        {
          blockchain: 'ethereum',
          blockNumber: 12345678,
          transactionHash: '0xabc123',
          token: 'usdt',
          amount: '1000000',
          timestamp: 1699900000,
          from: '0x123',
          to: ADDRESS
        }
      ]
    }

    beforeEach(() => {
      getTokenTransfers(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    test('should call indexerClient.getTokenTransfers with blockchain, token, address, and options', async () => {
      server.indexerClient.getTokenTransfers.mockResolvedValue(MOCK_TRANSFERS)

      await handler({
        blockchain: 'ethereum',
        token: 'usdt',
        address: ADDRESS,
        limit: 50,
        fromTs: 1699800000,
        toTs: 1699900000,
        sort: 'asc'
      })

      expect(server.indexerClient.getTokenTransfers).toHaveBeenCalledWith(
        'ethereum',
        'usdt',
        ADDRESS,
        { limit: 50, fromTs: 1699800000, toTs: 1699900000, sort: 'asc' }
      )
    })

    test('should pass undefined for optional parameters when not provided', async () => {
      server.indexerClient.getTokenTransfers.mockResolvedValue(MOCK_TRANSFERS)

      await handler({
        blockchain: 'ethereum',
        token: 'usdt',
        address: ADDRESS
      })

      expect(server.indexerClient.getTokenTransfers).toHaveBeenCalledWith(
        'ethereum',
        'usdt',
        ADDRESS,
        { limit: undefined, fromTs: undefined, toTs: undefined, sort: undefined }
      )
    })

    test('should return transfer count in text content', async () => {
      server.indexerClient.getTokenTransfers.mockResolvedValue(MOCK_TRANSFERS)

      const result = await handler({
        blockchain: 'ethereum',
        token: 'usdt',
        address: ADDRESS
      })

      expect(result.content[0].text).toContain('Found 1 USDT transfer(s) on ethereum')
    })

    test('should return no transfers message when empty', async () => {
      server.indexerClient.getTokenTransfers.mockResolvedValue({ transfers: [] })

      const result = await handler({
        blockchain: 'ethereum',
        token: 'usdt',
        address: ADDRESS
      })

      expect(result.content[0].text).toContain(`No transfers found for ${ADDRESS} on ethereum`)
    })

    test('should return indexer response as structured content', async () => {
      server.indexerClient.getTokenTransfers.mockResolvedValue(MOCK_TRANSFERS)

      const result = await handler({
        blockchain: 'ethereum',
        token: 'usdt',
        address: ADDRESS
      })

      expect(result.structuredContent).toEqual(MOCK_TRANSFERS)
    })

    test('should return error with message on exception', async () => {
      server.indexerClient.getTokenTransfers.mockRejectedValue(new Error('API error'))

      const result = await handler({
        blockchain: 'ethereum',
        token: 'usdt',
        address: ADDRESS
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error getting token transfers: API error')
    })
  })
})
