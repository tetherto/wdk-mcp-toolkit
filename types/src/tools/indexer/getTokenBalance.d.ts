/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'getIndexerTokenBalance' tool for querying indexed token balances.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getIndexerTokenBalance(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
