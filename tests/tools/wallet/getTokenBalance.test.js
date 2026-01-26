'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { getTokenBalance } from '../../../src/tools/wallet/getTokenBalance.js'

describe('getTokenBalance', () => {
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

  function setupMocks (balance = 94428840n) {
    const getTokenBalanceMock = jest.fn().mockResolvedValue(balance)
    const accountMock = { getTokenBalance: getTokenBalanceMock }
    server.getTokenInfo.mockReturnValue(USDT_INFO)
    server.wdk.getAccount.mockResolvedValue(accountMock)
    return { getTokenBalanceMock, accountMock }
  }

  test('should register tool with name getTokenBalance', () => {
    getTokenBalance(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'getTokenBalance',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getTokenBalance(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if token not registered', async () => {
        server.getTokenInfo.mockReturnValue(undefined)
        server.getRegisteredTokens.mockReturnValue(['USDC', 'DAI'])

        const result = await handler({ chain: 'ethereum', token: 'USDT' })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('Token symbol "USDT" not registered')
        expect(result.content[0].text).toContain('USDC, DAI')
        expect(result.structuredContent).toBeUndefined()
      })

      test('should return error if no tokens available', async () => {
        server.getTokenInfo.mockReturnValue(undefined)
        server.getRegisteredTokens.mockReturnValue([])

        const result = await handler({ chain: 'ethereum', token: 'USDT' })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('Available tokens: none')
        expect(result.structuredContent).toBeUndefined()
      })
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        setupMocks()

        await handler({ chain: 'ethereum', token: 'USDT' })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
      })

      test('should call getTokenBalance with token address', async () => {
        const { getTokenBalanceMock } = setupMocks()

        await handler({ chain: 'ethereum', token: 'USDT' })

        expect(getTokenBalanceMock).toHaveBeenCalledWith(USDT_INFO.address)
      })

      test('should uppercase token symbol', async () => {
        setupMocks()

        await handler({ chain: 'ethereum', token: 'usdt' })

        expect(server.getTokenInfo).toHaveBeenCalledWith('ethereum', 'USDT')
      })
    })

    describe('result formatting', () => {
      test('should return complete response with formatted balance', async () => {
        setupMocks(94428840n)

        const result = await handler({ chain: 'ethereum', token: 'USDT' })

        expect(result.isError).toBeUndefined()
        expect(result.content).toHaveLength(1)
        expect(result.content[0].type).toBe('text')
        expect(result.content[0].text).toBe('Balance: 94.42884 USDT (94428840 base units)')
        expect(result.structuredContent).toEqual({
          balance: '94.42884',
          balanceRaw: '94428840'
        })
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockRejectedValue(new Error('Network error'))

        const result = await handler({ chain: 'ethereum', token: 'USDT' })

        expect(result.isError).toBe(true)
        expect(result.content).toHaveLength(1)
        expect(result.content[0].type).toBe('text')
        expect(result.content[0].text).toBe('Error getting token balance on ethereum: Network error')
        expect(result.structuredContent).toBeUndefined()
      })
    })
  })
})
