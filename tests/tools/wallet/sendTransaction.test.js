'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { sendTransaction } from '../../../src/tools/wallet/sendTransaction.js'

describe('sendTransaction', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      getChains: jest.fn().mockReturnValue(['bitcoin', 'ethereum']),
      wdk: {
        getAccount: jest.fn()
      },
      requestConfirmation: jest.fn()
    }
  })

  function setupMocks (overrides = {}) {
    const quoteSendTransactionMock = jest.fn().mockResolvedValue({ fee: 5000n, ...overrides.quote })
    const sendTransactionMock = jest.fn().mockResolvedValue({ hash: '0xabc123', fee: 5000n, ...overrides.send })
    const accountMock = {
      quoteSendTransaction: quoteSendTransactionMock,
      sendTransaction: sendTransactionMock
    }
    server.wdk.getAccount.mockResolvedValue(accountMock)
    server.requestConfirmation.mockResolvedValue(overrides.elicit ?? { action: 'accept', content: { confirmed: true } })
    return { quoteSendTransactionMock, sendTransactionMock, accountMock }
  }

  test('should register tool with name sendTransaction', () => {
    sendTransaction(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'sendTransaction',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      sendTransaction(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if value is zero', async () => {
        const result = await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '0'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('Amount must be greater than zero')
        expect(result.structuredContent).toBeUndefined()
      })

      test('should return error if value is negative', async () => {
        const result = await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '-100'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('Amount must be greater than zero')
        expect(result.structuredContent).toBeUndefined()
      })
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        setupMocks()

        await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('bitcoin', 0)
      })

      test('should call quoteSendTransaction with to and value as BigInt', async () => {
        const { quoteSendTransactionMock } = setupMocks()

        await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(quoteSendTransactionMock).toHaveBeenCalledWith({
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: 100000n
        })
      })

      test('should call sendTransaction with to and value after confirmation', async () => {
        const { sendTransactionMock } = setupMocks()

        await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(sendTransactionMock).toHaveBeenCalledWith({
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: 100000n
        })
      })
    })

    describe('confirmation flow', () => {
      test('should call elicitInput with confirmation message containing amount and recipient', async () => {
        setupMocks()

        await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(server.requestConfirmation).toHaveBeenCalledWith(
          expect.stringContaining('TRANSACTION CONFIRMATION'),
          expect.any(Object)
        )
        expect(server.requestConfirmation.mock.calls[0][0]).toContain('100000')
        expect(server.requestConfirmation.mock.calls[0][0]).toContain('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')
      })

      test('should return cancelled message if user declines', async () => {
        setupMocks({ elicit: { action: 'reject' } })

        const result = await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(result.content[0].text).toBe('Transaction cancelled by user. No funds were spent.')
        expect(result.structuredContent).toBeUndefined()
      })

      test('should not call sendTransaction if user declines', async () => {
        const { sendTransactionMock } = setupMocks({ elicit: { action: 'reject' } })

        await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(sendTransactionMock).not.toHaveBeenCalled()
      })
    })

    describe('result formatting', () => {
      test('should return complete response on success', async () => {
        setupMocks({ send: { hash: '0xabc123', fee: 5000n } })

        const result = await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(result.isError).toBeUndefined()
        expect(result.content).toHaveLength(1)
        expect(result.content[0].type).toBe('text')
        expect(result.structuredContent).toEqual({
          hash: '0xabc123',
          fee: '5000'
        })
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.wdk.getAccount.mockRejectedValue(new Error('Network error'))

        const result = await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(result.isError).toBe(true)
        expect(result.content).toHaveLength(1)
        expect(result.content[0].type).toBe('text')
        expect(result.content[0].text).toBe('Error sending transaction on bitcoin: Network error')
        expect(result.structuredContent).toBeUndefined()
      })
    })
  })
})
