/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'quoteWithdraw' tool for quoting lending pool withdrawals.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function quoteWithdraw(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
