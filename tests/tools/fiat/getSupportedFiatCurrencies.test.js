'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { getSupportedFiatCurrencies } from '../../../src/tools/fiat/getSupportedFiatCurrencies.js'

describe('getSupportedFiatCurrencies', () => {
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

    getSupportedFiatCurrencies(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name getSupportedFiatCurrencies', () => {
    getSupportedFiatCurrencies(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'getSupportedFiatCurrencies',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getSupportedFiatCurrencies(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if no fiat protocol for chain', async () => {
        server.getFiatProtocols.mockReturnValue([])

        const result = await handler({ chain: 'ethereum' })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('No fiat protocol registered for ethereum.')
      })
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        const getSupportedFiatCurrenciesMock = jest.fn().mockResolvedValue([
          { code: 'USD', name: 'US Dollar', decimals: 2 }
        ])

        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            getSupportedFiatCurrencies: getSupportedFiatCurrenciesMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({ chain: 'ethereum' })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
      })

      test('should call getFiatProtocol with first protocol label', async () => {
        const getSupportedFiatCurrenciesMock = jest.fn().mockResolvedValue([
          { code: 'USD', name: 'US Dollar', decimals: 2 }
        ])

        const getFiatProtocolMock = jest.fn().mockReturnValue({
          getSupportedFiatCurrencies: getSupportedFiatCurrenciesMock
        })

        const accountMock = { getFiatProtocol: getFiatProtocolMock }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({ chain: 'ethereum' })

        expect(getFiatProtocolMock).toHaveBeenCalledWith('moonpay')
      })

      test('should call getSupportedFiatCurrencies on protocol', async () => {
        const getSupportedFiatCurrenciesMock = jest.fn().mockResolvedValue([
          { code: 'USD', name: 'US Dollar', decimals: 2 }
        ])

        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            getSupportedFiatCurrencies: getSupportedFiatCurrenciesMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({ chain: 'ethereum' })

        expect(getSupportedFiatCurrenciesMock).toHaveBeenCalled()
      })
    })

    describe('result formatting', () => {
      test('should return currencies array in structured content', async () => {
        const currencies = [
          { code: 'USD', name: 'US Dollar', decimals: 2 },
          { code: 'EUR', name: 'Euro', decimals: 2 }
        ]

        const getSupportedFiatCurrenciesMock = jest.fn().mockResolvedValue(currencies)

        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            getSupportedFiatCurrencies: getSupportedFiatCurrenciesMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({ chain: 'ethereum' })

        expect(result.structuredContent).toEqual(currencies)
      })

      test('should return text content with JSON', async () => {
        const currencies = [{ code: 'USD', name: 'US Dollar', decimals: 2 }]

        const getSupportedFiatCurrenciesMock = jest.fn().mockResolvedValue(currencies)

        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            getSupportedFiatCurrencies: getSupportedFiatCurrenciesMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({ chain: 'ethereum' })

        expect(result.content[0].type).toBe('text')
        expect(result.content[0].text).toContain('USD')
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.wdk.getAccount.mockRejectedValue(new Error('Network error'))

        const result = await handler({ chain: 'ethereum' })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error getting supported fiat currencies: Network error')
      })
    })
  })
})
