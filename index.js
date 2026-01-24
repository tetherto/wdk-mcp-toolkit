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

export { WdkMcpServer, CHAINS, DEFAULT_TOKENS } from './src/server.js'

export {
  WALLET_TOOLS,
  WALLET_READ_TOOLS,
  WALLET_WRITE_TOOLS,
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
  PRICING_TOOLS,
  getCurrentPrice,
  getHistoricalPrice
} from './src/tools/pricing/index.js'

export {
  INDEXER_TOOLS,
  getTokenTransfers,
  getIndexerTokenBalance
} from './src/tools/indexer/index.js'

export {
  SWAP_TOOLS,
  SWAP_READ_TOOLS,
  SWAP_WRITE_TOOLS,
  quoteSwap,
  swap
} from './src/tools/swap/index.js'

export {
  BRIDGE_TOOLS,
  BRIDGE_READ_TOOLS,
  BRIDGE_WRITE_TOOLS,
  quoteBridge,
  bridge
} from './src/tools/bridge/index.js'

export {
  LENDING_TOOLS,
  LENDING_READ_TOOLS,
  LENDING_WRITE_TOOLS,
  quoteSupply,
  supply,
  quoteWithdraw,
  withdraw,
  quoteBorrow,
  borrow,
  quoteRepay,
  repay
} from './src/tools/lending/index.js'

export {
  FIAT_TOOLS,
  FIAT_READ_TOOLS,
  FIAT_WRITE_TOOLS,
  quoteBuy,
  buy,
  quoteSell,
  sell,
  getTransactionDetail,
  getSupportedCryptoAssets,
  getSupportedFiatCurrencies,
  getSupportedCountries
} from './src/tools/fiat/index.js'

export {
  parseAmountToBaseUnits,
  formatBaseUnitsToAmount,
  AmountParseError,
  AMOUNT_ERROR_CODES
} from './src/utils/index.js'
