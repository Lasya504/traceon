import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, PAYMENT_MODES } from './constants';

export default function TransactionModal() {
  const {
    modalOpen,
    setModalOpen,
    editingTransaction,
    handleAddTransaction,
    handleUpdateTransaction,
    handleDeleteTransaction,
  } = useApp();

  const isEdit = !!editingTransaction;

  // Form state
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (modalOpen) {
      if (editingTransaction) {
        const isIncome = parseFloat(editingTransaction.Credit) > 0;
        setType(isIncome ? 'income' : 'expense');
        setAmount(isIncome ? editingTransaction.Credit : editingTransaction.Debit);
        setDate(editingTransaction.Date || '');
        setDescription(editingTransaction.Description || '');
        setCategory(editingTransaction.Category || 'Food & Dining');
        setPaymentMode(editingTransaction.Payment_Mode || 'UPI');
      } else {
        setType('expense');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setCategory('Food & Dining');
        setPaymentMode('UPI');
      }
    }
  }, [modalOpen, editingTransaction]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalOpen) {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, setModalOpen]);

  if (!modalOpen) return null;

  const handleSubmit = async () => {
    if (!amount || !description || !date) return;
    setSaving(true);
    const formData = {
      type,
      amount: parseFloat(amount),
      date,
      description,
      category: type === 'income' ? 'Income' : category,
      paymentMode,
      transactionId: editingTransaction?.Transaction_ID,
    };
    try {
      if (isEdit) {
        await handleUpdateTransaction(formData);
      } else {
        await handleAddTransaction(formData);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTransaction) return;
    setSaving(true);
    try {
      await handleDeleteTransaction(editingTransaction.Transaction_ID);
    } finally {
      setSaving(false);
    }
  };

  const amountColor = type === 'income' ? '#34A853' : '#EA4335';

  return (
    <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
      <div
        className="modal-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="sheet-handle" />

        <div style={{ padding: '20px 22px 36px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 id="modal-title" style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.02em' }}>
              {isEdit ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <button
              onClick={() => setModalOpen(false)}
              aria-label="Close"
              className="touch-scale"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ── Type Toggle (Expense / Income) ── */}
          <div className="type-toggle">
            <button
              type="button"
              className={`type-toggle-btn ${type === 'expense' ? 'expense-active' : ''}`}
              onClick={() => setType('expense')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
              Expense
            </button>
            <button
              type="button"
              className={`type-toggle-btn ${type === 'income' ? 'income-active' : ''}`}
              onClick={() => setType('income')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="17" y1="7" x2="7" y2="17" />
                <polyline points="17 17 7 17 7 7" />
              </svg>
              Income
            </button>
          </div>

          {/* ── Amount (Hero Field) ── */}
          <div className="form-input-group">
            <label className="form-label" style={{ color: amountColor }}>
              Amount (₹)
            </label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  color: amountColor,
                  opacity: 0.85,
                  lineHeight: 1,
                }}
              >
                ₹
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="amount-input"
                style={{ flex: 1, color: amountColor }}
                inputMode="decimal"
                autoFocus
              />
            </div>
          </div>

          {/* ── Description ── */}
          <div className="form-input-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Grocery shopping, Salary, Dinner"
            />
          </div>

          {/* ── Category Chips (Shown for Expense) ── */}
          {type === 'expense' && (
            <div className="form-input-group">
              <label className="form-label">Category</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      className={`chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => setCategory(cat.name)}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                      {isSelected && (
                        <span className="chip-check">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Date Picker ── */}
          <div className="form-input-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* ── Payment Mode Chips ── */}
          <div className="form-input-group">
            <label className="form-label">Payment Mode</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PAYMENT_MODES.map((pm) => {
                const isSelected = paymentMode === pm.name;
                return (
                  <button
                    key={pm.name}
                    type="button"
                    className={`chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => setPaymentMode(pm.name)}
                  >
                    <span>{pm.icon}</span>
                    <span>{pm.name}</span>
                    {isSelected && (
                      <span className="chip-check">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
            <button
              onClick={handleSubmit}
              disabled={saving || !amount || !description || !date}
              className="btn-primary touch-scale"
            >
              {saving ? (
                <>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Saving…
                </>
              ) : isEdit ? (
                'Save Changes'
              ) : (
                'Save Transaction'
              )}
            </button>

            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="btn-destructive touch-scale"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                Delete Transaction
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
