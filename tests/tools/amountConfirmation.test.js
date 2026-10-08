'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { transfer } from '../../src/tools/wallet/transfer.js'
import { bridge } from '../../src/tools/bridge/bridge.js'
import { supply } from '../../src/tools/lending/supply.js'
import { withdraw } from '../../src/tools/lending/withdraw.js'
import { borrow } from '../../src/tools/lending/borrow.js'
import { repay } from '../../src/tools/lending/repay.js'

describe.each([
  ['transfer', transfer],
  ['bridge', bridge],
  ['supply', supply],
  ['withdraw', withdraw],
  ['borrow', borrow],
  ['repay', repay]
])('%s amount confirmation', (name, register) => {
  let server, quote, send, handler, schema

  beforeEach(() => {
    quote = jest.fn().mockResolvedValue({ fee: 1n, bridgeFee: 2n })
    send = jest.fn().mockResolvedValue({ hash: '0xabc', fee: 1n, bridgeFee: 2n })
    const operations = {
      [`quote${name[0].toUpperCase()}${name.slice(1)}`]: quote,
      [name]: send
    }
    const account = {
      ...operations,
      getAddress: jest.fn().mockResolvedValue('0x123'),
      getBridgeProtocol: jest.fn().mockReturnValue(operations),
      getLendingProtocol: jest.fn().mockReturnValue(operations)
    }
    server = {
      registerTool: jest.fn(),
      getChains: jest.fn().mockReturnValue(['ethereum']),
      getBridgeChains: jest.fn().mockReturnValue(['ethereum']),
      getLendingChains: jest.fn().mockReturnValue(['ethereum']),
      getBridgeProtocols: jest.fn().mockReturnValue(['usdt0']),
      getLendingProtocols: jest.fn().mockReturnValue(['aave']),
      getTokenInfo: jest.fn().mockReturnValue({ address: '0x456', decimals: 6 }),
      wdk: { getAccount: jest.fn().mockResolvedValue(account) },
      requestConfirmation: jest.fn().mockImplementation(async () => {
        expect(quote).toHaveBeenCalledTimes(1)
        expect(send).not.toHaveBeenCalled()
        return { action: 'accept', content: { confirmed: true } }
      })
    }
    register(server)
    schema = server.registerTool.mock.calls[0][1].inputSchema
    handler = server.registerTool.mock.calls[0][2]
  })

  const argumentsFor = amount => schema.parse({
    chain: 'ethereum', token: 'USDT', amount, to: '0x123', targetChain: 'arbitrum'
  })

  test.each([
    ['0,5', 6, '5', 5000000n],
    ['0,100000', 6, '100000', 100000000000n],
    ['1,000.50', 6, '1000.5', 1000500000n],
    [' 0001.230000 ', 6, '1.23', 1230000n],
    ['1e-6', 6, '0.000001', 1n],
    ['9007199254740993.000001', 6, '9007199254740993.000001', 9007199254740993000001n],
    ['1.000000000000000001', 18, '1.000000000000000001', 1000000000000000001n]
  ])('confirms and sends the parsed value of %s', async (input, decimals, displayed, baseUnits) => {
    server.getTokenInfo.mockReturnValue({ address: '0x456', decimals })

    const result = await handler(argumentsFor(input))

    expect(result.isError).not.toBe(true)
    expect(server.requestConfirmation).toHaveBeenCalledTimes(1)
    const amountLine = server.requestConfirmation.mock.calls[0][0].split('\n').find(line => line.startsWith('Amount:'))
    expect(amountLine).toBe(name === 'transfer'
      ? `Amount: ${displayed} USDT (${baseUnits} base units)`
      : `Amount: ${displayed}`)
    expect(quote).toHaveBeenCalledWith(expect.objectContaining({ amount: baseUnits }))
    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith(quote.mock.calls[0][0])
  })

  test.each([
    { action: 'decline' },
    { action: 'cancel' },
    { action: 'accept', content: { confirmed: false } },
    { action: 'accept' }
  ])('does not send without explicit approval: %j', async confirmation => {
    server.requestConfirmation.mockResolvedValue(confirmation)

    const result = await handler(argumentsFor('0,5'))

    expect(server.requestConfirmation.mock.calls[0][0]).toContain('\nAmount: 5')
    expect(result.content[0].text).toMatch(/cancelled by user/)
    expect(send).not.toHaveBeenCalled()
  })
})
