'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { SwapProtocol, BridgeProtocol, LendingProtocol, FiatProtocol } from '@tetherto/wdk-wallet/protocols'

import { WdkMcpServer, DEFAULT_TOKENS, CHAINS } from '../src/server.js'

const SEED_PHRASE = 'cook voyage document eight skate token alien guide drink uncle term abuse'

describe('WdkMcpServer', () => {
  let server

  beforeEach(() => {
    server = new WdkMcpServer('test-server', '1.0.0')
  })

  describe('constructor', () => {
    test('should initialize with null wdk', () => {
      expect(server.wdk).toBeNull()
    })

    test('should initialize with null indexerClient', () => {
      expect(server.indexerClient).toBeNull()
    })

    test('should initialize with null pricingClient', () => {
      expect(server.pricingClient).toBeNull()
    })

    test('should initialize with empty chains', () => {
      expect(server.getChains()).toEqual([])
    })
  })

  describe('wdk getter', () => {
    test('should return the WDK instance after useWdk is called', () => {
      server.useWdk({ seed: SEED_PHRASE })

      expect(server.wdk).not.toBeNull()
    })
  })

  describe('indexerClient getter', () => {
    test('should return the indexer client after useIndexer is called', () => {
      server.useIndexer({ apiKey: 'test-api-key' })

      expect(server.indexerClient).not.toBeNull()
    })
  })

  describe('pricingClient getter', () => {
    test('should return the pricing client after usePricing is called', () => {
      server.usePricing()

      expect(server.pricingClient).not.toBeNull()
    })
  })

  describe('useWdk', () => {
    test('should create WDK instance with provided seed', () => {
      server.useWdk({ seed: SEED_PHRASE })

      expect(server.wdk).not.toBeNull()
    })

    test('should create WDK instance with WDK_SEED env variable', () => {
      const originalEnv = process.env.WDK_SEED
      process.env.WDK_SEED = SEED_PHRASE

      server.useWdk({})

      expect(server.wdk).not.toBeNull()

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
    test('should create WdkIndexerClient with apiKey', () => {
      server.useIndexer({ apiKey: 'test-api-key' })

      expect(server.indexerClient).not.toBeNull()
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
    test('should create BitfinexPricingClient', () => {
      server.usePricing()

      expect(server.pricingClient).not.toBeNull()
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
      const WalletManagerMock = jest.fn()

      server.useWdk({ seed: SEED_PHRASE })
            .registerWallet('ethereum', WalletManagerMock, {})
            .registerWallet('bitcoin', WalletManagerMock, {})

      expect(server.getChains()).toContain('ethereum')
      expect(server.getChains()).toContain('bitcoin')
    })
  })

  describe('registerToken', () => {
    test('should register token for chain', () => {
      const tokenInfo = { address: '0x123', decimals: 18 }

      server.registerToken('ethereum', 'TEST', tokenInfo)

      expect(server.getTokenInfo('ethereum', 'TEST')).toEqual(tokenInfo)
    })

    test('should uppercase symbol', () => {
      const tokenInfo = { address: '0x123', decimals: 18 }

      server.registerToken('ethereum', 'test', tokenInfo)

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

      expect(tokens).toContain('USDT')
      expect(tokens).toContain('USDC')
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
      server.useWdk({ seed: SEED_PHRASE })

      server.registerWallet('ethereum', WalletManagerMock, CONFIG)

      expect(server.getChains()).toContain('ethereum')
    })

    test('should register default tokens for known chains', () => {
      server.useWdk({ seed: SEED_PHRASE })

      server.registerWallet('ethereum', WalletManagerMock, CONFIG)

      expect(server.getTokenInfo('ethereum', 'USDT')).toEqual(DEFAULT_TOKENS[CHAINS.ETHEREUM].USDT)
      expect(server.getTokenInfo('ethereum', 'XAUT')).toEqual(DEFAULT_TOKENS[CHAINS.ETHEREUM].XAUT)
    })

    test('should not register tokens for unknown chains', () => {
      server.useWdk({ seed: SEED_PHRASE })

      server.registerWallet('customchain', WalletManagerMock, CONFIG)

      expect(server.getRegisteredTokens('customchain')).toEqual([])
    })

    test('should throw if useWdk not called', () => {
      expect(() => server.registerWallet('ethereum', WalletManagerMock, CONFIG))
        .toThrow('Call useWdk({ seed }) before registerWallet().')
    })

    test('should return server instance for chaining', () => {
      server.useWdk({ seed: SEED_PHRASE })

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

      server.useWdk({ seed: SEED_PHRASE })
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
      const SwapProtocolMock = jest.fn()
      Object.setPrototypeOf(SwapProtocolMock.prototype, SwapProtocol.prototype)

      server.useWdk({ seed: SEED_PHRASE })
            .registerProtocol('ethereum', 'velora', SwapProtocolMock, {})

      expect(server.getSwapChains()).toContain('ethereum')
    })
  })

  describe('getSwapProtocols', () => {
    test('should return protocol labels for chain', () => {
      const SwapProtocolMock = jest.fn()
      Object.setPrototypeOf(SwapProtocolMock.prototype, SwapProtocol.prototype)

      server.useWdk({ seed: SEED_PHRASE })
            .registerProtocol('ethereum', 'velora', SwapProtocolMock, {})
            .registerProtocol('ethereum', 'uniswap', SwapProtocolMock, {})

      const protocols = server.getSwapProtocols('ethereum')

      expect(protocols).toContain('velora')
      expect(protocols).toContain('uniswap')
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
      const BridgeProtocolMock = jest.fn()
      Object.setPrototypeOf(BridgeProtocolMock.prototype, BridgeProtocol.prototype)

      server.useWdk({ seed: SEED_PHRASE })
            .registerProtocol('ethereum', 'usdt0', BridgeProtocolMock, {})

      expect(server.getBridgeChains()).toContain('ethereum')
    })
  })

  describe('getBridgeProtocols', () => {
    test('should return protocol labels for chain', () => {
      const BridgeProtocolMock = jest.fn()
      Object.setPrototypeOf(BridgeProtocolMock.prototype, BridgeProtocol.prototype)

      server.useWdk({ seed: SEED_PHRASE })
            .registerProtocol('ethereum', 'usdt0', BridgeProtocolMock, {})

      expect(server.getBridgeProtocols('ethereum')).toContain('usdt0')
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
      const LendingProtocolMock = jest.fn()
      Object.setPrototypeOf(LendingProtocolMock.prototype, LendingProtocol.prototype)

      server.useWdk({ seed: SEED_PHRASE })
            .registerProtocol('ethereum', 'aave', LendingProtocolMock, {})

      expect(server.getLendingChains()).toContain('ethereum')
    })
  })

  describe('getLendingProtocols', () => {
    test('should return protocol labels for chain', () => {
      const LendingProtocolMock = jest.fn()
      Object.setPrototypeOf(LendingProtocolMock.prototype, LendingProtocol.prototype)

      server.useWdk({ seed: SEED_PHRASE })
            .registerProtocol('ethereum', 'aave', LendingProtocolMock, {})

      expect(server.getLendingProtocols('ethereum')).toContain('aave')
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
      const FiatProtocolMock = jest.fn()
      Object.setPrototypeOf(FiatProtocolMock.prototype, FiatProtocol.prototype)

      server.useWdk({ seed: SEED_PHRASE })
            .registerProtocol('ethereum', 'moonpay', FiatProtocolMock, {})

      expect(server.getFiatChains()).toContain('ethereum')
    })
  })

  describe('getFiatProtocols', () => {
    test('should return protocol labels for chain', () => {
      const FiatProtocolMock = jest.fn()
      Object.setPrototypeOf(FiatProtocolMock.prototype, FiatProtocol.prototype)

      server.useWdk({ seed: SEED_PHRASE })
            .registerProtocol('ethereum', 'moonpay', FiatProtocolMock, {})

      expect(server.getFiatProtocols('ethereum')).toContain('moonpay')
    })

    test('should return empty array for chain without protocols', () => {
      expect(server.getFiatProtocols('ethereum')).toEqual([])
    })
  })

  describe('close', () => {
    test('should not throw if wdk is null', async () => {
      await expect(server.close()).resolves.not.toThrow()
    })

    test('should not throw when wdk exists', async () => {
      server.useWdk({ seed: SEED_PHRASE })

      await expect(server.close()).resolves.not.toThrow()
    })
  })
})
