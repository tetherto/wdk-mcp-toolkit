'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { getAddress } from '../../../src/tools/wallet/getAddress.js'

describe('getAddress', () => {
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

  test('should register tool with name getAddress', () => {
    getAddress(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'getAddress',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getAddress(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    test('should call wdk.getAccount with chain and index 0', async () => {
      const accountMock = {
        getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7')
      }
      server.wdk.getAccount.mockResolvedValue(accountMock)

      await handler({ chain: 'ethereum' })

      expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
    })

    test('should call account.getAddress', async () => {
      const getAddressMock = jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7')
      const accountMock = { getAddress: getAddressMock }
      server.wdk.getAccount.mockResolvedValue(accountMock)

      await handler({ chain: 'ethereum' })

      expect(getAddressMock).toHaveBeenCalled()
    })

    test('should return address in text content', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      const accountMock = { getAddress: jest.fn().mockResolvedValue(address) }
      server.wdk.getAccount.mockResolvedValue(accountMock)

      const result = await handler({ chain: 'ethereum' })

      expect(result.content[0].text).toBe(`Address: ${address}`)
    })

    test('should return address in structured content', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      const accountMock = { getAddress: jest.fn().mockResolvedValue(address) }
      server.wdk.getAccount.mockResolvedValue(accountMock)

      const result = await handler({ chain: 'ethereum' })

      expect(result.structuredContent.address).toBe(address)
    })

    test('should return error with message on exception', async () => {
      server.wdk.getAccount.mockRejectedValue(new Error('Wallet not found'))

      const result = await handler({ chain: 'ethereum' })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error getting address on ethereum: Wallet not found')
    })
  })
})
