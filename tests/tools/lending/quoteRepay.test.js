'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { quoteRepay } from '../../../src/tools/lending/quoteRepay.js'

describe('quoteRepay', () => {
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

    quoteRepay(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name quoteRepay', () => {
    quoteRepay(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'quoteRepay',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    const USDT_INFO = { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }

    beforeEach(() => {
      quoteRepay(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if no lending protocol for chain', async () => {
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
        const quoteRepayMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteRepay: quoteRepayMock
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(quoteRepayMock).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 100000000n
          })
        )
      })
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        const quoteRepayMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteRepay: quoteRepayMock
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
      })

      test('should call getLendingProtocol with first protocol label', async () => {
        const quoteRepayMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })

        const getLendingProtocolMock = jest.fn().mockReturnValue({
          quoteRepay: quoteRepayMock
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: getLendingProtocolMock
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(getLendingProtocolMock).toHaveBeenCalledWith('aave')
      })

      test('should call quoteRepay with token address', async () => {
        const quoteRepayMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteRepay: quoteRepayMock
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(quoteRepayMock).toHaveBeenCalledWith(
          expect.objectContaining({
            token: USDT_INFO.address
          })
        )
      })

      test('should use onBehalfOf if provided', async () => {
        const quoteRepayMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteRepay: quoteRepayMock
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100',
          onBehalfOf: '0x456'
        })

        expect(quoteRepayMock).toHaveBeenCalledWith(
          expect.objectContaining({
            onBehalfOf: '0x456'
          })
        )
      })
    })

    describe('result formatting', () => {
      test('should return fee as string', async () => {
        const quoteRepayMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteRepay: quoteRepayMock
          })
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

      test('should return protocol label', async () => {
        const quoteRepayMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteRepay: quoteRepayMock
          })
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
        expect(result.structuredContent.amount).toBe('100')
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
        expect(result.content[0].text).toBe('Error quoting repay: Network error')
      })
    })
  })
})
