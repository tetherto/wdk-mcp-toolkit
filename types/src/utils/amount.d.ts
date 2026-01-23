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
export function parseAmountToBaseUnits(amount: string, decimals: number): bigint;
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
export function formatBaseUnitsToAmount(baseUnits: bigint, decimals: number): string;
/**
 * Error codes for amount parsing failures.
 */
export type AMOUNT_ERROR_CODES = string;
export namespace AMOUNT_ERROR_CODES {
    let EMPTY_STRING: string;
    let INVALID_FORMAT: string;
    let NEGATIVE_AMOUNT: string;
    let EXCESSIVE_PRECISION: string;
    let INVALID_DECIMALS: string;
    let SCIENTIFIC_NOTATION_PRECISION: string;
}
/**
 * Error thrown when amount parsing fails due to invalid input.
 */
export class AmountParseError extends Error {
    /**
     * @param {string} message - The error message.
     * @param {string} code - The error code for programmatic handling.
     */
    constructor(message: string, code: string);
    code: string;
}
