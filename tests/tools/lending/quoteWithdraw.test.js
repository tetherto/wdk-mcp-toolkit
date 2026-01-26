'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { quoteWithdraw } from '../../../src/tools/lending/quoteWithdraw.js'

describe('quoteWithdraw', () => {
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

    quoteWithdraw(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name quoteWithdraw', () => {
    quoteWithdraw(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'quoteWithdraw',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    const USDT_INFO = { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }

    beforeEach(() => {
      quoteWithdraw(server)
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
        const quoteWithdrawMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteWithdraw: quoteWithdrawMock
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(quoteWithdrawMock).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 100000000n
          })
        )
      })
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        const quoteWithdrawMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteWithdraw: quoteWithdrawMock
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
        const quoteWithdrawMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })

        const getLendingProtocolMock = jest.fn().mockReturnValue({
          quoteWithdraw: quoteWithdrawMock
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

      test('should call quoteWithdraw with token address', async () => {
        const quoteWithdrawMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteWithdraw: quoteWithdrawMock
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(quoteWithdrawMock).toHaveBeenCalledWith(
          expect.objectContaining({
            token: USDT_INFO.address
          })
        )
      })

      test('should use to address if provided', async () => {
        const quoteWithdrawMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteWithdraw: quoteWithdrawMock
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100',
          to: '0x456'
        })

        expect(quoteWithdrawMock).toHaveBeenCalledWith(
          expect.objectContaining({
            to: '0x456'
          })
        )
      })
    })

    describe('result formatting', () => {
      test('should return fee as string', async () => {
        const quoteWithdrawMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteWithdraw: quoteWithdrawMock
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
        const quoteWithdrawMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteWithdraw: quoteWithdrawMock
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
        expect(result.content[0].text).toBe('Error quoting withdraw: Network error')
      })
    })
  })
})
