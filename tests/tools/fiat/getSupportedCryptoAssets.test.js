'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { getSupportedCryptoAssets } from '../../../src/tools/fiat/getSupportedCryptoAssets.js'

describe('getSupportedCryptoAssets', () => {
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

    getSupportedCryptoAssets(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name getSupportedCryptoAssets', () => {
    getSupportedCryptoAssets(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'getSupportedCryptoAssets',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getSupportedCryptoAssets(server)
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
        const getSupportedCryptoAssetsMock = jest.fn().mockResolvedValue([
          { code: 'eth', name: 'Ethereum', networkCode: 'ethereum', decimals: 18 }
        ])

        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            getSupportedCryptoAssets: getSupportedCryptoAssetsMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({ chain: 'ethereum' })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
      })

      test('should call getFiatProtocol with first protocol label', async () => {
        const getSupportedCryptoAssetsMock = jest.fn().mockResolvedValue([
          { code: 'eth', name: 'Ethereum', networkCode: 'ethereum', decimals: 18 }
        ])

        const getFiatProtocolMock = jest.fn().mockReturnValue({
          getSupportedCryptoAssets: getSupportedCryptoAssetsMock
        })

        const accountMock = { getFiatProtocol: getFiatProtocolMock }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({ chain: 'ethereum' })

        expect(getFiatProtocolMock).toHaveBeenCalledWith('moonpay')
      })

      test('should call getSupportedCryptoAssets on protocol', async () => {
        const getSupportedCryptoAssetsMock = jest.fn().mockResolvedValue([
          { code: 'eth', name: 'Ethereum', networkCode: 'ethereum', decimals: 18 }
        ])

        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            getSupportedCryptoAssets: getSupportedCryptoAssetsMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({ chain: 'ethereum' })

        expect(getSupportedCryptoAssetsMock).toHaveBeenCalled()
      })
    })

    describe('result formatting', () => {
      test('should return assets array in structured content', async () => {
        const assets = [
          { code: 'eth', name: 'Ethereum', networkCode: 'ethereum', decimals: 18 },
          { code: 'usdt', name: 'Tether', networkCode: 'ethereum', decimals: 6 }
        ]

        const getSupportedCryptoAssetsMock = jest.fn().mockResolvedValue(assets)

        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            getSupportedCryptoAssets: getSupportedCryptoAssetsMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({ chain: 'ethereum' })

        expect(result.structuredContent).toEqual(assets)
      })

      test('should return text content with JSON', async () => {
        const assets = [{ code: 'eth', name: 'Ethereum', networkCode: 'ethereum', decimals: 18 }]

        const getSupportedCryptoAssetsMock = jest.fn().mockResolvedValue(assets)

        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            getSupportedCryptoAssets: getSupportedCryptoAssetsMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({ chain: 'ethereum' })

        expect(result.content[0].type).toBe('text')
        expect(result.content[0].text).toContain('eth')
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.wdk.getAccount.mockRejectedValue(new Error('Network error'))

        const result = await handler({ chain: 'ethereum' })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error getting supported crypto assets: Network error')
      })
    })
  })
})
