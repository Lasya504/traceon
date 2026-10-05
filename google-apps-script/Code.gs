/**
 * ═══════════════════════════════════════════════════════════════
 *  TraceOn — Google Apps Script Middleware
 *  Deploy this as a Web App (Execute as: Me, Access: Anyone)
 * ═══════════════════════════════════════════════════════════════
 *
 *  Spreadsheet: https://docs.google.com/spreadsheets/d/1HljbCaOjeJ26koxiVycY1LztwOd5V2g8fyGYhi_yDNg/edit
 *  Sheet Tab: Raw_Data
 *  Headers (Row 1): Transaction_ID | Date | Description | Category | Payment_Mode | Credit | Debit
 *
 *  ENDPOINTS:
 *  ─────────
 *  GET  ?action=getAll           → Returns all transactions as JSON
 *  POST { action: "add",    data: {...} }  → Appends a new row
 *  POST { action: "update", data: {...} }  → Updates row by Transaction_ID
 *  POST { action: "delete", Transaction_ID: "..." } → Deletes row by Transaction_ID
 */

const SHEET_ID = '1HljbCaOjeJ26koxiVycY1LztwOd5V2g8fyGYhi_yDNg';
const SHEET_NAME = 'Raw_Data';

// ─── GET Handler ────────────────────────────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action || 'getAll';

    if (action === 'getAll') {
      return respond(getAllRecords());
    }

    return respond({ error: 'Unknown action' }, 400);
  } catch (err) {
    return respond({ error: err.message }, 500);
  }
}

// ─── POST Handler ───────────────────────────────────────────────
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    if (action === 'add') {
      return respond(addRecord(payload.data));
    }

    if (action === 'update') {
      return respond(updateRecord(payload.data));
    }

    if (action === 'delete') {
      return respond(deleteRecord(payload.Transaction_ID));
    }

    return respond({ error: 'Unknown action' }, 400);
  } catch (err) {
    return respond({ error: err.message }, 500);
  }
}

// ─── Get All Records ────────────────────────────────────────────
function getAllRecords() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return { records: [] };
  }

  const headers = data[0];
  const records = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // skip empty rows

    const record = {};
    headers.forEach((header, index) => {
      let value = row[index];

      // Format dates as YYYY-MM-DD
      if (header === 'Date' && value instanceof Date) {
        value = Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }

      record[header] = value !== null && value !== undefined ? String(value) : '';
    });

    records.push(record);
  }

  return { records };
}

// ─── Add Record ─────────────────────────────────────────────────
function addRecord(data) {
  const sheet = getSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const newRow = headers.map((header) => {
    if (header === 'Date' && data[header]) {
      return new Date(data[header]);
    }
    return data[header] || '';
  });

  sheet.appendRow(newRow);

  return { success: true, id: data.Transaction_ID };
}

// ─── Update Record ──────────────────────────────────────────────
function updateRecord(data) {
  const sheet = getSheet();
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idColIndex = headers.indexOf('Transaction_ID');

  if (idColIndex === -1) {
    return { error: 'Transaction_ID column not found' };
  }

  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][idColIndex]) === String(data.Transaction_ID)) {
      headers.forEach((header, colIndex) => {
        if (data[header] !== undefined) {
          let value = data[header];
          if (header === 'Date' && value) {
            value = new Date(value);
          }
          sheet.getRange(i + 1, colIndex + 1).setValue(value);
        }
      });

      return { success: true };
    }
  }

  return { error: 'Transaction not found' };
}

// ─── Delete Record ──────────────────────────────────────────────
function deleteRecord(transactionId) {
  const sheet = getSheet();
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idColIndex = headers.indexOf('Transaction_ID');

  if (idColIndex === -1) {
    return { error: 'Transaction_ID column not found' };
  }

  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][idColIndex]) === String(transactionId)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { error: 'Transaction not found' };
}

// ─── Helpers ────────────────────────────────────────────────────
function getSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheetByName(SHEET_NAME);
}

function respond(data, code) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
