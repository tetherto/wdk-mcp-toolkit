'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { getBalance } from '../../../src/tools/wallet/getBalance.js'

describe('getBalance', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      getChains: jest.fn().mockReturnValue(['ethereum', 'bitcoin']),
      wdk: {
        getAccount: jest.fn()
      }
    }
  })

  test('should register tool with name getBalance', () => {
    getBalance(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'getBalance',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getBalance(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    test('should call wdk.getAccount with chain and index 0', async () => {
      const accountMock = {
        getBalance: jest.fn().mockResolvedValue(1000000000000000000n)
      }
      server.wdk.getAccount.mockResolvedValue(accountMock)

      await handler({ chain: 'ethereum' })

      expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
    })

    test('should call account.getBalance', async () => {
      const getBalanceMock = jest.fn().mockResolvedValue(1000000000000000000n)
      const accountMock = { getBalance: getBalanceMock }
      server.wdk.getAccount.mockResolvedValue(accountMock)

      await handler({ chain: 'ethereum' })

      expect(getBalanceMock).toHaveBeenCalled()
    })

    test('should return balance with wei unit for ethereum', async () => {
      const accountMock = {
        getBalance: jest.fn().mockResolvedValue(1000000000000000000n)
      }
      server.wdk.getAccount.mockResolvedValue(accountMock)

      const result = await handler({ chain: 'ethereum' })

      expect(result.content[0].text).toBe('Balance: 1000000000000000000 wei')
    })

    test('should return balance with satoshis unit for bitcoin', async () => {
      const accountMock = {
        getBalance: jest.fn().mockResolvedValue(100000000n)
      }
      server.wdk.getAccount.mockResolvedValue(accountMock)

      const result = await handler({ chain: 'bitcoin' })

      expect(result.content[0].text).toBe('Balance: 100000000 satoshis')
    })

    test('should return balance with base units for other chains', async () => {
      server.getChains.mockReturnValue(['polygon'])
      getBalance(server)
      handler = registerToolMock.mock.calls[1][2]

      const accountMock = {
        getBalance: jest.fn().mockResolvedValue(1000000n)
      }
      server.wdk.getAccount.mockResolvedValue(accountMock)

      const result = await handler({ chain: 'polygon' })

      expect(result.content[0].text).toBe('Balance: 1000000 base units')
    })

    test('should return balance as string in structured content', async () => {
      const accountMock = {
        getBalance: jest.fn().mockResolvedValue(1000000000000000000n)
      }
      server.wdk.getAccount.mockResolvedValue(accountMock)

      const result = await handler({ chain: 'ethereum' })

      expect(result.structuredContent.balance).toBe('1000000000000000000')
    })

    test('should return error with message on exception', async () => {
      server.wdk.getAccount.mockRejectedValue(new Error('Provider not connected'))

      const result = await handler({ chain: 'ethereum' })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error getting balance on ethereum: Provider not connected')
    })
  })
})
