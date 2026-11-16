import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  fetchTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  generateTransactionId,
  downloadExcelFile,
  checkServerStatus,
} from '../services/localExcelService';
import { parseAmount } from '../utils/analytics';
import { computeDashboardMetrics } from '../utils/dashboardMetrics';

const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}

function Snackbar({ message, type }) {
  if (!message) return null;
  return (
    <div className={`snackbar ${type}`}>
      {message}
    </div>
  );
}

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExcelConnected, setIsExcelConnected] = useState(true);
  const [excelFileName, setExcelFileName] = useState('Traceon_Transactions.xlsx');
  const [excelFilePath, setExcelFilePath] = useState('');

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [snackbar, setSnackbar] = useState({ message: '', type: '' });

  const appSessionEpochRef = useRef(0);

  const showSnackbar = (message, type = 'success', duration = 3000) => {
    setSnackbar({ message, type });
    if (duration > 0) {
      setTimeout(() => setSnackbar({ message: '', type: '' }), duration);
    }
  };

  /**
   * Resets active in-memory state.
   */
  const resetAppState = useCallback(() => {
    appSessionEpochRef.current += 1;
    setTransactions([]);
    setError(null);
    setLoading(false);
    setModalOpen(false);
    setEditingTransaction(null);
  }, []);

  /**
   * Reads transactions directly from the local Excel sheet via API / local service.
   */
  const loadTransactions = useCallback(async () => {
    const epoch = ++appSessionEpochRef.current;
    setLoading(true);
    setError(null);

    try {
      // Check status of Excel file
      checkServerStatus().then((status) => {
        if (status?.fileName) setExcelFileName(status.fileName);
        if (status?.filePath) setExcelFilePath(status.filePath);
      });

      const records = await fetchTransactions();
      if (appSessionEpochRef.current !== epoch) return;
      setTransactions(records);
      setIsExcelConnected(true);
    } catch (err) {
      if (appSessionEpochRef.current !== epoch) return;
      console.error('[TraceOn] Error loading transactions from Excel:', err);
      const errMsg = err.message || "Couldn't load transactions from Excel sheet";
      setError(errMsg);
      showSnackbar(errMsg, 'error');
    } finally {
      if (appSessionEpochRef.current === epoch) {
        setLoading(false);
      }
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const filteredTransactions = useMemo(
    () => transactions.filter((tx) => tx.Date && tx.Date.startsWith(selectedMonth)),
    [transactions, selectedMonth]
  );

  // Summary shape used by SummaryCards and Dashboard hero
  const summary = useMemo(() => {
    const acc = filteredTransactions.reduce(
      (a, tx) => {
        a.income   += parseAmount(tx.Credit);
        a.expenses += parseAmount(tx.Debit);
        return a;
      },
      { income: 0, expenses: 0 }
    );
    acc.savings = acc.income - acc.expenses;
    return acc;
  }, [filteredTransactions]);

  // dashboardMetrics: richer metrics object computed by pure utility
  const dashboardMetrics = useMemo(
    () => computeDashboardMetrics(transactions, selectedMonth),
    [transactions, selectedMonth]
  );

  /**
   * Add a new transaction (income or expense)
   * Records to Excel sheet in the background!
   */
  const handleAddTransaction = async (formData) => {
    const epoch = appSessionEpochRef.current;
    const amount = parseFloat(formData.amount) || 0;
    const amountStr = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);

    const newTx = {
      Transaction_ID: generateTransactionId(),
      Date: formData.date,
      Description: formData.description,
      Category: formData.category,
      Payment_Mode: formData.paymentMode,
      Credit: formData.type === 'income' ? amountStr : '',
      Debit: formData.type === 'expense' ? amountStr : '',
    };

    // Optimistic UI update
    setTransactions((prev) => [newTx, ...prev]);
    setModalOpen(false);
    showSnackbar('Saving to Excel…', 'syncing', 1500);

    try {
      const saved = await addTransaction(newTx);
      if (appSessionEpochRef.current !== epoch) return;
      setTransactions((prev) =>
        prev.map((t) => (t.Transaction_ID === newTx.Transaction_ID ? saved : t))
      );
      showSnackbar(formData.type === 'income' ? 'Income recorded in Excel' : 'Expense recorded in Excel');
    } catch (err) {
      if (appSessionEpochRef.current !== epoch) return;
      console.error('[TraceOn] Add failed:', err);
      setTransactions((prev) => prev.filter((t) => t.Transaction_ID !== newTx.Transaction_ID));
      showSnackbar(err.message || "Couldn't record to Excel. Try again.", 'error');
    }
  };

  /**
   * Update an existing transaction in the local Excel sheet
   */
  const handleUpdateTransaction = async (formData) => {
    const epoch = appSessionEpochRef.current;
    const amount = parseFloat(formData.amount) || 0;
    const amountStr = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);

    const updatedTx = {
      Transaction_ID: formData.transactionId,
      Date: formData.date,
      Description: formData.description,
      Category: formData.category,
      Payment_Mode: formData.paymentMode,
      Credit: formData.type === 'income' ? amountStr : '',
      Debit: formData.type === 'expense' ? amountStr : '',
    };

    const previousTransactions = transactions.slice();
    setTransactions((prev) =>
      prev.map((t) => (t.Transaction_ID === updatedTx.Transaction_ID ? updatedTx : t))
    );
    setModalOpen(false);
    setEditingTransaction(null);
    showSnackbar('Updating in Excel…', 'syncing', 1500);

    try {
      const saved = await updateTransaction(updatedTx);
      if (appSessionEpochRef.current !== epoch) return;
      setTransactions((prev) =>
        prev.map((t) => (t.Transaction_ID === updatedTx.Transaction_ID ? saved : t))
      );
      showSnackbar('Transaction updated in Excel');
    } catch (err) {
      if (appSessionEpochRef.current !== epoch) return;
      console.error('[TraceOn] Update failed:', err);
      setTransactions(previousTransactions);
      showSnackbar(err.message || "Couldn't update in Excel. Try again.", 'error');
    }
  };

  /**
   * Delete a transaction from the local Excel sheet
   */
  const handleDeleteTransaction = async (transactionId) => {
    const epoch = appSessionEpochRef.current;
    const previousTransactions = transactions.slice();
    setTransactions((prev) => prev.filter((t) => t.Transaction_ID !== transactionId));
    setModalOpen(false);
    setEditingTransaction(null);
    showSnackbar('Removing from Excel…', 'syncing', 1500);

    try {
      await deleteTransaction(transactionId);
      if (appSessionEpochRef.current !== epoch) return;
      showSnackbar('Transaction removed from Excel');
    } catch (err) {
      if (appSessionEpochRef.current !== epoch) return;
      console.error('[TraceOn] Delete failed:', err);
      setTransactions(previousTransactions);
      showSnackbar(err.message || "Couldn't delete from Excel. Try again.", 'error');
    }
  };

  const handleDownloadExcel = () => {
    downloadExcelFile(transactions);
    showSnackbar('Downloading Excel spreadsheet…', 'success', 2000);
  };

  const openAddModal = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const openEditModal = (tx) => {
    setEditingTransaction(tx);
    setModalOpen(true);
  };

  const value = {
    transactions,
    filteredTransactions,
    loading,
    error,
    summary,
    dashboardMetrics,
    selectedMonth,
    setSelectedMonth,
    modalOpen,
    setModalOpen,
    editingTransaction,
    handleAddTransaction,
    handleUpdateTransaction,
    handleDeleteTransaction,
    openAddModal,
    openEditModal,
    loadTransactions,
    resetAppState,
    downloadExcel: handleDownloadExcel,
    isExcelConnected,
    excelFileName,
    excelFilePath,
    // Backward compatibility aliases
    isSheetConnected: isExcelConnected,
    isSheetSyncDone: true,
    activeSpreadsheetId: 'Traceon_Transactions.xlsx',
    activeSpreadsheetUrl: null,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <Snackbar message={snackbar.message} type={snackbar.type} />
    </AppContext.Provider>
  );
}
