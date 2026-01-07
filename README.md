# @tetherto/wdk-mcp-toolkit

> **Note:** This package is currently in beta. Please test thoroughly in development environments before using in production.

A simple and secure package to expose WDK (Wallet Development Kit) functionality through the Model Context Protocol (MCP). This package provides a clean API for creating MCP servers that enable AI agents to interact with cryptocurrency wallets across multiple blockchains.

## 🔍 About WDK

This module is part of the WDK (Wallet Development Kit) project, which empowers developers to build secure, non-custodial wallets with unified blockchain access, stateless architecture, and complete user control.

For detailed documentation about the complete WDK ecosystem, visit [docs.wallet.tether.io](https://docs.wallet.tether.io).

## 🌟 Features

- **MCP Server Extension**: Extends `McpServer` from [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) with all familiar APIs plus WDK-specific functionality
- **Multi-Chain Support**: Register wallets for any blockchain supported by WDK wallet modules (EVM chains, Bitcoin, Solana, TON, TRON, and more)
- **Built-in Tools**: Pre-built MCP tools for wallet operations, pricing data, and transaction history
- **Extensible & Modular**: Register only the tools you need, create custom tools, and organize functionality into reusable modules
- **Secure by Design**: Automatic memory cleanup and secure key disposal

## ⚙️ Requirements

### MCP Client Compatibility

This toolkit requires an MCP client that supports **tools**. For wallet write operations (sending transactions, signing messages), a client that also supports **elicitations** is required to enable human approval flows before executing sensitive operations.

| Feature | Required For |
|---------|--------------|
| Tools support | All operations (read and write) |
| Elicitations support | Write operations (`sendTransaction`, `transfer`, `sign`) |

See the [full list of MCP clients and their capabilities](https://modelcontextprotocol.io/clients).

## ⬇️ Installation

To install the `@tetherto/wdk-mcp-toolkit` package, follow these instructions:

You can install it using npm:

```bash
npm install @tetherto/wdk-mcp-toolkit @modelcontextprotocol/sdk
```

You'll also need to install the wallet modules for your target blockchains:

```bash
npm install @tetherto/wdk-wallet-evm @tetherto/wdk-wallet-btc
```

Add `"type": "module"` to your `package.json` for ES module support:

```json
{
  "type": "module"
}
```

## 🚀 Quick Start

### Creating a Basic MCP Server

```javascript
import { WdkMcpServer } from '@tetherto/wdk-mcp-toolkit'
import { walletTools } from '@tetherto/wdk-mcp-toolkit/tools/wallet'
import { pricingTools } from '@tetherto/wdk-mcp-toolkit/tools/pricing'
import { indexerTools } from '@tetherto/wdk-mcp-toolkit/tools/indexer'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import WalletManagerBtc from '@tetherto/wdk-wallet-btc'

const server = new WdkMcpServer('my-wallet-server', '1.0.0')
  .useWdk({ seed: process.env.WDK_SEED })
  .registerWallet('ethereum', WalletManagerEvm, {
    provider: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key'
  })
  .registerWallet('bitcoin', WalletManagerBtc, {
    network: 'bitcoin'
  })
  .usePricing()
  .useIndexer({ apiKey: process.env.WDK_INDEXER_API_KEY })
  .registerTools([...walletTools, ...pricingTools, ...indexerTools])

const transport = new StdioServerTransport()
await server.connect(transport)

console.error('WDK MCP Server running on stdio')
```

> **📁 Example:** See [`examples/basic/index.js`](examples/basic/index.js) for a complete working example.

### Custom Token Registration

Token registration maps human-readable symbols (like "USDT") to contract addresses. This is necessary because:

1. **AI agents work with symbols** — Users say "send 100 USDT" not "send 100 tokens with contract address 0xXYZ"
2. **Decimal handling** — Each token has different decimals (USDT uses 6, DAI uses 18). The registry stores this so tools can convert between human amounts and raw values.
3. **Chain-specific addresses** — USDT has different contract addresses on each chain. The registry resolves the correct address per chain.

```javascript
// Register additional tokens beyond the defaults
server
  .registerToken('ethereum', 'USDC', {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6
  })
  .registerToken('ethereum', 'DAI', {
    address: '0x6B175474E89094C44Da98b954EesE8Ff8cB6dB',
    decimals: 18
  })

// Tools use the registry to resolve symbols
const usdc = server.getTokenInfo('ethereum', 'USDC')
console.log('USDC address:', usdc.address)
```

### Using Read-Only vs Write Tools

```javascript
import { walletReadTools, walletWriteTools } from '@tetherto/wdk-mcp-toolkit/tools/wallet'

// For read-only access (balance checks, address lookups, fee estimates)
const readOnlyServer = new WdkMcpServer('read-only-server', '1.0.0')
  .useWdk({ seed: process.env.WDK_SEED })
  .registerWallet('ethereum', WalletManagerEvm, { provider: '...' })
  .registerTools(walletReadTools)

// For full access (includes sendTransaction, transfer, sign)
const fullAccessServer = new WdkMcpServer('full-access-server', '1.0.0')
  .useWdk({ seed: process.env.WDK_SEED })
  .registerWallet('ethereum', WalletManagerEvm, { provider: '...' })
  .registerTools(walletWriteTools)
```

> **💡 Best Practice:** Register only the tools you need. Large tool sets increase context size, which can lead to slower responses, higher costs, and potential hallucinations where the AI invokes incorrect tools. If you only need to check balances, import and register just that tool:
> ```javascript
> import { getBalance } from '@tetherto/wdk-mcp-toolkit'
> server.registerTools([getBalance])
> ```

## 🔌 Enabling Capabilities

`WdkMcpServer` uses a capability pattern. The `use*` methods enable capabilities by initializing underlying clients that tools can access:

| Method | Enables | Tools Can Access |
|--------|---------|------------------|
| `useWdk(config)` | Wallet operations | `server.wdk` |
| `usePricing()` | Price data | `server.pricingClient` |
| `useIndexer(config)` | Transaction history | `server.indexer.apiKey` |

**How it works:**

```javascript
// 1. Enable capabilities
const server = new WdkMcpServer('my-server', '1.0.0')
  .useWdk({ seed: process.env.WDK_SEED })      // server.wdk is now available
  .usePricing()                                 // server.pricingClient is now available
  .useIndexer({ apiKey: process.env.API_KEY }) // server.indexer.apiKey is now available

// 2. Register tools that use those capabilities
server.registerTools(walletTools)   // These tools call server.wdk.*
server.registerTools(pricingTools)  // These tools call server.pricingClient.*
server.registerTools(indexerTools)  // These tools use server.indexer.apiKey
```

**Writing custom tools:**

You can register tools directly using `registerTool()` from the MCP SDK, or use our `registerTools()` utility for bulk registration.

**Single tool with `registerTool()` (MCP SDK method):**

```javascript
import { z } from 'zod'

const chains = server.getChains()

server.registerTool(
  'getAllTokenBalances',
  {
    title: 'Get All Token Balances',
    description: 'Get balances for all registered tokens on a chain.',
    inputSchema: z.object({
      chain: z.enum(chains).describe('The blockchain to query')
    }),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false
    }
  },
  async ({ chain }) => {
    try {
      const account = await server.wdk.getAccount(chain, 0)
      const symbols = server.getRegisteredTokens(chain)
      const balances = {}

      for (const symbol of symbols) {
        const token = server.getTokenInfo(chain, symbol)
        const rawBalance = await account.getTokenBalance(token.address)
        const balance = Number(rawBalance) / Math.pow(10, token.decimals)
        balances[symbol] = balance.toString()
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(balances, null, 2)
        }],
        structuredContent: balances
      }
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error getting token balances: ${error.message}`
        }]
      }
    }
  }
)
```

**Multiple tools with `registerTools()` (WdkMcpServer utility):**

The `registerTools()` method is a utility we added on top of the MCP SDK. It accepts an array of tool registration functions, making it easy to organize tools into modules and register them in bulk:

```javascript
// Tool defined as a registration function
function getAllTokenBalances (server) {
  const chains = server.getChains()
  
  server.registerTool(
    'getAllTokenBalances',
    { /* schema */ },
    async ({ chain }) => { /* handler */ }
  )
}

function getPortfolioValue (server) {
  server.registerTool(
    'getPortfolioValue',
    { /* schema */ },
    async (params) => { /* handler */ }
  )
}

// Register multiple tools at once
server.registerTools([getAllTokenBalances, getPortfolioValue])
```

This pattern allows you to:
- Organize tools into separate files/modules
- Conditionally include tools based on enabled capabilities
- Mix custom tools with built-in tool arrays
- Keep tool counts minimal to reduce context bloat

**Capability dependencies:**

If a tool requires a capability that wasn't enabled, it will fail at runtime. The built-in tools check for this:

- `walletTools` require `useWdk()` and `registerWallet()`
- `pricingTools` require `usePricing()`
- `indexerTools` require `useIndexer()`

## 📚 API Reference

### Table of Contents

| Class | Description |
|-------|-------------|
| [WdkMcpServer](#wdkmcpserver) | Main class for creating MCP servers with WDK functionality. Extends `McpServer` from `@modelcontextprotocol/sdk`. |
| [CHAINS](#chains) | Convenience constants for chains with pre-configured token addresses. |
| [DEFAULT_TOKENS](#default_tokens) | Pre-configured token addresses for all supported chains. |

### WdkMcpServer

The main class for creating MCP servers with WDK wallet functionality. Extends `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`, providing all standard MCP server methods plus WDK-specific functionality.

#### Constructor

```javascript
new WdkMcpServer(name, version)
```

**Parameters:**

- `name` (string): The server name
- `version` (string): The server version

**Example:**

```javascript
const server = new WdkMcpServer('my-wallet-server', '1.0.0')
```

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `useWdk(config)` | Initializes the WDK with a seed phrase | `WdkMcpServer` |
| `registerWallet(blockchain, WalletManager, config)` | Registers a wallet for a blockchain | `WdkMcpServer` |
| `useIndexer(config)` | Enables the WDK Indexer for transaction history | `WdkMcpServer` |
| `usePricing()` | Enables the Bitfinex pricing client | `WdkMcpServer` |
| `registerToken(chain, symbol, token)` | Registers a token address mapping | `WdkMcpServer` |
| `getTokenInfo(chain, symbol)` | Returns token info for a symbol | `TokenInfo \| undefined` |
| `getRegisteredTokens(chain)` | Returns all registered token symbols | `string[]` |
| `getChains()` | Returns all registered blockchain names | `string[]` |
| `registerTools(tools)` | Bulk registers tools from an array of functions | `WdkMcpServer` |
| `close()` | Closes the server and disposes WDK securely | `Promise<void>` |

#### useWdk(config)

Enables wallet capabilities by initializing the Wallet Development Kit. After calling this, `server.wdk` becomes available for tools to use.

**Parameters:**

- `config` (object): Configuration object
  - `seed` (string, optional): BIP-39 seed phrase. Falls back to `WDK_SEED` environment variable.

**Returns:** `WdkMcpServer` - The server instance for chaining

**Throws:** `Error` - If no seed is provided

**Example:**

```javascript
server.useWdk({ seed: 'your twelve word seed phrase here' })
// OR use environment variable
server.useWdk({}) // Uses process.env.WDK_SEED

// Now tools can access server.wdk
const account = await server.wdk.getAccount('ethereum', 0)
```

#### registerWallet(blockchain, WalletManager, config)

Registers a wallet module for a specific blockchain. Automatically registers default tokens (USDT) for the chain if available.

**Parameters:**

- `blockchain` (string): The blockchain name (e.g., "ethereum", "bitcoin")
- `WalletManager` (class): The wallet manager class from a WDK wallet package
- `config` (object): Configuration object specific to the wallet manager

**Returns:** `WdkMcpServer` - The server instance for chaining

**Throws:** `Error` - If `useWdk()` has not been called

**Example:**

```javascript
server.registerWallet('ethereum', WalletManagerEvm, {
  provider: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key'
})

server.registerWallet('bitcoin', WalletManagerBtc, {
  network: 'bitcoin',
  host: 'electrum.blockstream.info',
  port: 50001
})
```

#### useIndexer(config)

Enables transaction history capabilities by storing the Indexer API key. After calling this, `server.indexer.apiKey` becomes available for tools to use when querying the WDK Indexer API.

**Parameters:**

- `config` (object): Configuration object
  - `apiKey` (string): WDK Indexer API key

**Returns:** `WdkMcpServer` - The server instance for chaining

**Throws:** `Error` - If no apiKey is provided

**Example:**

```javascript
server.useIndexer({ apiKey: process.env.WDK_INDEXER_API_KEY })

// Now tools can access server.indexer.apiKey
const response = await fetch(url, {
  headers: { 'x-api-key': server.indexer.apiKey }
})
```

#### usePricing()

Enables pricing capabilities by initializing the Bitfinex pricing client. After calling this, `server.pricingClient` becomes available for tools to use.

**Returns:** `WdkMcpServer` - The server instance for chaining

**Example:**

```javascript
server.usePricing()

// Now tools can access server.pricingClient
const price = await server.pricingClient.getCurrentPrice('BTC', 'USD')
```

#### registerToken(chain, symbol, token)

Registers a token symbol to contract address mapping for a blockchain.

**Parameters:**

- `chain` (string): The blockchain name
- `symbol` (string): The token symbol (e.g., "USDT", "USDC")
- `token` (object): Token information
  - `address` (string): Token contract address
  - `decimals` (number): Number of decimal places

**Returns:** `WdkMcpServer` - The server instance for chaining

**Example:**

```javascript
server.registerToken('ethereum', 'USDC', {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  decimals: 6
})
```

#### getTokenInfo(chain, symbol)

Returns token information for a symbol on a blockchain.

**Parameters:**

- `chain` (string): The blockchain name
- `symbol` (string): The token symbol (case-insensitive)

**Returns:** `TokenInfo | undefined` - The token info or undefined if not found

**Example:**

```javascript
const usdt = server.getTokenInfo('ethereum', 'USDT')
// { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }
```

#### getRegisteredTokens(chain)

Returns all registered token symbols for a blockchain.

**Parameters:**

- `chain` (string): The blockchain name

**Returns:** `string[]` - Array of token symbols

**Example:**

```javascript
const tokens = server.getRegisteredTokens('ethereum')
// ['USDT', 'USDC', 'DAI']
```

#### getChains()

Returns all registered blockchain names.

**Returns:** `string[]` - Array of blockchain names

**Example:**

```javascript
const chains = server.getChains()
// ['ethereum', 'polygon', 'bitcoin']
```

#### registerTools(tools)

Utility method for bulk tool registration. This is a convenience wrapper we added on top of the MCP SDK's `registerTool()` method. Each function in the array receives the server instance and should call `server.registerTool()` internally.

**Parameters:**

- `tools` (array): Array of tool registration functions with signature `(server: WdkMcpServer) => void`

**Returns:** `WdkMcpServer` - The server instance for chaining

**Example:**

```javascript
import { walletTools } from '@tetherto/wdk-mcp-toolkit/tools/wallet'
import { pricingTools } from '@tetherto/wdk-mcp-toolkit/tools/pricing'

// Register built-in tool arrays
server.registerTools([...walletTools, ...pricingTools])

// Or mix with custom tools
server.registerTools([
  ...walletTools,
  myCustomTool,
  anotherCustomTool
])
```

**Note:** For registering a single tool, you can use `registerTool()` directly (inherited from McpServer).

#### close()

Closes the server and securely disposes the WDK instance, clearing sensitive data from memory.

**Returns:** `Promise<void>`

**Example:**

```javascript
await server.close()
```

### CHAINS

Convenience constants for blockchain names that have pre-configured USDT token addresses. Using these constants triggers automatic token registration via `DEFAULT_TOKENS`.

**Note:** You can register any blockchain name you want. `CHAINS` is purely for convenience. If you use a name not in `CHAINS`, simply register your tokens manually:

```javascript
// Using a custom chain name works fine
server.registerWallet('zksync', WalletManagerEvm, {
  provider: 'https://mainnet.era.zksync.io'
})

// Just register tokens yourself since there's no default
server.registerToken('zksync', 'USDT', {
  address: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C',
  decimals: 6
})
```

### DEFAULT_TOKENS

Pre-configured USDT token addresses for common chains. These are automatically registered when you call `registerWallet()` with a matching chain name.

| Chain | USDT Address | Decimals |
|-------|--------------|----------|
| Ethereum | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | 6 |
| Polygon | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` | 6 |
| Arbitrum | `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9` | 6 |
| Optimism | `0x94b008aA00579c1307B0EF2c499aD98a8ce58e58` | 6 |
| Base | `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` | 6 |
| Avalanche | `0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7` | 6 |
| BNB | `0x55d398326f99059fF775485246999027B3197955` | 18 |
| Plasma | `0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb` | 6 |
| TRON | `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` | 6 |
| TON | `EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs` | 6 |
| Solana | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` | 6 |

## 🔧 Built-in Tools

### Wallet Tools

| Tool | Category | Description |
|------|----------|-------------|
| `getAddress` | Read | Get wallet address for a blockchain |
| `getBalance` | Read | Get native token balance |
| `getTokenBalance` | Read | Get ERC20/token balance |
| `getFeeRates` | Read | Get current network fee rates |
| `getMaxSpendableBtc` | Read | Get maximum spendable Bitcoin amount |
| `quoteSendTransaction` | Read | Estimate fee for a transaction |
| `quoteTransfer` | Read | Estimate fee for a token transfer |
| `sendTransaction` | Write | Send native tokens |
| `transfer` | Write | Transfer ERC20/tokens |
| `sign` | Write | Sign a message |
| `verify` | Write | Verify a message signature |

### Pricing Tools

| Tool | Description |
|------|-------------|
| `getCurrentPrice` | Get current price for a trading pair |
| `getHistoricalPrice` | Get historical price data |

### Indexer Tools

| Tool | Description |
|------|-------------|
| `getTokenTransfers` | Get token transfer history for an address |
| `getIndexerTokenBalance` | Get token balance via indexer API |

## 🖥️ Using with VS Code GitHub Copilot Chat

You can use this MCP server with [VS Code GitHub Copilot Chat](https://code.visualstudio.com/docs/copilot/chat/mcp-servers).

### Step 1: Clone the repository

```bash
git clone https://github.com/AlibudaLab/wdk-mcp-toolkit.git
cd wdk-mcp-toolkit
npm install
```

### Step 2: Configure VS Code

Create `.vscode/mcp.json` in the project root:

```json
{
  "servers": {
    "wdk": {
      "type": "stdio",
      "command": "node",
      "args": ["examples/basic/index.js"],
      "env": {
        "WDK_SEED": "your wallet's seed phrase",
        "WDK_INDEXER_API_KEY": "your indexer api key, you can obtain one here: https://docs.wallet.tether.io/tools/indexer-api/get-started"
      }
    }
  }
}
```

Open the file in VS Code and click the **Start** button that appears above the server configuration.

### Step 3: Use in Copilot Chat

1. Open GitHub Copilot Chat in VS Code
2. Select **Agent** mode from the dropdown
3. Click the **Tools** button to verify your MCP server tools are available
4. Start chatting:

```
You: What's my ethereum address?
Copilot: Your Ethereum address is 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7

You: Check my ETH balance
Copilot: Your ETH balance is 1.5 ETH

You: What's the current price of BTC?
Copilot: The current price of BTC is $98,450.00 USD

You: How much USDT do I have on ethereum?
Copilot: Your USDT balance on Ethereum is 1,000.00 USDT

You: Send 1 USDT to vitalik.eth
Copilot: I'll transfer 1 USDT to vitalik.eth (0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045).
         [Requests approval via elicitation]
         Transaction sent! Hash: 0xabc123...
```

## 🔒 Security Considerations

- **Seed Phrase Security**: Always store your seed phrase securely and never share it. Use environment variables (`WDK_SEED`) instead of hardcoding.
- **API Key Security**: Store API keys in environment variables, never in source code.
- **Memory Cleanup**: The `close()` method automatically calls `dispose()` on the WDK instance to clear private keys from memory.
- **Read vs Write Tools**: Use `walletReadTools` for read-only access when write operations are not needed.
- **Elicitations for Write Operations**: For maximum safety, use an MCP client that supports elicitations (like VS Code GitHub Copilot or Cursor) for write operations to ensure human approval before transactions execute.
- **MCP Transport Security**: Use secure transports (stdio, SSE with TLS) in production environments.
- **Tool Annotations**: All tools include proper `readOnlyHint` and `destructiveHint` annotations for MCP clients.

## 🛠️ Development

### Building

```bash
# Install dependencies
npm install

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Project Structure

```
src/
├── server.js              # WdkMcpServer class, CHAINS, DEFAULT_TOKENS
└── tools/
    ├── wallet/            # Wallet operation tools
    │   ├── index.js       # Tool exports
    │   ├── getAddress.js
    │   ├── getBalance.js
    │   ├── getTokenBalance.js
    │   ├── getFeeRates.js
    │   ├── getMaxSpendableBtc.js
    │   ├── quoteSendTransaction.js
    │   ├── quoteTransfer.js
    │   ├── sendTransaction.js
    │   ├── transfer.js
    │   ├── sign.js
    │   └── verify.js
    ├── pricing/           # Price data tools
    │   ├── index.js
    │   ├── getCurrentPrice.js
    │   └── getHistoricalPrice.js
    └── indexer/           # Transaction history tools
        ├── index.js
        ├── constants.js
        ├── getTokenTransfers.js
        └── getTokenBalance.js
```

## 📜 License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🆘 Support

For support, please open an issue on the GitHub repository.

## 📖 Learn More

- **WDK Documentation**: [docs.wallet.tether.io](https://docs.wallet.tether.io)
- **MCP SDK**: [github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- **MCP Specification**: [spec.modelcontextprotocol.io](https://spec.modelcontextprotocol.io)
- **MCP Clients**: [modelcontextprotocol.io/clients](https://modelcontextprotocol.io/clients)
- **VS Code Copilot MCP**: [Using MCP servers in VS Code](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)