# Agent Guide

This repository is part of the Tether WDK (Wallet Development Kit) ecosystem. It follows strict coding conventions and tooling standards to ensure consistency, reliability, and cross-platform compatibility (Node.js and Bare runtime).

## Project Overview
- **Architecture:** MCP (Model Context Protocol) server extending `@modelcontextprotocol/sdk` with WDK-specific functionality. Modular tool-based architecture with categories for wallet operations, pricing, indexing, and DeFi protocols (swap, bridge, lending, fiat).
- **Runtime:** Supports Node.js runtime.
- **Domain:** Provides unified blockchain wallet operations through the Model Context Protocol, enabling AI agents to interact with cryptocurrency wallets across multiple blockchains.

## Tech Stack & Tooling
- **Language:** JavaScript (ES2015+).
- **Module System:** ES Modules (`"type": "module"` in package.json).
- **Type Checking:** TypeScript is used purely for generating type declarations (`.d.ts`). The source code remains JavaScript.
  - Command: `npm run build:types`
- **Linting:** `standard` (JavaScript Standard Style).
  - Command: `npm run lint` / `npm run lint:fix`
- **Testing:** `jest` (configured with `experimental-vm-modules` for ESM support).
  - Command: `npm test` / `npm run test:watch` / `npm run test:coverage`
- **Dependencies:** `cross-env` is consistently used for environment variable management in scripts.

## Coding Conventions
- **File Naming:** Kebab-case (e.g., `wdk-mcp-server.js`, `get-balance.js`).
- **Class Naming:** PascalCase (e.g., `WdkMcpServer`).
- **Private Members:** Prefixed with `_` (underscore) and explicitly documented with `@private`.
- **Imports:** Explicit file extensions are mandatory (e.g., `import ... from './file.js'`).
- **Copyright:** All source files must include the standard Tether copyright header:
  ```javascript
  // Copyright 2025 Tether Operations Limited
  //
  // Licensed under the Apache License, Version 2.0 (the "License");
  // you may not use this file except in compliance with the License.
  // You may obtain a copy of the License at
  //
  //     http://www.apache.org/licenses/LICENSE-2.0
  //
  // Unless required by applicable law or agreed to in writing, software
  // distributed under the License is distributed on an "AS IS" BASIS,
  // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  // See the License for the specific language governing permissions and
  // limitations under the License.
  ```

## Documentation (JSDoc)
Source code must be strictly typed using JSDoc comments to support the `build:types` process.
- **Types:** Use `@typedef` to define or import types.
- **Methods:** Use `@param`, `@returns`, `@throws`.
- **Generics:** Use `@template`.
- **Examples:** Include JSDoc `@example` tags for complex functions or tools.

## Development Workflow
1. **Install:** `npm install`
2. **Lint:** `npm run lint`
3. **Test:** `npm test`
4. **Build Types:** `npm run build:types`

## Key Files
- `index.js`: Main entry point exporting `WdkMcpServer`, tool arrays, and utilities.
- `src/server.js`: Core `WdkMcpServer` class implementation.
- `src/tools/`: Tool implementations organized by category (wallet, pricing, indexer, swap, bridge, lending, fiat).
- `src/utils/`: Utility functions (amount parsing, formatting).
- `types/`: Generated type definitions (do not edit manually).
- `examples/`: Example MCP server implementations.

## Repository Specifics
- **Domain:** Model Context Protocol (MCP) server for Wallet Development Kit.
- **Key Libraries:**
  - `@modelcontextprotocol/sdk`: Core MCP server SDK.
  - `@tetherto/wdk`: Wallet Development Kit core.
  - `@tetherto/wdk-wallet`: Wallet protocol definitions.
  - `@tetherto/wdk-indexer-http`: Transaction history indexer client.
  - `@tetherto/wdk-pricing-bitfinex-http`: Cryptocurrency pricing client.
  - `zod`: Schema validation for tool parameters.
- **Features:**
  - MCP server extension with WDK capabilities.
  - Multi-chain wallet operations (address, balance, transactions, signing).
  - Real-time cryptocurrency pricing data.
  - Transaction history via indexer API.
  - DeFi protocol integrations (swaps, bridges, lending, fiat on/off-ramps).
  - Built-in tool registry with read/write separation.
  - Token registry for symbol-to-address mapping.
- **Architecture:**
  - `WdkMcpServer` extends `McpServer` from MCP SDK.
  - Capability pattern using `use*` methods (e.g., `useWdk()`, `usePricing()`, `useIndexer()`).
  - Tool registration via `registerTools()` utility or `registerTool()` from SDK.
  - Protocol registration system for DeFi integrations.
  - Chain-scoped token registry for address resolution.
- **Testing:**
  - Jest-based unit and integration tests.
  - Tests use ESM format with `experimental-vm-modules`.
  - Mock implementations for external dependencies.

## MCP Tool Development Guidelines
- **Tool Structure:** Each tool is a function that receives the `WdkMcpServer` instance and calls `server.registerTool()`.
- **Schema Validation:** Use `zod` for input parameter validation.
- **Annotations:** All tools must include `readOnlyHint` and `destructiveHint` annotations.
- **Error Handling:** Tools should return structured errors with `isError: true` and descriptive messages.
- **Response Format:** Tools return objects with `content` (array of content blocks) and optional `structuredContent`.
- **Read vs Write:** Separate tools into read-only and write categories. Write tools should request user approval via elicitations when supported by MCP client.
- **Tool Arrays:** Organize related tools into exported arrays (e.g., `walletTools`, `pricingTools`).

## Environment Variables
- `WDK_SEED`: BIP-39 seed phrase for wallet operations (required for wallet tools).
- `WDK_INDEXER_API_KEY`: API key for transaction history indexer (required for indexer tools).

## Security Considerations
- Never commit seed phrases or API keys to source control.
- Use environment variables for all sensitive configuration.
- The `WdkMcpServer.close()` method securely disposes of the WDK instance, clearing private keys from memory.
- Follow principle of least privilege when registering tools (only include necessary tools).
