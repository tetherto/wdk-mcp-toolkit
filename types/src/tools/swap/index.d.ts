/** @typedef {import('../../server.js').ToolFunction} ToolFunction */
/**
 * Read-only swap tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const SWAP_READ_TOOLS: ToolFunction[];
/**
 * Write swap tools (require confirmation).
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const SWAP_WRITE_TOOLS: ToolFunction[];
/**
 * All swap tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const SWAP_TOOLS: ToolFunction[];
export type ToolFunction = import("../../server.js").ToolFunction;
import { quoteSwap } from './quoteSwap.js';
import { swap } from './swap.js';
export { quoteSwap, swap };
