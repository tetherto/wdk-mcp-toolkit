#!/usr/bin/env node
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

import pc from 'picocolors'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const pkg = require('../package.json')

const COMMANDS = {
  setup: {
    description: 'Configure WDK MCP server for VS Code GitHub Copilot',
    handler: async () => {
      const { runSetupWizard } = await import('./setup.js')
      await runSetupWizard()
    }
  },
  help: {
    description: 'Show this help message',
    handler: async () => {
      printHelp()
    }
  },
  version: {
    description: 'Show the current version',
    handler: async () => {
      console.log(pkg.version)
    }
  }
}

function printHelp () {
  console.log()
  console.log(pc.cyan(pc.bold('WDK MCP Toolkit')))
  console.log()
  console.log('Usage: wdk-mcp-toolkit <command>')
  console.log()
  console.log('Commands:')
  for (const [name, cmd] of Object.entries(COMMANDS)) {
    console.log(`  ${pc.green(name.padEnd(12))} ${cmd.description}`)
  }
  console.log()
  console.log('Examples:')
  console.log(`  ${pc.dim('$')} wdk-mcp-toolkit setup`)
  console.log()
}

async function main () {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command) {
    printHelp()
    process.exit(0)
  }

  const cmd = COMMANDS[command]
  if (!cmd) {
    console.error(pc.red(`Unknown command: ${command}`))
    console.error()
    console.error(`Run ${pc.cyan('wdk-mcp-toolkit help')} for available commands.`)
    process.exit(1)
  }

  await cmd.handler()
}

main().catch((error) => {
  console.error(pc.red('Error:'), error.message)
  process.exit(1)
})
