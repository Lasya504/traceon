/**
 * ═══════════════════════════════════════════════════
 * TraceOn — Analytics Business Logic & Normalization
 * ═══════════════════════════════════════════════════
 * 
 * Pure, independently testable calculation utilities.
 * Handles data normalization, safe parsing, category
 * breakdowns, and monthly trends without timezone shifts.
 */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Safely parse numeric amounts from Google Sheets strings.
 * Handles: "1500", "1,500", "₹1500", 1500, "", null, undefined, NaN.
 * Always returns a non-negative finite number.
 * 
 * @param {any} val 
 * @returns {number}
 */
export function parseAmount(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') {
    return isNaN(val) || !isFinite(val) ? 0 : Math.max(0, val);
  }
  if (typeof val !== 'string') return 0;

  // Strip currency symbols, commas, spaces
  const cleaned = val.replace(/[^0-9.-]/g, '').trim();
  if (!cleaned) return 0;

  const num = parseFloat(cleaned);
  return isNaN(num) || !isFinite(num) ? 0 : Math.max(0, num);
}

/**
 * Extract YYYY-MM from a Date string (YYYY-MM-DD) without timezone shifts.
 * 
 * @param {string} dateStr 
 * @returns {string|null} e.g. "2026-10"
 */
export function getYearMonth(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split(/[-/]/);
  if (parts.length >= 2) {
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    if (y.length === 4 && m.length === 2 && !isNaN(Number(y)) && !isNaN(Number(m))) {
      return `${y}-${m}`;
    }
  }
  return null;
}

/**
 * Format a YYYY-MM string to "Oct 2026"
 * 
 * @param {string} ym 
 * @returns {string}
 */
export function formatMonthYear(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const idx = parseInt(m, 10) - 1;
  if (idx >= 0 && idx < 12) {
    return `${MONTH_NAMES[idx]} ${y}`;
  }
  return ym;
}

/**
 * Format a YYYY-MM string to "October 2026"
 * 
 * @param {string} ym 
 * @returns {string}
 */
export function formatMonthYearFull(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const idx = parseInt(m, 10) - 1;
  if (idx >= 0 && idx < 12) {
    return `${MONTH_NAMES_FULL[idx]} ${y}`;
  }
  return ym;
}

/**
 * Calculate core financial metrics for a set of transactions.
 * 
 * @param {Array} transactions 
 * @returns {Object}
 */
export function calculateMetrics(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      transactionCount: 0,
      expenseTransactionCount: 0,
      incomeTransactionCount: 0,
      averageExpense: 0,
      hasData: false,
    };
  }

  let totalIncome = 0;
  let totalExpenses = 0;
  let expenseCount = 0;
  let incomeCount = 0;

  for (const tx of transactions) {
    if (!tx) continue;
    const credit = parseAmount(tx.Credit);
    const debit = parseAmount(tx.Debit);

    if (credit > 0) {
      totalIncome += credit;
      incomeCount += 1;
    }
    if (debit > 0) {
      totalExpenses += debit;
      expenseCount += 1;
    }
  }

  const netBalance = totalIncome - totalExpenses;
  const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    transactionCount: transactions.length,
    expenseTransactionCount: expenseCount,
    incomeTransactionCount: incomeCount,
    averageExpense: Math.round(averageExpense),
    hasData: transactions.length > 0,
  };
}

/**
 * Calculate expense totals by category from actual transaction records.
 * Sorts highest spending categories first.
 * 
 * @param {Array} transactions 
 * @returns {Array<{ category: string, total: number, count: number, percentage: number }>}
 */
export function calculateCategoryBreakdown(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }

  const categoryMap = {};
  let totalExpenses = 0;

  for (const tx of transactions) {
    if (!tx) continue;
    const debit = parseAmount(tx.Debit);
    if (debit <= 0) continue; // Only count expenses

    const rawCategory = tx.Category;
    const category = (typeof rawCategory === 'string' && rawCategory.trim())
      ? rawCategory.trim()
      : 'Uncategorized';

    if (!categoryMap[category]) {
      categoryMap[category] = { category, total: 0, count: 0 };
    }
    categoryMap[category].total += debit;
    categoryMap[category].count += 1;
    totalExpenses += debit;
  }

  const sorted = Object.values(categoryMap).sort((a, b) => b.total - a.total);

  return sorted.map((item) => ({
    ...item,
    percentage: totalExpenses > 0
      ? Math.round((item.total / totalExpenses) * 1000) / 10
      : 0,
  }));
}

/**
 * Calculate monthly trends across all transactions.
 * Groups by YYYY-MM and sorts chronologically.
 * 
 * @param {Array} allTransactions 
 * @returns {Array<{ yearMonth: string, label: string, shortLabel: string, income: number, expense: number, net: number, count: number }>}
 */
export function calculateMonthlyTrends(allTransactions) {
  if (!Array.isArray(allTransactions) || allTransactions.length === 0) {
    return [];
  }

  const monthlyMap = {};

  for (const tx of allTransactions) {
    if (!tx || !tx.Date) continue;
    const ym = getYearMonth(tx.Date);
    if (!ym) continue;

    if (!monthlyMap[ym]) {
      const [y, m] = ym.split('-');
      const mIdx = parseInt(m, 10) - 1;
      const shortLabel = mIdx >= 0 && mIdx < 12 ? MONTH_NAMES[mIdx] : ym;

      monthlyMap[ym] = {
        yearMonth: ym,
        label: formatMonthYear(ym),
        shortLabel,
        income: 0,
        expense: 0,
        net: 0,
        count: 0,
      };
    }

    const credit = parseAmount(tx.Credit);
    const debit = parseAmount(tx.Debit);

    if (credit > 0) monthlyMap[ym].income += credit;
    if (debit > 0) monthlyMap[ym].expense += debit;
    monthlyMap[ym].count += 1;
  }

  const sortedKeys = Object.keys(monthlyMap).sort();

  return sortedKeys.map((ym) => {
    const item = monthlyMap[ym];
    item.net = item.income - item.expense;
    return item;
  });
}
