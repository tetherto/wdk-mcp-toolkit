/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'getFiatTransactionDetail' tool for retrieving fiat transaction status.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getTransactionDetail(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
