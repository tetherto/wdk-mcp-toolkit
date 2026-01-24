'use strict'

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import WalletManagerBtc from '@tetherto/wdk-wallet-btc'
import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import VeloraProtocolEvm from '@tetherto/wdk-protocol-swap-velora-evm'
import Usdt0ProtocolEvm from '@tetherto/wdk-protocol-bridge-usdt0-evm'
import AaveProtocolEvm from '@tetherto/wdk-protocol-lending-aave-evm'
import MoonPayProtocol from '@tetherto/wdk-protocol-fiat-moonpay'
import { WdkMcpServer } from '../../src/server.js'
import { WALLET_TOOLS } from '../../src/tools/wallet/index.js'
import { PRICING_TOOLS } from '../../src/tools/pricing/index.js'
import { INDEXER_TOOLS } from '../../src/tools/indexer/index.js'
import { SWAP_TOOLS } from '../../src/tools/swap/index.js'
import { BRIDGE_TOOLS } from '../../src/tools/bridge/index.js'
import { LENDING_TOOLS } from '../../src/tools/lending/index.js'
import { FIAT_TOOLS } from '../../src/tools/fiat/index.js'

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
    .registerProtocol('ethereum', 'moonpay', MoonPayProtocol, {
      secretKey: process.env.MOONPAY_SECRET_KEY,
      apiKey: process.env.MOONPAY_API_KEY
    })
    .usePricing()
    .useIndexer({ apiKey: process.env.WDK_INDEXER_API_KEY })
    .registerTools([
      ...WALLET_TOOLS,
      ...PRICING_TOOLS,
      ...INDEXER_TOOLS,
      ...SWAP_TOOLS,
      ...BRIDGE_TOOLS,
      ...LENDING_TOOLS,
      ...FIAT_TOOLS
    ])

  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('WDK MCP Server running on stdio')
  console.error('Registered chains:', server.getChains())
  console.error('Registered swap protocols:', server.getSwapChains())
  console.error('Registered bridge protocols:', server.getBridgeChains())
  console.error('Registered lending protocols:', server.getLendingChains())
  console.error('Registered fiat protocols:', server.getFiatChains())
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
