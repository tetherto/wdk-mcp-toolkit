/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'transfer' tool for transferring tokens.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function transfer(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
