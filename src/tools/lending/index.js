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

import { quoteSupply } from './quoteSupply.js'
import { supply } from './supply.js'
import { quoteWithdraw } from './quoteWithdraw.js'
import { withdraw } from './withdraw.js'
import { quoteBorrow } from './quoteBorrow.js'
import { borrow } from './borrow.js'
import { quoteRepay } from './quoteRepay.js'
import { repay } from './repay.js'

/** @typedef {import('../../server.js').ToolFunction} ToolFunction */

/**
 * Read-only lending tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const LENDING_READ_TOOLS = [
  quoteSupply,
  quoteWithdraw,
  quoteBorrow,
  quoteRepay
]

/**
 * Write lending tools (require confirmation).
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const LENDING_WRITE_TOOLS = [
  supply,
  withdraw,
  borrow,
  repay
]

/**
 * All lending tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const LENDING_TOOLS = [
  ...LENDING_READ_TOOLS,
  ...LENDING_WRITE_TOOLS
]

export { quoteSupply, supply, quoteWithdraw, withdraw, quoteBorrow, borrow, quoteRepay, repay }
