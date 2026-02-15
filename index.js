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

/** @typedef {import('./src/server.js').TokenInfo} TokenInfo */

/** @typedef {import('./src/server.js').IndexerConfig} IndexerConfig */

/** @typedef {import('./src/server.js').WdkConfig} WdkConfig */

/** @typedef {import('./src/server.js').TokenMap} TokenMap */

/** @typedef {import('./src/server.js').TokenRegistry} TokenRegistry */

/** @typedef {import('./src/server.js').ToolFunction} ToolFunction */

/** @typedef {import('./src/server.js').Capabilities} Capabilities */

/** @typedef {import('./src/server.js').ServerOptions} ServerOptions */

export { WdkMcpServer, CHAINS, DEFAULT_TOKENS } from './src/server.js'

export {
  walletTools,
  walletReadTools,
  walletWriteTools,
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
} from './src/tools/wallet/index.js'

export {
  pricingTools,
  getCurrentPrice,
  getHistoricalPrice
} from './src/tools/pricing/index.js'

export {
  indexerTools,
  getTokenTransfers,
  getIndexerTokenBalance
} from './src/tools/indexer/index.js'

export {
  parseAmountToBaseUnits,
  formatBaseUnitsToAmount,
  AmountParseError,
  AMOUNT_ERROR_CODES
} from './src/utils/index.js'
