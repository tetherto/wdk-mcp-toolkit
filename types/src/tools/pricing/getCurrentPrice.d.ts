/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'getCurrentPrice' tool for fetching current spot prices.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getCurrentPrice(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
