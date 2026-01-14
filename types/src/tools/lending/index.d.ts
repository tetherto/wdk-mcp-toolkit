/**
 * Read-only lending tools.
 *
 * @readonly
 * @type {import('../../server.js').ToolFunction[]}
 */
export const LENDING_READ_TOOLS: import("../../server.js").ToolFunction[];
/**
 * Write lending tools (require confirmation).
 *
 * @readonly
 * @type {import('../../server.js').ToolFunction[]}
 */
export const LENDING_WRITE_TOOLS: import("../../server.js").ToolFunction[];
/**
 * All lending tools.
 *
 * @readonly
 * @type {import('../../server.js').ToolFunction[]}
 */
export const LENDING_TOOLS: import("../../server.js").ToolFunction[];
import { quoteSupply } from './quoteSupply.js';
import { supply } from './supply.js';
import { quoteWithdraw } from './quoteWithdraw.js';
import { withdraw } from './withdraw.js';
import { quoteBorrow } from './quoteBorrow.js';
import { borrow } from './borrow.js';
import { quoteRepay } from './quoteRepay.js';
import { repay } from './repay.js';
export { quoteSupply, supply, quoteWithdraw, withdraw, quoteBorrow, borrow, quoteRepay, repay };
