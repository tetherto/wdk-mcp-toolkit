'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { quoteBuy } from '../../../src/tools/fiat/quoteBuy.js'

describe('quoteBuy', () => {
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

  function setupMocks (quote = { cryptoAmount: 1000000000000000000n, fiatAmount: 350000n, fee: 1750n, rate: '3500.00' }) {
    const quoteBuyMock = jest.fn().mockResolvedValue(quote)
    const accountMock = {
      getFiatProtocol: jest.fn().mockReturnValue({ quoteBuy: quoteBuyMock })
    }
    server.wdk.getAccount.mockResolvedValue(accountMock)
    return { quoteBuyMock, accountMock }
  }

  test('should not register tool if no fiat chains available', () => {
    server.getFiatChains.mockReturnValue([])

    quoteBuy(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name quoteBuy', () => {
    quoteBuy(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'quoteBuy',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      quoteBuy(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if no fiat protocol for chain', async () => {
        server.getFiatProtocols.mockReturnValue([])

        const result = await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '10000',
          amountType: 'fiat'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('No fiat protocol registered for ethereum.')
        expect(result.structuredContent).toBeUndefined()
      })
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        setupMocks()

        await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '350000',
          amountType: 'fiat'
        })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
      })

      test('should call getFiatProtocol with first protocol label', async () => {
        const { accountMock } = setupMocks()

        await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '350000',
          amountType: 'fiat'
        })

        expect(accountMock.getFiatProtocol).toHaveBeenCalledWith('moonpay')
      })

      test('should call quoteBuy with fiatAmount when amountType is fiat', async () => {
        const { quoteBuyMock } = setupMocks()

        await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '350000',
          amountType: 'fiat'
        })

        expect(quoteBuyMock).toHaveBeenCalledWith({
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          fiatAmount: 350000n
        })
      })

      test('should call quoteBuy with cryptoAmount when amountType is crypto', async () => {
        const { quoteBuyMock } = setupMocks()

        await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '1000000000000000000',
          amountType: 'crypto'
        })

        expect(quoteBuyMock).toHaveBeenCalledWith({
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          cryptoAmount: 1000000000000000000n
        })
      })
    })

    describe('result formatting', () => {
      test('should return complete response with quote', async () => {
        setupMocks({
          cryptoAmount: 1000000000000000000n,
          fiatAmount: 350000n,
          fee: 1750n,
          rate: '3500.00'
        })

        const result = await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '350000',
          amountType: 'fiat'
        })

        expect(result.isError).toBeUndefined()
        expect(result.content).toHaveLength(1)
        expect(result.content[0].type).toBe('text')
        expect(result.structuredContent).toEqual({
          protocol: 'moonpay',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          cryptoAmount: '1000000000000000000',
          fiatAmount: '350000',
          fee: '1750',
          rate: '3500.00'
        })
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.wdk.getAccount.mockRejectedValue(new Error('Network error'))

        const result = await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '350000',
          amountType: 'fiat'
        })

        expect(result.isError).toBe(true)
        expect(result.content).toHaveLength(1)
        expect(result.content[0].type).toBe('text')
        expect(result.content[0].text).toBe('Error quoting buy: Network error')
        expect(result.structuredContent).toBeUndefined()
      })
    })
  })
})
