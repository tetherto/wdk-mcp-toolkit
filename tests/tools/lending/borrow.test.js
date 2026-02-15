'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { borrow } from '../../../src/tools/lending/borrow.js'

describe('borrow', () => {
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

    borrow(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name borrow', () => {
    borrow(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'borrow',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    const USDT_INFO = { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }

    beforeEach(() => {
      borrow(server)
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
        const quoteBorrowMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })
        const borrowMock = jest.fn().mockResolvedValue({ hash: '0xabc', fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteBorrow: quoteBorrowMock,
            borrow: borrowMock
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

        expect(quoteBorrowMock).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 100000000n
          })
        )
      })
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        const quoteBorrowMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })
        const borrowMock = jest.fn().mockResolvedValue({ hash: '0xabc', fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteBorrow: quoteBorrowMock,
            borrow: borrowMock
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

        expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
      })

      test('should call getLendingProtocol with first protocol label', async () => {
        const quoteBorrowMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })
        const borrowMock = jest.fn().mockResolvedValue({ hash: '0xabc', fee: 21000000000000n })

        const getLendingProtocolMock = jest.fn().mockReturnValue({
          quoteBorrow: quoteBorrowMock,
          borrow: borrowMock
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: getLendingProtocolMock
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.requestConfirmation.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(getLendingProtocolMock).toHaveBeenCalledWith('aave')
      })

      test('should call quoteBorrow with token address', async () => {
        const quoteBorrowMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })
        const borrowMock = jest.fn().mockResolvedValue({ hash: '0xabc', fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteBorrow: quoteBorrowMock,
            borrow: borrowMock
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

        expect(quoteBorrowMock).toHaveBeenCalledWith(
          expect.objectContaining({
            token: USDT_INFO.address
          })
        )
      })
    })

    describe('confirmation flow', () => {
      test('should call elicitInput for confirmation', async () => {
        const quoteBorrowMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })
        const borrowMock = jest.fn().mockResolvedValue({ hash: '0xabc', fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteBorrow: quoteBorrowMock,
            borrow: borrowMock
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

        expect(server.requestConfirmation).toHaveBeenCalledWith(
          expect.stringContaining('BORROW CONFIRMATION'),
          expect.any(Object)
        )
      })

      test('should return cancelled message if user declines', async () => {
        const quoteBorrowMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteBorrow: quoteBorrowMock,
            borrow: jest.fn()
          })
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.requestConfirmation.mockResolvedValue({ action: 'reject' })

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          amount: '100'
        })

        expect(result.content[0].text).toBe('Borrow cancelled by user. No debt was created.')
      })
    })

    describe('result formatting', () => {
      test('should return hash on success', async () => {
        const quoteBorrowMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })
        const borrowMock = jest.fn().mockResolvedValue({ hash: '0xabc123', fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteBorrow: quoteBorrowMock,
            borrow: borrowMock
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
        expect(result.structuredContent.protocol).toBe('aave')
        expect(result.structuredContent.success).toBe(true)
      })

      test('should return fee as string', async () => {
        const quoteBorrowMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })
        const borrowMock = jest.fn().mockResolvedValue({ hash: '0xabc', fee: 21000000000000n })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getLendingProtocol: jest.fn().mockReturnValue({
            quoteBorrow: quoteBorrowMock,
            borrow: borrowMock
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
        expect(result.content[0].text).toBe('Error executing borrow: Network error')
      })
    })
  })
})
