import * as XLSX from 'xlsx';

const LOCAL_STORAGE_KEY = 'traceon_local_transactions';

export const REQUIRED_HEADERS = [
  'Transaction_ID',
  'Date',
  'Description',
  'Category',
  'Payment_Mode',
  'Credit',
  'Debit',
];

/**
 * Generate a unique Transaction ID
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
 * Download the Excel spreadsheet file.
 * Generates the .xlsx file directly from the live transaction records,
 * guaranteeing all records are present without stale HTTP or service worker caches.
 * @param {Array<Object>} [transactionsFallback]
 */
export async function downloadExcelFile(transactionsFallback = []) {
  let data = transactionsFallback;
  if (!data || data.length === 0) {
    data = await fetchTransactions();
  }

  const rows = (data || []).map((t) => [
    t.Transaction_ID || '',
    t.Date || '',
    t.Description || '',
    t.Category || '',
    t.Payment_Mode || '',
    t.Credit != null && t.Credit !== '' ? String(t.Credit) : '',
    t.Debit != null && t.Debit !== '' ? String(t.Debit) : '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([REQUIRED_HEADERS, ...rows]);
  ws['!cols'] = [
    { wch: 22 },
    { wch: 14 },
    { wch: 32 },
    { wch: 20 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
  ];

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
