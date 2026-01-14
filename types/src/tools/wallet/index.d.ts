/** @typedef {import('../../server.js').ToolFunction} ToolFunction */
/**
 * Read-only wallet tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const WALLET_READ_TOOLS: ToolFunction[];
/**
 * Write wallet tools (require confirmation).
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const WALLET_WRITE_TOOLS: ToolFunction[];
/**
 * All wallet tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const WALLET_TOOLS: ToolFunction[];
export type ToolFunction = import("../../server.js").ToolFunction;
import { getAddress } from './getAddress.js';
import { getBalance } from './getBalance.js';
import { getFeeRates } from './getFeeRates.js';
import { getMaxSpendableBtc } from './getMaxSpendableBtc.js';
import { getTokenBalance } from './getTokenBalance.js';
import { quoteSendTransaction } from './quoteSendTransaction.js';
import { quoteTransfer } from './quoteTransfer.js';
import { sendTransaction } from './sendTransaction.js';
import { transfer } from './transfer.js';
import { sign } from './sign.js';
import { verify } from './verify.js';
export { getAddress, getBalance, getFeeRates, getMaxSpendableBtc, getTokenBalance, quoteSendTransaction, quoteTransfer, sendTransaction, transfer, sign, verify };
