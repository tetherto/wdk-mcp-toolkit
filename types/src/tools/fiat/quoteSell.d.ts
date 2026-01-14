/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'quoteSell' tool for quoting crypto-to-fiat sales.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function quoteSell(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
