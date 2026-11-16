import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';

export const EXCEL_FILE_NAME = 'Traceon_Transactions.xlsx';
export const EXCEL_FILE_PATH = path.resolve(process.cwd(), EXCEL_FILE_NAME);
export const RAW_DATA_SHEET_NAME = 'Raw_Data';

export const REQUIRED_HEADERS = [
  'Transaction_ID',
  'Date',
  'Description',
  'Category',
  'Payment_Mode',
  'Credit',
  'Debit',
];

const DEFAULT_COL_WIDTHS = [
  { wch: 22 }, // Transaction_ID
  { wch: 14 }, // Date
  { wch: 32 }, // Description
  { wch: 20 }, // Category
  { wch: 18 }, // Payment_Mode
  { wch: 14 }, // Credit (Income)
  { wch: 14 }, // Debit (Expense)
];

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
    return rows.map((r, index) => ({
      Transaction_ID: r.Transaction_ID ? String(r.Transaction_ID).trim() : `TXN_LOCAL_${index + 1}`,
      Date: r.Date ? String(r.Date).trim() : '',
      Description: r.Description ? String(r.Description).trim() : '',
      Category: r.Category ? String(r.Category).trim() : '',
      Payment_Mode: r.Payment_Mode ? String(r.Payment_Mode).trim() : '',
      Credit: r.Credit != null && r.Credit !== '' ? String(r.Credit).trim() : '',
      Debit: r.Debit != null && r.Debit !== '' ? String(r.Debit).trim() : '',
    }));
  } catch (err) {
    console.error('[TraceOn Excel] Error reading transactions:', err);
    return [];
  }
}

/**
 * Overwrite transactions in the Excel sheet with provided records.
 * @param {Array<Object>} transactions
 */
export function writeTransactions(transactions) {
  const dataRows = transactions.map((t) => [
    t.Transaction_ID || '',
    t.Date || '',
    t.Description || '',
    t.Category || '',
    t.Payment_Mode || '',
    t.Credit != null && t.Credit !== '' ? String(t.Credit) : '',
    t.Debit != null && t.Debit !== '' ? String(t.Debit) : '',
  ]);

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
  // Newest transactions at the top, or preserved order
  const updated = [tx, ...current.filter((t) => t.Transaction_ID !== tx.Transaction_ID)];
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
