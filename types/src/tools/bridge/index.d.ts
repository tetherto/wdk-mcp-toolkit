/** @typedef {import('../../server.js').ToolFunction} ToolFunction */
/**
 * Read-only bridge tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const BRIDGE_READ_TOOLS: ToolFunction[];
/**
 * Write bridge tools (require confirmation).
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const BRIDGE_WRITE_TOOLS: ToolFunction[];
/**
 * All bridge tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const BRIDGE_TOOLS: ToolFunction[];
export type ToolFunction = import("../../server.js").ToolFunction;
import { quoteBridge } from './quoteBridge.js';
import { bridge } from './bridge.js';
export { quoteBridge, bridge };
