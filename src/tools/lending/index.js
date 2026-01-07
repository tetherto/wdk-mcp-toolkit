'use strict'

import { quoteSupply } from './quoteSupply.js'
import { supply } from './supply.js'
import { quoteWithdraw } from './quoteWithdraw.js'
import { withdraw } from './withdraw.js'
import { quoteBorrow } from './quoteBorrow.js'
import { borrow } from './borrow.js'
import { quoteRepay } from './quoteRepay.js'
import { repay } from './repay.js'

export const lendingTools = [
  quoteSupply,
  supply,
  quoteWithdraw,
  withdraw,
  quoteBorrow,
  borrow,
  quoteRepay,
  repay
]

export const lendingReadTools = [
  quoteSupply,
  quoteWithdraw,
  quoteBorrow,
  quoteRepay
]

export const lendingWriteTools = [
  supply,
  withdraw,
  borrow,
  repay
]

export { quoteSupply, supply, quoteWithdraw, withdraw, quoteBorrow, borrow, quoteRepay, repay }