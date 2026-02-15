'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { swap } from '../../../src/tools/swap/swap.js'

describe('swap', () => {
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
      },
      requestConfirmation: jest.fn()
    }
  })

  test('should not register tool if no swap chains available', () => {
    server.getSwapChains.mockReturnValue([])

    swap(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name swap', () => {
    swap(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'swap',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    const USDT_INFO = { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }
    const USDC_INFO = { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 }

    beforeEach(() => {
      swap(server)
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
          getSwapProtocol: jest.fn().mockReturnValue({
            quoteSwap: quoteSwapMock,
            swap: jest.fn()
          })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.requestConfirmation.mockResolvedValue({ action: 'decline' })

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
          getSwapProtocol: jest.fn().mockReturnValue({
            quoteSwap: quoteSwapMock,
            swap: jest.fn()
          })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.requestConfirmation.mockResolvedValue({ action: 'decline' })

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

    describe('recipient handling', () => {
      test('should not include to in options when not provided', async () => {
        const quoteSwapMock = jest.fn().mockResolvedValue({
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const accountMock = {
          getSwapProtocol: jest.fn().mockReturnValue({
            quoteSwap: quoteSwapMock,
            swap: jest.fn()
          })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.requestConfirmation.mockResolvedValue({ action: 'decline' })

        await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        expect(quoteSwapMock).toHaveBeenCalledWith(
          expect.not.objectContaining({ to: expect.anything() })
        )
      })

      test('should include to in options when provided', async () => {
        const quoteSwapMock = jest.fn().mockResolvedValue({
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const swapMock = jest.fn().mockResolvedValue({
          hash: '0xabc',
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const accountMock = {
          getSwapProtocol: jest.fn().mockReturnValue({
            quoteSwap: quoteSwapMock,
            swap: swapMock
          })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.requestConfirmation.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

        const recipient = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'

        await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell',
          to: recipient
        })

        expect(swapMock).toHaveBeenCalledWith(
          expect.objectContaining({ to: recipient })
        )
      })
    })

    describe('confirmation flow', () => {
      test('should call server.requestConfirmation with confirmation message', async () => {
        const quoteSwapMock = jest.fn().mockResolvedValue({
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const accountMock = {
          getSwapProtocol: jest.fn().mockReturnValue({
            quoteSwap: quoteSwapMock,
            swap: jest.fn()
          })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.requestConfirmation.mockResolvedValue({ action: 'decline' })

        await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        expect(server.requestConfirmation).toHaveBeenCalledWith(
          expect.stringContaining('SWAP CONFIRMATION REQUIRED'),
          expect.any(Object)
        )
      })

      test('should return cancelled message when user declines', async () => {
        const quoteSwapMock = jest.fn().mockResolvedValue({
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const accountMock = {
          getSwapProtocol: jest.fn().mockReturnValue({
            quoteSwap: quoteSwapMock,
            swap: jest.fn()
          })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.requestConfirmation.mockResolvedValue({ action: 'accept', content: { confirmed: false } })

        const result = await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        expect(result.content[0].text).toBe('Swap cancelled by user. No funds were spent.')
      })

      test('should return cancelled message when action is not accept', async () => {
        const quoteSwapMock = jest.fn().mockResolvedValue({
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const accountMock = {
          getSwapProtocol: jest.fn().mockReturnValue({
            quoteSwap: quoteSwapMock,
            swap: jest.fn()
          })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.requestConfirmation.mockResolvedValue({ action: 'decline' })

        const result = await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        expect(result.content[0].text).toBe('Swap cancelled by user. No funds were spent.')
      })
    })

    describe('swap execution', () => {
      test('should call swapProtocol.swap when user confirms', async () => {
        const quoteSwapMock = jest.fn().mockResolvedValue({
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const swapMock = jest.fn().mockResolvedValue({
          hash: '0xabc123',
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const accountMock = {
          getSwapProtocol: jest.fn().mockReturnValue({
            quoteSwap: quoteSwapMock,
            swap: swapMock
          })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.requestConfirmation.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

        await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        expect(swapMock).toHaveBeenCalled()
      })

      test('should return hash in result', async () => {
        const quoteSwapMock = jest.fn().mockResolvedValue({
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const swapMock = jest.fn().mockResolvedValue({
          hash: '0xabc123',
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const accountMock = {
          getSwapProtocol: jest.fn().mockReturnValue({
            quoteSwap: quoteSwapMock,
            swap: swapMock
          })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.requestConfirmation.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

        const result = await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        expect(result.structuredContent.hash).toBe('0xabc123')
      })

      test('should format amounts in human readable form', async () => {
        const quoteSwapMock = jest.fn().mockResolvedValue({
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const swapMock = jest.fn().mockResolvedValue({
          hash: '0xabc123',
          tokenInAmount: 100000000n,
          tokenOutAmount: 99850000n,
          fee: 21000000000000n
        })

        const accountMock = {
          getSwapProtocol: jest.fn().mockReturnValue({
            quoteSwap: quoteSwapMock,
            swap: swapMock
          })
        }

        server.getTokenInfo
          .mockReturnValueOnce(USDT_INFO)
          .mockReturnValueOnce(USDC_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.requestConfirmation.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

        const result = await handler({
          chain: 'ethereum',
          tokenIn: 'USDT',
          tokenOut: 'USDC',
          amount: '100',
          side: 'sell'
        })

        expect(result.structuredContent.tokenInAmount).toBe('100')
        expect(result.structuredContent.tokenOutAmount).toBe('99.85')
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
        expect(result.content[0].text).toBe('Error executing swap: Network error')
      })
    })
  })
})
