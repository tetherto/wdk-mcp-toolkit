/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'getSupportedCountries' tool for listing supported countries.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getSupportedCountries(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
