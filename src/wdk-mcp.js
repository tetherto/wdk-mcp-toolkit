'use strict'

import { WdkMcpServerReadonly } from './wdk-mcp-readonly.js'
import { registerWriteTools } from './tools/index.js'

export class WdkMcpServer extends WdkMcpServerReadonly {
  /**
   * Creates a new WDK MCP server instance with read and write capabilities.
   *
   * @param {string} name - The server name.
   * @param {string} version - The server version.
   * @param {string} [seed] - Optional BIP-39 seed phrase. If not provided, reads from WDK_SEED environment variable.
   * @throws {Error} If no seed is provided and WDK_SEED environment variable is not set.
   */
  constructor (name, version, seed) {
    super(name, version, seed)
  }

  /**
   * Registers a new wallet to WDK MCP with both read and write tools.
   *
   * @template {typeof import('@tetherto/wdk-wallet').default} W
   * @param {string} blockchain - The name of the blockchain the wallet must be bound to.
   * @param {W} WalletManager - The wallet manager class.
   * @param {ConstructorParameters<W>[1]} config - The configuration object.
   * @returns {WdkMcpServer} The wdk-mcp instance.
   * @throws {Error} If wallet registration fails.
   */
  registerWallet (blockchain, WalletManager, config) {
    super.registerWallet(blockchain, WalletManager, config)

    registerWriteTools(this, blockchain)

    return this
  }
}