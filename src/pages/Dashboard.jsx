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
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 14, width: '55%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: '35%', borderRadius: 6 }} />
      </div>
      <div className="skeleton" style={{ height: 16, width: 64, borderRadius: 6 }} />
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    filteredTransactions,
    loading,
    openEditModal,
    summary,
    dashboardMetrics,
    activeSpreadsheetId,
    activeSpreadsheetUrl,
    isSheetConnected,
  } = useApp();

  const sheetUrl =
    activeSpreadsheetUrl ||
    (activeSpreadsheetId ? `https://docs.google.com/spreadsheets/d/${activeSpreadsheetId}/edit` : null);

  const recentTxs = dashboardMetrics.recentTransactions;

  const topCategories = useMemo(() => {
    return calculateCategoryBreakdown(filteredTransactions).slice(0, 3);
  }, [filteredTransactions]);

  const isPositiveBalance = summary.savings >= 0;
  const totalFlow = summary.income + summary.expenses;
  const expensePercentage = totalFlow > 0 ? Math.min(100, Math.round((summary.expenses / (summary.income || summary.expenses)) * 100)) : 0;

  return (
    <div className="app-shell page-in" style={{ paddingBottom: 104 }}>
      <TopAppBar />
      <MonthSelector />

      {/* Google Sheet Connection Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0 20px 16px',
          padding: '10px 14px',
          borderRadius: 16,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          fontSize: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: isSheetConnected && activeSpreadsheetId ? 'var(--income)' : 'var(--text-muted)',
              boxShadow: isSheetConnected && activeSpreadsheetId ? '0 0 6px var(--income)' : 'none',
            }}
          />
          <span
            style={{
              fontWeight: 600,
              color: isSheetConnected && activeSpreadsheetId ? 'var(--income)' : 'var(--text-secondary)',
            }}
          >
            {isSheetConnected && activeSpreadsheetId ? 'Google Sheet synced' : 'Sheet not connected'}
          </span>
        </div>

        {isSheetConnected && activeSpreadsheetId && sheetUrl ? (
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-scale"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: 12,
              textDecoration: 'none',
            }}
          >
            <span>Open Sheet ↗</span>
          </a>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="touch-scale"
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Connect Sheet →
          </button>
        )}
      </div>

      {/* Hero Balance Card */}
      <div style={{ padding: '0 20px 18px' }}>
        <div className="hero-balance-card">
          {/* Header Row: Label & Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-secondary)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Net Balance
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 10px',
                borderRadius: 9999,
                background: isPositiveBalance ? 'var(--income-dim)' : 'var(--expense-dim)',
                color: isPositiveBalance ? 'var(--income)' : 'var(--expense)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.01em',
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  backgroundColor: isPositiveBalance ? 'var(--income)' : 'var(--expense)',
                }}
              />
              {isPositiveBalance ? 'Surplus' : 'Deficit'}
            </span>
          </div>

          {/* Amount */}
          <p
            className="tabular-nums"
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              margin: '8px 0 14px',
            }}
          >
            {summary.savings < 0 ? '−' : ''}₹{Math.abs(summary.savings).toLocaleString('en-IN')}
          </p>

          {/* Flow Bar */}
          {summary.income > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  width: '100%',
                  height: 6,
                  borderRadius: 9999,
                  background: 'var(--income-dim)',
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, expensePercentage)}%`,
                    height: '100%',
                    backgroundColor: 'var(--expense)',
                    borderRadius: 9999,
                  }}
                  title={`Expenses: ${expensePercentage}% of income`}
                />
              </div>
            </div>
          )}

          {/* Subtitle details */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            <span>
              {isPositiveBalance ? 'Saved this month' : 'Over budget'}
            </span>
            <span>
              {dashboardMetrics.currentMonthTxCount} {dashboardMetrics.currentMonthTxCount === 1 ? 'transaction' : 'transactions'}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Top Categories of Selected Month */}
      {!loading && topCategories.length > 0 && (
        <div style={{ marginTop: 2, marginBottom: 20 }}>
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
          <div style={{ margin: '0 20px', padding: '16px 18px', borderRadius: 22 }} className="card-surface">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {topCategories.map((cat) => {
                const meta = getCategoryMeta(cat.category);
                return (
                  <div key={cat.category}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: meta.bg || 'var(--bg-surface-subtle)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                          }}
                        >
                          {meta.icon || '🏷️'}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {cat.category}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-surface-subtle)',
                            padding: '1px 6px',
                            borderRadius: 9999,
                          }}
                        >
                          {cat.percentage}%
                        </span>
                      </div>
                      <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{cat.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 5, borderRadius: 9999, background: 'var(--bg-surface-subtle)' }}>
                      <div
                        style={{
                          width: `${Math.max(4, cat.percentage)}%`,
                          height: '100%',
                          borderRadius: 9999,
                          backgroundColor: meta.color || 'var(--btn-primary-bg)',
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
      <div className="divider" style={{ marginBottom: 18 }} />

      {/* Recent Transactions Section */}
      <div>
        <div className="section-header">
          <span className="section-title">Recent Activity</span>
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
          <div style={{ margin: '0 20px', borderRadius: 22, overflow: 'hidden' }} className="card-surface">
            <SkeletonRow />
            <div style={{ height: 1, background: 'var(--border-solid)', margin: '0 18px' }} />
            <SkeletonRow />
            <div style={{ height: 1, background: 'var(--border-solid)', margin: '0 18px' }} />
            <SkeletonRow />
          </div>
        ) : recentTxs.length === 0 ? (
          <div className="empty-card">
            <div className="empty-icon-glow">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              No transactions yet
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 260, lineHeight: 1.5 }}>
              Tap the <strong>+</strong> button below to record your first expense or income
            </p>
          </div>
        ) : (
          <div style={{ margin: '0 20px', borderRadius: 22, overflow: 'hidden' }} className="card-surface">
            {recentTxs.map((tx, i) => (
              <div key={tx.Transaction_ID}>
                <TransactionItem transaction={tx} onClick={openEditModal} />
                {i < recentTxs.length - 1 && (
                  <div style={{ height: 1, background: 'var(--border-solid)', margin: '0 18px' }} />
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
