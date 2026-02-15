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

import { password, input, confirm, checkbox } from '@inquirer/prompts'
import pc from 'picocolors'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { exec as execCallback } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execCallback)

/**
 * MCP protocol features that can be enabled/disabled based on client support.
 * Each feature maps to a capability that the MCP client must support.
 *
 * @see https://modelcontextprotocol.io/clients
 */
const MCP_FEATURES = [
  {
    name: 'Elicitations',
    envKey: 'WDK_MCP_ELICITATION',
    description: 'Allows the server to request additional input from the user during tool execution.',
    capabilities: [
      'Human-in-the-loop confirmation for transactions (send, swap, bridge, etc.)',
      'Interactive approval before any irreversible blockchain operation'
    ],
    default: true,
    disabledNote: 'Write operations (transfers, swaps, etc.) will execute without confirmation prompts.'
  }
]

const DEPENDENCIES = [
  {
    name: '@tetherto/wdk-wallet-btc',
    description: 'Bitcoin wallet support',
    capabilities: ['Interact with Bitcoin blockchain']
  },
  {
    name: '@tetherto/wdk-wallet-evm',
    description: 'Ethereum & EVM-compatible chains support',
    capabilities: ['Interact with EVM blockchains']
  },
  {
    name: '@tetherto/wdk-protocol-swap-velora-evm',
    description: 'Token swap protocol (Velora)',
    capabilities: ['Swap tokens on EVM chains']
  },
  {
    name: '@tetherto/wdk-protocol-bridge-usdt0-evm',
    description: 'Cross-chain bridge protocol (USDT0)',
    capabilities: ['Bridge USDT across chains']
  },
  {
    name: '@tetherto/wdk-protocol-lending-aave-evm',
    description: 'DeFi lending protocol (Aave)',
    capabilities: ['Supply assets to earn yield', 'Borrow against collateral']
  },
  {
    name: '@tetherto/wdk-protocol-fiat-moonpay',
    description: 'Fiat on/off-ramp (MoonPay)',
    capabilities: ['Buy crypto with fiat (USD, EUR, etc.)', 'Sell crypto for fiat']
  }
]

async function checkVsCodeInstalled () {
  try {
    await exec('code --version')
    return true
  } catch {
    return false
  }
}

async function runSetupWizard () {
  printBanner()

  const vsCodeInstalled = await checkVsCodeInstalled()
  if (!vsCodeInstalled) {
    console.log(pc.red(pc.bold('Error: Visual Studio Code is not installed or not in PATH')))
    console.log()
    console.log('This setup wizard requires VS Code to be installed.')
    console.log()
    console.log('Please install VS Code from: ' + pc.underline('https://code.visualstudio.com/'))
    console.log()
    console.log(pc.dim('After installing, make sure the "code" command is available in your terminal.'))
    console.log(pc.dim('On macOS, open VS Code and run: Shell Command: Install \'code\' command in PATH'))
    console.log()
    process.exit(1)
  }

  await checkGitignore()

  const config = {}

  config.seed = await collectSeedPhrase()

  config.indexerApiKey = await collectIndexerApiKey()

  const moonpay = await collectMoonPayCredentials()
  config.moonPayApiKey = moonpay.apiKey
  config.moonPaySecretKey = moonpay.secretKey

  config.mcpFeatures = await collectMcpCapabilities()

  await selectAndInstallDependencies()

  await generateConfig(config)

  await openVsCode()

  printSuccessMessage(config)
}

function printBanner () {
  console.log()
  console.log(pc.cyan(pc.bold('╔══════════════════════════════════════════════════════════╗')))
  console.log(pc.cyan(pc.bold('║           WDK MCP Toolkit Setup Wizard                   ║')))
  console.log(pc.cyan(pc.bold('╚══════════════════════════════════════════════════════════╝')))
  console.log()
  console.log('This wizard configures the WDK MCP server for VS Code GitHub Copilot.')
  console.log()
}

async function checkGitignore () {
  const gitignorePath = path.join(process.cwd(), '.gitignore')
  try {
    const content = await fs.readFile(gitignorePath, 'utf-8')
    if (!content.includes('.vscode')) {
      console.log(pc.yellow('Note: .vscode is not in .gitignore'))
      console.log(pc.yellow('The generated config will contain sensitive data.\n'))

      const proceed = await confirm({
        message: 'Add .vscode to .gitignore?',
        default: true
      })

      if (proceed) {
        await fs.appendFile(gitignorePath, '\n.vscode\n')
        console.log(pc.green('Added .vscode to .gitignore\n'))
      }
    }
  } catch {
    await fs.writeFile(gitignorePath, '.vscode\n')
    console.log(pc.green('Created .gitignore with .vscode entry\n'))
  }
}

async function collectSeedPhrase () {
  console.log(pc.yellow(pc.bold('SEED PHRASE (Required)')))
  console.log(pc.dim('──────────────────────────────────────────────────────────'))
  console.log()
  console.log(pc.yellow('SECURITY NOTICE:'))
  console.log(pc.yellow('   - Your seed phrase controls your wallet funds'))
  console.log(pc.yellow('   - It will be stored locally in .vscode/mcp.json (gitignored)'))
  console.log(pc.yellow('   - We recommend using a dedicated development wallet'))
  console.log(pc.yellow('   - Never use your main wallet seed phrase'))
  console.log()

  const seed = await password({
    message: 'Enter your BIP-39 seed phrase (12 or 24 words):',
    mask: '*',
    validate: (value) => {
      if (!value || value.trim() === '') {
        return 'Seed phrase is required for wallet operations'
      }
      const words = value.trim().split(/\s+/)
      if (words.length !== 12 && words.length !== 24) {
        return 'Seed phrase must be 12 or 24 words'
      }
      return true
    }
  })

  console.log()
  return seed.trim()
}

async function collectIndexerApiKey () {
  console.log(pc.blue(pc.bold('WDK INDEXER API KEY (Optional)')))
  console.log(pc.dim('──────────────────────────────────────────────────────────'))
  console.log()
  console.log('Enables transaction history and token transfer queries.')
  console.log()
  console.log(pc.cyan('Get your free API key at: ') + pc.underline('https://wdk-api.tether.io/register'))
  console.log()
  console.log(pc.dim('Press Enter to skip if you don\'t need transaction history.'))
  console.log()

  const apiKey = await password({
    message: 'WDK Indexer API key:',
    mask: '*'
  })

  if (!apiKey || apiKey.trim() === '') {
    console.log(pc.yellow('Skipping indexer - transaction history tools will be disabled'))
    console.log()
    return null
  }

  console.log()
  return apiKey.trim()
}

async function collectMoonPayCredentials () {
  console.log(pc.magenta(pc.bold('MOONPAY CREDENTIALS (Optional)')))
  console.log(pc.dim('──────────────────────────────────────────────────────────'))
  console.log()
  console.log('Enables fiat on/off-ramp - buy and sell crypto with USD, EUR, etc.')
  console.log()
  console.log(pc.cyan('Get your API keys from: ') + pc.underline('https://dashboard.moonpay.com/'))
  console.log()
  console.log(pc.dim('Press Enter to skip if you don\'t need fiat capabilities.'))
  console.log()

  const apiKey = await input({
    message: 'MoonPay API key:'
  })

  if (!apiKey || apiKey.trim() === '') {
    console.log(pc.yellow('Skipping MoonPay - fiat tools will be disabled'))
    console.log()
    return { apiKey: null, secretKey: null }
  }

  const secretKey = await password({
    message: 'MoonPay Secret key:',
    mask: '*',
    validate: (value) => {
      if (!value || value.trim() === '') {
        return 'Secret key is required when API key is provided'
      }
      return true
    }
  })

  console.log()
  return {
    apiKey: apiKey.trim(),
    secretKey: secretKey.trim()
  }
}

async function collectMcpCapabilities () {
  console.log(pc.white(pc.bold('MCP CLIENT CAPABILITIES')))
  console.log(pc.dim('──────────────────────────────────────────────────────────'))
  console.log()
  console.log('The MCP protocol supports optional features that enhance the')
  console.log('server experience. Not all MCP clients support every feature.')
  console.log()
  console.log(pc.cyan('Check client compatibility: ') + pc.underline('https://modelcontextprotocol.io/clients'))
  console.log()
  console.log(pc.yellow('Ensure your MCP client supports the features you enable.'))
  console.log(pc.yellow('Disabling unsupported features prevents runtime errors.'))
  console.log()

  const choices = MCP_FEATURES.map(feature => ({
    name: `${pc.bold(feature.name)}\n     ${pc.dim(feature.description)}\n     ${pc.cyan('Enables:')} ${feature.capabilities.join(', ')}\n     ${pc.yellow('If disabled:')} ${feature.disabledNote}`,
    value: feature.envKey,
    checked: feature.default
  }))

  const selected = await checkbox({
    message: 'Select MCP features to enable (space to toggle):',
    choices,
    pageSize: 15
  })

  const result = {}
  for (const feature of MCP_FEATURES) {
    result[feature.envKey] = selected.includes(feature.envKey)
  }

  if (selected.length === 0) {
    console.log(pc.yellow('\nNo MCP features selected. The server will run in basic mode.'))
  } else {
    const names = MCP_FEATURES
      .filter(f => selected.includes(f.envKey))
      .map(f => f.name)
    console.log(pc.green(`\nEnabled: ${names.join(', ')}`))
  }

  console.log()
  return result
}

async function selectAndInstallDependencies () {
  console.log(pc.green(pc.bold('DEPENDENCIES')))
  console.log(pc.dim('──────────────────────────────────────────────────────────'))
  console.log()
  console.log('Select which wallet and protocol packages to install.')
  console.log('Each package enables specific capabilities for the MCP server.')
  console.log()

  const choices = DEPENDENCIES.map(dep => ({
    name: `${pc.bold(dep.name)}\n     ${pc.dim(dep.description)}\n     ${pc.cyan('Enables:')} ${dep.capabilities.join(', ')}`,
    value: dep.name,
    checked: true
  }))

  const selectedDeps = await checkbox({
    message: 'Select dependencies to install:',
    choices,
    pageSize: 10
  })

  if (selectedDeps.length === 0) {
    console.log(pc.yellow('\nNo dependencies selected. Skipping installation.'))
    console.log()
    return
  }

  console.log()
  console.log(pc.cyan('Installing selected dependencies...'))
  console.log()

  for (let i = 0; i < selectedDeps.length; i++) {
    const dep = selectedDeps[i]
    process.stdout.write(`  [${i + 1}/${selectedDeps.length}] ${dep}...`)
    try {
      await exec(`npm install ${dep}`, { cwd: process.cwd() })
      console.log(pc.green(' done'))
    } catch (error) {
      console.log(pc.red(' failed'))
      console.log(pc.red(`    Error: ${error.message}`))
    }
  }

  console.log()
}

async function generateConfig (config) {
  process.stdout.write(pc.cyan('Generating .vscode/mcp.json...'))

  const mcpConfig = {
    servers: {
      wdk: {
        type: 'stdio',
        command: 'node',
        args: ['examples/basic/index.js'],
        env: {
          WDK_SEED: config.seed
        }
      }
    }
  }

  if (config.indexerApiKey) {
    mcpConfig.servers.wdk.env.WDK_INDEXER_API_KEY = config.indexerApiKey
  }

  if (config.moonPayApiKey) {
    mcpConfig.servers.wdk.env.MOONPAY_API_KEY = config.moonPayApiKey
    mcpConfig.servers.wdk.env.MOONPAY_SECRET_KEY = config.moonPaySecretKey
  }

  if (config.mcpFeatures) {
    for (const feature of MCP_FEATURES) {
      mcpConfig.servers.wdk.env[feature.envKey] = config.mcpFeatures[feature.envKey] ? 'true' : 'false'
    }
  }

  const vscodeDir = path.join(process.cwd(), '.vscode')
  await fs.mkdir(vscodeDir, { recursive: true })

  const configPath = path.join(vscodeDir, 'mcp.json')
  await fs.writeFile(configPath, JSON.stringify(mcpConfig, null, 2) + '\n')

  if (process.platform !== 'win32') {
    await fs.chmod(configPath, 0o600)
  }

  console.log(pc.green(' done'))
}

async function openVsCode () {
  console.log()
  const shouldOpen = await confirm({
    message: 'Open VS Code in the current directory?',
    default: true
  })

  if (!shouldOpen) {
    console.log(pc.dim('Skipping VS Code launch. You can open it manually later.'))
    return
  }

  process.stdout.write(pc.cyan('Opening VS Code...'))

  try {
    await exec('code .', { cwd: process.cwd() })
    console.log(pc.green(' done'))
  } catch {
    console.log(pc.yellow(' failed'))
    console.log(pc.dim('   Could not open VS Code. Please open it manually in this directory.'))
  }
}

function printSuccessMessage (config) {
  const enabledCapabilities = [
    'Wallet Operations (Ethereum, Arbitrum, Bitcoin)',
    'Pricing Data',
    'Token Swaps (Velora)',
    'Cross-chain Bridge (USDT0)',
    'DeFi Lending (Aave)'
  ]
  const disabledCapabilities = []

  if (config.indexerApiKey) {
    enabledCapabilities.push('Transaction History')
  } else {
    disabledCapabilities.push('Transaction History')
  }

  if (config.moonPayApiKey) {
    enabledCapabilities.push('Fiat On/Off-Ramp (MoonPay)')
  } else {
    disabledCapabilities.push('Fiat On/Off-Ramp (MoonPay)')
  }

  console.log()
  console.log(pc.green(pc.bold('╔══════════════════════════════════════════════════════════╗')))
  console.log(pc.green(pc.bold('║                 Setup Complete!                          ║')))
  console.log(pc.green(pc.bold('╚══════════════════════════════════════════════════════════╝')))
  console.log()
  console.log(pc.bold('Enabled capabilities:'))
  enabledCapabilities.forEach(cap => {
    console.log(pc.green(`  - ${cap}`))
  })

  if (disabledCapabilities.length > 0) {
    console.log()
    console.log(pc.dim('Disabled capabilities (re-run setup to enable):'))
    disabledCapabilities.forEach(cap => {
      console.log(pc.dim(`  - ${cap}`))
    })
  }

  if (config.mcpFeatures) {
    const enabledFeatures = MCP_FEATURES.filter(f => config.mcpFeatures[f.envKey])
    const disabledFeatures = MCP_FEATURES.filter(f => !config.mcpFeatures[f.envKey])

    console.log()
    console.log(pc.bold('MCP features:'))
    enabledFeatures.forEach(f => {
      console.log(pc.green(`  ✔ ${f.name}`))
    })
    disabledFeatures.forEach(f => {
      console.log(pc.dim(`  ✘ ${f.name}`))
    })
  }

  console.log()
  console.log(pc.bold('Next steps:'))
  console.log('  1. In VS Code, open ' + pc.cyan('.vscode/mcp.json'))
  console.log('  2. Click the ' + pc.cyan('"Start"') + ' button above the server config')
  console.log('  3. Open GitHub Copilot Chat and select ' + pc.cyan('"Agent"') + ' mode')
  console.log('  4. Try: ' + pc.cyan('"What\'s my ethereum address?"'))
  console.log()
  console.log(pc.yellow(pc.bold('Remember: Never commit .vscode/mcp.json to git!')))
  console.log()
}

export { runSetupWizard }
