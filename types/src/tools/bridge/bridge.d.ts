/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'bridge' tool for executing cross-chain bridge operations.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function bridge(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
