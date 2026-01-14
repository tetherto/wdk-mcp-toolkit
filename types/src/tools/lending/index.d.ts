/** @typedef {import('../../server.js').ToolFunction} ToolFunction */
/**
 * Read-only lending tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const LENDING_READ_TOOLS: ToolFunction[];
/**
 * Write lending tools (require confirmation).
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const LENDING_WRITE_TOOLS: ToolFunction[];
/**
 * All lending tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const LENDING_TOOLS: ToolFunction[];
export type ToolFunction = import("../../server.js").ToolFunction;
import { quoteSupply } from './quoteSupply.js';
import { supply } from './supply.js';
import { quoteWithdraw } from './quoteWithdraw.js';
import { withdraw } from './withdraw.js';
import { quoteBorrow } from './quoteBorrow.js';
import { borrow } from './borrow.js';
import { quoteRepay } from './quoteRepay.js';
import { repay } from './repay.js';
export { quoteSupply, supply, quoteWithdraw, withdraw, quoteBorrow, borrow, quoteRepay, repay };
