'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { getTransactionDetail } from '../../../src/tools/fiat/getTransactionDetail.js'

describe('getTransactionDetail', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      getFiatChains: jest.fn().mockReturnValue(['ethereum']),
      getFiatProtocols: jest.fn().mockReturnValue(['moonpay']),
      wdk: {
        getAccount: jest.fn()
      }
    }
  })

  test('should not register tool if no fiat chains available', () => {
    server.getFiatChains.mockReturnValue([])

    getTransactionDetail(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name getFiatTransactionDetail', () => {
    getTransactionDetail(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'getFiatTransactionDetail',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getTransactionDetail(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if no fiat protocol for chain', async () => {
        server.getFiatProtocols.mockReturnValue([])

        const result = await handler({
          chain: 'ethereum',
          txId: 'tx123'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('No fiat protocol registered for ethereum.')
      })
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        const getTransactionDetailMock = jest.fn().mockResolvedValue({
          status: 'completed',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD'
        })

        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            getTransactionDetail: getTransactionDetailMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          txId: 'tx123'
        })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
      })

      test('should call getFiatProtocol with first protocol label', async () => {
        const getTransactionDetailMock = jest.fn().mockResolvedValue({
          status: 'completed',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD'
        })

        const getFiatProtocolMock = jest.fn().mockReturnValue({
          getTransactionDetail: getTransactionDetailMock
        })

        const accountMock = { getFiatProtocol: getFiatProtocolMock }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          txId: 'tx123'
        })

        expect(getFiatProtocolMock).toHaveBeenCalledWith('moonpay')
      })

      test('should call getTransactionDetail with txId and direction', async () => {
        const getTransactionDetailMock = jest.fn().mockResolvedValue({
          status: 'completed',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD'
        })

        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            getTransactionDetail: getTransactionDetailMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          txId: 'tx123',
          direction: 'sell'
        })

        expect(getTransactionDetailMock).toHaveBeenCalledWith('tx123', 'sell')
      })

      test('should default direction to buy', async () => {
        const getTransactionDetailMock = jest.fn().mockResolvedValue({
          status: 'completed',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD'
        })

        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            getTransactionDetail: getTransactionDetailMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          txId: 'tx123'
        })

        expect(getTransactionDetailMock).toHaveBeenCalledWith('tx123', 'buy')
      })
    })

    describe('result formatting', () => {
      test('should return transaction detail in structured content', async () => {
        const getTransactionDetailMock = jest.fn().mockResolvedValue({
          status: 'completed',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD'
        })

        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            getTransactionDetail: getTransactionDetailMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          txId: 'tx123'
        })

        expect(result.structuredContent.protocol).toBe('moonpay')
        expect(result.structuredContent.txId).toBe('tx123')
        expect(result.structuredContent.status).toBe('completed')
        expect(result.structuredContent.cryptoAsset).toBe('eth')
        expect(result.structuredContent.fiatCurrency).toBe('USD')
      })

      test('should return text content with JSON', async () => {
        const getTransactionDetailMock = jest.fn().mockResolvedValue({
          status: 'completed',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD'
        })

        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            getTransactionDetail: getTransactionDetailMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          txId: 'tx123'
        })

        expect(result.content[0].type).toBe('text')
        expect(result.content[0].text).toContain('moonpay')
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.wdk.getAccount.mockRejectedValue(new Error('Network error'))

        const result = await handler({
          chain: 'ethereum',
          txId: 'tx123'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error getting transaction detail: Network error')
      })
    })
  })
})
