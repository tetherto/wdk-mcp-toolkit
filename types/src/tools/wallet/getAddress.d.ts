/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'getAddress' tool for retrieving wallet addresses.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getAddress(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
