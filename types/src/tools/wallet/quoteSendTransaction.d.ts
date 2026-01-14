/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'quoteSendTransaction' tool for quoting transaction fees.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function quoteSendTransaction(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
