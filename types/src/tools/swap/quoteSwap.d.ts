/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'quoteSwap' tool for quoting token swaps.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function quoteSwap(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
