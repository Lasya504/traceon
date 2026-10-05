import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import BottomNav from '../components/BottomNav';
import FAB from '../components/FAB';
import TransactionItem from '../components/TransactionItem';
import TransactionModal from '../components/TransactionModal';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function groupByMonth(transactions) {
  const groups = {};
  transactions.forEach((tx) => {
    if (!tx.Date) return;
    const [y, m] = tx.Date.split('-');
    const key = `${y}-${m}`;
    const label = `${MONTHS[parseInt(m) - 1]} ${y}`;
    if (!groups[key]) groups[key] = { label, items: [], total: 0 };
    groups[key].items.push(tx);
    const credit = parseFloat(tx.Credit) || 0;
    const debit  = parseFloat(tx.Debit)  || 0;
    groups[key].total += credit - debit;
  });

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, val]) => val);
}

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px' }}>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 15, width: '50%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: '32%', borderRadius: 6 }} />
      </div>
      <div className="skeleton" style={{ height: 16, width: 60, borderRadius: 6 }} />
    </div>
  );
}

export default function TransactionsPage() {
  const { transactions, loading, openEditModal } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.Description?.toLowerCase().includes(q) ||
          tx.Category?.toLowerCase().includes(q) ||
          tx.Payment_Mode?.toLowerCase().includes(q)
      );
    }

    if (filter === 'income') {
      result = result.filter((tx) => parseFloat(tx.Credit) > 0);
    } else if (filter === 'expenses') {
      result = result.filter((tx) => parseFloat(tx.Debit) > 0);
    }

    result.sort((a, b) => new Date(b.Date) - new Date(a.Date));
    return result;
  }, [transactions, search, filter]);

  const grouped = groupByMonth(filtered);

  return (
    <div className="app-shell page-in" style={{ paddingBottom: 100 }}>

      {/* Sticky Header with Glassmorphism */}
      <div
        style={{
          padding: '20px 20px 14px',
          position: 'sticky',
          top: 0,
          background: 'rgba(11, 14, 23, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 30,
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 14 }}>
          Transactions
        </h1>

        {/* Search Input with Glowing Focus */}
        <div className="search-wrap" style={{ marginBottom: 12 }}>
          <svg
            className="search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#64748B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by note, category, payment mode…"
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
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: 22,
                height: 22,
                color: '#94A3B8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {[
            { id: 'all', label: 'All' },
            { id: 'income', label: 'Income' },
            { id: 'expenses', label: 'Expenses' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`filter-tab ${filter === tab.id ? 'active' : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div style={{ paddingTop: 8 }}>
        {loading ? (
          <div>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : grouped.length === 0 ? (
          <div className="empty-card">
            <div className="empty-icon-glow">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {search ? (
                  <>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </>
                ) : (
                  <>
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </>
                )}
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>
              {search ? 'No matching transactions' : 'No transactions yet'}
            </p>
            <p style={{ fontSize: 13, color: '#94A3B8', maxWidth: 280, lineHeight: 1.5 }}>
              {search
                ? `No transactions found matching "${search}". Try another search.`
                : 'Tap the + button to record your first expense'}
            </p>
          </div>
        ) : (
          grouped.map((group) => {
            const isPositive = group.total >= 0;
            return (
              <div key={group.label} style={{ marginBottom: 20 }}>
                {/* Month Group Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px 8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#94A3B8',
                      letterSpacing: '0.06em',
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
                      color: isPositive ? '#34A853' : '#EA4335',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {isPositive ? '+' : '−'}₹{Math.abs(group.total).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Glass Card Containing Month's Transactions */}
                <div
                  style={{ margin: '0 16px', borderRadius: 16, overflow: 'hidden' }}
                  className="glass-card"
                >
                  {group.items.map((tx, i) => (
                    <div key={tx.Transaction_ID}>
                      <TransactionItem transaction={tx} onClick={openEditModal} />
                      {i < group.items.length - 1 && (
                        <div
                          style={{
                            height: 1,
                            background: 'rgba(255, 255, 255, 0.05)',
                            margin: '0 20px',
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <FAB />
      <BottomNav />
      <TransactionModal />
    </div>
  );
}
