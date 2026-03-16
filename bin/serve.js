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
'use strict'

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { WdkMcpServer } from '../src/server.js'
import { PRICING_TOOLS } from '../src/tools/pricing/index.js'
import { WALLET_TOOLS } from '../src/tools/wallet/index.js'
import { INDEXER_TOOLS } from '../src/tools/indexer/index.js'
import { SWAP_TOOLS } from '../src/tools/swap/index.js'
import { BRIDGE_TOOLS } from '../src/tools/bridge/index.js'
import { LENDING_TOOLS } from '../src/tools/lending/index.js'
import { FIAT_TOOLS } from '../src/tools/fiat/index.js'

const CHAIN_MODULES = {
  ethereum: { pkg: '@tetherto/wdk-wallet-evm', config: { provider: 'https://rpc.mevblocker.io/fast' } },
  polygon: { pkg: '@tetherto/wdk-wallet-evm', config: { provider: 'https://polygon-rpc.com' } },
  arbitrum: { pkg: '@tetherto/wdk-wallet-evm', config: { provider: 'https://arb1.arbitrum.io/rpc' } },
  optimism: { pkg: '@tetherto/wdk-wallet-evm', config: { provider: 'https://mainnet.optimism.io' } },
  base: { pkg: '@tetherto/wdk-wallet-evm', config: { provider: 'https://mainnet.base.org' } },
  avalanche: { pkg: '@tetherto/wdk-wallet-evm', config: { provider: 'https://api.avax.network/ext/bc/C/rpc' } },
  bnb: { pkg: '@tetherto/wdk-wallet-evm', config: { provider: 'https://bsc-dataseed.binance.org' } },
  plasma: { pkg: '@tetherto/wdk-wallet-evm', config: { provider: 'https://rpc.plasma.io' } },
  spark: { pkg: '@tetherto/wdk-wallet-evm', config: { provider: 'https://rpc.fusespark.io' } },
  bitcoin: { pkg: '@tetherto/wdk-wallet-btc', config: { network: 'bitcoin' } },
  solana: { pkg: '@tetherto/wdk-wallet-sol', config: {} },
  ton: { pkg: '@tetherto/wdk-wallet-ton', config: {} },
  tron: { pkg: '@tetherto/wdk-wallet-tron', config: {} }
}

const BUILTIN_TOOL_MAP = {
  swap: SWAP_TOOLS,
  bridge: BRIDGE_TOOLS,
  lending: LENDING_TOOLS,
  fiat: FIAT_TOOLS
}

const PROTOCOL_MODULES = [
  { pkg: '@tetherto/wdk-protocol-swap-velora-evm', label: 'velora', type: 'swap', chains: ['ethereum', 'arbitrum'] },
  { pkg: '@tetherto/wdk-protocol-bridge-usdt0-evm', label: 'usdt0', type: 'bridge', chains: ['ethereum', 'arbitrum'] },
  { pkg: '@tetherto/wdk-protocol-lending-aave-evm', label: 'aave', type: 'lending', chains: ['ethereum'] },
  {
    pkg: '@tetherto/wdk-protocol-fiat-moonpay',
    label: 'moonpay',
    type: 'fiat',
    chains: ['ethereum'],
    requireEnv: ['MOONPAY_API_KEY', 'MOONPAY_SECRET_KEY'],
    config: () => ({ secretKey: process.env.MOONPAY_SECRET_KEY, apiKey: process.env.MOONPAY_API_KEY })
  }
]

const DEFAULT_CHAINS = ['ethereum', 'arbitrum', 'bitcoin']

async function tryImport (pkg) {
  try {
    const mod = await import(pkg)
    return mod.default || mod
  } catch {
    return null
  }
}

/**
 * Loads and validates a wdk.config.json file.
 *
 * @param {string} configPath - Absolute or relative path to the config file.
 * @returns {Promise<Object|null>} The parsed config or null.
 */
async function loadConfig (configPath) {
  try {
    const resolved = path.resolve(configPath)
    const raw = await fs.readFile(resolved, 'utf-8')
    const config = JSON.parse(raw)
    console.error(`Config: loaded ${resolved}`)
    return config
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`Warning: config file not found at ${configPath}`)
    } else {
      console.error(`Warning: failed to load config: ${err.message}`)
    }
    return null
  }
}

function getChainDef (chain, chainModules) {
  const mod = chainModules[chain]
  if (!mod) return null

  const envKey = `WDK_RPC_${chain.toUpperCase()}`
  const rpcOverride = process.env[envKey]

  if (rpcOverride && mod.config.provider !== undefined) {
    return { ...mod, config: { ...mod.config, provider: rpcOverride } }
  }

  return mod
}

export async function serve () {
  const elicitation = process.env.WDK_MCP_ELICITATION !== 'false'
  const userConfig = process.env.WDK_CONFIG
    ? await loadConfig(process.env.WDK_CONFIG)
    : null

  const chainModules = { ...CHAIN_MODULES }
  const protocolModules = [...PROTOCOL_MODULES]

  if (userConfig) {
    if (userConfig.chains) {
      for (const [chain, def] of Object.entries(userConfig.chains)) {
        const name = chain.toLowerCase()
        if (chainModules[name]) {
          chainModules[name] = {
            pkg: def.module || chainModules[name].pkg,
            config: { ...chainModules[name].config, ...def.config }
          }
        } else {
          if (!def.module) {
            console.error(`Warning: custom chain "${name}" requires a "module" field, skipping`)
            continue
          }
          chainModules[name] = { pkg: def.module, config: def.config || {} }
        }
      }
    }

    if (userConfig.protocols) {
      for (const proto of userConfig.protocols) {
        if (!proto.module || !proto.label || !proto.chains) {
          console.error('Warning: custom protocol requires "module", "label", and "chains" fields, skipping')
          continue
        }
        protocolModules.push({
          pkg: proto.module,
          label: proto.label,
          type: proto.type || null,
          chains: proto.chains,
          config: proto.config ? () => proto.config : undefined
        })
      }
    }
  }

  const server = new WdkMcpServer('wdk-mcp-server', '1.0.0', {
    capabilities: { elicitation }
  })

  const tools = [...PRICING_TOOLS]
  server.usePricing()
  console.error('Pricing: enabled')

  if (process.env.WDK_SEED) {
    server.useWdk({ seed: process.env.WDK_SEED })

    const requestedChains = (userConfig && userConfig.enabledChains)
      ? userConfig.enabledChains.map(c => c.toLowerCase())
      : process.env.WDK_CHAINS
        ? process.env.WDK_CHAINS.split(',').map(c => c.trim().toLowerCase())
        : DEFAULT_CHAINS

    const importCache = new Map()
    const registeredChains = []

    for (const chain of requestedChains) {
      const chainDef = getChainDef(chain, chainModules)
      if (!chainDef) {
        console.error(`Warning: unknown chain "${chain}", skipping`)
        continue
      }

      if (!importCache.has(chainDef.pkg)) {
        importCache.set(chainDef.pkg, await tryImport(chainDef.pkg))
      }

      const WalletManager = importCache.get(chainDef.pkg)
      if (!WalletManager) {
        console.error(`Warning: ${chainDef.pkg} not installed, skipping ${chain}`)
        continue
      }

      server.registerWallet(chain, WalletManager, chainDef.config)
      registeredChains.push(chain)
    }

    if (registeredChains.length > 0) {
      console.error('Wallets:', registeredChains.join(', '))
      tools.push(...WALLET_TOOLS)
    }

    const registeredToolTypes = new Set()

    for (const proto of protocolModules) {
      if (proto.requireEnv && !proto.requireEnv.every(k => process.env[k])) {
        continue
      }

      const applicableChains = proto.chains.filter(c => registeredChains.includes(c))
      if (applicableChains.length === 0) continue

      const Protocol = await tryImport(proto.pkg)
      if (!Protocol) continue

      const protoConfig = proto.config ? proto.config() : undefined
      for (const chain of applicableChains) {
        server.registerProtocol(chain, proto.label, Protocol, protoConfig)
      }

      if (proto.type && BUILTIN_TOOL_MAP[proto.type] && !registeredToolTypes.has(proto.type)) {
        tools.push(...BUILTIN_TOOL_MAP[proto.type])
        registeredToolTypes.add(proto.type)
      }

      console.error(`${proto.label}: ${applicableChains.join(', ')}`)
    }

    if (process.env.WDK_INDEXER_API_KEY) {
      server.useIndexer({ apiKey: process.env.WDK_INDEXER_API_KEY })
      tools.push(...INDEXER_TOOLS)
      console.error('Indexer: enabled')
    }
  } else {
    console.error('WDK_SEED not set — running with pricing tools only')
    console.error('Set WDK_SEED to enable wallet, swap, bridge, and lending tools')
  }

  server.registerTools(tools)

  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error(`WDK MCP Server running on stdio (${tools.length} tools)`)
  console.error('Elicitation:', elicitation ? 'enabled' : 'disabled')
}

const isDirectRun = process.argv[1] &&
  (process.argv[1].endsWith('serve.js') || process.argv[1].endsWith('bin/serve.js'))

if (isDirectRun) {
  serve().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
