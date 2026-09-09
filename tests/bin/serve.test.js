'use strict'

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const { configureWdkSeed, resolveSeed } = await import('../../bin/serve.js')

const SEED = 'cook voyage document eight skate token alien guide drink uncle term abuse'
const SEED_KEYS = ['WDK_SEED', 'WDK_SEED_COMMAND', 'WDK_SEED_FILE']

describe('resolveSeed', () => {
  let tmpDir
  let saved

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdk-seed-'))
  })

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  beforeEach(() => {
    // Snapshot and clear the seed-related env so each test starts clean.
    saved = {}
    for (const key of SEED_KEYS) {
      saved[key] = process.env[key]
      delete process.env[key]
    }
  })

  afterEach(() => {
    for (const key of SEED_KEYS) {
      if (saved[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = saved[key]
      }
    }
  })

  async function writeSeedFile (name, contents) {
    const file = path.join(tmpDir, name)
    await fs.writeFile(file, contents)
    return file
  }

  test('returns null when no source is configured', async () => {
    await expect(resolveSeed()).resolves.toBeNull()
  })

  describe('WDK_SEED', () => {
    test('returns the value directly', async () => {
      process.env.WDK_SEED = SEED
      await expect(resolveSeed()).resolves.toBe(SEED)
    })

    test('trims surrounding whitespace', async () => {
      process.env.WDK_SEED = `  ${SEED}\n`
      await expect(resolveSeed()).resolves.toBe(SEED)
    })

    test('takes priority over WDK_SEED_COMMAND and WDK_SEED_FILE', async () => {
      process.env.WDK_SEED = SEED
      process.env.WDK_SEED_COMMAND = 'echo from-command'
      process.env.WDK_SEED_FILE = await writeSeedFile('priority.txt', 'from-file')
      await expect(resolveSeed()).resolves.toBe(SEED)
    })
  })

  describe('WDK_SEED_COMMAND', () => {
    test("returns the command's stdout, trimmed", async () => {
      process.env.WDK_SEED_COMMAND = `printf '  %s\\n' "${SEED}"`
      await expect(resolveSeed()).resolves.toBe(SEED)
    })

    test('takes priority over WDK_SEED_FILE', async () => {
      process.env.WDK_SEED_COMMAND = 'echo from-command'
      process.env.WDK_SEED_FILE = await writeSeedFile('cmd-priority.txt', 'from-file')
      await expect(resolveSeed()).resolves.toBe('from-command')
    })

    test('throws a clear error when the command fails', async () => {
      process.env.WDK_SEED_COMMAND = 'exit 7'
      await expect(resolveSeed()).rejects.toThrow(/Failed to resolve seed from WDK_SEED_COMMAND/)
    })
  })

  describe('WDK_SEED_FILE', () => {
    test('returns the file contents, trimmed', async () => {
      process.env.WDK_SEED_FILE = await writeSeedFile('seed.txt', `${SEED}\n`)
      await expect(resolveSeed()).resolves.toBe(SEED)
    })

    test('throws a clear error when the file cannot be read', async () => {
      process.env.WDK_SEED_FILE = path.join(tmpDir, 'does-not-exist.txt')
      await expect(resolveSeed()).rejects.toThrow(/Failed to resolve seed from WDK_SEED_FILE/)
    })
  })

  describe('configureWdkSeed', () => {
    test('hands the seed to WDK before clearing every seed source', async () => {
      const server = {
        useWdk: jest.fn(({ seed }) => {
          expect(seed).toBe(SEED)
          for (const key of SEED_KEYS) expect(process.env[key]).toBeDefined()
        })
      }
      process.env.WDK_SEED = SEED
      process.env.WDK_SEED_COMMAND = 'echo from-command'
      process.env.WDK_SEED_FILE = await writeSeedFile('configure.txt', 'from-file')

      await expect(configureWdkSeed(server)).resolves.toBe(SEED)

      expect(server.useWdk).toHaveBeenCalledTimes(1)
      for (const key of SEED_KEYS) expect(process.env[key]).toBeUndefined()
    })

    test('does not configure WDK when no seed source is set', async () => {
      const server = { useWdk: jest.fn() }

      await expect(configureWdkSeed(server)).resolves.toBeNull()

      expect(server.useWdk).not.toHaveBeenCalled()
    })

    test('clears every seed source when WDK configuration fails', async () => {
      const server = {
        useWdk: jest.fn(() => {
          throw new Error('Invalid seed.')
        })
      }
      process.env.WDK_SEED = SEED
      process.env.WDK_SEED_COMMAND = 'echo from-command'
      process.env.WDK_SEED_FILE = await writeSeedFile('configure-failure.txt', 'from-file')

      await expect(configureWdkSeed(server)).rejects.toThrow('Invalid seed.')

      for (const key of SEED_KEYS) expect(process.env[key]).toBeUndefined()
    })
  })
})
