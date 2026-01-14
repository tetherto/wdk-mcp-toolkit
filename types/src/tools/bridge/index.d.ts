/**
 * Read-only bridge tools.
 *
 * @readonly
 * @type {import('../../server.js').ToolFunction[]}
 */
export const BRIDGE_READ_TOOLS: import("../../server.js").ToolFunction[];
/**
 * Write bridge tools (require confirmation).
 *
 * @readonly
 * @type {import('../../server.js').ToolFunction[]}
 */
export const BRIDGE_WRITE_TOOLS: import("../../server.js").ToolFunction[];
/**
 * All bridge tools.
 *
 * @readonly
 * @type {import('../../server.js').ToolFunction[]}
 */
export const BRIDGE_TOOLS: import("../../server.js").ToolFunction[];
import { quoteBridge } from './quoteBridge.js';
import { bridge } from './bridge.js';
export { quoteBridge, bridge };
