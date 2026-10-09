/**
 * Parses a human-readable currency amount string into BigInt base units.
 *
 * This function avoids floating-point precision errors by performing all
 * arithmetic on strings and BigInt values directly.
 *
 * @param {string} amount - The amount to parse (e.g., "2.01", "1,000.50", "100")
 * @param {number} decimals - The number of decimal places for the token (e.g., 6 for USDT, 18 for ETH)
 * @returns {bigint} The amount in base units (wei, satoshis, etc.)
 * @throws {AmountParseError} If `decimals` is not an integer between 0 and 77 (`INVALID_DECIMALS`).
 * @throws {AmountParseError} If `amount` is not a string (`INVALID_FORMAT`).
 * @throws {AmountParseError} If `amount` is empty or contains only whitespace (`EMPTY_STRING`).
 * @throws {AmountParseError} If `amount` is negative (`NEGATIVE_AMOUNT`).
 * @throws {AmountParseError} If `amount` uses a comma as anything other than a thousand separator, such as "0,5" (`AMBIGUOUS_SEPARATOR`).
 * @throws {AmountParseError} If `amount` is not a positive decimal number (`INVALID_FORMAT`).
 * @throws {AmountParseError} If `amount` is in scientific notation and expands past `decimals` places (`SCIENTIFIC_NOTATION_PRECISION`).
 * @throws {AmountParseError} If `amount` has more decimal places than `decimals` (`EXCESSIVE_PRECISION`).
 *
 * @example
 * parseAmountToBaseUnits("2.01", 6)  // Returns 2010000n
 * parseAmountToBaseUnits("1,000.50", 6)  // Returns 1000500000n
 * parseAmountToBaseUnits("100", 18)  // Returns 100000000000000000000n
 */
export function parseAmountToBaseUnits(amount: string, decimals: number): bigint;
/**
 * A user-supplied amount in both the form that is sent and the form that is shown.
 *
 * @typedef {Object} ParsedAmount
 * @property {bigint} baseUnits - The amount in base units, to be sent on-chain.
 * @property {string} display - The same amount rendered back as a decimal string, to be shown to the user.
 */
/**
 * Parses a human-readable amount into the value to send and the value to display.
 *
 * Both fields derive from the same parse, so a confirmation prompt built from
 * `display` always describes the `baseUnits` that are submitted.
 *
 * @param {string} amount - The amount to parse (e.g., "2.01", "1,000.50", "100")
 * @param {number} decimals - The number of decimal places for the token (e.g., 6 for USDT, 18 for ETH)
 * @returns {ParsedAmount} The amount in base units together with its display form.
 * @throws {AmountParseError} If `decimals` is not an integer between 0 and 77 (`INVALID_DECIMALS`).
 * @throws {AmountParseError} If `amount` is not a string (`INVALID_FORMAT`).
 * @throws {AmountParseError} If `amount` is empty or contains only whitespace (`EMPTY_STRING`).
 * @throws {AmountParseError} If `amount` is negative (`NEGATIVE_AMOUNT`).
 * @throws {AmountParseError} If `amount` uses a comma as anything other than a thousand separator, such as "0,5" (`AMBIGUOUS_SEPARATOR`).
 * @throws {AmountParseError} If `amount` is not a positive decimal number (`INVALID_FORMAT`).
 * @throws {AmountParseError} If `amount` is in scientific notation and expands past `decimals` places (`SCIENTIFIC_NOTATION_PRECISION`).
 * @throws {AmountParseError} If `amount` has more decimal places than `decimals` (`EXCESSIVE_PRECISION`).
 *
 * @example
 * parseAmount("1,000.50", 6)  // Returns { baseUnits: 1000500000n, display: "1000.5" }
 */
export function parseAmount(amount: string, decimals: number): ParsedAmount;
/**
 * Formats base units (BigInt) back to a human-readable amount string.
 *
 * This is the inverse of parseAmountToBaseUnits. It handles formatting
 * without floating-point precision issues.
 *
 * @param {bigint} baseUnits - The amount in base units
 * @param {number} decimals - The number of decimal places for the token
 * @returns {string} The human-readable amount string
 * @throws {AmountParseError} If baseUnits is a negative integer, or decimals is invalid.
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
    let AMBIGUOUS_SEPARATOR: string;
}
/**
 * Error thrown when amount parsing fails due to invalid input.
 */
export class AmountParseError extends Error {
    /**
     * Creates an AmountParseError with a message and error code.
     *
     * @param {string} message - The error message.
     * @param {string} code - The error code for programmatic handling.
     */
    constructor(message: string, code: string);
    code: string;
}
/**
 * A user-supplied amount in both the form that is sent and the form that is shown.
 */
export type ParsedAmount = {
    /**
     * - The amount in base units, to be sent on-chain.
     */
    baseUnits: bigint;
    /**
     * - The same amount rendered back as a decimal string, to be shown to the user.
     */
    display: string;
};
