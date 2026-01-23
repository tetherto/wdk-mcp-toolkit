/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'borrow' tool for borrowing from lending pools.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function borrow(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
