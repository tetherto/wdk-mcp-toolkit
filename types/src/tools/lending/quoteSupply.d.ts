/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'quoteSupply' tool for quoting lending pool supply operations.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function quoteSupply(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
