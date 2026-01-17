/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'quoteBorrow' tool for quoting lending pool borrows.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function quoteBorrow(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
