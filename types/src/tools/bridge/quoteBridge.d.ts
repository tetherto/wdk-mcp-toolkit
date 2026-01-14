/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'quoteBridge' tool for quoting cross-chain bridge operations.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function quoteBridge(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
