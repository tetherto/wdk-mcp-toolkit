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

import { quoteSwap } from './quoteSwap.js'
import { swap } from './swap.js'

/** @typedef {import('../../server.js').ToolFunction} ToolFunction */

/**
 * Read-only swap tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const SWAP_READ_TOOLS = [quoteSwap]

/**
 * Write swap tools (require confirmation).
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const SWAP_WRITE_TOOLS = [swap]

/**
 * All swap tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const SWAP_TOOLS = [...SWAP_READ_TOOLS, ...SWAP_WRITE_TOOLS]

// camelCase aliases for convenience
export { SWAP_TOOLS as swapTools }
export { SWAP_READ_TOOLS as swapReadTools }
export { SWAP_WRITE_TOOLS as swapWriteTools }

export { quoteSwap, swap }
