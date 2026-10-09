/**
 * ═══════════════════════════════════════════════════
 * TraceOn — Google Sheets API Service
 * ═══════════════════════════════════════════════════
 * Framework-independent service for inspecting, initializing,
 * and reading transactions from user-owned TraceOn Google Spreadsheets.
 */

export const REQUIRED_HEADERS = [
  'Transaction_ID',
  'Date',
  'Description',
  'Category',
  'Payment_Mode',
  'Credit',
  'Debit',
];

export const RAW_DATA_SHEET_NAME = 'Raw_Data';

/**
 * Storage helpers for caching user's active spreadsheet ID.
 * Strictly namespaced per authenticated Google user.
 * Never falls back to a global key or developer spreadsheet.
 */
export function getCachedSpreadsheetId(userId) {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    return localStorage.getItem(`traceon_spreadsheet_id_${userId}`) || null;
  } catch {
    return null;
  }
}

export function setCachedSpreadsheetId(userId, spreadsheetId) {
  if (typeof window === 'undefined' || !userId || !spreadsheetId) return;
  try {
    localStorage.setItem(`traceon_spreadsheet_id_${userId}`, spreadsheetId);
  } catch {}
}

export function clearCachedSpreadsheetId(userId) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.removeItem(`traceon_spreadsheet_id_${userId}`);
    // Also clean up any legacy global key so it cannot contaminate sessions
    localStorage.removeItem('traceon_spreadsheet_id');
  } catch {}
}

/**
 * Validates a user's TraceOn Google Spreadsheet.
 * Verifies:
 * 1. The spreadsheet exists and is accessible.
 * 2. The sheet 'Raw_Data' exists.
 *
 * @param {string} accessToken - In-memory OAuth 2.0 access token
 * @param {string} spreadsheetId - The target Google Spreadsheet ID
 * @returns {Promise<{ valid: boolean, reason?: string, spreadsheetId?: string, spreadsheetUrl?: string, title?: string, error?: string }>}
 */
export async function validateTraceOnSpreadsheet(accessToken, spreadsheetId) {
  if (!accessToken || !spreadsheetId) {
    return { valid: false, reason: 'missing_credentials' };
  }

  try {
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=properties.title,sheets.properties`;
    const metaData = await sheetsApiFetch(metaUrl, accessToken, {
      operation: 'validateTraceOnSpreadsheet:fetchMetadata',
    });
    const sheets = metaData?.sheets || [];
    const rawDataSheet = sheets.find(
      (s) => s.properties && s.properties.title === RAW_DATA_SHEET_NAME
    );

    if (!rawDataSheet) {
      console.warn(`[TraceOn] Validation check: Spreadsheet ${spreadsheetId} exists but sheet "${RAW_DATA_SHEET_NAME}" was not found.`);
      return {
        valid: false,
        reason: 'no_raw_data',
        title: metaData?.properties?.title || 'TraceOn',
      };
    }

    return {
      valid: true,
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      title: metaData?.properties?.title || 'TraceOn',
    };
  } catch (err) {
    console.warn(`[TraceOn] Validation check failed for spreadsheet ${spreadsheetId}:`, err.message);
    return {
      valid: false,
      reason: 'inaccessible',
      error: err.message,
    };
  }
}

/**
 * Parses and sanitizes Google Sheets API errors.
 * Never logs or returns auth tokens or secrets.
 *
 * @param {Response} response
 * @param {any} data
 * @param {string} operation
 * @returns {Error}
 */
function createSanitizedApiError(response, data, operation = 'Google Sheets API') {
  const apiError = data?.error || {};
  const sanitizedError = {
    operation,
    httpStatus: response.status,
    status: apiError.status || undefined,
    code: apiError.code || response.status,
    message: apiError.message || `Google Sheets API error (HTTP ${response.status})`,
    reason: apiError.errors?.[0]?.reason || undefined,
    domain: apiError.errors?.[0]?.domain || undefined,
    errors: apiError.errors || undefined,
    details: apiError.details || undefined,
  };

  console.error(`[TraceOn] ${operation} failed:`, sanitizedError);

  const parts = [`${operation} (HTTP ${response.status})`];
  if (sanitizedError.status) parts.push(`[${sanitizedError.status}]`);
  parts.push(`— ${sanitizedError.message}`);
  if (sanitizedError.reason) parts.push(`(reason: ${sanitizedError.reason})`);

  const error = new Error(parts.join(' '));
  error.httpStatus = response.status;
  return error;
}

/**
 * Generic fetch wrapper with sanitized error handling.
 */
async function sheetsApiFetch(url, accessToken, options = {}) {
  const { operation = 'Google Sheets API', ...fetchOptions } = options;
  let response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });
  } catch (netErr) {
    const error = new Error(`${operation} network failure: ${netErr.message}`);
    error.isNetworkError = true;
    throw error;
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(`${operation} invalid response (HTTP ${response.status})`);
    }
  }

  if (!response.ok) {
    throw createSanitizedApiError(response, data, operation);
  }

  return data;
}

/**
 * Normalizes dates from Google Sheets into canonical YYYY-MM-DD strings.
 * Handles:
 * - "2026-10-07" -> "2026-10-07"
 * - "2026/10/07" -> "2026-10-07"
 * - "10/07/2026", "10/7/2026" -> "2026-10-07"
 * - "10/5/2026 5:00:00" -> "2026-10-05"
 * - Google Serial Dates (e.g. 46300) -> "2026-10-05"
 * - Invalid/empty -> ""
 *
 * @param {any} val
 * @returns {string}
 */
export function normalizeSheetDate(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (!str) return '';

  // 1. Direct ISO format YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 2. US date format M/D/YYYY or MM/DD/YYYY
  const usMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (usMatch) {
    const [, m, d, y] = usMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 3. Check for Google Sheets serial date number (e.g. 46300 or 46300.22917)
  const num = parseFloat(str);
  if (!isNaN(num) && num > 30000 && num < 70000) {
    // Google Sheets epoch: Dec 30 1899
    const utcDays = Math.floor(num - 25569);
    const dateObj = new Date(utcDays * 86400 * 1000);
    if (!isNaN(dateObj.getTime())) {
      const y = dateObj.getUTCFullYear();
      const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // Fallback: return trimmed string
  return str;
}

/**
 * Normalizes numeric Credit/Debit amounts from Google Sheets.
 * Preserves empty cells as empty strings.
 * Strips currency symbols and commas.
 *
 * @param {any} val
 * @returns {string}
 */
export function normalizeSheetAmount(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    if (isNaN(val) || val <= 0) return '';
    return Number.isInteger(val) ? String(val) : val.toFixed(2);
  }

  const str = String(val).replace(/[^0-9.-]/g, '').trim();
  if (!str) return '';

  const num = parseFloat(str);
  if (isNaN(num) || num <= 0) return '';
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

/**
 * Initializes a user's TraceOn Google Spreadsheet.
 *
 * Behavior:
 * 1. Checks if a sheet named 'Raw_Data' already exists.
 * 2. If no 'Raw_Data' sheet exists, renames the first sheet (e.g. Sheet1) to 'Raw_Data',
 *    or creates 'Raw_Data' if no sheets exist to rename.
 * 3. Checks the header row (A1:G1) in 'Raw_Data'.
 * 4. If A1:G1 is empty, writes standard headers:
 *    [Transaction_ID, Date, Description, Category, Payment_Mode, Credit, Debit]
 * 5. If Raw_Data already exists and has data/headers, leaves existing data untouched.
 *
 * This function is fully idempotent.
 *
 * @param {string} accessToken - In-memory OAuth 2.0 access token
 * @param {string} spreadsheetId - The target Google Spreadsheet ID
 * @returns {Promise<{ initialized: boolean, sheetName: string, headers: string[] }>}
 */
export async function initializeTraceOnSpreadsheet(accessToken, spreadsheetId) {
  if (!accessToken) {
    throw new Error('Authentication required: Missing access token');
  }
  if (!spreadsheetId) {
    throw new Error('Missing spreadsheetId: Cannot initialize spreadsheet');
  }

  // 1. Fetch spreadsheet metadata (sheets list)
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties`;
  const metaData = await sheetsApiFetch(metaUrl, accessToken, {
    operation: 'initializeTraceOnSpreadsheet:fetchMetadata',
  });

  const sheets = metaData.sheets || [];
  let rawDataSheet = sheets.find(
    (s) => s.properties && s.properties.title === RAW_DATA_SHEET_NAME
  );

  // 2. If Raw_Data does not exist, rename first sheet or add Raw_Data sheet
  if (!rawDataSheet) {
    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`;

    const sheet1Sheet = sheets.find(
      (s) => s.properties && s.properties.title === 'Sheet1'
    );

    if (sheets.length === 1 && sheets[0]?.properties?.sheetId !== undefined) {
      // Single default sheet exists: rename it to Raw_Data
      const firstSheetId = sheets[0].properties.sheetId;
      await sheetsApiFetch(batchUrl, accessToken, {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId: firstSheetId,
                  title: RAW_DATA_SHEET_NAME,
                },
                fields: 'title',
              },
            },
          ],
        }),
        operation: 'initializeTraceOnSpreadsheet:renameDefaultSheet',
      });
    } else if (sheet1Sheet && sheet1Sheet.properties.sheetId !== undefined) {
      // Sheet1 exists among multiple sheets: rename Sheet1 to Raw_Data
      await sheetsApiFetch(batchUrl, accessToken, {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId: sheet1Sheet.properties.sheetId,
                  title: RAW_DATA_SHEET_NAME,
                },
                fields: 'title',
              },
            },
          ],
        }),
        operation: 'initializeTraceOnSpreadsheet:renameSheet1',
      });
    } else {
      // Add a new sheet named Raw_Data
      await sheetsApiFetch(batchUrl, accessToken, {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: RAW_DATA_SHEET_NAME,
                },
              },
            },
          ],
        }),
        operation: 'initializeTraceOnSpreadsheet:addRawDataSheet',
      });
    }
  }

  // 3. Inspect existing headers in Raw_Data!A1:G1
  const range = `${RAW_DATA_SHEET_NAME}!A1:G1`;
  const getValuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
  const valuesData = await sheetsApiFetch(getValuesUrl, accessToken, {
    operation: 'initializeTraceOnSpreadsheet:readHeaders',
  });

  const existingRow = valuesData?.values?.[0] || [];

  // Check if correct required headers already exist
  const hasCorrectHeaders =
    existingRow.length >= REQUIRED_HEADERS.length &&
    REQUIRED_HEADERS.every(
      (reqHeader, idx) =>
        existingRow[idx] &&
        String(existingRow[idx]).trim().toLowerCase() === reqHeader.toLowerCase()
    );

  // 4. If correct headers are not present, write standard headers
  // Never overwrites existing transaction data in row 2+
  if (!hasCorrectHeaders) {
    const putValuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    await sheetsApiFetch(putValuesUrl, accessToken, {
      method: 'PUT',
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [REQUIRED_HEADERS],
      }),
      operation: 'initializeTraceOnSpreadsheet:writeHeaders',
    });
  }

  return {
    initialized: true,
    sheetName: RAW_DATA_SHEET_NAME,
    headers: REQUIRED_HEADERS,
  };
}

/**
 * Reads all transaction records from the user's TraceOn Google Spreadsheet.
 *
 * Flow:
 * 1. Checks spreadsheet metadata to verify 'Raw_Data' exists.
 * 2. Fetches Raw_Data!A:G.
 * 3. Validates that the first row contains the required TraceOn schema headers.
 * 4. Normalizes all subsequent data rows into standard TraceOn transaction objects.
 * 5. Safely filters out completely empty rows.
 *
 * @param {string} accessToken - In-memory OAuth 2.0 access token
 * @param {string} spreadsheetId - The target Google Spreadsheet ID
 * @returns {Promise<Array<Object>>} List of transaction objects
 */
export async function getTraceOnTransactions(accessToken, spreadsheetId) {
  if (!accessToken) {
    throw new Error('Authentication required: Missing access token');
  }
  if (!spreadsheetId) {
    throw new Error('Missing spreadsheetId: Cannot read transactions');
  }

  try {
  // 1. Verify spreadsheet existence and inspect sheets
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties`;
  const metaData = await sheetsApiFetch(metaUrl, accessToken, {
    operation: 'getTraceOnTransactions:fetchMetadata',
  });

  const sheets = metaData.sheets || [];
  const rawDataSheet = sheets.find(
    (s) => s.properties && s.properties.title === RAW_DATA_SHEET_NAME
  );

  if (!rawDataSheet) {
    throw new Error(
      `Spreadsheet validation failed: Sheet "${RAW_DATA_SHEET_NAME}" was not found. Please initialize the spreadsheet.`
    );
  }

  // 2. Fetch all values from Raw_Data!A:G
  const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(RAW_DATA_SHEET_NAME + '!A:G')}`;
  const valuesData = await sheetsApiFetch(valuesUrl, accessToken, {
    operation: 'getTraceOnTransactions:fetchValues',
  });

  const allRows = valuesData?.values || [];

  if (allRows.length === 0) {
    throw new Error(
      `Spreadsheet validation failed: "${RAW_DATA_SHEET_NAME}" is completely empty. Please initialize headers.`
    );
  }

  // 3. Validate Header Row
  const headerRow = allRows[0].map((h) => (h ? String(h).trim() : ''));
  const headerMismatch = REQUIRED_HEADERS.some(
    (requiredCol, idx) =>
      !headerRow[idx] ||
      headerRow[idx].toLowerCase() !== requiredCol.toLowerCase()
  );

  if (headerMismatch) {
    throw new Error(
      `Spreadsheet schema mismatch: Expected headers [${REQUIRED_HEADERS.join(', ')}], but found [${headerRow.join(', ')}].`
    );
  }

  // 4. Map and Normalize Data Rows
  const dataRows = allRows.slice(1);
  const transactions = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row || row.length === 0) continue;

    // Check if entire row is empty / whitespace
    const isEmpty = row.every((cell) => !cell || String(cell).trim() === '');
    if (isEmpty) continue;

    const rawId = row[0] ? String(row[0]).trim() : '';
    const rawDate = row[1];
    const rawDesc = row[2] ? String(row[2]).trim() : '';
    const rawCat = row[3] ? String(row[3]).trim() : '';
    const rawMode = row[4] ? String(row[4]).trim() : '';
    const rawCredit = row[5];
    const rawDebit = row[6];

    transactions.push({
      Transaction_ID: rawId || `TXN_ROW_${i + 2}`,
      Date: normalizeSheetDate(rawDate),
      Description: rawDesc,
      Category: rawCat,
      Payment_Mode: rawMode,
      Credit: normalizeSheetAmount(rawCredit),
      Debit: normalizeSheetAmount(rawDebit),
    });
  }

  return transactions;
  } catch (err) {
    throw toUserFacingSheetsError(err, "Couldn't load transactions from your Google Sheet.");
  }
}

export function generateTransactionId() {
  return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
}

function normalizeAmount(value) {
  const n = parseFloat(value);
  if (!n || n <= 0) return '';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function validateTransaction(tx) {
  if (!tx.Transaction_ID) throw new Error('Missing Transaction_ID');
  if (!tx.Date || !/^\d{4}-\d{2}-\d{2}$/.test(tx.Date)) throw new Error('Date must be in YYYY-MM-DD format');
  if (!tx.Description || !tx.Description.trim()) throw new Error('Description is required');
  if (!tx.Category || !tx.Category.trim()) throw new Error('Category is required');
  if (!tx.Payment_Mode || !tx.Payment_Mode.trim()) throw new Error('Payment mode is required');
  const credit = parseFloat(tx.Credit);
  const debit = parseFloat(tx.Debit);
  const hasCredit = !isNaN(credit) && credit > 0;
  const hasDebit = !isNaN(debit) && debit > 0;
  if (!hasCredit && !hasDebit) throw new Error('Transaction must have a positive Credit or Debit amount');
  if (hasCredit && hasDebit) throw new Error('Transaction cannot have both Credit and Debit amounts');
}

function requireWriteCredentials(accessToken, spreadsheetId) {
  if (!accessToken) {
    throw new Error('Your Google session expired. Please sign in again.');
  }
  if (!spreadsheetId) {
    throw new Error('Your Google Sheet is not connected. Connect your TraceOn spreadsheet and try again.');
  }
}

function toUserFacingSheetsError(err, fallback) {
  if (err?.isNetworkError || /network failure/i.test(err?.message || '')) {
    return new Error("Couldn't reach Google Sheets. Check your connection and try again.");
  }

  const status = err?.httpStatus || Number((err?.message || '').match(/HTTP (\d+)/)?.[1]);
  if (status === 401) {
    return new Error('Your Google session expired. Please sign in again.');
  }
  if (status === 403) {
    return new Error("TraceOn doesn't have permission to update your Google Sheet. Please sign in again and grant access.");
  }
  if (status === 404) {
    return new Error('Your TraceOn spreadsheet or Raw_Data sheet could not be found.');
  }

  const knownValidation = [
    'Missing Transaction_ID',
    'Date must be',
    'Description is required',
    'Category is required',
    'Payment mode is required',
    'positive Credit or Debit',
    'cannot have both Credit and Debit',
    'not connected',
    'session expired',
    'Transaction not found',
    'Cannot delete the header',
    'Spreadsheet validation failed',
    'Spreadsheet schema mismatch',
  ];
  const message = err?.message || '';
  if (knownValidation.some((snippet) => message.includes(snippet))) {
    return err;
  }

  return new Error(fallback);
}

function toRowValues(transaction) {
  return [
    transaction.Transaction_ID,
    transaction.Date,
    transaction.Description,
    transaction.Category,
    transaction.Payment_Mode,
    normalizeAmount(transaction.Credit),
    normalizeAmount(transaction.Debit),
  ];
}

async function getRawDataSheetMeta(accessToken, spreadsheetId, operation) {
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties`;
  const metaData = await sheetsApiFetch(metaUrl, accessToken, { operation });
  const sheets = metaData.sheets || [];
  const rawDataSheet = sheets.find(
    (s) => s.properties && s.properties.title === RAW_DATA_SHEET_NAME
  );
  if (!rawDataSheet || rawDataSheet.properties.sheetId === undefined) {
    const error = new Error(
      `Spreadsheet validation failed: Sheet "${RAW_DATA_SHEET_NAME}" was not found. Please initialize the spreadsheet.`
    );
    error.httpStatus = 404;
    throw error;
  }
  return rawDataSheet.properties;
}

/**
 * Locate the 1-based spreadsheet row for a Transaction_ID in Raw_Data column A.
 * Never treats React array indexes as sheet rows.
 */
async function findRowByTransactionId(accessToken, spreadsheetId, transactionId) {
  const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(RAW_DATA_SHEET_NAME + '!A:A')}`;
  const valuesData = await sheetsApiFetch(valuesUrl, accessToken, {
    operation: 'findRowByTransactionId',
  });
  const rows = valuesData?.values || [];

  for (let i = 1; i < rows.length; i++) {
    const cell = rows[i]?.[0] ? String(rows[i][0]).trim() : '';
    if (cell && cell === transactionId) {
      return i + 1;
    }
  }

  const syntheticMatch = String(transactionId).match(/^TXN_ROW_(\d+)$/);
  if (syntheticMatch) {
    const rowNumber = Number(syntheticMatch[1]);
    if (rowNumber > 1 && rowNumber <= rows.length) {
      const cell = rows[rowNumber - 1]?.[0] ? String(rows[rowNumber - 1][0]).trim() : '';
      if (!cell) return rowNumber;
    }
  }

  return null;
}

export async function addTraceOnTransaction(accessToken, spreadsheetId, transaction) {
  requireWriteCredentials(accessToken, spreadsheetId);

  const payload = {
    ...transaction,
    Credit: normalizeAmount(transaction.Credit),
    Debit: normalizeAmount(transaction.Debit),
  };
  validateTransaction(payload);

  try {
    const range = `${RAW_DATA_SHEET_NAME}!A:G`;
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
      `/values/${encodeURIComponent(range)}:append` +
      `?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    await sheetsApiFetch(url, accessToken, {
      method: 'POST',
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [toRowValues(payload)],
      }),
      operation: 'addTraceOnTransaction',
    });

    return { success: true, id: payload.Transaction_ID };
  } catch (err) {
    throw toUserFacingSheetsError(err, "Couldn't save this transaction to your Google Sheet. Try again.");
  }
}

export async function updateTraceOnTransaction(accessToken, spreadsheetId, transaction) {
  requireWriteCredentials(accessToken, spreadsheetId);

  const payload = {
    ...transaction,
    Credit: normalizeAmount(transaction.Credit),
    Debit: normalizeAmount(transaction.Debit),
  };
  validateTransaction(payload);

  try {
    await getRawDataSheetMeta(accessToken, spreadsheetId, 'updateTraceOnTransaction:fetchMetadata');
    const rowNumber = await findRowByTransactionId(accessToken, spreadsheetId, payload.Transaction_ID);
    if (!rowNumber || rowNumber < 2) {
      throw new Error('Transaction not found in your Google Sheet. Refresh and try again.');
    }

    const range = `${RAW_DATA_SHEET_NAME}!A${rowNumber}:G${rowNumber}`;
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
      `/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

    await sheetsApiFetch(url, accessToken, {
      method: 'PUT',
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [toRowValues(payload)],
      }),
      operation: 'updateTraceOnTransaction',
    });

    return { success: true };
  } catch (err) {
    throw toUserFacingSheetsError(err, "Couldn't update this transaction in your Google Sheet. Try again.");
  }
}

export async function deleteTraceOnTransaction(accessToken, spreadsheetId, transactionId) {
  requireWriteCredentials(accessToken, spreadsheetId);
  if (!transactionId) {
    throw new Error('Transaction_ID is required for delete');
  }

  try {
    const sheetMeta = await getRawDataSheetMeta(accessToken, spreadsheetId, 'deleteTraceOnTransaction:fetchMetadata');
    const rowNumber = await findRowByTransactionId(accessToken, spreadsheetId, transactionId);
    if (!rowNumber || rowNumber < 2) {
      throw new Error('Transaction not found in your Google Sheet. Refresh and try again.');
    }
    if (rowNumber === 1) {
      throw new Error('Cannot delete the header row.');
    }

    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`;
    await sheetsApiFetch(batchUrl, accessToken, {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetMeta.sheetId,
                dimension: 'ROWS',
                startIndex: rowNumber - 1,
                endIndex: rowNumber,
              },
            },
          },
        ],
      }),
      operation: 'deleteTraceOnTransaction',
    });

    return { success: true };
  } catch (err) {
    throw toUserFacingSheetsError(err, "Couldn't delete this transaction from your Google Sheet. Try again.");
  }
}
