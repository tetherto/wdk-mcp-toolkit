/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'getSupportedFiatCurrencies' tool for listing supported fiat currencies.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getSupportedFiatCurrencies(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
