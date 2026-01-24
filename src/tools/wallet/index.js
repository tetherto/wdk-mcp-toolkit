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

import { getAddress } from './getAddress.js'
import { getBalance } from './getBalance.js'
import { getFeeRates } from './getFeeRates.js'
import { getMaxSpendableBtc } from './getMaxSpendableBtc.js'
import { getTokenBalance } from './getTokenBalance.js'
import { quoteSendTransaction } from './quoteSendTransaction.js'
import { quoteTransfer } from './quoteTransfer.js'
import { sendTransaction } from './sendTransaction.js'
import { transfer } from './transfer.js'
import { sign } from './sign.js'
import { verify } from './verify.js'

/** @typedef {import('../../server.js').ToolFunction} ToolFunction */

/**
 * Read-only wallet tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const WALLET_READ_TOOLS = [
  getAddress,
  getBalance,
  getFeeRates,
  getMaxSpendableBtc,
  getTokenBalance,
  quoteSendTransaction,
  quoteTransfer
]

/**
 * Write wallet tools (require confirmation).
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const WALLET_WRITE_TOOLS = [
  sendTransaction,
  transfer,
  sign,
  verify
]

/**
 * All wallet tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const WALLET_TOOLS = [
  ...WALLET_READ_TOOLS,
  ...WALLET_WRITE_TOOLS
]

// camelCase aliases for convenience
export { WALLET_TOOLS as walletTools }
export { WALLET_READ_TOOLS as walletReadTools }
export { WALLET_WRITE_TOOLS as walletWriteTools }

export {
  getAddress,
  getBalance,
  getFeeRates,
  getMaxSpendableBtc,
  getTokenBalance,
  quoteSendTransaction,
  quoteTransfer,
  sendTransaction,
  transfer,
  sign,
  verify
}
