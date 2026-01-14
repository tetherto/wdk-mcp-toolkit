/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'getSupportedCryptoAssets' tool for listing supported crypto assets.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getSupportedCryptoAssets(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
