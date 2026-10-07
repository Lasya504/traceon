/**
 * ═══════════════════════════════════════════════════
 * TraceOn — Dashboard Metrics Utility
 * ═══════════════════════════════════════════════════
 *
 * Pure, side-effect-free functions that derive all
 * dashboard-level metrics from raw transaction arrays.
 *
 * All callers should pass the canonical transactions
 * array from AppContext (already fetched from Google
 * Sheets).  No fetch calls happen here.
 */

import { parseAmount, getYearMonth } from './analytics';

/**
 * Derive the complete set of dashboard metrics from
 * a raw transaction array.
 *
 * @param {Array}  allTransactions  - Full canonical list (all months)
 * @param {string} selectedMonth    - "YYYY-MM" string for the current view
 * @param {number} [recentLimit=5]  - How many recent transactions to return
 * @returns {DashboardMetrics}
 *
 * @typedef {Object} DashboardMetrics
 * @property {number}   allTimeIncome          - Sum of Credit across all transactions
 * @property {number}   allTimeExpenses        - Sum of Debit  across all transactions
 * @property {number}   allTimeBalance         - allTimeIncome − allTimeExpenses
 * @property {number}   currentMonthIncome     - Income for selectedMonth
 * @property {number}   currentMonthExpenses   - Expenses for selectedMonth
 * @property {number}   currentMonthBalance    - currentMonthIncome − currentMonthExpenses
 * @property {number}   currentMonthTxCount    - Number of transactions in selectedMonth
 * @property {Array}    recentTransactions     - Up to recentLimit tx sorted newest-first
 * @property {boolean}  hasData               - true when allTransactions is non-empty
 */
export function computeDashboardMetrics(
  allTransactions,
  selectedMonth,
  recentLimit = 5
) {
  const EMPTY = {
    allTimeIncome: 0,
    allTimeExpenses: 0,
    allTimeBalance: 0,
    currentMonthIncome: 0,
    currentMonthExpenses: 0,
    currentMonthBalance: 0,
    currentMonthTxCount: 0,
    recentTransactions: [],
    hasData: false,
  };

  if (!Array.isArray(allTransactions) || allTransactions.length === 0) {
    return EMPTY;
  }

  let allTimeIncome = 0;
  let allTimeExpenses = 0;
  let currentMonthIncome = 0;
  let currentMonthExpenses = 0;
  let currentMonthTxCount = 0;

  for (const tx of allTransactions) {
    if (!tx) continue;

    const credit = parseAmount(tx.Credit);
    const debit  = parseAmount(tx.Debit);

    // All-time totals
    allTimeIncome    += credit;
    allTimeExpenses  += debit;

    // Current-month totals
    const ym = getYearMonth(tx.Date);
    if (ym === selectedMonth) {
      currentMonthIncome   += credit;
      currentMonthExpenses += debit;
      currentMonthTxCount  += 1;
    }
  }

  // Recent transactions: sort all by date descending, take first N
  const recentTransactions = [...allTransactions]
    .filter((tx) => tx && tx.Date)
    .sort((a, b) => {
      // String comparison on YYYY-MM-DD is safe for ISO dates
      if (b.Date < a.Date) return -1;
      if (b.Date > a.Date) return 1;
      return 0;
    })
    .slice(0, recentLimit);

  return {
    allTimeIncome,
    allTimeExpenses,
    allTimeBalance: allTimeIncome - allTimeExpenses,
    currentMonthIncome,
    currentMonthExpenses,
    currentMonthBalance: currentMonthIncome - currentMonthExpenses,
    currentMonthTxCount,
    recentTransactions,
    hasData: allTransactions.length > 0,
  };
}
