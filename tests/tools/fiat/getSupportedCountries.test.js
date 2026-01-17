'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { getSupportedCountries } from '../../../src/tools/fiat/getSupportedCountries.js'

describe('getSupportedCountries', () => {
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

    getSupportedCountries(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name getSupportedCountries', () => {
    getSupportedCountries(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'getSupportedCountries',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    const MOCK_COUNTRIES = [
      { code: 'US', name: 'United States', isBuyAllowed: true, isSellAllowed: true },
      { code: 'DE', name: 'Germany', isBuyAllowed: true, isSellAllowed: false }
    ]

    beforeEach(() => {
      getSupportedCountries(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if no fiat protocols for chain', async () => {
        server.getFiatProtocols.mockReturnValue([])

        const result = await handler({ chain: 'ethereum' })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('No fiat protocol registered for ethereum.')
      })
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        const getSupportedCountriesMock = jest.fn().mockResolvedValue(MOCK_COUNTRIES)
        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            getSupportedCountries: getSupportedCountriesMock
          })
        }
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({ chain: 'ethereum' })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
      })

      test('should call getFiatProtocol with first protocol label', async () => {
        const getSupportedCountriesMock = jest.fn().mockResolvedValue(MOCK_COUNTRIES)
        const getFiatProtocolMock = jest.fn().mockReturnValue({
          getSupportedCountries: getSupportedCountriesMock
        })
        const accountMock = { getFiatProtocol: getFiatProtocolMock }
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({ chain: 'ethereum' })

        expect(getFiatProtocolMock).toHaveBeenCalledWith('moonpay')
      })

      test('should call fiatProtocol.getSupportedCountries', async () => {
        const getSupportedCountriesMock = jest.fn().mockResolvedValue(MOCK_COUNTRIES)
        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            getSupportedCountries: getSupportedCountriesMock
          })
        }
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({ chain: 'ethereum' })

        expect(getSupportedCountriesMock).toHaveBeenCalled()
      })
    })

    describe('result formatting', () => {
      test('should return countries with code, name, and buy/sell flags', async () => {
        const getSupportedCountriesMock = jest.fn().mockResolvedValue(MOCK_COUNTRIES)
        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            getSupportedCountries: getSupportedCountriesMock
          })
        }
        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({ chain: 'ethereum' })

        expect(result.structuredContent).toEqual([
          { code: 'US', name: 'United States', isBuyAllowed: true, isSellAllowed: true },
          { code: 'DE', name: 'Germany', isBuyAllowed: true, isSellAllowed: false }
        ])
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.wdk.getAccount.mockRejectedValue(new Error('Network error'))

        const result = await handler({ chain: 'ethereum' })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error getting supported countries: Network error')
      })
    })
  })
})
