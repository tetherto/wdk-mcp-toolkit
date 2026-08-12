'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { sign } from '../../../src/tools/wallet/sign.js'

describe('sign', () => {
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
    const signMock = jest.fn().mockResolvedValue(overrides.signature ?? '0xsignature123abc')
    const accountMock = { sign: signMock }
    server.wdk.getAccount.mockResolvedValue(accountMock)
    server.requestConfirmation.mockResolvedValue(overrides.elicit ?? { action: 'accept', content: { confirmed: true } })
    return { signMock, accountMock }
  }

  test('should register tool with name sign', () => {
    sign(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'sign',
      expect.any(Object),
      expect.any(Function)
    )
  })

  test('should register tool as destructive and non-idempotent', () => {
    sign(server)

    expect(registerToolMock.mock.calls[0][1].annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true
    })
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      sign(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if message is empty', async () => {
        const result = await handler({ chain: 'ethereum', message: '' })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error signing message on ethereum: Message cannot be empty')
        expect(result.structuredContent).toBeUndefined()
      })

      test('should return error if message is whitespace', async () => {
        const result = await handler({ chain: 'ethereum', message: '   ' })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error signing message on ethereum: Message cannot be empty')
        expect(result.structuredContent).toBeUndefined()
      })
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        setupMocks()

        await handler({ chain: 'ethereum', message: 'Hello World' })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
      })

      test('should call sign with message', async () => {
        const { signMock } = setupMocks()

        await handler({ chain: 'ethereum', message: 'Hello World' })

        expect(signMock).toHaveBeenCalledWith('Hello World')
      })
    })

    describe('confirmation flow', () => {
      test('should call elicitInput with confirmation message containing chain and message', async () => {
        setupMocks()

        await handler({ chain: 'ethereum', message: 'Hello World' })

        expect(server.requestConfirmation).toHaveBeenCalledWith(
          '⚠️  SIGNATURE CONFIRMATION REQUIRED\n\nChain: ethereum\nMessage to sign:\nHello World\n\nThis signature can authorize actions on behalf of your wallet.\n\nDo you want to sign this message?',
          {
            type: 'object',
            properties: {
              confirmed: {
                type: 'boolean',
                title: 'Confirm Signature',
                description: 'Check to confirm and sign the message'
              }
            },
            required: ['confirmed']
          }
        )
      })

      test('should return cancelled message if user declines', async () => {
        setupMocks({ elicit: { action: 'reject' } })

        const result = await handler({ chain: 'ethereum', message: 'Hello World' })

        expect(result.content[0].text).toBe('Signing cancelled by user. No signature was created.')
        expect(result.structuredContent).toBeUndefined()
      })

      test('should not call sign if user declines', async () => {
        const { signMock } = setupMocks({ elicit: { action: 'reject' } })

        await handler({ chain: 'ethereum', message: 'Hello World' })

        expect(signMock).not.toHaveBeenCalled()
      })
    })

    describe('result formatting', () => {
      test('should return complete response with signature', async () => {
        setupMocks('0xsignature123abc')

        const result = await handler({ chain: 'ethereum', message: 'Hello World' })

        expect(result.isError).toBeUndefined()
        expect(result.content).toHaveLength(1)
        expect(result.content[0].type).toBe('text')
        expect(result.content[0].text).toBe('Message signed. Signature: 0xsignature123abc')
        expect(result.structuredContent).toEqual({ signature: '0xsignature123abc' })
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.wdk.getAccount.mockRejectedValue(new Error('Wallet not available'))

        const result = await handler({ chain: 'ethereum', message: 'Hello World' })

        expect(result.isError).toBe(true)
        expect(result.content).toHaveLength(1)
        expect(result.content[0].type).toBe('text')
        expect(result.content[0].text).toBe('Error signing message on ethereum: Wallet not available')
        expect(result.structuredContent).toBeUndefined()
      })
    })
  })
})
