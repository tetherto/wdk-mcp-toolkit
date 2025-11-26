'use strict'

import WDK from '@tetherto/wdk'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerReadonlyTools } from './tools/index.js'

/**
 * @typedef {Object} TokenInfo
 * @property {string} address - The token's contract address
 * @property {number} decimals - The token's decimal places
 */

const DEFAULT_TOKENS = {
  ethereum: {
    USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    DAI: { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
    WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
    WBTC: { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 }
  }
}

export class WdkMcpServerReadonly extends McpServer {
  /**
   * Creates a new WDK MCP server instance.
   *
   * @param {string} name - The server name.
   * @param {string} version - The server version.
   * @param {string} [seed] - Optional BIP-39 seed phrase. If not provided, reads from WDK_SEED environment variable.
   * @throws {Error} If no seed is provided and WDK_SEED environment variable is not set.
   */
  constructor (name, version, seed) {
    super({
      name,
      version
    })

    const seedPhrase = seed || process.env.WDK_SEED

    if (!seedPhrase) {
      throw new Error(
        'WDK seed phrase is required. ' +
        'Provide it as constructor parameter or set WDK_SEED environment variable.'
      )
    }

    /** @type {WDK} */
    this.wdk = new WDK(seedPhrase)

    /** @type {Set<string>} */
    this.registeredWallets = new Set()

    /** @type {Map<string, Map<string, TokenInfo>>} */
    this.tokenRegistry = new Map()
  }

  /**
   * Registers a tool. Automatically overrides if tool with same name already exists.
   *
   * @param {string} name - Tool name.
   * @param {Object} config - Tool configuration (title, description, inputSchema, outputSchema, annotations, _meta).
   * @param {Function} callback - Tool callback function.
   * @returns {Object} Registered tool.
   */
  registerTool (name, config, callback) {
    this._registeredTools?.[name]?.remove()
    return super.registerTool(name, config, callback)
  }

  /**
   * Registers a token symbol to contract address mapping for a blockchain.
   *
   * This allows users to query token balances using human-readable symbols (e.g., "USDT")
   * instead of contract addresses.
   *
   * @param {string} blockchain - The blockchain name (e.g., "ethereum").
   * @param {string} symbol - The token symbol (e.g., "USDT", "USDC"). Case-insensitive.
   * @param {string} address - The token's contract address (should use EIP-55 checksum for Ethereum).
   * @param {number} decimals - The number of decimal places for the token (e.g., 6 for USDT, 18 for DAI).
   * @returns {WdkMcpServerReadonly} The wdk-mcp instance.
   *
   * @example
   * server.registerToken('ethereum', 'MYTOKEN', '0x1234...', 18)
   */
  registerToken (blockchain, symbol, address, decimals) {
    if (!this.tokenRegistry.has(blockchain)) {
      this.tokenRegistry.set(blockchain, new Map())
    }

    this.tokenRegistry.get(blockchain).set(symbol.toUpperCase(), { address, decimals })

    return this
  }

  /**
   * Returns token info for a given symbol on a blockchain.
   *
   * @param {string} blockchain - The blockchain name.
   * @param {string} symbol - The token symbol.
   * @returns {TokenInfo | undefined} The token info or undefined if not found.
   */
  getTokenInfo (blockchain, symbol) {
    const tokens = this.tokenRegistry.get(blockchain)
    return tokens ? tokens.get(symbol.toUpperCase()) : undefined
  }

  /**
   * Returns all registered token symbols for a blockchain.
   *
   * @param {string} blockchain - The blockchain name.
   * @returns {string[]} Array of registered token symbols.
   */
  getRegisteredTokens (blockchain) {
    const tokens = this.tokenRegistry.get(blockchain)
    return tokens ? Array.from(tokens.keys()) : []
  }

  /**
   * Registers a new wallet to WDK MCP.
   *
   * This method registers a blockchain wallet and automatically generates standard MCP tools
   * for the blockchain (getAddress, getFeeRates, etc.). Tools are namespaced by blockchain name
   * using snake_case (e.g., "bitcoin_getAddress", "ethereum_getFeeRates").
   *
   * Also registers default tokens for the blockchain if available.
   *
   * @template {typeof import('@tetherto/wdk-wallet').default} W
   * @param {string} blockchain - The name of the blockchain the wallet must be bound to. Can be any string (e.g., "ethereum").
   * @param {W} WalletManager - The wallet manager class.
   * @param {ConstructorParameters<W>[1]} config - The configuration object.
   * @returns {WdkMcpServerReadonly} The wdk-mcp instance.
   * @throws {Error} If wallet registration fails.
   */
  registerWallet (blockchain, WalletManager, config) {
    this.wdk.registerWallet(blockchain, WalletManager, config)
    this.registeredWallets.add(blockchain)

    if (DEFAULT_TOKENS[blockchain]) {
      for (const [symbol, tokenInfo] of Object.entries(DEFAULT_TOKENS[blockchain])) {
        this.registerToken(blockchain, symbol, tokenInfo.address, tokenInfo.decimals)
      }
    }

    registerReadonlyTools(this, blockchain)
    return this
  }

  /**
   * Returns the list of registered blockchain names.
   *
   * @returns {string[]} Array of registered blockchain names.
   */
  getRegisteredWallets () {
    return Array.from(this.registeredWallets)
  }

  /**
   * Closes the server and disposes of all wallets, erasing sensitive data from memory.
   *
   * @override
   * @returns {Promise<void>}
   */
  async close () {
    this.wdk.dispose()
    await super.close()
  }
}