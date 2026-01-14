/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'getBalance' tool for retrieving native token balances.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getBalance(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
