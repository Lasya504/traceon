/* ═══════════════════════════════════════════════════
   TraceOn — Google Apps Script API Service Layer
   ═══════════════════════════════════════════════════
   
   After deploying your Google Apps Script as a Web App,
   paste the deployment URL below.
*/

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

/**
 * Generate a unique Transaction ID
 */
export function generateTransactionId() {
  return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
}

/**
 * Fetch all transactions from the Google Sheet
 * @returns {Promise<Array>} Array of transaction objects
 */
export async function fetchTransactions() {
  if (!APPS_SCRIPT_URL) {
    console.warn('Apps Script URL not configured. Using demo data.');
    return getDemoData();
  }

  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getAll`, {
      method: 'GET',
      redirect: 'follow',
    });
    const data = await response.json();
    return data.records || [];
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return getDemoData();
  }
}

/**
 * Add a new transaction
 * @param {Object} transaction - The transaction to add
 * @returns {Promise<Object>} Response from the API
 */
export async function addTransaction(transaction) {
  if (!APPS_SCRIPT_URL) {
    console.warn('Apps Script URL not configured. Simulating add.');
    return { success: true, id: transaction.Transaction_ID };
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'add', data: transaction }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to add transaction:', error);
    throw error;
  }
}

/**
 * Update an existing transaction
 * @param {Object} transaction - The transaction with updated fields
 * @returns {Promise<Object>} Response from the API
 */
export async function updateTransaction(transaction) {
  if (!APPS_SCRIPT_URL) {
    console.warn('Apps Script URL not configured. Simulating update.');
    return { success: true };
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'update', data: transaction }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to update transaction:', error);
    throw error;
  }
}

/**
 * Delete a transaction by Transaction_ID
 * @param {string} transactionId - The Transaction_ID to delete
 * @returns {Promise<Object>} Response from the API
 */
export async function deleteTransaction(transactionId) {
  if (!APPS_SCRIPT_URL) {
    console.warn('Apps Script URL not configured. Simulating delete.');
    return { success: true };
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'delete', Transaction_ID: transactionId }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    throw error;
  }
}

/**
 * Demo data for development/preview when API is not connected
 */
function getDemoData() {
  return [
    {
      Transaction_ID: 'TXN_demo_001',
      Date: '2026-10-15',
      Description: 'Zomato Lunch',
      Category: 'Food & Dining',
      Payment_Mode: 'UPI',
      Credit: '',
      Debit: '350',
    },
    {
      Transaction_ID: 'TXN_demo_002',
      Date: '2026-10-14',
      Description: 'Freelance Payment',
      Category: 'Income',
      Payment_Mode: 'UPI',
      Credit: '5000',
      Debit: '',
    },
    {
      Transaction_ID: 'TXN_demo_003',
      Date: '2026-10-14',
      Description: 'Metro Card',
      Category: 'Transport',
      Payment_Mode: 'Card',
      Credit: '',
      Debit: '150',
    },
    {
      Transaction_ID: 'TXN_demo_004',
      Date: '2026-10-13',
      Description: 'Amazon Order',
      Category: 'Shopping',
      Payment_Mode: 'Card',
      Credit: '',
      Debit: '1299',
    },
    {
      Transaction_ID: 'TXN_demo_005',
      Date: '2026-10-12',
      Description: 'Electricity Bill',
      Category: 'Bills & Utilities',
      Payment_Mode: 'UPI',
      Credit: '',
      Debit: '1800',
    },
    {
      Transaction_ID: 'TXN_demo_006',
      Date: '2026-10-11',
      Description: 'Grocery Shopping',
      Category: 'Food & Dining',
      Payment_Mode: 'Cash',
      Credit: '',
      Debit: '650',
    },
    {
      Transaction_ID: 'TXN_demo_007',
      Date: '2026-10-10',
      Description: 'Salary',
      Category: 'Income',
      Payment_Mode: 'UPI',
      Credit: '30000',
      Debit: '',
    },
    {
      Transaction_ID: 'TXN_demo_008',
      Date: '2026-10-08',
      Description: 'Udemy Course',
      Category: 'Education',
      Payment_Mode: 'Card',
      Credit: '',
      Debit: '499',
    },
    {
      Transaction_ID: 'TXN_demo_009',
      Date: '2026-10-05',
      Description: 'Netflix Subscription',
      Category: 'Bills & Utilities',
      Payment_Mode: 'Card',
      Credit: '',
      Debit: '649',
    },
    {
      Transaction_ID: 'TXN_demo_010',
      Date: '2026-10-03',
      Description: 'Uber Ride',
      Category: 'Transport',
      Payment_Mode: 'UPI',
      Credit: '',
      Debit: '230',
    },
  ];
}
