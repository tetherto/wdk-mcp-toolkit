'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { quoteSendTransaction } from '../../../src/tools/wallet/quoteSendTransaction.js'

describe('quoteSendTransaction', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      getChains: jest.fn().mockReturnValue(['bitcoin', 'ethereum']),
      wdk: {
        getAccount: jest.fn()
      }
    }
  })

  function setupMocks (fee = 5000n) {
    const quoteSendTransactionMock = jest.fn().mockResolvedValue({ fee })
    const accountMock = { quoteSendTransaction: quoteSendTransactionMock }
    server.wdk.getAccount.mockResolvedValue(accountMock)
    return { quoteSendTransactionMock, accountMock }
  }

  test('should register tool with name quoteSendTransaction', () => {
    quoteSendTransaction(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'quoteSendTransaction',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      quoteSendTransaction(server)
      handler = registerToolMock.mock.calls[0][2]
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
    })

    describe('result formatting', () => {
      test('should return complete response with fee as string', async () => {
        setupMocks(5000n)

        const result = await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(result.isError).toBeUndefined()
        expect(result.content).toHaveLength(1)
        expect(result.content[0].type).toBe('text')
        expect(result.structuredContent).toEqual({ fee: '5000' })
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
        expect(result.content[0].text).toBe('Error quoting transaction on bitcoin: Network error')
        expect(result.structuredContent).toBeUndefined()
      })
    })
  })
})
