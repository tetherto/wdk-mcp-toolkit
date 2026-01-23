/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'getFeeRates' tool for retrieving network fee rates.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getFeeRates(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
