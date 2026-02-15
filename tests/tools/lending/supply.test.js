'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { supply } from '../../../src/tools/lending/supply.js'

describe('supply', () => {
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
      },
      requestConfirmation: jest.fn()
    }
  })

  test('should not register tool if no lending chains available', () => {
    server.getLendingChains.mockReturnValue([])

    supply(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name supply', () => {
    supply(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'supply',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    const USDT_INFO = { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }
    const WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'

    beforeEach(() => {
      supply(server)
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

    describe('confirmation flow', () => {
      test('should call server.requestConfirmation with confirmation message', async () => {
        const quoteSupplyMock = jest.fn().mockResolvedValue({
          fee: 21000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteSupply: quoteSupplyMock,
            supply: jest.fn()
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.requestConfirmation.mockResolvedValue({ action: 'decline' })

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(server.requestConfirmation).toHaveBeenCalledWith(
          expect.stringContaining('SUPPLY CONFIRMATION REQUIRED'),
          expect.any(Object)
        )
      })

      test('should return cancelled message when user declines', async () => {
        const quoteSupplyMock = jest.fn().mockResolvedValue({
          fee: 21000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteSupply: quoteSupplyMock,
            supply: jest.fn()
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.requestConfirmation.mockResolvedValue({ action: 'accept', content: { confirmed: false } })

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(result.content[0].text).toBe('Supply cancelled by user. No funds were spent.')
      })

      test('should return cancelled message when action is not accept', async () => {
        const quoteSupplyMock = jest.fn().mockResolvedValue({
          fee: 21000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteSupply: quoteSupplyMock,
            supply: jest.fn()
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.requestConfirmation.mockResolvedValue({ action: 'decline' })

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(result.content[0].text).toBe('Supply cancelled by user. No funds were spent.')
      })
    })

    describe('supply execution', () => {
      test('should call lendingProtocol.supply when user confirms', async () => {
        const supplyMock = jest.fn().mockResolvedValue({
          hash: '0xabc123',
          fee: 21000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteSupply: jest.fn().mockResolvedValue({ fee: 21000000000000n }),
            supply: supplyMock
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.requestConfirmation.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(supplyMock).toHaveBeenCalled()
      })

      test('should return hash in result', async () => {
        const supplyMock = jest.fn().mockResolvedValue({
          hash: '0xabc123',
          fee: 21000000000000n
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue(WALLET_ADDRESS),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteSupply: jest.fn().mockResolvedValue({ fee: 21000000000000n }),
            supply: supplyMock
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.requestConfirmation.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

        const result = await handler({
          chain: 'ethereum',
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
          token: 'USDT',
          amount: '100'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error executing supply: Network error')
      })
    })
  })
})
