# @tetherto/wdk-mcp-toolkit

[![npm version](https://img.shields.io/npm/v/%40tetherto%2Fwdk-mcp-toolkit?style=flat-square)](https://www.npmjs.com/package/@tetherto/wdk-mcp-toolkit)
[![npm downloads](https://img.shields.io/npm/dw/%40tetherto%2Fwdk-mcp-toolkit?style=flat-square)](https://www.npmjs.com/package/@tetherto/wdk-mcp-toolkit)
[![license](https://img.shields.io/npm/l/%40tetherto%2Fwdk-mcp-toolkit?style=flat-square)](https://github.com/tetherto/wdk-mcp-toolkit/blob/main/LICENSE)
[![docs](https://img.shields.io/badge/docs-docs.wdk.tether.io-0A66C2?style=flat-square)](https://docs.wdk.tether.io/ai/mcp-toolkit)

**Note**: This package is currently in beta. Please test thoroughly in development environments before using in production.

A simple and secure package to expose WDK (Wallet Development Kit) functionality through the Model Context Protocol (MCP). This package provides a clean API for creating MCP servers that enable AI agents to interact with cryptocurrency wallets across multiple blockchains.

## About WDK

This module is part of the [**WDK (Wallet Development Kit)**](https://docs.wdk.tether.io/) project, which empowers developers to build secure, non-custodial wallets with unified blockchain access, stateless architecture, and complete user control.

For detailed documentation about the complete WDK ecosystem, visit [docs.wdk.tether.io](https://docs.wdk.tether.io).

## Installation

```bash
npm install @tetherto/wdk-mcp-toolkit @modelcontextprotocol/sdk
```

## Quick Start

```javascript
import { WdkMcpServer, WALLET_TOOLS, PRICING_TOOLS } from '@tetherto/wdk-mcp-toolkit'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import WalletManagerEvm from '@tetherto/wdk-wallet-evm'

const server = new WdkMcpServer('my-wallet-server', '1.0.0')
  .useWdk({ seed: process.env.WDK_SEED })
  .registerWallet('ethereum', WalletManagerEvm, {
    provider: 'https://eth.drpc.org',
  })
  .usePricing()
  .registerTools([...WALLET_TOOLS, ...PRICING_TOOLS])

const transport = new StdioServerTransport()
await server.connect(transport)
```

## Key Capabilities

- **MCP Server Extension**: Extends the official `@modelcontextprotocol/sdk` server with WDK-specific capabilities
- **Multi-Chain Wallets**: Register wallet managers for EVM chains, Bitcoin, Solana, TON, TRON, and more
- **Built-In Tools**: Expose wallet, pricing, indexer, swap, bridge, lending, and fiat tools
- **Read/Write Tool Sets**: Register read-only tools for safer agent access or write tools for approved transactions
- **Human Confirmation**: Use MCP elicitations to require approval before sensitive write operations
- **Extensible Design**: Add custom MCP tools alongside WDK tools
- **Secure Memory Disposal**: Dispose wallet instances and clear private keys from memory

## Compatibility

- MCP clients with tools support
- MCP clients with elicitations support for human-approved write operations
- Node.js projects using ES modules
- WDK wallet modules and protocol modules registered by the host application

## Documentation

| Topic | Description | Link |
|-------|-------------|------|
| Overview | MCP Toolkit overview and feature summary | [MCP Toolkit Overview](https://docs.wdk.tether.io/ai/mcp-toolkit) |
| Usage | End-to-end MCP server and agent integration walkthrough | [MCP Toolkit Usage](https://docs.wdk.tether.io/ai/mcp-toolkit/get-started) |
| Configuration | Wallets, tokens, protocols, tools, and security | [MCP Toolkit Configuration](https://docs.wdk.tether.io/ai/mcp-toolkit/configuration) |
| API Reference | Complete server and tool reference | [MCP Toolkit API Reference](https://docs.wdk.tether.io/ai/mcp-toolkit/api-reference) |

## Examples

| Example | Description |
|---------|-------------|
| [Basic Server](https://github.com/tetherto/wdk-examples/blob/main/mcp-toolkit/basic-server.ts) | Create a WDK MCP server with wallet, pricing, indexer, swap, bridge, lending, and fiat tools |
| [LangChain Agent (TypeScript)](https://github.com/tetherto/wdk-examples/blob/main/mcp-toolkit/langchain/typescript/agent.ts) | Connect a TypeScript LangChain agent to the WDK MCP server |
| [LangChain Agent (Python)](https://github.com/tetherto/wdk-examples/blob/main/mcp-toolkit/langchain/python/agent.py) | Connect a Python LangChain agent to the WDK MCP server |

> For detailed walkthroughs, see the [Usage Guide](https://docs.wdk.tether.io/ai/mcp-toolkit/get-started).
> See all runnable examples in the [wdk-examples](https://github.com/tetherto/wdk-examples) repository.

## Community

Join the [WDK Discord](https://discord.gg/arYXDhHB2w) to connect with other developers.

## Support

For support, please [open an issue](https://github.com/tetherto/wdk-mcp-toolkit/issues) on GitHub or reach out via [email](mailto:wallet-info@tether.io).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
