/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'verify' tool for verifying message signatures.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function verify(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
