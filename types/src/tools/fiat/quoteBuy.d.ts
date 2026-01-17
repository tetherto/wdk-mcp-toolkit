/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'quoteBuy' tool for quoting fiat-to-crypto purchases.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function quoteBuy(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
