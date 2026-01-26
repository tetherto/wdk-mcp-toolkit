'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { quoteSupply } from '../../../src/tools/lending/quoteSupply.js'

describe('quoteSupply', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      getLendingChains: jest.fn().mockReturnValue(['ethereum']),
      getLendingProtocols: jest.fn().mockReturnValue(['aave']),
      getTokenInfo: jest.fn(),
      wdk: {
        getAccount: jest.fn()
      }
    }
  })

  test('should not register tool if no lending chains available', () => {
    server.getLendingChains.mockReturnValue([])

    quoteSupply(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name quoteSupply', () => {
    quoteSupply(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'quoteSupply',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    const USDT_INFO = { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }
    const WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'

    beforeEach(() => {
      quoteSupply(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if no lending protocols for chain', async () => {
        server.getLendingProtocols.mockReturnValue([])

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('No lending protocol registered for ethereum.')
      })

      test('should return error if token not registered', async () => {
        server.getTokenInfo.mockReturnValue(undefined)

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Token USDT not registered for ethereum.')
      })
    })

    describe('amount conversion', () => {
      test('should convert amount to base units using token decimals', async () => {
        const quoteSupplyMock = jest.fn().mockResolvedValue({
          fee: 21000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getLendingProtocol: jest.fn().mockReturnValue({ quoteSupply: quoteSupplyMock })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(quoteSupplyMock).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 100000000n
          })
        )
      })
    })

    describe('onBehalfOf handling', () => {
      test('should use wallet address when onBehalfOf not provided', async () => {
        const quoteSupplyMock = jest.fn().mockResolvedValue({
          fee: 21000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getLendingProtocol: jest.fn().mockReturnValue({ quoteSupply: quoteSupplyMock })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(quoteSupplyMock).toHaveBeenCalledWith(
          expect.objectContaining({
            onBehalfOf: WALLET_ADDRESS
          })
        )
      })

      test('should use provided onBehalfOf address', async () => {
        const customAddress = '0xCustomAddress'
        const quoteSupplyMock = jest.fn().mockResolvedValue({
          fee: 21000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getLendingProtocol: jest.fn().mockReturnValue({ quoteSupply: quoteSupplyMock })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100',
          onBehalfOf: customAddress
        })

        expect(quoteSupplyMock).toHaveBeenCalledWith(
          expect.objectContaining({
            onBehalfOf: customAddress
          })
        )
      })
    })

    describe('result formatting', () => {
      test('should return structured content with protocol and chain info', async () => {
        const quoteSupplyMock = jest.fn().mockResolvedValue({
          fee: 21000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getLendingProtocol: jest.fn().mockReturnValue({ quoteSupply: quoteSupplyMock })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(result.structuredContent.protocol).toBe('aave')
        expect(result.structuredContent.chain).toBe('ethereum')
        expect(result.structuredContent.token).toBe('USDT')
      })

      test('should return fee as string', async () => {
        const quoteSupplyMock = jest.fn().mockResolvedValue({
          fee: 21000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getLendingProtocol: jest.fn().mockReturnValue({ quoteSupply: quoteSupplyMock })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(result.structuredContent.fee).toBe('21000000000000')
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockRejectedValue(new Error('Network error'))

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error quoting supply: Network error')
      })
    })
  })
})
