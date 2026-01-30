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

const HAS_INDEXER = !!process.env.WDK_INDEXER_API_KEY
const HAS_FIAT = process.env.MOONPAY_API_KEY && process.env.MOONPAY_SECRET_KEY

async function main () {
  if (!process.env.WDK_SEED) {
    console.error('Error: WDK_SEED environment variable is required.')
    console.error('Run "npm run setup" to configure the server.')
    process.exit(1)
  }

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

  if (HAS_INDEXER) {
    server.useIndexer({ apiKey: process.env.WDK_INDEXER_API_KEY })
  }

  if (HAS_FIAT) {
    server.registerProtocol('ethereum', 'moonpay', MoonPayProtocol, {
      secretKey: process.env.MOONPAY_SECRET_KEY,
      apiKey: process.env.MOONPAY_API_KEY
    })
  }

  const tools = [
    ...WALLET_TOOLS,
    ...PRICING_TOOLS,
    ...SWAP_TOOLS,
    ...BRIDGE_TOOLS,
    ...LENDING_TOOLS
  ]

  if (HAS_INDEXER) {
    tools.push(...INDEXER_TOOLS)
  }

  if (HAS_FIAT) {
    tools.push(...FIAT_TOOLS)
  }

  server.registerTools(tools)

  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('WDK MCP Server running on stdio')
  console.error('Registered chains:', server.getChains())
  console.error('Registered swap protocols:', server.getSwapChains())
  console.error('Registered bridge protocols:', server.getBridgeChains())
  console.error('Registered lending protocols:', server.getLendingChains())

  if (HAS_INDEXER) {
    console.error('Indexer: enabled')
  } else {
    console.error('Indexer: disabled (set WDK_INDEXER_API_KEY to enable)')
  }

  if (HAS_FIAT) {
    console.error('Registered fiat protocols:', server.getFiatChains())
  } else {
    console.error('Fiat: disabled (set MOONPAY_API_KEY and MOONPAY_SECRET_KEY to enable)')
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
