/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'withdraw' tool for withdrawing from lending pools.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function withdraw(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
