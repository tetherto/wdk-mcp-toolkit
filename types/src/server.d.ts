/**
 * Supported blockchain identifiers.
 */
export type CHAINS = string;
export namespace CHAINS {
    let ETHEREUM: string;
    let POLYGON: string;
    let ARBITRUM: string;
    let OPTIMISM: string;
    let BASE: string;
    let AVALANCHE: string;
    let BNB: string;
    let PLASMA: string;
    let BITCOIN: string;
    let SOLANA: string;
    let SPARK: string;
    let TON: string;
    let TRON: string;
}
/**
 * Default token configurations per blockchain.
 *
 * @readonly
 * @type {Object<string, Object<string, TokenInfo>>}
 */
export const DEFAULT_TOKENS: {
    [x: string]: {
        [x: string]: TokenInfo;
    };
};
export class WdkMcpServer extends McpServer {
    /**
     * Creates a new MCP server for Tether Wallet Development Kit.
     *
     * @param {string} name - The server name.
     * @param {string} version - The server version.
     */
    constructor(name: string, version: string);
    /**
     * The Wallet Development Kit instance for blockchain operations.
     *
     * @private
     * @type {WDK | null}
     */
    private _wdk;
    /**
     * HTTP client for querying blockchain indexer data (balances, transfers).
     *
     * @private
     * @type {WdkIndexerClient | null}
     */
    private _indexerClient;
    /**
     * HTTP client for fetching cryptocurrency pricing data from Bitfinex.
     *
     * @private
     * @type {BitfinexPricingClient | null}
     */
    private _pricingClient;
    /**
     * Set of blockchain identifiers that have been configured.
     *
     * @private
     * @type {Set<string>}
     */
    private _chains;
    /**
     * Registry mapping chains to their token configurations (address, decimals).
     *
     * @private
     * @type {TokenRegistry}
     */
    private _tokenRegistry;
    /**
     * Registry of DeFi protocols (swap, bridge, lending, fiat) by chain.
     *
     * @private
     * @type {ProtocolRegistry}
     */
    private _protocols;
    /**
     * The WDK instance.
     *
     * @type {WDK | null}
     */
    get wdk(): WDK | null;
    /**
     * The indexer client.
     *
     * @type {WdkIndexerClient | null}
     */
    get indexerClient(): WdkIndexerClient | null;
    /**
     * The pricing client.
     *
     * @type {BitfinexPricingClient | null}
     */
    get pricingClient(): BitfinexPricingClient | null;
    /**
     * Enables WDK and initializes the wallet development kit.
     *
     * @param {WdkConfig} config - The configuration.
     * @returns {WdkMcpServer} The server instance.
     * @throws {Error} If no seed is provided.
     */
    useWdk(config: WdkConfig): WdkMcpServer;
    /**
     * Enables Indexer for transaction history and UTXO queries.
     *
     * @param {Pick<WdkIndexerConfig, 'apiKey'>} config - The configuration.
     * @returns {WdkMcpServer} The server instance.
     * @throws {Error} If no apiKey is provided.
     */
    useIndexer(config: Pick<WdkIndexerConfig, "apiKey">): WdkMcpServer;
    /**
     * Enables Pricing for Bitfinex price rates.
     *
     * @returns {WdkMcpServer} The server instance.
     */
    usePricing(): WdkMcpServer;
    /**
     * Returns all registered blockchain names.
     *
     * @returns {string[]} The blockchain names.
     */
    getChains(): string[];
    /**
     * Registers a token symbol to contract address mapping.
     *
     * @param {string} chain - The blockchain name.
     * @param {string} symbol - The token symbol (e.g., "USDT").
     * @param {TokenInfo} token - The token info.
     * @returns {WdkMcpServer} The server instance.
     */
    registerToken(chain: string, symbol: string, token: TokenInfo): WdkMcpServer;
    /**
     * Returns the token info for a symbol on a blockchain.
     *
     * @param {string} chain - The blockchain name.
     * @param {string} symbol - The token symbol.
     * @returns {TokenInfo | undefined} The token info.
     */
    getTokenInfo(chain: string, symbol: string): TokenInfo | undefined;
    /**
     * Returns all registered token symbols for a blockchain.
     *
     * @param {string} chain - The blockchain name.
     * @returns {string[]} The token symbols.
     */
    getRegisteredTokens(chain: string): string[];
    /**
     * Registers tools with the server.
     *
     * @param {ToolFunction[]} tools - The tool functions.
     * @returns {WdkMcpServer} The server instance.
     */
    registerTools(tools: ToolFunction[]): WdkMcpServer;
    /**
     * Registers a new wallet to the server.
     *
     * @template {WDK} W
     * @param {string} blockchain - The name of the blockchain (e.g., "ethereum").
     * @param {W} WalletManager - The wallet manager class.
     * @param {ConstructorParameters<W>[1]} config - The configuration object.
     * @returns {WdkMcpServer} The server instance.
     * @throws {Error} If useWdk() has not been called.
     */
    registerWallet<W extends WDK>(blockchain: string, WalletManager: W, config: ConstructorParameters<W>[1]): WdkMcpServer;
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
    registerProtocol<P extends typeof SwapProtocol | typeof BridgeProtocol | typeof LendingProtocol | typeof FiatProtocol>(chain: string, label: string, Protocol: P, config?: ConstructorParameters<P>[1]): WdkMcpServer;
    /**
     * Returns chains that have swap protocols registered.
     *
     * @returns {string[]} The chain names.
     */
    getSwapChains(): string[];
    /**
     * Returns swap protocol labels for a chain.
     *
     * @param {string} chain - The blockchain name.
     * @returns {string[]} The protocol labels.
     */
    getSwapProtocols(chain: string): string[];
    /**
     * Returns chains that have bridge protocols registered.
     *
     * @returns {string[]} The chain names.
     */
    getBridgeChains(): string[];
    /**
     * Returns bridge protocol labels for a chain.
     *
     * @param {string} chain - The blockchain name.
     * @returns {string[]} The protocol labels.
     */
    getBridgeProtocols(chain: string): string[];
    /**
     * Returns chains that have lending protocols registered.
     *
     * @returns {string[]} The chain names.
     */
    getLendingChains(): string[];
    /**
     * Returns lending protocol labels for a chain.
     *
     * @param {string} chain - The blockchain name.
     * @returns {string[]} The protocol labels.
     */
    getLendingProtocols(chain: string): string[];
    /**
     * Returns chains that have fiat protocols registered.
     *
     * @returns {string[]} The chain names.
     */
    getFiatChains(): string[];
    /**
     * Returns fiat protocol labels for a chain.
     *
     * @param {string} chain - The blockchain name.
     * @returns {string[]} The protocol labels.
     */
    getFiatProtocols(chain: string): string[];
}
export type WdkIndexerConfig = import("@tetherto/wdk-indexer-http").WdkIndexerConfig;
export type TokenInfo = {
    /**
     * - Token contract address.
     */
    address: string;
    /**
     * - Number of decimal places for the token.
     */
    decimals: number;
};
export type WdkConfig = {
    /**
     * - BIP-39 seed phrase. Falls back to WDK_SEED env variable.
     */
    seed?: string;
};
export type ProtocolRegistry = {
    /**
     * - Chain to labels mapping for swap protocols.
     */
    swap: Map<string, Set<string>>;
    /**
     * - Chain to labels mapping for bridge protocols.
     */
    bridge: Map<string, Set<string>>;
    /**
     * - Chain to labels mapping for lending protocols.
     */
    lending: Map<string, Set<string>>;
    /**
     * - Chain to labels mapping for fiat protocols.
     */
    fiat: Map<string, Set<string>>;
};
export type TokenMap = Map<string, TokenInfo>;
export type TokenRegistry = Map<string, TokenMap>;
export type ToolFunction = (server: WdkMcpServer) => void;
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import WDK from '@tetherto/wdk';
import { WdkIndexerClient } from '@tetherto/wdk-indexer-http';
import { BitfinexPricingClient } from '@tetherto/wdk-pricing-bitfinex-http';
import { SwapProtocol } from '@tetherto/wdk-wallet/protocols';
import { BridgeProtocol } from '@tetherto/wdk-wallet/protocols';
import { LendingProtocol } from '@tetherto/wdk-wallet/protocols';
import { FiatProtocol } from '@tetherto/wdk-wallet/protocols';
