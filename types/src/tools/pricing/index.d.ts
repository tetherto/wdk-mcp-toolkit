/** @typedef {import('../../server.js').ToolFunction} ToolFunction */
/**
 * All pricing tools.
 *
 * @readonly
 * @type {ToolFunction[]}
 */
export const PRICING_TOOLS: ToolFunction[];
export type ToolFunction = import("../../server.js").ToolFunction;
import { getCurrentPrice } from './getCurrentPrice.js';
import { getHistoricalPrice } from './getHistoricalPrice.js';
export { getCurrentPrice, getHistoricalPrice };
