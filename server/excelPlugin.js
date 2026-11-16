import fs from 'node:fs';
import {
  EXCEL_FILE_NAME,
  EXCEL_FILE_PATH,
  ensureExcelFile,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from './excelStorage.js';

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Guard against huge payload
      if (body.length > 5e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export function excelStoragePlugin() {
  const handler = async (req, res, next) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // Only intercept /api/ endpoints
    if (!pathname.startsWith('/api/')) {
      return next();
    }

    try {
      // 1. GET /api/status
      if (pathname === '/api/status' && req.method === 'GET') {
        ensureExcelFile();
        return sendJson(res, 200, {
          success: true,
          mode: 'local-excel',
          fileName: EXCEL_FILE_NAME,
          filePath: EXCEL_FILE_PATH,
          count: getTransactions().length,
        });
      }

      // 2. GET /api/excel/download
      if (pathname === '/api/excel/download' && req.method === 'GET') {
        ensureExcelFile();
        const fileBuffer = fs.readFileSync(EXCEL_FILE_PATH);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${EXCEL_FILE_NAME}"`);
        res.setHeader('Content-Length', fileBuffer.length);
        res.end(fileBuffer);
        return;
      }

      // 3. Transactions CRUD: /api/transactions
      if (pathname === '/api/transactions') {
        if (req.method === 'GET') {
          const records = getTransactions();
          return sendJson(res, 200, { success: true, records });
        }

        if (req.method === 'POST') {
          const body = await parseRequestBody(req);
          const tx = body.transaction || body;
          if (!tx || !tx.Transaction_ID) {
            return sendJson(res, 400, { success: false, error: 'Missing Transaction_ID' });
          }
          const saved = addTransaction(tx);
          return sendJson(res, 200, { success: true, record: saved });
        }

        if (req.method === 'PUT') {
          const body = await parseRequestBody(req);
          const tx = body.transaction || body;
          if (!tx || !tx.Transaction_ID) {
            return sendJson(res, 400, { success: false, error: 'Missing Transaction_ID' });
          }
          const updated = updateTransaction(tx);
          return sendJson(res, 200, { success: true, record: updated });
        }

        if (req.method === 'DELETE') {
          const id = url.searchParams.get('id');
          let txId = id;
          if (!txId) {
            const body = await parseRequestBody(req);
            txId = body.id || body.Transaction_ID;
          }
          if (!txId) {
            return sendJson(res, 400, { success: false, error: 'Missing id parameter' });
          }
          deleteTransaction(txId);
          return sendJson(res, 200, { success: true, deletedId: txId });
        }
      }

      // 4. Fallback for unhandled /api
      return sendJson(res, 404, { success: false, error: 'Endpoint not found' });
    } catch (err) {
      console.error('[TraceOn Excel API Error]', err);
      return sendJson(res, 500, { success: false, error: err.message || 'Internal server error' });
    }
  };

  return {
    name: 'traceon-excel-storage',
    configureServer(server) {
      ensureExcelFile();
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      ensureExcelFile();
      server.middlewares.use(handler);
    },
  };
}
