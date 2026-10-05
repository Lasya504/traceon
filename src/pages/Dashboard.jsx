import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import TopAppBar from '../components/TopAppBar';
import MonthSelector from '../components/MonthSelector';
import SummaryCards from '../components/SummaryCards';
import TransactionItem from '../components/TransactionItem';
import BottomNav from '../components/BottomNav';
import FAB from '../components/FAB';
import TransactionModal from '../components/TransactionModal';
import { getCategoryMeta } from '../components/constants';
import { calculateCategoryBreakdown } from '../utils/analytics';

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px' }}>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 15, width: '55%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: '35%', borderRadius: 6 }} />
      </div>
      <div className="skeleton" style={{ height: 16, width: 64, borderRadius: 6 }} />
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { filteredTransactions, loading, openEditModal, summary } = useApp();

  const recentTxs = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => new Date(b.Date) - new Date(a.Date))
      .slice(0, 5);
  }, [filteredTransactions]);

  const topCategories = useMemo(() => {
    return calculateCategoryBreakdown(filteredTransactions).slice(0, 3);
  }, [filteredTransactions]);

  const isPositiveBalance = summary.savings >= 0;

  return (
    <div className="app-shell page-in" style={{ paddingBottom: 104 }}>
      <TopAppBar />
      <MonthSelector />

      {/* Balance Hero Section */}
      <div className="balance-section">
        <p className="balance-label">Net Balance</p>
        <p
          className="balance-amount"
          style={{ color: isPositiveBalance ? '#4285F4' : '#EA4335' }}
        >
          {summary.savings < 0 ? '−' : ''}₹{Math.abs(summary.savings).toLocaleString('en-IN')}
        </p>
        <div className="balance-sub">
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: isPositiveBalance ? '#34A853' : '#EA4335',
              boxShadow: `0 0 6px ${isPositiveBalance ? '#34A853' : '#EA4335'}`,
            }}
          />
          <span>
            {isPositiveBalance ? 'Saved this month' : 'Over budget this month'} · {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Top Categories of Selected Month */}
      {!loading && topCategories.length > 0 && (
        <div style={{ marginTop: 2 }}>
          <div className="section-header">
            <span className="section-title">Top Spending</span>
            <button
              className="section-action touch-scale"
              onClick={() => navigate('/analytics')}
              type="button"
            >
              All Insights →
            </button>
          </div>
          <div style={{ margin: '6px 16px 20px', padding: '14px 16px', borderRadius: 16 }} className="glass-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topCategories.map((cat) => {
                const meta = getCategoryMeta(cat.category);
                return (
                  <div key={cat.category}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>{meta.icon || '🏷️'}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>
                          {cat.category}
                        </span>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>
                          {cat.percentage}%
                        </span>
                      </div>
                      <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>
                        ₹{cat.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 5, borderRadius: 99, background: 'rgba(255, 255, 255, 0.06)' }}>
                      <div
                        style={{
                          width: `${Math.max(4, cat.percentage)}%`,
                          height: '100%',
                          borderRadius: 99,
                          backgroundColor: meta.color || '#4285F4',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Section Divider */}
      <div className="divider" />

      {/* Recent Transactions Section */}
      <div style={{ marginTop: 22 }}>
        <div className="section-header">
          <span className="section-title">Recent Transactions</span>
          {recentTxs.length > 0 && (
            <button
              className="section-action touch-scale"
              onClick={() => navigate('/transactions')}
              type="button"
            >
              See all
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '4px 0' }}>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : recentTxs.length === 0 ? (
          <div className="empty-card">
            <div className="empty-icon-glow">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>
              No transactions yet
            </p>
            <p style={{ fontSize: 13, color: '#94A3B8', maxWidth: 280, lineHeight: 1.5 }}>
              Tap the <strong style={{ color: '#4285F4', fontWeight: 600 }}>+</strong> button to record your first expense
            </p>
          </div>
        ) : (
          <div style={{ margin: '8px 16px 0', borderRadius: 16, overflow: 'hidden' }} className="glass-card">
            {recentTxs.map((tx, i) => (
              <div key={tx.Transaction_ID}>
                <TransactionItem transaction={tx} onClick={openEditModal} />
                {i < recentTxs.length - 1 && (
                  <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.05)', margin: '0 20px' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <FAB />
      <BottomNav />
      <TransactionModal />
    </div>
  );
}
