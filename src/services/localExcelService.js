import * as XLSX from 'xlsx';

const LOCAL_STORAGE_KEY = 'traceon_local_transactions';

export const REQUIRED_HEADERS = [
  'Date',
  'Description',
  'Category',
  'Payment_Mode',
  'Credit',
  'Debit',
  'Total',
];

const DEFAULT_COL_WIDTHS = [
  { wch: 14 }, // Date
  { wch: 32 }, // Description
  { wch: 20 }, // Category
  { wch: 18 }, // Payment_Mode
  { wch: 14 }, // Credit (Income)
  { wch: 14 }, // Debit (Expense)
  { wch: 16 }, // Total (Balance)
];

/**
 * Generate a unique Transaction ID for internal client state
 */
export function generateTransactionId() {
  return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
}

/**
 * Load cached transactions from localStorage as fallback.
 */
function getLocalCache() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save transactions to localStorage fallback cache.
 */
function setLocalCache(records) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

/**
 * Normalise amount to clean string without trailing .0
 */
function normalizeAmount(value) {
  if (value == null || value === '') return '';
  const n = parseFloat(value);
  if (isNaN(n) || n === 0) return '';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * Builds chronological rows and dynamic formula for running Total balance.
 * Row 2: =E2-F2
 * Row i: =G{i-1}+E{i}-F{i}
 */
export function buildExcelRows(transactions) {
  const sorted = [...transactions].sort((a, b) => {
    const da = a.Date || '';
    const db = b.Date || '';
    if (da < db) return -1;
    if (da > db) return 1;
    const ca = parseFloat(a.Credit) || 0;
    const cb = parseFloat(b.Credit) || 0;
    if (ca > 0 && cb === 0) return -1;
    if (cb > 0 && ca === 0) return 1;
    return 0;
  });

  let runningBalance = 0;
  return sorted.map((t, idx) => {
    const credit = parseFloat(t.Credit) || 0;
    const debit = parseFloat(t.Debit) || 0;
    runningBalance += (credit - debit);

    const rowIndex = idx + 2; // Row 1 is header
    const formula = rowIndex === 2 ? 'E2-F2' : `G${rowIndex - 1}+E${rowIndex}-F${rowIndex}`;
    const totalCell = {
      t: 'n',
      v: Number.isInteger(runningBalance) ? runningBalance : parseFloat(runningBalance.toFixed(2)),
      f: formula,
    };

    return [
      t.Date || '',
      t.Description || '',
      t.Category || '',
      t.Payment_Mode || '',
      credit > 0 ? (Number.isInteger(credit) ? credit : parseFloat(credit.toFixed(2))) : '',
      debit > 0 ? (Number.isInteger(debit) ? debit : parseFloat(debit.toFixed(2))) : '',
      totalCell,
    ];
  });
}

/**
 * Fetch all transactions from the local Excel file via API with cache-busting.
 * Falls back to localStorage cache if offline.
 * @returns {Promise<Array<Object>>}
 */
export async function fetchTransactions() {
  try {
    const res = await fetch(`/api/transactions?_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.records)) {
        setLocalCache(data.records);
        return data.records;
      }
    }
  } catch (err) {
    console.warn('[TraceOn] Backend API fetch failed, using local cache:', err);
  }

  return getLocalCache();
}

/**
 * Record a new transaction (income or expense) into the local Excel sheet.
 * @param {Object} tx
 * @returns {Promise<Object>}
 */
export async function addTransaction(tx) {
  const normalized = {
    ...tx,
    Credit: normalizeAmount(tx.Credit),
    Debit: normalizeAmount(tx.Debit),
  };

  try {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: normalized }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.record) {
        const cache = getLocalCache();
        setLocalCache([data.record, ...cache.filter((t) => t.Transaction_ID !== data.record.Transaction_ID)]);
        return data.record;
      }
    }
  } catch (err) {
    console.warn('[TraceOn] Backend API add failed, saving to local cache:', err);
  }

  // Fallback cache update
  const cache = getLocalCache();
  const updated = [normalized, ...cache.filter((t) => t.Transaction_ID !== normalized.Transaction_ID)];
  setLocalCache(updated);
  return normalized;
}

/**
 * Update an existing transaction in the local Excel sheet.
 * @param {Object} tx
 * @returns {Promise<Object>}
 */
export async function updateTransaction(tx) {
  const normalized = {
    ...tx,
    Credit: normalizeAmount(tx.Credit),
    Debit: normalizeAmount(tx.Debit),
  };

  try {
    const res = await fetch('/api/transactions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: normalized }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.record) {
        const cache = getLocalCache();
        const updated = cache.map((t) => (t.Transaction_ID === data.record.Transaction_ID ? data.record : t));
        setLocalCache(updated);
        return data.record;
      }
    }
  } catch (err) {
    console.warn('[TraceOn] Backend API update failed, saving to local cache:', err);
  }

  // Fallback cache update
  const cache = getLocalCache();
  const updated = cache.map((t) => (t.Transaction_ID === normalized.Transaction_ID ? normalized : t));
  setLocalCache(updated);
  return normalized;
}

/**
 * Delete a transaction from the local Excel sheet.
 * @param {string} transactionId
 * @returns {Promise<boolean>}
 */
export async function deleteTransaction(transactionId) {
  try {
    const res = await fetch(`/api/transactions?id=${encodeURIComponent(transactionId)}&_t=${Date.now()}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const cache = getLocalCache();
        setLocalCache(cache.filter((t) => t.Transaction_ID !== transactionId));
        return true;
      }
    }
  } catch (err) {
    console.warn('[TraceOn] Backend API delete failed, updating local cache:', err);
  }

  const cache = getLocalCache();
  setLocalCache(cache.filter((t) => t.Transaction_ID !== transactionId));
  return true;
}

/**
 * Download the Excel spreadsheet file without Transaction_ID column,
 * with Total balance column and dynamic running formulas.
 * @param {Array<Object>} [transactionsFallback]
 */
export async function downloadExcelFile(transactionsFallback = []) {
  let data = transactionsFallback;
  if (!data || data.length === 0) {
    data = await fetchTransactions();
  }

  const rows = buildExcelRows(data || []);
  const ws = XLSX.utils.aoa_to_sheet([REQUIRED_HEADERS, ...rows]);
  ws['!cols'] = DEFAULT_COL_WIDTHS;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Raw_Data');
  XLSX.writeFile(wb, 'Traceon_Transactions.xlsx');
}

/**
 * Check backend status.
 */
export async function checkServerStatus() {
  try {
    const res = await fetch(`/api/status?_t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (res.ok) return await res.json();
  } catch {
    return { success: false, mode: 'local-offline' };
  }
}
