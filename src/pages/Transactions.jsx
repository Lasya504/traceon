import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import BottomNav from '../components/BottomNav';
import FAB from '../components/FAB';
import TransactionItem from '../components/TransactionItem';
import TransactionModal from '../components/TransactionModal';
import { CATEGORIES } from '../components/constants';
import { getYearMonth } from '../utils/analytics';

// ─── Constants ──────────────────────────────────────────────────
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// Derive all months present in the transaction list (for the month filter).
function getAvailableMonths(transactions) {
  const seen = new Set();
  for (const tx of transactions) {
    const ym = getYearMonth(tx.Date);
    if (ym) seen.add(ym);
  }
  return [...seen]
    .sort((a, b) => b.localeCompare(a))
    .map((ym) => {
      const [y, m] = ym.split('-');
      return { value: ym, label: `${MONTHS[parseInt(m, 10) - 1]} ${y}` };
    });
}

// ─── Filter Logic (pure, no mutation) ───────────────────────────
function applyFilters(transactions, { search, monthFilter, categoryFilter, typeFilter }) {
  let result = transactions;

  if (monthFilter) {
    result = result.filter((tx) => getYearMonth(tx.Date) === monthFilter);
  }

  if (categoryFilter) {
    result = result.filter(
      (tx) => (tx.Category || '').toLowerCase() === categoryFilter.toLowerCase()
    );
  }

  if (typeFilter === 'income') {
    result = result.filter((tx) => parseFloat(tx.Credit) > 0);
  } else if (typeFilter === 'expenses') {
    result = result.filter((tx) => parseFloat(tx.Debit) > 0);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(
      (tx) =>
        (tx.Description || '').toLowerCase().includes(q) ||
        (tx.Category || '').toLowerCase().includes(q) ||
        (tx.Payment_Mode || '').toLowerCase().includes(q)
    );
  }

  // Newest-first, no mutation
  return [...result].sort((a, b) => {
    if ((b.Date || '') < (a.Date || '')) return -1;
    if ((b.Date || '') > (a.Date || '')) return 1;
    return 0;
  });
}

// ─── Group filtered transactions by month ───────────────────────
function groupByMonth(transactions) {
  const groups = {};
  for (const tx of transactions) {
    if (!tx.Date) continue;
    const [y, m] = tx.Date.split('-');
    const key = `${y}-${m}`;
    const label = `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
    if (!groups[key]) groups[key] = { label, key, items: [], netTotal: 0 };
    groups[key].items.push(tx);
    groups[key].netTotal += (parseFloat(tx.Credit) || 0) - (parseFloat(tx.Debit) || 0);
  }
  return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
}

// ─── Sub-components ──────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 14, width: '50%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: '32%', borderRadius: 6 }} />
      </div>
      <div className="skeleton" style={{ height: 16, width: 60, borderRadius: 6 }} />
    </div>
  );
}

function EmptyState({ hasFilters, hasData, onClear }) {
  if (!hasData) {
    return (
      <div className="empty-card">
        <div className="empty-icon-glow">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
          No transactions yet
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 260, lineHeight: 1.5 }}>
          Tap the <strong>+</strong> button below to record your first transaction
        </p>
      </div>
    );
  }

  if (hasFilters) {
    return (
      <div className="empty-card">
        <div className="empty-icon-glow">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
          No matching transactions
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 260, lineHeight: 1.5 }}>
          No records match your active search or filters.
        </p>
        <button
          type="button"
          onClick={onClear}
          className="btn-primary touch-scale"
          style={{
            marginTop: 6,
            width: 'auto',
            padding: '8px 18px',
            fontSize: 13,
            borderRadius: 9999,
          }}
        >
          Clear Filters
        </button>
      </div>
    );
  }

  return null;
}

function ErrorState({ onRetry }) {
  return (
    <div
      style={{
        margin: '20px',
        padding: '24px 20px',
        borderRadius: 22,
        background: 'var(--expense-dim)',
        border: '1px solid var(--expense-border)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
        stroke="var(--expense)" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Failed to load transactions</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 260, lineHeight: 1.4 }}>
        Could not connect to Google Sheets. Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="btn-primary touch-scale"
        style={{ width: 'auto', padding: '9px 20px', fontSize: 13, marginTop: 4, borderRadius: 9999 }}
      >
        Retry
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function TransactionsPage() {
  const { transactions, loading, error, openEditModal, loadTransactions } = useApp();

  // Filter state
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const hasFilters = search.trim() !== '' || monthFilter !== '' || categoryFilter !== '' || typeFilter !== 'all';

  function clearFilters() {
    setSearch('');
    setMonthFilter('');
    setCategoryFilter('');
    setTypeFilter('all');
  }

  const availableMonths = useMemo(() => getAvailableMonths(transactions), [transactions]);

  const filtered = useMemo(
    () => applyFilters(transactions, { search, monthFilter, categoryFilter, typeFilter }),
    [transactions, search, monthFilter, categoryFilter, typeFilter]
  );

  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);

  const showEmpty = !loading && !error && grouped.length === 0;

  return (
    <div className="app-shell page-in" style={{ paddingBottom: 104 }}>

      {/* ── Sticky Header ── */}
      <div
        style={{
          padding: '20px 20px 14px',
          position: 'sticky',
          top: 0,
          background: 'var(--topbar-bg)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 30,
          borderBottom: '1px solid var(--topbar-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Transactions
          </h1>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="touch-scale"
              style={{
                padding: '5px 12px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                background: 'var(--expense-dim)',
                border: '1px solid var(--expense-border)',
                color: 'var(--expense)',
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          )}
        </div>

        {/* Search */}
        <div className="search-wrap" style={{ marginBottom: 10 }}>
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--text-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, category, payment…"
            aria-label="Search transactions"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="touch-scale"
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--bg-surface-subtle)',
                border: 'none',
                borderRadius: '50%',
                width: 20,
                height: 20,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Type Filter Tabs (Pill Controls) */}
        <div className="filter-tabs" style={{ marginBottom: 10 }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'income', label: 'Income' },
            { id: 'expenses', label: 'Expenses' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`filter-tab ${typeFilter === tab.id ? 'active' : ''}`}
              onClick={() => setTypeFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Month + Category Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Month dropdown */}
          {availableMonths.length > 0 && (
            <div style={{ position: 'relative' }}>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                aria-label="Filter by month"
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  background: monthFilter ? 'var(--tab-active-bg)' : 'var(--bg-surface)',
                  border: monthFilter ? '1px solid var(--tab-active-bg)' : '1px solid var(--border-medium)',
                  borderRadius: 9999,
                  padding: '6px 28px 6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: monthFilter ? 'var(--tab-active-text)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 2px 6px -1px rgba(0, 0, 0, 0.04)',
                }}
              >
                <option value="" style={{ color: 'var(--text-primary)', background: 'var(--bg-surface)' }}>All Months</option>
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value} style={{ color: 'var(--text-primary)', background: 'var(--bg-surface)' }}>{m.label}</option>
                ))}
              </select>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: monthFilter ? 'var(--tab-active-text)' : 'var(--text-secondary)',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          )}

          {/* Category dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                background: categoryFilter ? 'var(--tab-active-bg)' : 'var(--bg-surface)',
                border: categoryFilter ? '1px solid var(--tab-active-bg)' : '1px solid var(--border-medium)',
                borderRadius: 9999,
                padding: '6px 28px 6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: categoryFilter ? 'var(--tab-active-text)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 2px 6px -1px rgba(0, 0, 0, 0.04)',
              }}
            >
              <option value="" style={{ color: 'var(--text-primary)', background: 'var(--bg-surface)' }}>All Categories</option>
              <option value="Income" style={{ color: 'var(--text-primary)', background: 'var(--bg-surface)' }}>💰 Income</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name} style={{ color: 'var(--text-primary)', background: 'var(--bg-surface)' }}>{cat.icon} {cat.name}</option>
              ))}
            </select>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: categoryFilter ? 'var(--tab-active-text)' : 'var(--text-secondary)',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ paddingTop: 8 }}>

        {/* Loading */}
        {loading && (
          <div style={{ margin: '0 20px', borderRadius: 22, overflow: 'hidden' }} className="card-surface">
            <SkeletonRow />
            <div style={{ height: 1, background: 'var(--border-solid)', margin: '0 16px' }} />
            <SkeletonRow />
            <div style={{ height: 1, background: 'var(--border-solid)', margin: '0 16px' }} />
            <SkeletonRow />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <ErrorState onRetry={loadTransactions} />
        )}

        {/* Empty states */}
        {showEmpty && (
          <EmptyState
            hasData={transactions.length > 0}
            hasFilters={hasFilters}
            onClear={clearFilters}
          />
        )}

        {/* Grouped transaction list */}
        {!loading && !error && grouped.map((group) => {
          const isPositive = group.netTotal >= 0;
          return (
            <div key={group.key} style={{ marginBottom: 20 }}>
              {/* Month Group Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 22px 8px',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  {group.label}
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: isPositive ? 'var(--income)' : 'var(--expense)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {isPositive ? '+' : '−'}₹{Math.abs(group.netTotal).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Transactions card */}
              <div style={{ margin: '0 20px', borderRadius: 22, overflow: 'hidden' }} className="card-surface">
                {group.items.map((tx, i) => (
                  <div key={tx.Transaction_ID}>
                    <TransactionItem transaction={tx} onClick={openEditModal} />
                    {i < group.items.length - 1 && (
                      <div style={{ height: 1, background: 'var(--border-solid)', margin: '0 16px' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <FAB />
      <BottomNav />
      <TransactionModal />
    </div>
  );
}
