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

/**
 * Error codes for amount parsing failures.
 * @readonly
 * @enum {string}
 */
export const AMOUNT_ERROR_CODES = {
  EMPTY_STRING: 'EMPTY_STRING',
  INVALID_FORMAT: 'INVALID_FORMAT',
  NEGATIVE_AMOUNT: 'NEGATIVE_AMOUNT',
  EXCESSIVE_PRECISION: 'EXCESSIVE_PRECISION',
  INVALID_DECIMALS: 'INVALID_DECIMALS',
  SCIENTIFIC_NOTATION_PRECISION: 'SCIENTIFIC_NOTATION_PRECISION'
}

/**
 * Error thrown when amount parsing fails due to invalid input.
 */
export class AmountParseError extends Error {
  /**
   * @param {string} message - The error message.
   * @param {string} code - The error code for programmatic handling.
   */
  constructor (message, code) {
    super(message)
    this.name = 'AmountParseError'
    this.code = code
  }
}

/**
 * Expands scientific notation to decimal format.
 *
 * @param {string} value - The value in scientific notation (e.g., "1e-7", "1.5e6")
 * @param {number} maxDecimals - Maximum allowed decimal places
 * @returns {string} The expanded decimal string
 * @throws {AmountParseError} If expansion would exceed precision
 */
function expandScientificNotation (value, maxDecimals) {
  const sciMatch = value.match(/^(\d+(?:\.\d+)?)[eE]([+-]?\d+)$/)
  if (!sciMatch) {
    throw new AmountParseError(
      `Invalid scientific notation format: "${value}".`,
      AMOUNT_ERROR_CODES.INVALID_FORMAT
    )
  }

  const mantissa = sciMatch[1]
  const exponent = parseInt(sciMatch[2], 10)

  const mantissaParts = mantissa.split('.')
  const mantissaInt = mantissaParts[0]
  const mantissaFrac = mantissaParts[1] || ''

  const totalDigits = mantissaInt + mantissaFrac
  const decimalPosition = mantissaInt.length + exponent

  let result
  if (decimalPosition <= 0) {
    result = '0.' + '0'.repeat(-decimalPosition) + totalDigits
  } else if (decimalPosition >= totalDigits.length) {
    result = totalDigits + '0'.repeat(decimalPosition - totalDigits.length)
  } else {
    result = totalDigits.slice(0, decimalPosition) + '.' + totalDigits.slice(decimalPosition)
  }

  const resultParts = result.split('.')
  const resultFracLength = resultParts[1]?.length || 0
  if (resultFracLength > maxDecimals) {
    throw new AmountParseError(
      `Scientific notation "${value}" expands to ${resultFracLength} decimal places, ` +
      `but token only supports ${maxDecimals}.`,
      AMOUNT_ERROR_CODES.SCIENTIFIC_NOTATION_PRECISION
    )
  }

  return result
}

/**
 * Parses a human-readable currency amount string into BigInt base units.
 *
 * This function avoids floating-point precision errors by performing all
 * arithmetic on strings and BigInt values directly.
 *
 * @param {string} amount - The amount to parse (e.g., "2.01", "1,000.50", "100")
 * @param {number} decimals - The number of decimal places for the token (e.g., 6 for USDT, 18 for ETH)
 * @returns {bigint} The amount in base units (wei, satoshis, etc.)
 * @throws {AmountParseError} If the input is invalid
 *
 * @example
 * parseAmountToBaseUnits("2.01", 6)  // Returns 2010000n
 * parseAmountToBaseUnits("1,000.50", 6)  // Returns 1000500000n
 * parseAmountToBaseUnits("100", 18)  // Returns 100000000000000000000n
 */
export function parseAmountToBaseUnits (amount, decimals) {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 77) {
    throw new AmountParseError(
      `Invalid decimals value: ${decimals}. Must be a non-negative integer <= 77.`,
      AMOUNT_ERROR_CODES.INVALID_DECIMALS
    )
  }

  if (typeof amount !== 'string') {
    throw new AmountParseError(
      `Amount must be a string, received ${typeof amount}.`,
      AMOUNT_ERROR_CODES.INVALID_FORMAT
    )
  }

  let trimmed = amount.trim()

  if (trimmed === '') {
    throw new AmountParseError(
      'Amount cannot be empty.',
      AMOUNT_ERROR_CODES.EMPTY_STRING
    )
  }

  if (trimmed.startsWith('-')) {
    throw new AmountParseError(
      `Negative amounts are not allowed: "${amount}".`,
      AMOUNT_ERROR_CODES.NEGATIVE_AMOUNT
    )
  }

  trimmed = trimmed.replace(/,/g, '')

  if (/[eE]/.test(trimmed)) {
    trimmed = expandScientificNotation(trimmed, decimals)
  }

  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new AmountParseError(
      `Invalid amount format: "${amount}". Expected a positive number (e.g., "100", "2.50", "1,000.00").`,
      AMOUNT_ERROR_CODES.INVALID_FORMAT
    )
  }

  const parts = trimmed.split('.')
  const integerPart = parts[0] || '0'
  const fractionalPart = parts[1] || ''

  if (fractionalPart.length > decimals) {
    throw new AmountParseError(
      `Amount "${amount}" has ${fractionalPart.length} decimal places, but token only supports ${decimals}. ` +
      'Please reduce precision to avoid unintended rounding.',
      AMOUNT_ERROR_CODES.EXCESSIVE_PRECISION
    )
  }

  const paddedFractional = fractionalPart.padEnd(decimals, '0')
  const normalizedInteger = integerPart.replace(/^0+/, '') || '0'

  const combinedString = normalizedInteger === '0'
    ? paddedFractional.replace(/^0+/, '') || '0'
    : normalizedInteger + paddedFractional

  return BigInt(combinedString)
}

/**
 * Formats base units (BigInt) back to a human-readable amount string.
 *
 * This is the inverse of parseAmountToBaseUnits. It handles formatting
 * without floating-point precision issues.
 *
 * @param {bigint} baseUnits - The amount in base units
 * @param {number} decimals - The number of decimal places for the token
 * @returns {string} The human-readable amount string
 *
 * @example
 * formatBaseUnitsToAmount(2010000n, 6)  // Returns "2.01"
 * formatBaseUnitsToAmount(100000000000000000000n, 18)  // Returns "100"
 * formatBaseUnitsToAmount(500000n, 6)  // Returns "0.5"
 */
export function formatBaseUnitsToAmount (baseUnits, decimals) {
  if (typeof baseUnits !== 'bigint') {
    throw new AmountParseError(
      `baseUnits must be a BigInt, received ${typeof baseUnits}.`,
      AMOUNT_ERROR_CODES.INVALID_FORMAT
    )
  }

  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 77) {
    throw new AmountParseError(
      `Invalid decimals value: ${decimals}. Must be a non-negative integer <= 77.`,
      AMOUNT_ERROR_CODES.INVALID_DECIMALS
    )
  }

  if (baseUnits < 0n) {
    throw new AmountParseError(
      'Negative base units are not supported.',
      AMOUNT_ERROR_CODES.NEGATIVE_AMOUNT
    )
  }

  if (decimals === 0) {
    return baseUnits.toString()
  }

  const str = baseUnits.toString()
  const len = str.length

  if (len <= decimals) {
    const padded = str.padStart(decimals, '0')
    const trimmed = padded.replace(/0+$/, '') || '0'
    return trimmed === '0' ? '0' : '0.' + trimmed
  }

  const integerPart = str.slice(0, len - decimals)
  const fractionalPart = str.slice(len - decimals)
  const trimmedFractional = fractionalPart.replace(/0+$/, '')

  if (trimmedFractional === '') {
    return integerPart
  }

  return integerPart + '.' + trimmedFractional
}
