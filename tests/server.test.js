'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import WDK from '@tetherto/wdk'
import { SwapProtocol, BridgeProtocol, LendingProtocol, FiatProtocol } from '@tetherto/wdk-wallet/protocols'
import { BitfinexPricingClient } from '@tetherto/wdk-pricing-bitfinex-http'
import { WdkIndexerClient } from '@tetherto/wdk-indexer-http'

import { WdkMcpServer, DEFAULT_TOKENS, CHAINS } from '../src/server.js'

const SEED_PHRASE = 'cook voyage document eight skate token alien guide drink uncle term abuse'

describe('WdkMcpServer', () => {
  let server

  beforeEach(() => {
    server = new WdkMcpServer('test-server', '1.0.0')
  })

  describe('wdk', () => {
    test('should allow access to non-blocked methods', () => {
      server.useWdk({ seed: SEED_PHRASE })

      expect(() => server.wdk.getAccount).not.toThrow()
    })

    test('should throw when accessing registerWallet directly', () => {
      server.useWdk({ seed: SEED_PHRASE })

      expect(() => server.wdk.registerWallet).toThrow('Use WdkMcpServer#registerWallet() instead of wdk.registerWallet()')
    })

    test('should throw when accessing registerProtocol directly', () => {
      server.useWdk({ seed: SEED_PHRASE })

      expect(() => server.wdk.registerProtocol).toThrow('Use WdkMcpServer#registerProtocol() instead of wdk.registerProtocol()')
    })

    test('should throw when accessing registerMiddleware directly', () => {
      server.useWdk({ seed: SEED_PHRASE })

      expect(() => server.wdk.registerMiddleware).toThrow('Use WdkMcpServer#registerMiddleware() instead of wdk.registerMiddleware()')
    })
  })

  describe('useWdk', () => {
    test('should create WDK instance with provided seed', () => {
      server.useWdk({ seed: SEED_PHRASE })

      expect(server.wdk).toBeInstanceOf(WDK)
    })

    test('should create WDK instance with WDK_SEED env variable', () => {
      const originalEnv = process.env.WDK_SEED
      process.env.WDK_SEED = SEED_PHRASE

      server.useWdk({})

      expect(server.wdk).toBeInstanceOf(WDK)

      process.env.WDK_SEED = originalEnv
    })

    test('should throw if no seed provided', () => {
      const originalEnv = process.env.WDK_SEED
      delete process.env.WDK_SEED

      expect(() => server.useWdk({}))
        .toThrow('WDK requires seed. Provide { seed } or set WDK_SEED env variable.')

      process.env.WDK_SEED = originalEnv
    })

    test('should return server instance for chaining', () => {
      const result = server.useWdk({ seed: SEED_PHRASE })

      expect(result).toBe(server)
    })
  })

  describe('useIndexer', () => {
    test('should create WdkIndexerClient instance with apiKey', () => {
      server.useIndexer({ apiKey: 'test-api-key' })

      expect(server.indexerClient).toBeInstanceOf(WdkIndexerClient)
    })

    test('should throw if no apiKey provided', () => {
      expect(() => server.useIndexer({}))
        .toThrow('Indexer requires apiKey.')
    })

    test('should return server instance for chaining', () => {
      const result = server.useIndexer({ apiKey: 'test-api-key' })

      expect(result).toBe(server)
    })
  })

  describe('usePricing', () => {
    test('should create BitfinexPricingClient instance', () => {
      server.usePricing()

      expect(server.pricingClient).toBeInstanceOf(BitfinexPricingClient)
    })

    test('should return server instance for chaining', () => {
      const result = server.usePricing()

      expect(result).toBe(server)
    })
  })

  describe('getChains', () => {
    test('should return empty array when no chains registered', () => {
      expect(server.getChains()).toEqual([])
    })

    test('should return registered chain names', () => {
      server._wdk = { registerWallet: jest.fn() }
      server.registerWallet('ethereum', jest.fn(), {})
      server.registerWallet('bitcoin', jest.fn(), {})

      expect(server.getChains()).toEqual(['ethereum', 'bitcoin'])
    })
  })

  describe('registerToken', () => {
    test('should register token for chain', () => {
      const tokenInfo = { address: '0x123', decimals: 18 }

      server.registerToken('ethereum', 'TEST', tokenInfo)

      expect(server.getTokenInfo('ethereum', 'TEST')).toEqual(tokenInfo)
    })

    test('should return server instance for chaining', () => {
      const result = server.registerToken('ethereum', 'TEST', { address: '0x123', decimals: 18 })

      expect(result).toBe(server)
    })
  })

  describe('getTokenInfo', () => {
    test('should return token info for registered token', () => {
      const tokenInfo = { address: '0x123', decimals: 18 }
      server.registerToken('ethereum', 'TEST', tokenInfo)

      expect(server.getTokenInfo('ethereum', 'TEST')).toEqual(tokenInfo)
    })

    test('should return undefined for unregistered token', () => {
      expect(server.getTokenInfo('ethereum', 'UNKNOWN')).toBeUndefined()
    })

    test('should be case-insensitive for symbol', () => {
      const tokenInfo = { address: '0x123', decimals: 18 }
      server.registerToken('ethereum', 'TEST', tokenInfo)

      expect(server.getTokenInfo('ethereum', 'test')).toEqual(tokenInfo)
    })

    test('should return undefined for unregistered chain', () => {
      expect(server.getTokenInfo('unknown', 'TEST')).toBeUndefined()
    })
  })

  describe('getRegisteredTokens', () => {
    test('should return token symbols for chain', () => {
      server.registerToken('ethereum', 'USDT', { address: '0x1', decimals: 6 })
      server.registerToken('ethereum', 'USDC', { address: '0x2', decimals: 6 })

      const tokens = server.getRegisteredTokens('ethereum')

      expect(tokens).toEqual(['USDT', 'USDC'])
    })

    test('should return empty array for unregistered chain', () => {
      expect(server.getRegisteredTokens('unknown')).toEqual([])
    })
  })

  describe('registerTools', () => {
    test('should call each tool function with server instance', () => {
      const tool1 = jest.fn()
      const tool2 = jest.fn()

      server.registerTools([tool1, tool2])

      expect(tool1).toHaveBeenCalledWith(server)
      expect(tool2).toHaveBeenCalledWith(server)
    })

    test('should return server instance for chaining', () => {
      const result = server.registerTools([])

      expect(result).toBe(server)
    })
  })

  describe('registerWallet', () => {
    const WalletManagerMock = jest.fn()
    const CONFIG = { provider: 'https://eth.drpc.org' }

    test('should add blockchain to chains registry', () => {
      server._wdk = { registerWallet: jest.fn() }

      server.registerWallet('ethereum', WalletManagerMock, CONFIG)

      expect(server.getChains()).toContain('ethereum')
    })

    test('should register default tokens for known chains', () => {
      server._wdk = { registerWallet: jest.fn() }
      const registerTokenSpy = jest.spyOn(server, 'registerToken')

      server.registerWallet('ethereum', WalletManagerMock, CONFIG)

      expect(registerTokenSpy).toHaveBeenCalledWith('ethereum', 'USDT', DEFAULT_TOKENS[CHAINS.ETHEREUM].USDT)
      expect(registerTokenSpy).toHaveBeenCalledWith('ethereum', 'XAUT', DEFAULT_TOKENS[CHAINS.ETHEREUM].XAUT)
    })

    test('should not register tokens for unknown chains', () => {
      server._wdk = { registerWallet: jest.fn() }
      const registerTokenSpy = jest.spyOn(server, 'registerToken')

      server.registerWallet('customchain', WalletManagerMock, CONFIG)

      expect(registerTokenSpy).not.toHaveBeenCalled()
    })

    test('should throw if useWdk not called', () => {
      expect(() => server.registerWallet('ethereum', WalletManagerMock, CONFIG))
        .toThrow('Call useWdk({ seed }) before registerWallet().')
    })

    test('should return server instance for chaining', () => {
      server._wdk = { registerWallet: jest.fn() }

      const result = server.registerWallet('ethereum', WalletManagerMock, CONFIG)

      expect(result).toBe(server)
    })
  })

  describe('registerProtocol', () => {
    const CONFIG = { apiKey: 'test-key' }

    let SwapProtocolMock, BridgeProtocolMock, LendingProtocolMock, FiatProtocolMock

    beforeEach(() => {
      SwapProtocolMock = jest.fn()
      Object.setPrototypeOf(SwapProtocolMock.prototype, SwapProtocol.prototype)

      BridgeProtocolMock = jest.fn()
      Object.setPrototypeOf(BridgeProtocolMock.prototype, BridgeProtocol.prototype)

      LendingProtocolMock = jest.fn()
      Object.setPrototypeOf(LendingProtocolMock.prototype, LendingProtocol.prototype)

      FiatProtocolMock = jest.fn()
      Object.setPrototypeOf(FiatProtocolMock.prototype, FiatProtocol.prototype)

      server._wdk = { registerProtocol: jest.fn() }
    })

    test('should add swap protocol to swap registry', () => {
      server.registerProtocol('ethereum', 'velora', SwapProtocolMock, CONFIG)

      expect(server.getSwapChains()).toContain('ethereum')
      expect(server.getSwapProtocols('ethereum')).toContain('velora')
    })

    test('should add bridge protocol to bridge registry', () => {
      server.registerProtocol('ethereum', 'usdt0', BridgeProtocolMock, CONFIG)

      expect(server.getBridgeChains()).toContain('ethereum')
      expect(server.getBridgeProtocols('ethereum')).toContain('usdt0')
    })

    test('should add lending protocol to lending registry', () => {
      server.registerProtocol('ethereum', 'aave', LendingProtocolMock, CONFIG)

      expect(server.getLendingChains()).toContain('ethereum')
      expect(server.getLendingProtocols('ethereum')).toContain('aave')
    })

    test('should add fiat protocol to fiat registry', () => {
      server.registerProtocol('ethereum', 'moonpay', FiatProtocolMock, CONFIG)

      expect(server.getFiatChains()).toContain('ethereum')
      expect(server.getFiatProtocols('ethereum')).toContain('moonpay')
    })

    test('should throw for unknown protocol type', () => {
      const UnknownProtocolMock = jest.fn()

      expect(() => server.registerProtocol('ethereum', 'unknown', UnknownProtocolMock, CONFIG))
        .toThrow('Unknown protocol type. Must extend SwapProtocol, BridgeProtocol, LendingProtocol, or FiatProtocol.')
    })

    test('should throw if useWdk not called', () => {
      const freshServer = new WdkMcpServer('test', '1.0.0')

      expect(() => freshServer.registerProtocol('ethereum', 'velora', SwapProtocolMock, CONFIG))
        .toThrow('Call useWdk({ seed }) before registerProtocol().')
    })

    test('should return server instance for chaining', () => {
      const result = server.registerProtocol('ethereum', 'velora', SwapProtocolMock, CONFIG)

      expect(result).toBe(server)
    })
  })

  describe('getSwapChains', () => {
    test('should return empty array when no swap protocols registered', () => {
      expect(server.getSwapChains()).toEqual([])
    })

    test('should return chains with swap protocols', () => {
      server._wdk = { registerProtocol: jest.fn() }
      const SwapMock = jest.fn()
      Object.setPrototypeOf(SwapMock.prototype, SwapProtocol.prototype)
      server.registerProtocol('ethereum', 'velora', SwapMock, {})

      expect(server.getSwapChains()).toEqual(['ethereum'])
    })
  })

  describe('getSwapProtocols', () => {
    test('should return protocol labels for chain', () => {
      server._wdk = { registerProtocol: jest.fn() }
      const SwapMock = jest.fn()
      Object.setPrototypeOf(SwapMock.prototype, SwapProtocol.prototype)
      server.registerProtocol('ethereum', 'velora', SwapMock, {})
      server.registerProtocol('ethereum', 'uniswap', SwapMock, {})

      const protocols = server.getSwapProtocols('ethereum')

      expect(protocols).toEqual(['velora', 'uniswap'])
    })

    test('should return empty array for chain without protocols', () => {
      expect(server.getSwapProtocols('ethereum')).toEqual([])
    })
  })

  describe('getBridgeChains', () => {
    test('should return empty array when no bridge protocols registered', () => {
      expect(server.getBridgeChains()).toEqual([])
    })

    test('should return chains with bridge protocols', () => {
      server._wdk = { registerProtocol: jest.fn() }
      const BridgeMock = jest.fn()
      Object.setPrototypeOf(BridgeMock.prototype, BridgeProtocol.prototype)
      server.registerProtocol('ethereum', 'usdt0', BridgeMock, {})

      expect(server.getBridgeChains()).toEqual(['ethereum'])
    })
  })

  describe('getBridgeProtocols', () => {
    test('should return protocol labels for chain', () => {
      server._wdk = { registerProtocol: jest.fn() }
      const BridgeMock = jest.fn()
      Object.setPrototypeOf(BridgeMock.prototype, BridgeProtocol.prototype)
      server.registerProtocol('ethereum', 'usdt0', BridgeMock, {})

      expect(server.getBridgeProtocols('ethereum')).toEqual(['usdt0'])
    })

    test('should return empty array for chain without protocols', () => {
      expect(server.getBridgeProtocols('ethereum')).toEqual([])
    })
  })

  describe('getLendingChains', () => {
    test('should return empty array when no lending protocols registered', () => {
      expect(server.getLendingChains()).toEqual([])
    })

    test('should return chains with lending protocols', () => {
      server._wdk = { registerProtocol: jest.fn() }
      const LendingMock = jest.fn()
      Object.setPrototypeOf(LendingMock.prototype, LendingProtocol.prototype)
      server.registerProtocol('ethereum', 'aave', LendingMock, {})

      expect(server.getLendingChains()).toEqual(['ethereum'])
    })
  })

  describe('getLendingProtocols', () => {
    test('should return protocol labels for chain', () => {
      server._wdk = { registerProtocol: jest.fn() }
      const LendingMock = jest.fn()
      Object.setPrototypeOf(LendingMock.prototype, LendingProtocol.prototype)
      server.registerProtocol('ethereum', 'aave', LendingMock, {})

      expect(server.getLendingProtocols('ethereum')).toEqual(['aave'])
    })

    test('should return empty array for chain without protocols', () => {
      expect(server.getLendingProtocols('ethereum')).toEqual([])
    })
  })

  describe('getFiatChains', () => {
    test('should return empty array when no fiat protocols registered', () => {
      expect(server.getFiatChains()).toEqual([])
    })

    test('should return chains with fiat protocols', () => {
      server._wdk = { registerProtocol: jest.fn() }
      const FiatMock = jest.fn()
      Object.setPrototypeOf(FiatMock.prototype, FiatProtocol.prototype)
      server.registerProtocol('ethereum', 'moonpay', FiatMock, {})

      expect(server.getFiatChains()).toEqual(['ethereum'])
    })
  })

  describe('getFiatProtocols', () => {
    test('should return protocol labels for chain', () => {
      server._wdk = { registerProtocol: jest.fn() }
      const FiatMock = jest.fn()
      Object.setPrototypeOf(FiatMock.prototype, FiatProtocol.prototype)
      server.registerProtocol('ethereum', 'moonpay', FiatMock, {})

      expect(server.getFiatProtocols('ethereum')).toEqual(['moonpay'])
    })

    test('should return empty array for chain without protocols', () => {
      expect(server.getFiatProtocols('ethereum')).toEqual([])
    })
  })

  describe('capabilities', () => {
    test('should default elicitation to true when no options provided', () => {
      expect(server.capabilities).toEqual({ elicitation: true })
    })

    test('should accept capabilities in constructor options', () => {
      const serverWithOptions = new WdkMcpServer('test', '1.0.0', {
        capabilities: { elicitation: false }
      })

      expect(serverWithOptions.capabilities).toEqual({ elicitation: false })
    })

    test('should return a copy from capabilities getter', () => {
      const caps1 = server.capabilities
      const caps2 = server.capabilities

      expect(caps1).toEqual(caps2)
      expect(caps1).not.toBe(caps2)
    })

    test('should not be affected by mutating the returned object', () => {
      const caps = server.capabilities
      caps.elicitation = false

      expect(server.capabilities.elicitation).toBe(true)
    })
  })

  describe('requestConfirmation', () => {
    const message = 'Confirm this action?'
    const schema = {
      type: 'object',
      properties: {
        confirmed: { type: 'boolean', title: 'Confirm' }
      },
      required: ['confirmed']
    }

    test('should call server.elicitInput when elicitation is enabled', async () => {
      const elicitInputMock = jest.fn().mockResolvedValue({
        action: 'accept',
        content: { confirmed: true }
      })
      server.server = { elicitInput: elicitInputMock }

      const result = await server.requestConfirmation(message, schema)

      expect(elicitInputMock).toHaveBeenCalledWith({
        message,
        requestedSchema: schema
      })
      expect(result).toEqual({ action: 'accept', content: { confirmed: true } })
    })

    test('should auto-confirm when elicitation is disabled', async () => {
      const serverNoElicit = new WdkMcpServer('test', '1.0.0', {
        capabilities: { elicitation: false }
      })

      const result = await serverNoElicit.requestConfirmation(message, schema)

      expect(result).toEqual({ action: 'accept', content: { confirmed: true } })
    })

    test('should not call server.elicitInput when elicitation is disabled', async () => {
      const serverNoElicit = new WdkMcpServer('test', '1.0.0', {
        capabilities: { elicitation: false }
      })
      const elicitInputMock = jest.fn()
      serverNoElicit.server = { elicitInput: elicitInputMock }

      await serverNoElicit.requestConfirmation(message, schema)

      expect(elicitInputMock).not.toHaveBeenCalled()
    })
  })

  describe('close', () => {
    test('should not throw if wdk is null', async () => {
      await expect(server.close()).resolves.not.toThrow()
    })

    test('should call wdk.dispose when wdk exists', async () => {
      const disposeMock = jest.fn()
      server._wdk = { dispose: disposeMock }

      await server.close()

      expect(disposeMock).toHaveBeenCalled()
    })
  })
})
