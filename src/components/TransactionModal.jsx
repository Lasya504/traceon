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

  return (
    <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        
        <div className="px-5 pt-4 pb-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold">
              {isEdit ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <button 
              onClick={() => setModalOpen(false)}
              className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text rounded-full bg-hover"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Type */}
          <div className="type-toggle">
            <button
              className={`type-toggle-btn ${type === 'expense' ? 'expense-active' : ''}`}
              onClick={() => setType('expense')}
            >
              Expense
            </button>
            <button
              className={`type-toggle-btn ${type === 'income' ? 'income-active' : ''}`}
              onClick={() => setType('income')}
            >
              Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[13px] font-medium text-text-muted mb-1">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="amount-input"
              inputMode="numeric"
              autoFocus
            />
          </div>

          {/* Date & Desc */}
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-text-muted mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-muted mb-1.5">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this for?"
              />
            </div>
          </div>

          {/* Category */}
          {type === 'expense' && (
            <div>
              <label className="block text-[13px] font-medium text-text-muted mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    className={`chip ${category === cat.name ? 'selected' : ''}`}
                    onClick={() => setCategory(cat.name)}
                  >
                    <span className="chip-icon">{cat.icon}</span>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment Mode */}
          <div>
            <label className="block text-[13px] font-medium text-text-muted mb-2">Payment Mode</label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_MODES.map((pm) => (
                <button
                  key={pm.name}
                  className={`chip ${paymentMode === pm.name ? 'selected' : ''}`}
                  onClick={() => setPaymentMode(pm.name)}
                >
                  <span className="chip-icon">{pm.icon}</span>
                  {pm.name}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 space-y-3">
            <button
              onClick={handleSubmit}
              disabled={saving || !amount || !description || !date}
              className="btn-primary"
            >
              {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Save Transaction')}
            </button>

            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="btn-destructive"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
