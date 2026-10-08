'use strict'

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'
import { promises as fs } from 'node:fs'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import os from 'node:os'
import path from 'node:path'

const execFile = promisify(execFileCallback)

const mockConfirm = jest.fn()

jest.unstable_mockModule('@inquirer/prompts', () => ({
  confirm: mockConfirm,
  password: jest.fn(),
  input: jest.fn(),
  checkbox: jest.fn()
}))

const { checkGitignore, gitIgnoreState } = await import('../../bin/setup.js')

const CONFIG_PATH = '.vscode/mcp.json'

describe('gitIgnoreState', () => {
  let tmpDirs
  let originalCwd

  beforeEach(() => {
    tmpDirs = []
    originalCwd = process.cwd()
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    for (const dir of tmpDirs) {
      await fs.rm(dir, { recursive: true, force: true })
    }
  })

  async function makeDir (gitInit, gitignoreContents) {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdk-setup-'))
    tmpDirs.push(dir)

    if (gitInit) {
      await execFile('git', ['init', '-q'], { cwd: dir })
    }

    if (gitignoreContents !== undefined) {
      await fs.writeFile(path.join(dir, '.gitignore'), gitignoreContents)
    }

    return dir
  }

  test('reports ignored when .vscode is in .gitignore', async () => {
    const dir = await makeDir(true, '.vscode\n')
    process.chdir(dir)

    await expect(gitIgnoreState(CONFIG_PATH)).resolves.toBe('ignored')
  })

  test('reports not-ignored when only .vscode/settings.json is listed', async () => {
    // The reported bug: a substring check for ".vscode" passes here, but Git
    // does not ignore .vscode/mcp.json, which is where the seed is written.
    const dir = await makeDir(true, '.vscode/settings.json\n')
    process.chdir(dir)

    await expect(gitIgnoreState(CONFIG_PATH)).resolves.toBe('not-ignored')
  })

  test('reports not-ignored when a comment merely mentions .vscode', async () => {
    const dir = await makeDir(true, '# keep .vscode tidy\nnode_modules\n')
    process.chdir(dir)

    await expect(gitIgnoreState(CONFIG_PATH)).resolves.toBe('not-ignored')
  })

  test('reports unverifiable outside a git repository', async () => {
    const dir = await makeDir(false)
    process.chdir(dir)

    await expect(gitIgnoreState(CONFIG_PATH)).resolves.toBe('unverifiable')
  })
})

describe('checkGitignore', () => {
  let tmpDirs
  let originalCwd
  let consoleSpy

  beforeEach(() => {
    tmpDirs = []
    originalCwd = process.cwd()
    mockConfirm.mockReset()
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(async () => {
    consoleSpy.mockRestore()
    process.chdir(originalCwd)
    for (const dir of tmpDirs) {
      await fs.rm(dir, { recursive: true, force: true })
    }
  })

  async function makeDir (gitInit, gitignore) {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdk-setup-'))
    tmpDirs.push(dir)

    if (gitInit) {
      await execFile('git', ['init', '-q'], { cwd: dir })
    }

    if (gitignore === 'as-directory') {
      await fs.mkdir(path.join(dir, '.gitignore'))
    } else if (typeof gitignore === 'string') {
      await fs.writeFile(path.join(dir, '.gitignore'), gitignore)
    }

    return dir
  }

  test('does not prompt when the config path is already ignored', async () => {
    const dir = await makeDir(true, '.vscode\n')
    process.chdir(dir)

    await expect(checkGitignore()).resolves.toBe('ignored')
    expect(mockConfirm).not.toHaveBeenCalled()
  })

  test('adds the rule and verifies it with git when the user accepts', async () => {
    const dir = await makeDir(true, '.vscode/settings.json\n')
    process.chdir(dir)
    mockConfirm.mockResolvedValue(true)

    await expect(checkGitignore()).resolves.toBe('ignored')
    expect(mockConfirm).toHaveBeenCalledTimes(1)

    // The appended rule has to make Git agree, not just look plausible.
    await expect(gitIgnoreState(CONFIG_PATH)).resolves.toBe('ignored')

    const gitignore = await fs.readFile(path.join(dir, '.gitignore'), 'utf-8')
    expect(gitignore).toContain('.vscode')
  })

  test('refuses when the user declines to add the rule', async () => {
    const dir = await makeDir(true, '.vscode/settings.json\n')
    process.chdir(dir)
    mockConfirm.mockResolvedValue(false)

    await expect(checkGitignore()).resolves.toBe('refused')
    await expect(gitIgnoreState(CONFIG_PATH)).resolves.toBe('not-ignored')
  })

  test('refuses when the user declines outside a git repository', async () => {
    const dir = await makeDir(false)
    process.chdir(dir)
    mockConfirm.mockResolvedValue(false)

    await expect(checkGitignore()).resolves.toBe('refused')
  })

  test('reports unverified when the user accepts outside a git repository', async () => {
    const dir = await makeDir(false)
    process.chdir(dir)
    mockConfirm.mockResolvedValue(true)

    await expect(checkGitignore()).resolves.toBe('unverified')
  })

  test('refuses instead of throwing when .gitignore cannot be written', async () => {
    const dir = await makeDir(true, 'as-directory')
    process.chdir(dir)
    mockConfirm.mockResolvedValue(true)

    await expect(checkGitignore()).resolves.toBe('refused')
  })
})
