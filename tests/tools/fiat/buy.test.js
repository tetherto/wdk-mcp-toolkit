'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { buy } from '../../../src/tools/fiat/buy.js'

describe('buy', () => {
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

  function setupMocks (buyUrl = 'https://buy.moonpay.com/abc123') {
    const buyMock = jest.fn().mockResolvedValue({ buyUrl })
    const accountMock = {
      getAddress: jest.fn().mockResolvedValue('0x123'),
      getFiatProtocol: jest.fn().mockReturnValue({ buy: buyMock })
    }
    server.wdk.getAccount.mockResolvedValue(accountMock)
    return { buyMock, accountMock }
  }

  test('should not register tool if no fiat chains available', () => {
    server.getFiatChains.mockReturnValue([])

    buy(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name buy', () => {
    buy(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'buy',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      buy(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if no fiat protocol for chain', async () => {
        server.getFiatProtocols.mockReturnValue([])

        const result = await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '100',
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
          amount: '100',
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
          amount: '100',
          amountType: 'fiat'
        })

        expect(accountMock.getFiatProtocol).toHaveBeenCalledWith('moonpay')
      })

      test('should call buy with fiatAmount when amountType is fiat', async () => {
        const { buyMock } = setupMocks()

        await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '10000',
          amountType: 'fiat'
        })

        expect(buyMock).toHaveBeenCalledWith({
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          fiatAmount: 10000n,
          recipient: '0x123'
        })
      })

      test('should call buy with cryptoAmount when amountType is crypto', async () => {
        const { buyMock } = setupMocks()

        await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '1000000000000000000',
          amountType: 'crypto'
        })

        expect(buyMock).toHaveBeenCalledWith({
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          cryptoAmount: 1000000000000000000n,
          recipient: '0x123'
        })
      })

      test('should use provided recipient if given', async () => {
        const { buyMock } = setupMocks()

        await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '100',
          amountType: 'fiat',
          recipient: '0x456'
        })

        expect(buyMock).toHaveBeenCalledWith(
          expect.objectContaining({ recipient: '0x456' })
        )
      })
    })

    describe('result formatting', () => {
      test('should return complete response on success', async () => {
        setupMocks('https://buy.moonpay.com/abc123')

        const result = await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '100',
          amountType: 'fiat'
        })

        expect(result.isError).toBeUndefined()
        expect(result.content).toHaveLength(1)
        expect(result.content[0].type).toBe('text')
        expect(result.content[0].text).toContain('https://buy.moonpay.com/abc123')
        expect(result.structuredContent).toEqual({
          buyUrl: 'https://buy.moonpay.com/abc123',
          protocol: 'moonpay'
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
          amount: '100',
          amountType: 'fiat'
        })

        expect(result.isError).toBe(true)
        expect(result.content).toHaveLength(1)
        expect(result.content[0].type).toBe('text')
        expect(result.content[0].text).toBe('Error generating buy URL: Network error')
        expect(result.structuredContent).toBeUndefined()
      })
    })
  })
})
