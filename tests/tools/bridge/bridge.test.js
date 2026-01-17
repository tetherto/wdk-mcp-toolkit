'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { bridge } from '../../../src/tools/bridge/bridge.js'

describe('bridge', () => {
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
      },
      server: {
        elicitInput: jest.fn()
      }
    }
  })

  test('should not register tool if no bridge chains available', () => {
    server.getBridgeChains.mockReturnValue([])

    bridge(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name bridge', () => {
    bridge(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'bridge',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    const USDT_INFO = { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }
    const WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'

    beforeEach(() => {
      bridge(server)
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

    describe('confirmation flow', () => {
      test('should call server.server.elicitInput with confirmation message', async () => {
        const quoteBridgeMock = jest.fn().mockResolvedValue({
          fee: 21000000000000n,
          bridgeFee: 500000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getBridgeProtocol: jest.fn().mockReturnValue({
            quoteBridge: quoteBridgeMock,
            bridge: jest.fn()
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'decline' })

        await handler({
          chain: 'ethereum',
          targetChain: 'arbitrum',
          token: 'USDT',
          amount: '100'
        })

        expect(server.server.elicitInput).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('BRIDGE CONFIRMATION REQUIRED')
          })
        )
      })

      test('should return cancelled message when user declines', async () => {
        const quoteBridgeMock = jest.fn().mockResolvedValue({
          fee: 21000000000000n,
          bridgeFee: 500000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getBridgeProtocol: jest.fn().mockReturnValue({
            quoteBridge: quoteBridgeMock,
            bridge: jest.fn()
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'accept', content: { confirmed: false } })

        const result = await handler({
          chain: 'ethereum',
          targetChain: 'arbitrum',
          token: 'USDT',
          amount: '100'
        })

        expect(result.content[0].text).toBe('Bridge cancelled by user. No funds were spent.')
      })

      test('should return cancelled message when action is not accept', async () => {
        const quoteBridgeMock = jest.fn().mockResolvedValue({
          fee: 21000000000000n,
          bridgeFee: 500000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getBridgeProtocol: jest.fn().mockReturnValue({
            quoteBridge: quoteBridgeMock,
            bridge: jest.fn()
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'decline' })

        const result = await handler({
          chain: 'ethereum',
          targetChain: 'arbitrum',
          token: 'USDT',
          amount: '100'
        })

        expect(result.content[0].text).toBe('Bridge cancelled by user. No funds were spent.')
      })
    })

    describe('bridge execution', () => {
      test('should call bridgeProtocol.bridge when user confirms', async () => {
        const bridgeMock = jest.fn().mockResolvedValue({
          hash: '0xabc123',
          fee: 21000000000000n,
          bridgeFee: 500000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getBridgeProtocol: jest.fn().mockReturnValue({
            quoteBridge: jest.fn().mockResolvedValue({
              fee: 21000000000000n,
              bridgeFee: 500000000000000n
            }),
            bridge: bridgeMock
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

        await handler({
          chain: 'ethereum',
          targetChain: 'arbitrum',
          token: 'USDT',
          amount: '100'
        })

        expect(bridgeMock).toHaveBeenCalled()
      })

      test('should return hash in result', async () => {
        const bridgeMock = jest.fn().mockResolvedValue({
          hash: '0xabc123',
          fee: 21000000000000n,
          bridgeFee: 500000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getBridgeProtocol: jest.fn().mockReturnValue({
            quoteBridge: jest.fn().mockResolvedValue({
              fee: 21000000000000n,
              bridgeFee: 500000000000000n
            }),
            bridge: bridgeMock
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

        const result = await handler({
          chain: 'ethereum',
          targetChain: 'arbitrum',
          token: 'USDT',
          amount: '100'
        })

        expect(result.structuredContent.hash).toBe('0xabc123')
        expect(result.structuredContent.success).toBe(true)
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
        expect(result.content[0].text).toBe('Error executing bridge: Network error')
      })
    })
  })
})
