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

import { quoteBridge } from './quoteBridge.js'
import { bridge } from './bridge.js'

/** @typedef {import('../../server.js').ToolFunction} ToolFunction */

/**
 * Read-only bridge tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const BRIDGE_READ_TOOLS = [quoteBridge]

/**
 * Write bridge tools (require confirmation).
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const BRIDGE_WRITE_TOOLS = [bridge]

/**
 * All bridge tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const BRIDGE_TOOLS = [...BRIDGE_READ_TOOLS, ...BRIDGE_WRITE_TOOLS]

export { quoteBridge, bridge }