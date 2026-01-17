'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { quoteTransfer } from '../../../src/tools/wallet/quoteTransfer.js'

describe('quoteTransfer', () => {
  let server, registerToolMock

  const USDT_INFO = { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      getChains: jest.fn().mockReturnValue(['ethereum']),
      getTokenInfo: jest.fn(),
      getRegisteredTokens: jest.fn(),
      wdk: {
        getAccount: jest.fn()
      }
    }
  })

  function setupMocks (fee = 21000000000000n) {
    const quoteTransferMock = jest.fn().mockResolvedValue({ fee })
    const accountMock = { quoteTransfer: quoteTransferMock }
    server.getTokenInfo.mockReturnValue(USDT_INFO)
    server.wdk.getAccount.mockResolvedValue(accountMock)
    return { quoteTransferMock, accountMock }
  }

  test('should register tool with name quoteTransfer', () => {
    quoteTransfer(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'quoteTransfer',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      quoteTransfer(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if token not registered', async () => {
        server.getTokenInfo.mockReturnValue(undefined)
        server.getRegisteredTokens.mockReturnValue(['USDC', 'DAI'])

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
          amount: '100'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('Token symbol "USDT" not registered')
        expect(result.structuredContent).toBeUndefined()
      })

      test('should return error if amount is invalid', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
          amount: 'invalid'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('Invalid amount')
        expect(result.structuredContent).toBeUndefined()
      })

      test('should return error if amount is zero', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
          amount: '0'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('Invalid amount')
        expect(result.structuredContent).toBeUndefined()
      })
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        setupMocks()

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
          amount: '100'
        })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
      })

      test('should call quoteTransfer with token address, recipient, and amount in base units', async () => {
        const { quoteTransferMock } = setupMocks()

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
          amount: '100'
        })

        expect(quoteTransferMock).toHaveBeenCalledWith({
          token: USDT_INFO.address,
          recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
          amount: 100000000n
        })
      })

      test('should handle decimal amounts', async () => {
        const { quoteTransferMock } = setupMocks()

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
          amount: '10.5'
        })

        expect(quoteTransferMock).toHaveBeenCalledWith({
          token: USDT_INFO.address,
          recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
          amount: 10500000n
        })
      })
    })

    describe('result formatting', () => {
      test('should return complete response with fee', async () => {
        setupMocks(21000000000000n)

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
          amount: '100'
        })

        expect(result.isError).toBeUndefined()
        expect(result.content).toHaveLength(1)
        expect(result.content[0].type).toBe('text')
        expect(result.content[0].text).toContain('Estimated fee for transferring 100 USDT')
        expect(result.structuredContent).toEqual({ fee: '21000000000000' })
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockRejectedValue(new Error('Network error'))

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
          amount: '100'
        })

        expect(result.isError).toBe(true)
        expect(result.content).toHaveLength(1)
        expect(result.content[0].type).toBe('text')
        expect(result.content[0].text).toBe('Error quoting transfer on ethereum: Network error')
        expect(result.structuredContent).toBeUndefined()
      })
    })
  })
})
