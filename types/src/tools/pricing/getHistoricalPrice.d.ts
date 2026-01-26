/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'getHistoricalPrice' tool for fetching historical price data.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getHistoricalPrice(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
