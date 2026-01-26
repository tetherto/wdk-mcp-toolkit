/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'supply' tool for supplying tokens to lending pools.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function supply(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
