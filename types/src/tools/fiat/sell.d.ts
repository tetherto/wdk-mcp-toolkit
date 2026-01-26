/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'sell' tool for selling crypto for fiat currency.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function sell(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
