/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'quoteRepay' tool for quoting debt repayments.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function quoteRepay(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
