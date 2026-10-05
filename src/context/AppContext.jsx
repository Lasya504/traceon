import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchTransactions, addTransaction, updateTransaction, deleteTransaction, generateTransactionId } from '../services/api';
import { parseAmount } from '../utils/analytics';

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

  const filteredTransactions = transactions.filter((tx) => {
    if (!tx.Date) return false;
    return tx.Date.startsWith(selectedMonth);
  });

  const summary = filteredTransactions.reduce(
    (acc, tx) => {
      const credit = parseAmount(tx.Credit);
      const debit = parseAmount(tx.Debit);
      acc.income += credit;
      acc.expenses += debit;
      return acc;
    },
    { income: 0, expenses: 0 }
  );
  summary.savings = summary.income - summary.expenses;

  const handleAddTransaction = async (formData) => {
    const newTx = {
      Transaction_ID: generateTransactionId(),
      Date: formData.date,
      Description: formData.description,
      Category: formData.category,
      Payment_Mode: formData.paymentMode,
      Credit: formData.type === 'income' ? String(formData.amount) : '',
      Debit: formData.type === 'expense' ? String(formData.amount) : '',
    };

    setTransactions((prev) => [newTx, ...prev]);
    setModalOpen(false);
    showSnackbar('Syncing...', 'syncing', 0);

    try {
      await addTransaction(newTx);
      showSnackbar('Transaction saved');
    } catch {
      setTransactions((prev) => prev.filter((t) => t.Transaction_ID !== newTx.Transaction_ID));
      showSnackbar("Couldn't sync. Try again.", 'error');
    }
  };

  const handleUpdateTransaction = async (formData) => {
    const updatedTx = {
      Transaction_ID: formData.transactionId,
      Date: formData.date,
      Description: formData.description,
      Category: formData.category,
      Payment_Mode: formData.paymentMode,
      Credit: formData.type === 'income' ? String(formData.amount) : '',
      Debit: formData.type === 'expense' ? String(formData.amount) : '',
    };

    setTransactions((prev) =>
      prev.map((t) => (t.Transaction_ID === updatedTx.Transaction_ID ? updatedTx : t))
    );
    setModalOpen(false);
    setEditingTransaction(null);
    showSnackbar('Syncing...', 'syncing', 0);

    try {
      await updateTransaction(updatedTx);
      showSnackbar('Transaction saved');
    } catch {
      loadTransactions();
      showSnackbar("Couldn't sync. Try again.", 'error');
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    setTransactions((prev) => prev.filter((t) => t.Transaction_ID !== transactionId));
    setModalOpen(false);
    setEditingTransaction(null);
    showSnackbar('Syncing...', 'syncing', 0);

    try {
      await deleteTransaction(transactionId);
      showSnackbar('Transaction deleted');
    } catch {
      loadTransactions();
      showSnackbar("Couldn't sync. Try again.", 'error');
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
