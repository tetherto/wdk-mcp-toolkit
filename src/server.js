'use strict'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import WDK from '@tetherto/wdk'
import { SwapProtocol, BridgeProtocol, LendingProtocol, FiatProtocol } from '@tetherto/wdk-wallet/protocols'
import { BitfinexPricingClient } from '@tetherto/wdk-pricing-bitfinex-http'

/** @typedef {import('@tetherto/wdk').default} WDK */

/** @typedef {import('@tetherto/wdk-pricing-bitfinex-http').BitfinexPricingClient} BitfinexPricingClient */

/**
 * @typedef {Object} TokenInfo
 * @property {string} address - Token contract address.
 * @property {number} decimals - Number of decimal places for the token.
 */

/**
 * @typedef {Object} IndexerConfig
 * @property {string} apiKey - WDK Indexer API key.
 */

/**
 * @typedef {Object} WdkConfig
 * @property {string} [seed] - BIP-39 seed phrase. Falls back to WDK_SEED env variable.
 */

/**
 * @typedef {Object} ProtocolRegistry
 * @property {Map<string, Set<string>>} swap - Chain to labels mapping for swap protocols.
 * @property {Map<string, Set<string>>} bridge - Chain to labels mapping for bridge protocols.
 * @property {Map<string, Set<string>>} lending - Chain to labels mapping for lending protocols.
 * @property {Map<string, Set<string>>} fiat - Chain to labels mapping for fiat protocols.
 */

/** @typedef {Map<string, TokenInfo>} TokenMap */

/** @typedef {Map<string, TokenMap>} TokenRegistry */

/** @typedef {(server: WdkMcpServer) => void} ToolFunction */

export const CHAINS = {
  ETHEREUM: 'ethereum',
  POLYGON: 'polygon',
  ARBITRUM: 'arbitrum',
  OPTIMISM: 'optimism',
  BASE: 'base',
  AVALANCHE: 'avalanche',
  BNB: 'bnb',
  PLASMA: 'plasma',
  BITCOIN: 'bitcoin',
  SOLANA: 'solana',
  SPARK: 'spark',
  TON: 'ton',
  TRON: 'tron'
}

export const DEFAULT_TOKENS = {
  [CHAINS.ETHEREUM]: {
    USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    XAUT: { address: '0x68749665FF8D2d112Fa859AA293F07A622782F38', decimals: 6 }
  },
  [CHAINS.POLYGON]: {
    USDT: { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 }
  },
  [CHAINS.ARBITRUM]: {
    USDT: { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 }
  },
  [CHAINS.OPTIMISM]: {
    USDT: { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6 }
  },
  [CHAINS.BASE]: {
    USDT: { address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', decimals: 6 }
  },
  [CHAINS.AVALANCHE]: {
    USDT: { address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', decimals: 6 }
  },
  [CHAINS.BNB]: {
    USDT: { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 }
  },
  [CHAINS.PLASMA]: {
    USDT: { address: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb', decimals: 6 }
  },
  [CHAINS.TRON]: {
    USDT: { address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', decimals: 6 }
  },
  [CHAINS.TON]: {
    USDT: { address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', decimals: 6 }
  },
  [CHAINS.SOLANA]: {
    USDT: { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 }
  }
}

export class WdkMcpServer extends McpServer {
  /**
   * Creates a new MCP server for Tether Wallet Development Kit.
   *
   * @param {string} name - The server name.
   * @param {string} version - The server version.
   */
  constructor (name, version) {
    super({ name, version })

    /** @type {WDK | null} */
    this.wdk = null

    /** @type {IndexerConfig | null} */
    this.indexer = null

    /** @type {BitfinexPricingClient | null} */
    this.pricingClient = null

    /** @type {Set<string>} */
    this.chains = new Set()

    /** @type {TokenRegistry} */
    this.tokenRegistry = new Map()

    /** @type {ProtocolRegistry} */
    this._protocols = {
      swap: new Map(),
      bridge: new Map(),
      lending: new Map(),
      fiat: new Map()
    }
  }

  /**
   * Enables WDK and initializes the wallet development kit.
   *
   * @param {WdkConfig} config - The configuration.
   * @returns {WdkMcpServer} The server instance.
   * @throws {Error} If no seed is provided.
   */
  useWdk (config) {
    const seedPhrase = config.seed || process.env.WDK_SEED

    if (!seedPhrase) {
      throw new Error('WDK requires seed. Provide { seed } or set WDK_SEED env variable.')
    }

    this.wdk = new WDK(seedPhrase)
    return this
  }

  /**
   * Enables Indexer for transaction history and UTXO queries.
   *
   * @param {IndexerConfig} config - The configuration.
   * @returns {WdkMcpServer} The server instance.
   * @throws {Error} If no apiKey is provided.
   */
  useIndexer (config) {
    if (!config.apiKey) {
      throw new Error('Indexer requires apiKey.')
    }

    this.indexer = { apiKey: config.apiKey }
    return this
  }

  /**
   * Enables Pricing for Bitfinex price rates.
   *
   * @returns {WdkMcpServer} The server instance.
   */
  usePricing () {
    this.pricingClient = new BitfinexPricingClient()
    return this
  }

  /**
   * Returns all registered blockchain names.
   *
   * @returns {string[]} The blockchain names.
   */
  getChains () {
    return [...this.chains]
  }

  /**
   * Registers a token symbol to contract address mapping.
   *
   * @param {string} chain - The blockchain name.
   * @param {string} symbol - The token symbol (e.g., "USDT").
   * @param {TokenInfo} token - The token info.
   * @returns {WdkMcpServer} The server instance.
   */
  registerToken (chain, symbol, token) {
    if (!this.tokenRegistry.has(chain)) {
      this.tokenRegistry.set(chain, new Map())
    }

    this.tokenRegistry.get(chain).set(symbol.toUpperCase(), token)
    return this
  }

  /**
   * Returns the token info for a symbol on a blockchain.
   *
   * @param {string} chain - The blockchain name.
   * @param {string} symbol - The token symbol.
   * @returns {TokenInfo | undefined} The token info.
   */
  getTokenInfo (chain, symbol) {
    const tokens = this.tokenRegistry.get(chain)
    return tokens ? tokens.get(symbol.toUpperCase()) : undefined
  }

  /**
   * Returns all registered token symbols for a blockchain.
   *
   * @param {string} chain - The blockchain name.
   * @returns {string[]} The token symbols.
   */
  getRegisteredTokens (chain) {
    const tokens = this.tokenRegistry.get(chain)
    return tokens ? [...tokens.keys()] : []
  }

  /**
   * Registers tools with the server.
   *
   * @param {ToolFunction[]} tools - The tool functions.
   * @returns {WdkMcpServer} The server instance.
   */
  registerTools (tools) {
    for (const tool of tools) {
      tool(this)
    }

    return this
  }

  /**
   * Registers a new wallet to the server.
   *
   * @template {typeof import('@tetherto/wdk-wallet').default} W
   * @param {string} blockchain - The name of the blockchain (e.g., "ethereum").
   * @param {W} WalletManager - The wallet manager class.
   * @param {ConstructorParameters<W>[1]} config - The configuration object.
   * @returns {WdkMcpServer} The server instance.
   * @throws {Error} If useWdk() has not been called.
   */
  registerWallet (blockchain, WalletManager, config) {
    if (!this.wdk) {
      throw new Error('Call useWdk({ seed }) before registerWallet().')
    }

    this.wdk.registerWallet(blockchain, WalletManager, config)
    this.chains.add(blockchain)

    if (DEFAULT_TOKENS[blockchain]) {
      for (const [symbol, token] of Object.entries(DEFAULT_TOKENS[blockchain])) {
        this.registerToken(blockchain, symbol, token)
      }
    }

    return this
  }

  /**
   * Registers a protocol for a blockchain.
   *
   * @template {typeof SwapProtocol | typeof BridgeProtocol | typeof LendingProtocol | typeof FiatProtocol} P
   * @param {string} chain - The blockchain name (e.g., "ethereum").
   * @param {string} label - The protocol label (e.g., "velora").
   * @param {P} Protocol - The protocol class.
   * @param {ConstructorParameters<P>[1]} [config] - The protocol configuration.
   * @returns {WdkMcpServer} The server instance.
   * @throws {Error} If useWdk() has not been called.
   * @throws {Error} If unknown protocol type.
   */
  registerProtocol (chain, label, Protocol, config) {
    if (!this.wdk) {
      throw new Error('Call useWdk({ seed }) before registerProtocol().')
    }

    let registry
    if (Protocol.prototype instanceof SwapProtocol) {
      registry = this._protocols.swap
    } else if (Protocol.prototype instanceof BridgeProtocol) {
      registry = this._protocols.bridge
    } else if (Protocol.prototype instanceof LendingProtocol) {
      registry = this._protocols.lending
    } else if (Protocol.prototype instanceof FiatProtocol) {
      registry = this._protocols.fiat
    } else {
      throw new Error('Unknown protocol type. Must extend SwapProtocol, BridgeProtocol, LendingProtocol, or FiatProtocol.')
    }

    if (!registry.has(chain)) {
      registry.set(chain, new Set())
    }
    registry.get(chain).add(label)

    this.wdk.registerProtocol(chain, label, Protocol, config)

    return this
  }

  /**
   * Returns chains that have swap protocols registered.
   *
   * @returns {string[]} The chain names.
   */
  getSwapChains () {
    return [...this._protocols.swap.keys()]
  }

  /**
   * Returns swap protocol labels for a chain.
   *
   * @param {string} chain - The blockchain name.
   * @returns {string[]} The protocol labels.
   */
  getSwapProtocols (chain) {
    const labels = this._protocols.swap.get(chain)
    return labels ? [...labels] : []
  }

  /**
   * Returns chains that have bridge protocols registered.
   *
   * @returns {string[]} The chain names.
   */
  getBridgeChains () {
    return [...this._protocols.bridge.keys()]
  }

  /**
   * Returns bridge protocol labels for a chain.
   *
   * @param {string} chain - The blockchain name.
   * @returns {string[]} The protocol labels.
   */
  getBridgeProtocols (chain) {
    const labels = this._protocols.bridge.get(chain)
    return labels ? [...labels] : []
  }

  /**
   * Returns chains that have lending protocols registered.
   *
   * @returns {string[]} The chain names.
   */
  getLendingChains () {
    return [...this._protocols.lending.keys()]
  }

  /**
   * Returns lending protocol labels for a chain.
   *
   * @param {string} chain - The blockchain name.
   * @returns {string[]} The protocol labels.
   */
  getLendingProtocols (chain) {
    const labels = this._protocols.lending.get(chain)
    return labels ? [...labels] : []
  }

  /**
   * Returns chains that have fiat protocols registered.
   *
   * @returns {string[]} The chain names.
   */
  getFiatChains () {
    return [...this._protocols.fiat.keys()]
  }

  /**
   * Returns fiat protocol labels for a chain.
   *
   * @param {string} chain - The blockchain name.
   * @returns {string[]} The protocol labels.
   */
  getFiatProtocols (chain) {
    const labels = this._protocols.fiat.get(chain)
    return labels ? [...labels] : []
  }

  /**
   * Closes the server and securely disposes the WDK instance.
   *
   * @returns {Promise<void>}
   */
  async close () {
    if (this.wdk && typeof this.wdk.dispose === 'function') {
      this.wdk.dispose()
    }

    await super.close()
  }
}