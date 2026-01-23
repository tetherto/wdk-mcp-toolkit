/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'buy' tool for purchasing crypto with fiat currency.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function buy(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
