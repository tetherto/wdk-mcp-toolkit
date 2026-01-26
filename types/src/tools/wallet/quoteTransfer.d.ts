/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'quoteTransfer' tool for quoting token transfer fees.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function quoteTransfer(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
