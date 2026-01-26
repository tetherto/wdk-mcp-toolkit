/** @typedef {import('../../server.js').WdkMcpServer} WdkMcpServer */
/**
 * Registers the 'getMaxSpendableBtc' tool for calculating maximum spendable Bitcoin.
 *
 * @param {WdkMcpServer} server - The MCP server instance.
 * @returns {void}
 */
export function getMaxSpendableBtc(server: WdkMcpServer): void;
export type WdkMcpServer = import("../../server.js").WdkMcpServer;
