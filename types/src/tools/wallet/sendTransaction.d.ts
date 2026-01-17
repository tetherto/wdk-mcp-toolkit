/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'sendTransaction' tool for sending native currency transactions.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function sendTransaction(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
