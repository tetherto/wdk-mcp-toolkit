'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { transfer } from '../../../src/tools/wallet/transfer.js'

describe('transfer', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      getChains: jest.fn().mockReturnValue(['ethereum']),
      getTokenInfo: jest.fn(),
      getRegisteredTokens: jest.fn().mockReturnValue(['USDT', 'USDC']),
      wdk: {
        getAccount: jest.fn()
      },
      server: {
        elicitInput: jest.fn()
      }
    }
  })

  test('should register tool with name transfer', () => {
    transfer(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'transfer',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    const USDT_INFO = { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }
    const RECIPIENT = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'

    beforeEach(() => {
      transfer(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('token validation', () => {
      test('should uppercase token symbol', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)

        const quoteTransferMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })
        const accountMock = {
          quoteTransfer: quoteTransferMock,
          transfer: jest.fn()
        }
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'decline' })

        await handler({
          chain: 'ethereum',
          token: 'usdt',
          to: RECIPIENT,
          amount: '100'
        })

        expect(server.getTokenInfo).toHaveBeenCalledWith('ethereum', 'USDT')
      })

      test('should throw if token not registered', async () => {
        server.getTokenInfo.mockReturnValue(undefined)

        const result = await handler({
          chain: 'ethereum',
          token: 'UNKNOWN',
          to: RECIPIENT,
          amount: '100'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('Token "UNKNOWN" not registered for ethereum')
      })

      test('should include available tokens in error message', async () => {
        server.getTokenInfo.mockReturnValue(undefined)

        const result = await handler({
          chain: 'ethereum',
          token: 'UNKNOWN',
          to: RECIPIENT,
          amount: '100'
        })

        expect(result.content[0].text).toContain('Available tokens: USDT, USDC')
      })
    })

    describe('amount validation', () => {
      test('should throw if amount is not a number', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          to: RECIPIENT,
          amount: 'abc'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('Invalid amount: "abc"')
      })

      test('should throw if amount is zero', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          to: RECIPIENT,
          amount: '0'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('Invalid amount')
      })

      test('should throw if amount is negative', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          to: RECIPIENT,
          amount: '-10'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('Invalid amount')
      })
    })

    describe('amount conversion', () => {
      test('should convert human amount to base units using token decimals', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)

        const quoteTransferMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })
        const accountMock = {
          quoteTransfer: quoteTransferMock,
          transfer: jest.fn()
        }
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'decline' })

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          to: RECIPIENT,
          amount: '100'
        })

        expect(quoteTransferMock).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 100000000n
          })
        )
      })
    })

    describe('quote', () => {
      test('should call account.quoteTransfer with token address, recipient, and base amount', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)

        const quoteTransferMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })
        const accountMock = {
          quoteTransfer: quoteTransferMock,
          transfer: jest.fn()
        }
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'decline' })

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          to: RECIPIENT,
          amount: '100'
        })

        expect(quoteTransferMock).toHaveBeenCalledWith({
          token: USDT_INFO.address,
          recipient: RECIPIENT,
          amount: 100000000n
        })
      })
    })

    describe('confirmation flow', () => {
      test('should call server.server.elicitInput with transfer details', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)

        const quoteTransferMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })
        const accountMock = {
          quoteTransfer: quoteTransferMock,
          transfer: jest.fn()
        }
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'decline' })

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          to: RECIPIENT,
          amount: '100'
        })

        expect(server.server.elicitInput).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('TOKEN TRANSFER CONFIRMATION REQUIRED')
          })
        )
      })

      test('should return cancelled message when user declines', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)

        const quoteTransferMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })
        const accountMock = {
          quoteTransfer: quoteTransferMock,
          transfer: jest.fn()
        }
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'accept', content: { confirmed: false } })

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          to: RECIPIENT,
          amount: '100'
        })

        expect(result.content[0].text).toBe('Transfer cancelled by user. No funds were spent.')
      })

      test('should return cancelled message when action is not accept', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)

        const quoteTransferMock = jest.fn().mockResolvedValue({ fee: 21000000000000n })
        const accountMock = {
          quoteTransfer: quoteTransferMock,
          transfer: jest.fn()
        }
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'decline' })

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          to: RECIPIENT,
          amount: '100'
        })

        expect(result.content[0].text).toBe('Transfer cancelled by user. No funds were spent.')
      })
    })

    describe('transfer execution', () => {
      test('should call account.transfer when user confirms', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)

        const transferMock = jest.fn().mockResolvedValue({
          hash: '0xabc123',
          fee: 21000000000000n
        })
        const accountMock = {
          quoteTransfer: jest.fn().mockResolvedValue({ fee: 21000000000000n }),
          transfer: transferMock
        }
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

        await handler({
          chain: 'ethereum',
          token: 'USDT',
          to: RECIPIENT,
          amount: '100'
        })

        expect(transferMock).toHaveBeenCalled()
      })

      test('should return hash in result', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)

        const transferMock = jest.fn().mockResolvedValue({
          hash: '0xabc123',
          fee: 21000000000000n
        })
        const accountMock = {
          quoteTransfer: jest.fn().mockResolvedValue({ fee: 21000000000000n }),
          transfer: transferMock
        }
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          to: RECIPIENT,
          amount: '100'
        })

        expect(result.structuredContent.hash).toBe('0xabc123')
      })

      test('should return fee as string', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)

        const transferMock = jest.fn().mockResolvedValue({
          hash: '0xabc123',
          fee: 21000000000000n
        })
        const accountMock = {
          quoteTransfer: jest.fn().mockResolvedValue({ fee: 21000000000000n }),
          transfer: transferMock
        }
        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          to: RECIPIENT,
          amount: '100'
        })

        expect(result.structuredContent.fee).toBe('21000000000000')
      })
    })

    describe('error handling', () => {
      test('should return error with chain name in message', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockRejectedValue(new Error('Network error'))

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT',
          to: RECIPIENT,
          amount: '100'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error transferring token on ethereum: Network error')
      })
    })
  })
})
