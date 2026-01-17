/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'swap' tool for executing token swaps.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function swap(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
