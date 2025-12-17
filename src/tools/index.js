'use strict'

import { registerGetAddress } from './getAddress.js'
import { registerGetFeeRates } from './getFeeRates.js'
import { registerGetBalance } from './getBalance.js'
import { registerGetMaxSpendable } from './getMaxSpendable.js'
import { registerQuoteSendTransaction } from './quoteSendTransaction.js'
import { registerGetTokenBalance } from './getTokenBalance.js'
import { registerQuoteTransfer } from './quoteTransfer.js'
import { registerSendTransaction } from './sendTransaction.js'
import { registerTransfer } from './transfer.js'
import { registerSign } from './sign.js'
import { registerVerify } from './verify.js'

/**
 * Register all standard tools for a chain.
 *
 * @param {import('../WdkMcpServer.js').WdkMcpServer} server - MCP server instance.
 * @param {string} chain - Chain name.
 */
export function registerReadonlyTools (server, chain) {
  registerGetAddress(server, chain)
  registerGetFeeRates(server, chain)
  registerGetBalance(server, chain)
  registerQuoteSendTransaction(server, chain)

  if (chain === 'bitcoin') {
    registerGetMaxSpendable(server, chain)
  }

  if (chain !== 'bitcoin') {
      registerGetTokenBalance(server, chain)
      registerQuoteTransfer(server, chain)
  }
}

export function registerWriteTools (server, chain) {
  registerSendTransaction(server, chain)
  registerSign(server, chain)
  registerVerify(server, chain)
  
  if (chain !== 'bitcoin') {
    registerTransfer(server, chain)
  }
}