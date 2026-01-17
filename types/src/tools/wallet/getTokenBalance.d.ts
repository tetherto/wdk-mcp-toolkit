/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'getTokenBalance' tool for retrieving token balances.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getTokenBalance(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
