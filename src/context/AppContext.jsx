import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGoogleAuth } from './GoogleAuthContext';
import {
  getTraceOnTransactions,
  getCachedSpreadsheetId,
  setCachedSpreadsheetId,
  clearCachedSpreadsheetId,
  validateTraceOnSpreadsheet,
  initializeTraceOnSpreadsheet,
  addTraceOnTransaction,
  updateTraceOnTransaction,
  deleteTraceOnTransaction,
  generateTransactionId,
} from '../services/googleSheetsApi';
import { findExistingTraceOnSpreadsheet } from '../services/googleDriveApi';
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
  const { isSignedIn, accessToken, user } = useGoogleAuth();

  const [activeSpreadsheetId, setActiveSpreadsheetIdState] = useState(null);
  const [activeSpreadsheetUrl, setActiveSpreadsheetUrlState] = useState(null);
  const [isSheetConnected, setIsSheetConnected] = useState(false);
  const [isValidatingSheet, setIsValidatingSheet] = useState(false);
  const [isSheetSyncDone, setIsSheetSyncDone] = useState(false);

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

  // Session epoch reference to discard stale asynchronous responses from previous sessions
  const appSessionEpochRef = useRef(0);

  const showSnackbar = (message, type = 'success', duration = 3000) => {
    setSnackbar({ message, type });
    if (duration > 0) {
      setTimeout(() => setSnackbar({ message: '', type: '' }), duration);
    }
  };

  /**
   * Resets active in-memory spreadsheet and transaction state.
   * Crucially, does NOT remove persistent per-user cached spreadsheet IDs in localStorage.
   * Increments session epoch so any pending async operations are dropped.
   */
  const resetAppState = useCallback(() => {
    appSessionEpochRef.current += 1;
    setActiveSpreadsheetIdState(null);
    setActiveSpreadsheetUrlState(null);
    setIsSheetConnected(false);
    setIsValidatingSheet(false);
    setIsSheetSyncDone(false);
    setTransactions([]);
    setError(null);
    setLoading(false);
    setModalOpen(false);
    setEditingTransaction(null);
  }, []);

  // Safe setter for activeSpreadsheetId that caches per authenticated user
  const setActiveSpreadsheetId = useCallback((id, url = null, isConnected = true) => {
    setActiveSpreadsheetIdState(id);
    const resolvedUrl = url || (id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : null);
    setActiveSpreadsheetUrlState(resolvedUrl);

    if (id && isConnected) {
      setIsSheetConnected(true);
      const userKey = user?.id || user?.email || null;
      if (userKey) {
        setCachedSpreadsheetId(userKey, id);
      }
    } else {
      setIsSheetConnected(false);
      // NOTE: We intentionally do NOT clearCachedSpreadsheetId here.
      // Unsetting the active connection must NOT wipe the user's saved spreadsheet mapping.
    }
  }, [user]);

  const setActiveSpreadsheetUrl = useCallback((url) => {
    setActiveSpreadsheetUrlState(url);
  }, []);

  // Synchronize and validate active spreadsheet when user authenticates or signs out
  useEffect(() => {
    let isCancelled = false;
    const epoch = ++appSessionEpochRef.current;

    async function syncAndValidate() {
      if (isSignedIn && user && accessToken) {
        const userKey = user.id || user.email;
        const cachedId = getCachedSpreadsheetId(userKey);

        if (!cachedId) {
          // No localStorage cache — search the user's Google Drive for an existing TraceOn spreadsheet
          console.log('[TraceOn] No cached spreadsheet for user, searching Google Drive...');
          try {
            const driveResult = await findExistingTraceOnSpreadsheet(accessToken);
            if (isCancelled || appSessionEpochRef.current !== epoch) return;

            if (driveResult) {
              // Found an existing TraceOn spreadsheet in Drive — validate and restore it
              console.log('[TraceOn] Found existing spreadsheet in Drive:', driveResult.spreadsheetId);
              const validation = await validateTraceOnSpreadsheet(accessToken, driveResult.spreadsheetId);
              if (isCancelled || appSessionEpochRef.current !== epoch) return;

              if (validation.valid) {
                // Valid spreadsheet with Raw_Data — restore it
                setCachedSpreadsheetId(userKey, driveResult.spreadsheetId);
                setActiveSpreadsheetIdState(driveResult.spreadsheetId);
                setActiveSpreadsheetUrlState(
                  validation.spreadsheetUrl || driveResult.spreadsheetUrl
                );
                setIsSheetConnected(true);
                setError(null);
                setLoading(false);
                setIsSheetSyncDone(true);
                return;
              } else if (validation.reason === 'no_raw_data') {
                // Spreadsheet exists but is not initialized — initialize it
                console.log('[TraceOn] Spreadsheet found but missing Raw_Data, initializing...');
                try {
                  await initializeTraceOnSpreadsheet(accessToken, driveResult.spreadsheetId);
                  if (isCancelled || appSessionEpochRef.current !== epoch) return;
                  setCachedSpreadsheetId(userKey, driveResult.spreadsheetId);
                  setActiveSpreadsheetIdState(driveResult.spreadsheetId);
                  setActiveSpreadsheetUrlState(driveResult.spreadsheetUrl);
                  setIsSheetConnected(true);
                  setError(null);
                  setLoading(false);
                  setIsSheetSyncDone(true);
                  return;
                } catch (initErr) {
                  console.warn('[TraceOn] Failed to initialize found spreadsheet:', initErr.message);
                  // Fall through to show create-sheet flow
                }
              }
              // If validation failed for other reasons, fall through to show create-sheet flow
            }
          } catch (driveErr) {
            if (isCancelled || appSessionEpochRef.current !== epoch) return;
            console.warn('[TraceOn] Drive search failed:', driveErr.message);
            // Fall through to show create-sheet flow
          }

          if (isCancelled || appSessionEpochRef.current !== epoch) return;
          // No spreadsheet found in Drive either — show create-sheet flow
          setActiveSpreadsheetIdState(null);
          setActiveSpreadsheetUrlState(null);
          setIsSheetConnected(false);
          setTransactions([]);
          setLoading(false);
          setIsSheetSyncDone(true);
          return;
        }

        // Validate cached spreadsheet exists and contains Raw_Data
        setIsValidatingSheet(true);
        setLoading(true);
        try {
          const validation = await validateTraceOnSpreadsheet(accessToken, cachedId);
          if (isCancelled || appSessionEpochRef.current !== epoch) return;

          if (validation.valid) {
            setActiveSpreadsheetIdState(cachedId);
            setActiveSpreadsheetUrlState(
              validation.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${cachedId}/edit`
            );
            setIsSheetConnected(true);
            setError(null);
          } else if (validation.reason === 'no_raw_data') {
            // Cached spreadsheet exists but Raw_Data is missing — attempt initialization
            console.log('[TraceOn] Cached spreadsheet missing Raw_Data, attempting initialization...');
            try {
              await initializeTraceOnSpreadsheet(accessToken, cachedId);
              if (isCancelled || appSessionEpochRef.current !== epoch) return;
              setActiveSpreadsheetIdState(cachedId);
              setActiveSpreadsheetUrlState(`https://docs.google.com/spreadsheets/d/${cachedId}/edit`);
              setIsSheetConnected(true);
              setError(null);
            } catch (initErr) {
              if (isCancelled || appSessionEpochRef.current !== epoch) return;
              console.warn('[TraceOn] Failed to initialize cached spreadsheet:', initErr.message);
              clearCachedSpreadsheetId(userKey);
              setActiveSpreadsheetIdState(null);
              setActiveSpreadsheetUrlState(null);
              setIsSheetConnected(false);
              setTransactions([]);
              setError('Could not initialize your TraceOn spreadsheet. Please reconnect.');
            }
          } else {
            console.warn(`[TraceOn] Stale or invalid cached spreadsheet ${cachedId} (${validation.reason}). Clearing reference for user.`);
            clearCachedSpreadsheetId(userKey);
            setActiveSpreadsheetIdState(null);
            setActiveSpreadsheetUrlState(null);
            setIsSheetConnected(false);
            setTransactions([]);
            setError('Could not access your saved Google Sheet. Please connect a spreadsheet.');
          }
        } catch (valErr) {
          if (isCancelled || appSessionEpochRef.current !== epoch) return;
          console.warn('[TraceOn] Error validating cached spreadsheet:', valErr.message);
          clearCachedSpreadsheetId(userKey);
          setActiveSpreadsheetIdState(null);
          setActiveSpreadsheetUrlState(null);
          setIsSheetConnected(false);
          setTransactions([]);
        } finally {
          if (!isCancelled && appSessionEpochRef.current === epoch) {
            setIsValidatingSheet(false);
            setLoading(false);
            setIsSheetSyncDone(true);
          }
        }
      } else if (!isSignedIn) {
        resetAppState();
      }
    }

    syncAndValidate();

    return () => {
      isCancelled = true;
    };
  }, [isSignedIn, user, accessToken, resetAppState]);

  /**
   * Reads transactions directly from the user's Google Sheet (Raw_Data!A:G).
   * Does NOT call Apps Script for reading.
   */
  const loadTransactions = useCallback(async () => {
    if (!isSignedIn || !accessToken) {
      setTransactions([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (!activeSpreadsheetId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const epoch = appSessionEpochRef.current;
    setLoading(true);
    setError(null);
    try {
      const records = await getTraceOnTransactions(accessToken, activeSpreadsheetId);
      if (appSessionEpochRef.current !== epoch || !isSignedIn) return;
      setTransactions(records);
    } catch (err) {
      if (appSessionEpochRef.current !== epoch || !isSignedIn) return;
      console.error('[TraceOn] Error loading transactions from Google Sheets:', err);
      const errMsg = err.message || "Couldn't load transactions from your Google Sheet";
      setError(errMsg);
      showSnackbar(errMsg, 'error');
    } finally {
      if (appSessionEpochRef.current === epoch) {
        setLoading(false);
      }
    }
  }, [isSignedIn, accessToken, activeSpreadsheetId]);

  // Trigger read when authentication and active spreadsheet are confirmed connected
  useEffect(() => {
    if (isSignedIn && accessToken && activeSpreadsheetId && isSheetConnected) {
      loadTransactions();
    } else if (!isSignedIn) {
      resetAppState();
    }
  }, [isSignedIn, accessToken, activeSpreadsheetId, isSheetConnected, loadTransactions, resetAppState]);

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
    if (!accessToken || !activeSpreadsheetId) {
      showSnackbar('Your Google Sheet is not connected. Connect your TraceOn spreadsheet and try again.', 'error');
      return;
    }

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

    setTransactions((prev) => [newTx, ...prev]);
    setModalOpen(false);
    showSnackbar('Syncing…', 'syncing', 0);

    try {
      await addTraceOnTransaction(accessToken, activeSpreadsheetId, newTx);
      if (appSessionEpochRef.current !== epoch) return;
      await loadTransactions();
      showSnackbar('Transaction saved');
    } catch (err) {
      if (appSessionEpochRef.current !== epoch) return;
      console.error('Add failed:', err);
      setTransactions((prev) => prev.filter((t) => t.Transaction_ID !== newTx.Transaction_ID));
      showSnackbar(err.message || "Couldn't sync. Try again.", 'error');
    }
  };

  const handleUpdateTransaction = async (formData) => {
    if (!accessToken || !activeSpreadsheetId) {
      showSnackbar('Your Google Sheet is not connected. Connect your TraceOn spreadsheet and try again.', 'error');
      return;
    }

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
    showSnackbar('Syncing…', 'syncing', 0);

    try {
      await updateTraceOnTransaction(accessToken, activeSpreadsheetId, updatedTx);
      if (appSessionEpochRef.current !== epoch) return;
      await loadTransactions();
      showSnackbar('Transaction saved');
    } catch (err) {
      if (appSessionEpochRef.current !== epoch) return;
      console.error('Update failed:', err);
      setTransactions(previousTransactions);
      showSnackbar(err.message || "Couldn't sync. Try again.", 'error');
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!accessToken || !activeSpreadsheetId) {
      showSnackbar('Your Google Sheet is not connected. Connect your TraceOn spreadsheet and try again.', 'error');
      return;
    }

    const epoch = appSessionEpochRef.current;
    const previousTransactions = transactions.slice();
    setTransactions((prev) => prev.filter((t) => t.Transaction_ID !== transactionId));
    setModalOpen(false);
    setEditingTransaction(null);
    showSnackbar('Syncing…', 'syncing', 0);

    try {
      await deleteTraceOnTransaction(accessToken, activeSpreadsheetId, transactionId);
      if (appSessionEpochRef.current !== epoch) return;
      await loadTransactions();
      showSnackbar('Transaction deleted');
    } catch (err) {
      if (appSessionEpochRef.current !== epoch) return;
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
    loading: loading || isValidatingSheet,
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
    activeSpreadsheetId,
    setActiveSpreadsheetId,
    activeSpreadsheetUrl,
    setActiveSpreadsheetUrl,
    isSheetConnected,
    isValidatingSheet,
    isSheetSyncDone,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <Snackbar message={snackbar.message} type={snackbar.type} />
    </AppContext.Provider>
  );
}
