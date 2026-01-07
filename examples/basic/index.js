'use strict'

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import WalletManagerBtc from '@tetherto/wdk-wallet-btc'
import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import VeloraProtocolEvm from '@tetherto/wdk-protocol-swap-velora-evm'
import Usdt0ProtocolEvm from '@tetherto/wdk-protocol-bridge-usdt0-evm'
import AaveProtocolEvm from '@tetherto/wdk-protocol-lending-aave-evm'
import { WdkMcpServer } from '../../src/server.js'
import { walletTools } from '../../src/tools/wallet/index.js'
import { pricingTools } from '../../src/tools/pricing/index.js'
import { indexerTools } from '../../src/tools/indexer/index.js'
import { swapTools } from '../../src/tools/swap/index.js'
import { bridgeTools } from '../../src/tools/bridge/index.js'
import { lendingTools } from '../../src/tools/lending/index.js'

async function main () {
  const server = new WdkMcpServer('wdk-mcp-server', '1.0.0')
    .useWdk({ seed: process.env.WDK_SEED })
    .registerWallet('ethereum', WalletManagerEvm, {
      provider: 'https://rpc.mevblocker.io/fast'
    })
    .registerWallet('arbitrum', WalletManagerEvm, {
      provider: 'https://arb1.arbitrum.io/rpc'
    })
    .registerWallet('bitcoin', WalletManagerBtc, {
      network: 'bitcoin'
    })
    .registerProtocol('ethereum', 'velora', VeloraProtocolEvm)
    .registerProtocol('arbitrum', 'velora', VeloraProtocolEvm)
    .registerProtocol('ethereum', 'usdt0', Usdt0ProtocolEvm)
    .registerProtocol('arbitrum', 'usdt0', Usdt0ProtocolEvm)
    .registerProtocol('ethereum', 'aave', AaveProtocolEvm)
    .usePricing()
    .useIndexer({ apiKey: process.env.WDK_INDEXER_API_KEY })
    .registerTools([
      ...walletTools,
      ...pricingTools,
      ...indexerTools,
      ...swapTools,
      ...bridgeTools,
      ...lendingTools
    ])

  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('WDK MCP Server running on stdio')
  console.error('Registered chains:', server.getChains())
  console.error('Registered swap protocols:', server.getSwapChains())
  console.error('Registered bridge protocols:', server.getBridgeChains())
  console.error('Registered lending protocols:', server.getLendingChains())
  console.error('Registered Ethereum tokens:', server.getRegisteredTokens('ethereum'))
  console.error('Registered Arbitrum tokens:', server.getRegisteredTokens('arbitrum'))
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})