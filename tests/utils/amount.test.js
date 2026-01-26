'use strict'

import { describe, expect, test } from '@jest/globals'

import {
  parseAmountToBaseUnits,
  formatBaseUnitsToAmount,
  AmountParseError,
  AMOUNT_ERROR_CODES
} from '../../src/utils/amount.js'

describe('parseAmountToBaseUnits', () => {
  describe('precision (critical bug fix)', () => {
    test.each([
      ['2.01', 6, 2010000n],
      ['0.1', 18, 100000000000000000n],
      ['0.3', 18, 300000000000000000n],
      ['1.005', 6, 1005000n],
      ['123.456789', 6, 123456789n]
    ])('parses "%s" with %d decimals to %s', (input, decimals, expected) => {
      expect(parseAmountToBaseUnits(input, decimals)).toBe(expected)
    })
  })

  describe('basic parsing', () => {
    test.each([
      ['100', 6, 100000000n],
      ['0', 6, 0n],
      ['0.5', 6, 500000n],
      ['0.000001', 6, 1n],
      ['100', 0, 100n]
    ])('parses "%s" with %d decimals to %s', (input, decimals, expected) => {
      expect(parseAmountToBaseUnits(input, decimals)).toBe(expected)
    })
  })

  describe('whitespace handling', () => {
    test.each([
      ['  100', 6, 100000000n],
      ['100  ', 6, 100000000n],
      ['  100.50  ', 6, 100500000n],
      ['\t50\n', 6, 50000000n]
    ])('trims "%s" correctly', (input, decimals, expected) => {
      expect(parseAmountToBaseUnits(input, decimals)).toBe(expected)
    })
  })

  describe('comma separators', () => {
    test.each([
      ['1,000', 6, 1000000000n],
      ['1,000.00', 6, 1000000000n],
      ['1,000,000.50', 6, 1000000500000n]
    ])('strips commas from "%s"', (input, decimals, expected) => {
      expect(parseAmountToBaseUnits(input, decimals)).toBe(expected)
    })
  })

  describe('scientific notation', () => {
    test.each([
      ['1e6', 6, 1000000000000n],
      ['1e-6', 6, 1n],
      ['5e-3', 6, 5000n],
      ['2.5e-2', 6, 25000n]
    ])('expands "%s" correctly', (input, decimals, expected) => {
      expect(parseAmountToBaseUnits(input, decimals)).toBe(expected)
    })

    test('throws on precision overflow', () => {
      expect(() => parseAmountToBaseUnits('1e-7', 6)).toThrow(AmountParseError)
      expect(() => parseAmountToBaseUnits('1e-7', 6)).toThrow(/only supports 6/)
    })
  })

  describe('leading/trailing zeros', () => {
    test.each([
      ['01.5', 6, 1500000n],
      ['007', 6, 7000000n],
      ['1.00', 6, 1000000n],
      ['1.500000', 6, 1500000n]
    ])('handles "%s" correctly', (input, decimals, expected) => {
      expect(parseAmountToBaseUnits(input, decimals)).toBe(expected)
    })
  })

  describe('error cases', () => {
    test('throws on negative amounts', () => {
      expect(() => parseAmountToBaseUnits('-1.5', 6)).toThrow(AmountParseError)
      try {
        parseAmountToBaseUnits('-1', 6)
      } catch (e) {
        expect(e.code).toBe(AMOUNT_ERROR_CODES.NEGATIVE_AMOUNT)
      }
    })

    test('throws on invalid format', () => {
      const invalidInputs = ['1.2.3', 'abc', '$100', '100 USDT', '.5', '5.']
      invalidInputs.forEach(input => {
        expect(() => parseAmountToBaseUnits(input, 6)).toThrow(AmountParseError)
      })
    })

    test('throws on empty input', () => {
      expect(() => parseAmountToBaseUnits('', 6)).toThrow(AmountParseError)
      expect(() => parseAmountToBaseUnits('   ', 6)).toThrow(AmountParseError)
      try {
        parseAmountToBaseUnits('', 6)
      } catch (e) {
        expect(e.code).toBe(AMOUNT_ERROR_CODES.EMPTY_STRING)
      }
    })

    test('throws on excessive precision', () => {
      expect(() => parseAmountToBaseUnits('1.0000001', 6)).toThrow(AmountParseError)
      try {
        parseAmountToBaseUnits('1.0000001', 6)
      } catch (e) {
        expect(e.code).toBe(AMOUNT_ERROR_CODES.EXCESSIVE_PRECISION)
      }
    })

    test('throws on invalid decimals parameter', () => {
      expect(() => parseAmountToBaseUnits('100', -1)).toThrow(AmountParseError)
      expect(() => parseAmountToBaseUnits('100', 6.5)).toThrow(AmountParseError)
      expect(() => parseAmountToBaseUnits('100', 78)).toThrow(AmountParseError)
    })
  })
})

describe('formatBaseUnitsToAmount', () => {
  describe('basic formatting', () => {
    test.each([
      [100000000n, 6, '100'],
      [2010000n, 6, '2.01'],
      [1500000n, 6, '1.5'],
      [500000n, 6, '0.5'],
      [1n, 6, '0.000001'],
      [0n, 6, '0']
    ])('formats %s with %d decimals to "%s"', (input, decimals, expected) => {
      expect(formatBaseUnitsToAmount(input, decimals)).toBe(expected)
    })
  })

  test('removes trailing zeros', () => {
    expect(formatBaseUnitsToAmount(1000000n, 6)).toBe('1')
    expect(formatBaseUnitsToAmount(1230000n, 6)).toBe('1.23')
  })

  test('throws on invalid input', () => {
    expect(() => formatBaseUnitsToAmount('100', 6)).toThrow(AmountParseError)
    expect(() => formatBaseUnitsToAmount(-1n, 6)).toThrow(AmountParseError)
  })
})

describe('roundtrip consistency', () => {
  test.each(['100', '2.01', '0.5', '1000.123456', '0.000001'])(
    'roundtrips "%s" correctly',
    (amount) => {
      const parsed = parseAmountToBaseUnits(amount, 6)
      const formatted = formatBaseUnitsToAmount(parsed, 6)
      expect(formatted).toBe(amount)
    }
  )
})
