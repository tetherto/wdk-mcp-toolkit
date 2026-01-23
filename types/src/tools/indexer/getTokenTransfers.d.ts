/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'getTokenTransfers' tool for querying token transfer history.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getTokenTransfers(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
