import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';

export const EXCEL_FILE_NAME = 'Traceon_Transactions.xlsx';
export const EXCEL_FILE_PATH = path.resolve(process.cwd(), EXCEL_FILE_NAME);
export const RAW_DATA_SHEET_NAME = 'Raw_Data';

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
  { wch: 16 }, // Total (Running Balance)
];

/**
 * Builds chronological rows and dynamic formula for running Total balance.
 * Row 2: =E2-F2
 * Row i: =G{i-1}+E{i}-F{i}
 */
export function buildExcelRows(transactions) {
  // Sort chronologically (oldest to newest)
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
 * Ensure the Excel file exists on disk. If not, create it with standard headers.
 */
export function ensureExcelFile() {
  if (!fs.existsSync(EXCEL_FILE_PATH)) {
    console.log(`[TraceOn Excel] Creating new Excel spreadsheet at: ${EXCEL_FILE_PATH}`);
    const ws = XLSX.utils.aoa_to_sheet([REQUIRED_HEADERS]);
    ws['!cols'] = DEFAULT_COL_WIDTHS;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, RAW_DATA_SHEET_NAME);
    XLSX.writeFile(wb, EXCEL_FILE_PATH);
  }
  return EXCEL_FILE_PATH;
}

/**
 * Read all transactions from the Excel file on disk.
 * @returns {Array<Object>} List of transaction objects
 */
export function getTransactions() {
  ensureExcelFile();
  try {
    const wb = XLSX.readFile(EXCEL_FILE_PATH, { cellDates: false });
    const sheet = wb.Sheets[RAW_DATA_SHEET_NAME] || wb.Sheets[wb.SheetNames[0]];
    if (!sheet) return [];

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    return rows.map((r, index) => {
      const creditStr = r.Credit != null && r.Credit !== '' ? String(r.Credit).trim() : '';
      const debitStr = r.Debit != null && r.Debit !== '' ? String(r.Debit).trim() : '';
      const totalStr = r.Total != null && r.Total !== '' ? String(r.Total).trim() : '';

      return {
        Transaction_ID: r.Transaction_ID
          ? String(r.Transaction_ID).trim()
          : `TXN_${index + 1}_${r.Date || ''}_${(r.Description || '').replace(/\s+/g, '')}`,
        Date: r.Date ? String(r.Date).trim() : '',
        Description: r.Description ? String(r.Description).trim() : '',
        Category: r.Category ? String(r.Category).trim() : '',
        Payment_Mode: r.Payment_Mode ? String(r.Payment_Mode).trim() : '',
        Credit: creditStr,
        Debit: debitStr,
        Total: totalStr,
      };
    });
  } catch (err) {
    console.error('[TraceOn Excel] Error reading transactions:', err);
    return [];
  }
}

/**
 * Overwrite transactions in the Excel sheet without Transaction_ID column,
 * adding the Total balance column.
 * @param {Array<Object>} transactions
 */
export function writeTransactions(transactions) {
  const dataRows = buildExcelRows(transactions);
  const aoa = [REQUIRED_HEADERS, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = DEFAULT_COL_WIDTHS;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, RAW_DATA_SHEET_NAME);
  XLSX.writeFile(wb, EXCEL_FILE_PATH);
  console.log(`[TraceOn Excel] Recorded ${transactions.length} rows to ${EXCEL_FILE_NAME}`);
}

/**
 * Add a new transaction (income or expense) to the Excel sheet in the background.
 * @param {Object} tx
 * @returns {Object} Added transaction
 */
export function addTransaction(tx) {
  const current = getTransactions();
  const filtered = current.filter((t) => t.Transaction_ID !== tx.Transaction_ID);
  const updated = [tx, ...filtered];
  writeTransactions(updated);
  return tx;
}

/**
 * Update an existing transaction by ID.
 * @param {Object} updatedTx
 * @returns {Object} Updated transaction
 */
export function updateTransaction(updatedTx) {
  const current = getTransactions();
  let found = false;
  const updated = current.map((t) => {
    if (t.Transaction_ID === updatedTx.Transaction_ID) {
      found = true;
      return { ...t, ...updatedTx };
    }
    return t;
  });

  if (!found) {
    updated.unshift(updatedTx);
  }

  writeTransactions(updated);
  return updatedTx;
}

/**
 * Delete a transaction by ID.
 * @param {string} transactionId
 * @returns {boolean}
 */
export function deleteTransaction(transactionId) {
  const current = getTransactions();
  const updated = current.filter((t) => t.Transaction_ID !== transactionId);
  writeTransactions(updated);
  return true;
}
