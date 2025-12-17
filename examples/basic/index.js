'use strict'

import { WdkMcpServer } from '../../src/wdk-mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import WalletManagerBtc from '@tetherto/wdk-wallet-btc'
import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import { z } from 'zod'

/**
 * Custom tool: Get all Ethereum token balances
 * @param {WdkMcpServer} server - The WDK MCP server instance
 */
function registerGetAllTokenBalances (server) {
  server.registerTool(
    'ethereum_getAllTokenBalances',
    {
      title: 'Get All Ethereum Token Balances',
      description: `Get balances for all registered Ethereum tokens in one call.

This tool retrieves the balance of every registered ERC-20 token (USDT, USDC, DAI, WETH, WBTC, LINK, UNI, etc.) and returns them in human-readable format. This is a read-only operation.

Args:
  - None

Returns:
  JSON format with all token balances:
  {
    "USDT": "94.42884",
    "USDC": "0",
    "DAI": "0",
    ...
  }

Examples:
  - Use when: "Show me all my token balances"
  - Use when: "What tokens do I have?"
  - Don't use when: You only need one specific token balance`,
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async () => {
      try {
        const tokens = server.getRegisteredTokens('ethereum')
        const account = await server.wdk.getAccount('ethereum', 0)
        
        const balances = {}
        
        for (const symbol of tokens) {
          const tokenInfo = server.getTokenInfo('ethereum', symbol)
          if (!tokenInfo) continue
          
          const { address, decimals } = tokenInfo
          const balance = await account.getTokenBalance(address)
          const humanReadable = Number(balance) / (10 ** decimals)
          
          balances[symbol] = humanReadable.toString()
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(balances, null, 2)
          }]
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `❌ Error getting all token balances: ${error.message}`
          }]
        }
      }
    }
  )
}

async function main () {
  const server = new WdkMcpServer('wdk-mcp-server', '1.0.0')

  server.registerWallet('bitcoin', WalletManagerBtc, {
    network: 'bitcoin'
  })

  server.registerWallet('ethereum', WalletManagerEvm, {
    provider: 'https://rpc.mevblocker.io/fast'
  })

  server.registerToken('ethereum', 'LINK', '0x514910771AF9Ca656af840dff83E8264EcF986CA', 18)
  server.registerToken('ethereum', 'UNI', '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 18)

  registerGetAllTokenBalances(server)

  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('WDK MCP Server running on stdio')
  console.error('Registered wallets:', server.getRegisteredWallets())
  console.error('Registered Ethereum tokens:', server.getRegisteredTokens('ethereum'))
}

main().catch((error) => {
  console.error('Fatal error running server:', error)
  process.exit(1)
})