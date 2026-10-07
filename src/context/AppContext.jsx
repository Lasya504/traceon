import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { fetchTransactions, addTransaction, updateTransaction, deleteTransaction, generateTransactionId } from '../services/transactionApi';
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
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  const [snackbar, setSnackbar] = useState({ message: '', type: '' });

  const showSnackbar = (message, type = 'success', duration = 3000) => {
    setSnackbar({ message, type });
    if (duration > 0) {
      setTimeout(() => setSnackbar({ message: '', type: '' }), duration);
    }
  };

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTransactions();
      setTransactions(data);
    } catch (err) {
      console.error('Error loading:', err);
      setError(err);
      showSnackbar("Couldn't load data. Try again.", 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const filteredTransactions = useMemo(
    () => transactions.filter((tx) => tx.Date && tx.Date.startsWith(selectedMonth)),
    [transactions, selectedMonth]
  );

  // summary: backward-compatible shape used by SummaryCards and Dashboard hero
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

  // dashboardMetrics: richer metrics object computed by the pure utility
  const dashboardMetrics = useMemo(
    () => computeDashboardMetrics(transactions, selectedMonth),
    [transactions, selectedMonth]
  );

  const handleAddTransaction = async (formData) => {
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

    setTransactions((prev) => [newTx, ...prev]);
    setModalOpen(false);
    showSnackbar('Syncing…', 'syncing', 0);

    try {
      await addTransaction(newTx);
      // Reconcile with backend — the server row is now canonical
      await loadTransactions();
      showSnackbar('Transaction saved');
    } catch (err) {
      console.error('Add failed:', err);
      setTransactions((prev) => prev.filter((t) => t.Transaction_ID !== newTx.Transaction_ID));
      showSnackbar(err.message || "Couldn't sync. Try again.", 'error');
    }
  };

  const handleUpdateTransaction = async (formData) => {
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
    showSnackbar('Syncing…', 'syncing', 0);

    try {
      await updateTransaction(updatedTx);
      // Reconcile with backend
      await loadTransactions();
      showSnackbar('Transaction saved');
    } catch (err) {
      console.error('Update failed:', err);
      setTransactions(previousTransactions);
      showSnackbar(err.message || "Couldn't sync. Try again.", 'error');
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    const previousTransactions = transactions.slice();
    setTransactions((prev) => prev.filter((t) => t.Transaction_ID !== transactionId));
    setModalOpen(false);
    setEditingTransaction(null);
    showSnackbar('Syncing…', 'syncing', 0);

    try {
      await deleteTransaction(transactionId);
      // Reconcile with backend — confirms row is gone
      await loadTransactions();
      showSnackbar('Transaction deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      setTransactions(previousTransactions);
      showSnackbar(err.message || "Couldn't sync. Try again.", 'error');
    }
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
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <Snackbar message={snackbar.message} type={snackbar.type} />
    </AppContext.Provider>
  );
}
