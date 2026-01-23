'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { quoteSwap } from '../../../src/tools/swap/quoteSwap.js'

describe('quoteSwap', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      getSwapChains: jest.fn().mockReturnValue(['ethereum']),
      getSwapProtocols: jest.fn().mockReturnValue(['velora']),
      getTokenInfo: jest.fn(),
      wdk: {
        getAccount: jest.fn()
      }
    }
  })

  test('should not register tool if no swap chains available', () => {
    server.getSwapChains.mockReturnValue([])

    quoteSwap(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name quoteSwap', () => {
    quoteSwap(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'quoteSwap',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    const USDT_INFO = { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }
    const USDC_INFO = { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 }

    beforeEach(() => {
      quoteSwap(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if no swap protocols for chain', async () => {
        server.getSwapProtocols.mockReturnValue([])

        const result = await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('No swap protocol registered for ethereum.')
      })

      test('should return error if tokenIn not registered', async () => {
        server.getTokenInfo.mockReturnValue(undefined)

        const result = await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Token USDT not registered for ethereum.')
      })

      test('should return error if tokenOut not registered', async () => {
        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(undefined)

        const result = await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Token USDC not registered for ethereum.')
      })
    })

    describe('amount conversion', () => {
      test('should convert amount to base units using tokenIn decimals when side is sell', async () => {
        const quoteSwapMock = jest.fn().mockResolvedValue({
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const accountMock = {
          getSwapProtocol: jest.fn().mockReturnValue({ quoteSwap: quoteSwapMock })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        expect(quoteSwapMock).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenInAmount: 100000000n
          })
        )
      })

      test('should convert amount to base units using tokenOut decimals when side is buy', async () => {
        const quoteSwapMock = jest.fn().mockResolvedValue({
          tokenInAmount: 100150000n,
          tokenOutAmount: 100000000n,
          fee: 21000000000000n
        })

        const accountMock = {
          getSwapProtocol: jest.fn().mockReturnValue({ quoteSwap: quoteSwapMock })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'buy'
        })

        expect(quoteSwapMock).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenOutAmount: 100000000n
          })
        )
      })
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        const quoteSwapMock = jest.fn().mockResolvedValue({
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const accountMock = {
          getSwapProtocol: jest.fn().mockReturnValue({ quoteSwap: quoteSwapMock })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
      })

      test('should call getSwapProtocol with first protocol label', async () => {
        const quoteSwapMock = jest.fn().mockResolvedValue({
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const getSwapProtocolMock = jest.fn().mockReturnValue({ quoteSwap: quoteSwapMock })
        const accountMock = { getSwapProtocol: getSwapProtocolMock }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        expect(getSwapProtocolMock).toHaveBeenCalledWith('velora')
      })

      test('should call quoteSwap with token addresses', async () => {
        const quoteSwapMock = jest.fn().mockResolvedValue({
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const accountMock = {
          getSwapProtocol: jest.fn().mockReturnValue({ quoteSwap: quoteSwapMock })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        expect(quoteSwapMock).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenIn: USDT_INFO.address,
            tokenOut: USDC_INFO.address
          })
        )
      })
    })

    describe('result formatting', () => {
      test('should convert tokenInAmount from base units to human readable', async () => {
        const quoteSwapMock = jest.fn().mockResolvedValue({
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const accountMock = {
          getSwapProtocol: jest.fn().mockReturnValue({ quoteSwap: quoteSwapMock })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        const structured = result.structuredContent
        expect(structured.tokenInAmount).toBe('100')
      })

      test('should convert tokenOutAmount from base units to human readable', async () => {
        const quoteSwapMock = jest.fn().mockResolvedValue({
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const accountMock = {
          getSwapProtocol: jest.fn().mockReturnValue({ quoteSwap: quoteSwapMock })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        const structured = result.structuredContent
        expect(structured.tokenOutAmount).toBe('99.85')
      })

      test('should return structured content with protocol label', async () => {
        const quoteSwapMock = jest.fn().mockResolvedValue({
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const accountMock = {
          getSwapProtocol: jest.fn().mockReturnValue({ quoteSwap: quoteSwapMock })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        expect(result.structuredContent.protocol).toBe('velora')
      })

      test('should return fee as string', async () => {
        const quoteSwapMock = jest.fn().mockResolvedValue({
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const accountMock = {
          getSwapProtocol: jest.fn().mockReturnValue({ quoteSwap: quoteSwapMock })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        expect(result.structuredContent.fee).toBe('21000000000000')
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockRejectedValue(new Error('Network error'))

        const result = await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error quoting swap: Network error')
      })
    })
  })
})
