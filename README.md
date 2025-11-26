# WDK MCP Server

A Model Context Protocol (MCP) server for Tether's Wallet Development Kit (WDK), enabling AI assistants to interact with blockchain wallets.

## Quick Start

### Usage with VSCode GitHub Copilot
1. `npm install`
2. Install VSCode GitHub Copilot extension
3. Configure `.vscode/mcp.json`
```json
{
  "servers": {
    "wdk": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/wdk-mcp/examples/basic/index.js"],
      "env": {
        "WDK_SEED": "your twelve word seed phrase goes here for testing only"
      }
    }
  }
}
```
4. Restart VSCode
5. Open Copilot Chat and enable **Agent Mode** (@ icon)
6. Start using wallet commands

## Example Prompts

### Check Balance
```
What's my Ethereum balance?
```

### Transfer Tokens
```
Transfer 10 USDT to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb on Ethereum
```
*Requires user confirmation before broadcasting*

### Sign Message
```
Sign the message "Hello World" on Ethereum
```

### Verify Signature
```
Verify this signature 0xabc123... for message "Hello World" on Ethereum
```

### Send Transaction
```
Send 0.01 ETH to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```
*Requires user confirmation before broadcasting*

## Available Tools

| Tool | Description | Confirmation Required |
|------|-------------|----------------------|
| `{chain}_getBalance` | Check wallet balance | No |
| `{chain}_getAddress` | Get wallet address | No |
| `{chain}_transfer` | Transfer tokens | Yes |
| `{chain}_sign` | Sign message | No |
| `{chain}_verify` | Verify signature | No |
| `{chain}_sendTransaction` | Send native currency | Yes |
| `{chain}_quoteTransfer` | Estimate transfer fee | No |

Replace `{chain}` with: `ethereum`, `polygon`, `arbitrum`, or `bitcoin`

## Security
- All write operations require explicit user confirmation via MCP elicitation
- Private keys never leave the MCP server process
- Seed phrases stored in environment variables only