/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'repay' tool for repaying borrowed assets.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function repay(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
