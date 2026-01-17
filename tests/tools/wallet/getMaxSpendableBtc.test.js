'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { getMaxSpendableBtc } from '../../../src/tools/wallet/getMaxSpendableBtc.js'

describe('getMaxSpendableBtc', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      wdk: {
        getAccount: jest.fn()
      }
    }
  })

  function setupMocks (mockResult = { amount: 95000000n, fee: 5000n, changeValue: 1000n }) {
    const getMaxSpendableMock = jest.fn().mockResolvedValue(mockResult)
    const accountMock = { getMaxSpendable: getMaxSpendableMock }
    server.wdk.getAccount.mockResolvedValue(accountMock)
    return { getMaxSpendableMock, accountMock }
  }

  test('should register tool with name getMaxSpendableBtc', () => {
    getMaxSpendableBtc(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'getMaxSpendableBtc',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getMaxSpendableBtc(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with bitcoin and index 0', async () => {
        setupMocks()

        await handler({})

        expect(server.wdk.getAccount).toHaveBeenCalledWith('bitcoin', 0)
      })

      test('should call getMaxSpendable on account', async () => {
        const { getMaxSpendableMock } = setupMocks()

        await handler({})

        expect(getMaxSpendableMock).toHaveBeenCalled()
      })
    })

    describe('result formatting', () => {
      test('should return complete response with all values as strings', async () => {
        setupMocks({ amount: 95000000n, fee: 5000n, changeValue: 1000n })

        const result = await handler({})

        expect(result.isError).toBeUndefined()
        expect(result.content).toHaveLength(1)
        expect(result.content[0].type).toBe('text')
        expect(result.structuredContent).toEqual({
          amount: '95000000',
          fee: '5000',
          changeValue: '1000'
        })
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.wdk.getAccount.mockRejectedValue(new Error('Wallet not registered'))

        const result = await handler({})

        expect(result.isError).toBe(true)
        expect(result.content).toHaveLength(1)
        expect(result.content[0].type).toBe('text')
        expect(result.content[0].text).toBe('Error getting max spendable: Wallet not registered')
        expect(result.structuredContent).toBeUndefined()
      })
    })
  })
})
