/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'sign' tool for signing messages.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function sign(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
