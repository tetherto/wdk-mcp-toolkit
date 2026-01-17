'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { quoteBridge } from '../../../src/tools/bridge/quoteBridge.js'

describe('quoteBridge', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      getBridgeChains: jest.fn().mockReturnValue(['ethereum']),
      getBridgeProtocols: jest.fn().mockReturnValue(['usdt0']),
      getTokenInfo: jest.fn(),
      wdk: {
        getAccount: jest.fn()
      }
    }
  })

  test('should not register tool if no bridge chains available', () => {
    server.getBridgeChains.mockReturnValue([])

    quoteBridge(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name quoteBridge', () => {
    quoteBridge(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'quoteBridge',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    const USDT_INFO = { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }
    const WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'

    beforeEach(() => {
      quoteBridge(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if no bridge protocols for chain', async () => {
        server.getBridgeProtocols.mockReturnValue([])

        const result = await handler({
          chain: 'ethereum',
          targetChain: 'arbitrum',
          token: 'USDT',
          amount: '100'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('No bridge protocol registered for ethereum.')
      })

      test('should return error if token not registered', async () => {
        server.getTokenInfo.mockReturnValue(undefined)

        const result = await handler({
          chain: 'ethereum',
          targetChain: 'arbitrum',
          token: 'USDT',
          amount: '100'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Token USDT not registered for ethereum.')
      })
    })

    describe('amount conversion', () => {
      test('should convert amount to base units using token decimals', async () => {
        const quoteBridgeMock = jest.fn().mockResolvedValue({
          fee: 21000000000000n,
          bridgeFee: 500000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getBridgeProtocol: jest.fn().mockReturnValue({ quoteBridge: quoteBridgeMock })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          targetChain: 'arbitrum',
          token: 'USDT',
          amount: '100'
        })

        expect(quoteBridgeMock).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 100000000n
          })
        )
      })
    })

    describe('recipient handling', () => {
      test('should use wallet address as recipient when not provided', async () => {
        const quoteBridgeMock = jest.fn().mockResolvedValue({
          fee: 21000000000000n,
          bridgeFee: 500000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getBridgeProtocol: jest.fn().mockReturnValue({ quoteBridge: quoteBridgeMock })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          targetChain: 'arbitrum',
          token: 'USDT',
          amount: '100'
        })

        expect(quoteBridgeMock).toHaveBeenCalledWith(
          expect.objectContaining({
            recipient: WALLET_ADDRESS
          })
        )
      })

      test('should use provided recipient address', async () => {
        const customRecipient = '0xCustomRecipient'
        const quoteBridgeMock = jest.fn().mockResolvedValue({
          fee: 21000000000000n,
          bridgeFee: 500000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getBridgeProtocol: jest.fn().mockReturnValue({ quoteBridge: quoteBridgeMock })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          targetChain: 'arbitrum',
          token: 'USDT',
          amount: '100',
          recipient: customRecipient
        })

        expect(quoteBridgeMock).toHaveBeenCalledWith(
          expect.objectContaining({
            recipient: customRecipient
          })
        )
      })
    })

    describe('result formatting', () => {
      test('should return structured content with protocol and chain info', async () => {
        const quoteBridgeMock = jest.fn().mockResolvedValue({
          fee: 21000000000000n,
          bridgeFee: 500000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getBridgeProtocol: jest.fn().mockReturnValue({ quoteBridge: quoteBridgeMock })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          targetChain: 'arbitrum',
          token: 'USDT',
          amount: '100'
        })

        expect(result.structuredContent.protocol).toBe('usdt0')
        expect(result.structuredContent.sourceChain).toBe('ethereum')
        expect(result.structuredContent.targetChain).toBe('arbitrum')
      })

      test('should return fees as strings', async () => {
        const quoteBridgeMock = jest.fn().mockResolvedValue({
          fee: 21000000000000n,
          bridgeFee: 500000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getBridgeProtocol: jest.fn().mockReturnValue({ quoteBridge: quoteBridgeMock })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          targetChain: 'arbitrum',
          token: 'USDT',
          amount: '100'
        })

        expect(result.structuredContent.fee).toBe('21000000000000')
        expect(result.structuredContent.bridgeFee).toBe('500000000000000')
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockRejectedValue(new Error('Network error'))

        const result = await handler({
          chain: 'ethereum',
          targetChain: 'arbitrum',
          token: 'USDT',
          amount: '100'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error quoting bridge: Network error')
      })
    })
  })
})
