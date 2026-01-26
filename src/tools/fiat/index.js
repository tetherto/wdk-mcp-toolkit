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

import { quoteBuy } from './quoteBuy.js'
import { buy } from './buy.js'
import { quoteSell } from './quoteSell.js'
import { sell } from './sell.js'
import { getTransactionDetail } from './getTransactionDetail.js'
import { getSupportedCryptoAssets } from './getSupportedCryptoAssets.js'
import { getSupportedFiatCurrencies } from './getSupportedFiatCurrencies.js'
import { getSupportedCountries } from './getSupportedCountries.js'

/** @typedef {import('../../server.js').ToolFunction} ToolFunction */

/**
 * Read-only fiat tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const FIAT_READ_TOOLS = [
  quoteBuy,
  quoteSell,
  getTransactionDetail,
  getSupportedCryptoAssets,
  getSupportedFiatCurrencies,
  getSupportedCountries
]

/**
 * Write fiat tools (require confirmation).
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const FIAT_WRITE_TOOLS = [
  buy,
  sell
]

/**
 * All fiat tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const FIAT_TOOLS = [
  ...FIAT_READ_TOOLS,
  ...FIAT_WRITE_TOOLS
]

export { quoteBuy, buy, quoteSell, sell, getTransactionDetail, getSupportedCryptoAssets, getSupportedFiatCurrencies, getSupportedCountries }
