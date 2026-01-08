'use strict'

import { quoteBuy } from './quoteBuy.js'
import { buy } from './buy.js'
import { quoteSell } from './quoteSell.js'
import { sell } from './sell.js'
import { getTransactionDetail } from './getTransactionDetail.js'
import { getSupportedCryptoAssets } from './getSupportedCryptoAssets.js'
import { getSupportedFiatCurrencies } from './getSupportedFiatCurrencies.js'
import { getSupportedCountries } from './getSupportedCountries.js'

export const fiatTools = [
  quoteBuy,
  buy,
  quoteSell,
  sell,
  getTransactionDetail,
  getSupportedCryptoAssets,
  getSupportedFiatCurrencies,
  getSupportedCountries
]

export const fiatReadTools = [
  quoteBuy,
  quoteSell,
  getTransactionDetail,
  getSupportedCryptoAssets,
  getSupportedFiatCurrencies,
  getSupportedCountries
]

export const fiatWriteTools = [
  buy,
  sell
]

export { quoteBuy, buy, quoteSell, sell, getTransactionDetail, getSupportedCryptoAssets, getSupportedFiatCurrencies, getSupportedCountries }