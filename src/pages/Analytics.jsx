import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import FAB from '../components/FAB';
import TransactionModal from '../components/TransactionModal';
import MonthSelector from '../components/MonthSelector';
import { getCategoryMeta } from '../components/constants';
import {
  calculateMetrics,
  calculateCategoryBreakdown,
  calculateMonthlyTrends,
  formatMonthYearFull,
} from '../utils/analytics';

function SkeletonBlock({ height = 80, width = '100%', borderRadius = 12 }) {
  return (
    <div
      className="skeleton"
      style={{ height, width, borderRadius, margin: '8px 0' }}
    />
  );
}

export default function Analytics() {
  const {
    transactions,
    filteredTransactions,
    loading,
    error,
    selectedMonth,
    loadTransactions,
    openAddModal,
  } = useApp();

  // Mode: 'month' (selected month) or 'all' (all time)
  const [viewScope, setViewScope] = useState('month');

  // Active dataset for scoped metrics & category breakdown
  const activeTransactions = useMemo(() => {
    return viewScope === 'month' ? filteredTransactions : transactions;
  }, [viewScope, filteredTransactions, transactions]);

  // Derived metrics
  const metrics = useMemo(() => {
    return calculateMetrics(activeTransactions);
  }, [activeTransactions]);

  // Derived category breakdown (sorted highest spending first)
  const categoryBreakdown = useMemo(() => {
    return calculateCategoryBreakdown(activeTransactions);
  }, [activeTransactions]);

  // Derived historical monthly trends (calculated across ALL transactions)
  const monthlyTrends = useMemo(() => {
    return calculateMonthlyTrends(transactions);
  }, [transactions]);

  // Find max value across all months for proportional bar scaling
  const maxTrendValue = useMemo(() => {
    let max = 0;
    for (const m of monthlyTrends) {
      if (m.income > max) max = m.income;
      if (m.expense > max) max = m.expense;
    }
    return max > 0 ? max : 1;
  }, [monthlyTrends]);

  const hasAnyData = transactions.length > 0;
  const hasScopedData = activeTransactions.length > 0;
  const monthName = formatMonthYearFull(selectedMonth);

  return (
    <div className="app-shell page-in" style={{ paddingBottom: 104 }}>
      <TopAppBar />

      {/* Page Title & Scope Toggle */}
      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>
            Analytics
          </h1>

          {/* Scope Toggle: This Month vs All Time */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 10,
              padding: 3,
              gap: 2,
            }}
          >
            <button
              type="button"
              onClick={() => setViewScope('month')}
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: viewScope === 'month' ? '#1A73E8' : 'transparent',
                color: viewScope === 'month' ? '#FFFFFF' : '#94A3B8',
                transition: 'all 0.15s ease',
              }}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewScope('all')}
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: viewScope === 'all' ? '#1A73E8' : 'transparent',
                color: viewScope === 'all' ? '#FFFFFF' : '#94A3B8',
                transition: 'all 0.15s ease',
              }}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Month Selector (shown when scope is 'month') */}
        {viewScope === 'month' && (
          <div style={{ margin: '0 -20px -8px -20px' }}>
            <MonthSelector />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SkeletonBlock height={110} />
            <SkeletonBlock height={180} />
            <SkeletonBlock height={140} />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            style={{
              background: 'rgba(234, 67, 53, 0.08)',
              border: '1px solid rgba(234, 67, 53, 0.25)',
              borderRadius: 16,
              padding: '28px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              marginTop: 10,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(234, 67, 53, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EA4335',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>
              Unable to load analytics
            </p>
            <p style={{ fontSize: 13, color: '#94A3B8', maxWidth: 280, lineHeight: 1.4 }}>
              Failed to connect to Google Sheets. Please check your network and try again.
            </p>
            <button
              onClick={() => loadTransactions()}
              className="btn-primary"
              style={{ width: 'auto', padding: '10px 20px', fontSize: 13, marginTop: 4 }}
              type="button"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Empty State (when no transactions exist at all) */}
        {!loading && !error && !hasAnyData && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 18,
              padding: '40px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              marginTop: 10,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'rgba(66, 133, 244, 0.1)',
                border: '1px solid rgba(66, 133, 244, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4285F4',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#F1F5F9' }}>
              No transaction data yet
            </p>
            <p style={{ fontSize: 13, color: '#94A3B8', maxWidth: 280, lineHeight: 1.5 }}>
              Add your first transaction to see your spending insights.
            </p>
            <button
              onClick={openAddModal}
              className="btn-primary"
              style={{ width: 'auto', padding: '11px 22px', fontSize: 14, marginTop: 6 }}
              type="button"
            >
              + Add Transaction
            </button>
          </div>
        )}

        {/* Empty State for Selected Month (historical data exists, but current month is empty) */}
        {!loading && !error && hasAnyData && !hasScopedData && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 18,
              padding: '36px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}
            >
              📅
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>
              No transactions in {monthName}
            </p>
            <p style={{ fontSize: 13, color: '#94A3B8', maxWidth: 260, lineHeight: 1.4 }}>
              Add an expense for {monthName}, or switch to "All Time" to view total insights.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button
                onClick={() => setViewScope('all')}
                style={{
                  padding: '9px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#F1F5F9',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                }}
                type="button"
              >
                View All Time
              </button>
              <button
                onClick={openAddModal}
                className="btn-primary"
                style={{ width: 'auto', padding: '9px 16px', fontSize: 13 }}
                type="button"
              >
                + Add Transaction
              </button>
            </div>
          </div>
        )}

        {/* 1. Core Financial Metrics Cards */}
        {!loading && !error && hasScopedData && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {viewScope === 'month' ? `${monthName} Overview` : 'All Time Overview'}
              </span>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                {metrics.transactionCount} {metrics.transactionCount === 1 ? 'transaction' : 'transactions'}
              </span>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {/* Total Income */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 14,
                  padding: '14px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34A853' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Income
                  </span>
                </div>
                <p className="tabular-nums" style={{ fontSize: 18, fontWeight: 700, color: '#34A853' }}>
                  ₹{metrics.totalIncome.toLocaleString('en-IN')}
                </p>
                <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  {metrics.incomeTransactionCount} deposits
                </p>
              </div>

              {/* Total Expenses */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 14,
                  padding: '14px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EA4335' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Expenses
                  </span>
                </div>
                <p className="tabular-nums" style={{ fontSize: 18, fontWeight: 700, color: '#EA4335' }}>
                  ₹{metrics.totalExpenses.toLocaleString('en-IN')}
                </p>
                <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  {metrics.expenseTransactionCount} spendings
                </p>
              </div>

              {/* Net Balance */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 14,
                  padding: '14px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4285F4' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Net Balance
                  </span>
                </div>
                <p
                  className="tabular-nums"
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: metrics.netBalance >= 0 ? '#4285F4' : '#EA4335',
                  }}
                >
                  {metrics.netBalance < 0 ? '−' : ''}₹{Math.abs(metrics.netBalance).toLocaleString('en-IN')}
                </p>
                <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  {metrics.netBalance >= 0 ? 'Surplus' : 'Deficit'}
                </p>
              </div>

              {/* Average Expense per Expense Transaction */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 14,
                  padding: '14px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFD166' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Avg Expense
                  </span>
                </div>
                <p className="tabular-nums" style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9' }}>
                  ₹{metrics.averageExpense.toLocaleString('en-IN')}
                </p>
                <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  per expense txn
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Expense Category Breakdown (Horizontal Bar Chart) */}
        {!loading && !error && categoryBreakdown.length > 0 && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 16,
              padding: '18px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', textTransform: 'none', letterSpacing: '-0.01em' }}>
                  Expenses by Category
                </h3>
                <p style={{ fontSize: 11, color: '#64748B', marginTop: 2, textTransform: 'none', letterSpacing: 'normal' }}>
                  Ranked by highest spending
                </p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>
                ₹{metrics.totalExpenses.toLocaleString('en-IN')}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {categoryBreakdown.map((cat) => {
                const meta = getCategoryMeta(cat.category);
                return (
                  <div key={cat.category}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: 15 }}>{meta.icon || '🏷️'}</span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#F1F5F9',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {cat.category}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '1px 6px',
                            borderRadius: 6,
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: '#94A3B8',
                            fontWeight: 600,
                          }}
                        >
                          {cat.percentage}%
                        </span>
                      </div>
                      <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>
                        ₹{cat.total.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Horizontal Bar */}
                    <div
                      style={{
                        width: '100%',
                        height: 6,
                        borderRadius: 99,
                        background: 'rgba(255, 255, 255, 0.06)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(4, cat.percentage)}%`,
                          height: '100%',
                          borderRadius: 99,
                          backgroundColor: meta.color || '#4285F4',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Monthly Income vs Expense Trend (Grouped Bar Chart) */}
        {!loading && !error && monthlyTrends.length > 0 && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 16,
              padding: '18px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', textTransform: 'none', letterSpacing: '-0.01em' }}>
                  Monthly Trends
                </h3>
                <p style={{ fontSize: 11, color: '#64748B', marginTop: 2, textTransform: 'none', letterSpacing: 'normal' }}>
                  Income vs Expenses over time
                </p>
              </div>

              {/* Chart Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#34A853' }} />
                  <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>Income</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#EA4335' }} />
                  <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>Expense</span>
                </div>
              </div>
            </div>

            {/* Responsive Chart Container */}
            <div
              style={{
                width: '100%',
                overflowX: monthlyTrends.length > 6 ? 'auto' : 'visible',
                paddingBottom: 4,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: monthlyTrends.length <= 4 ? 'space-around' : 'space-between',
                  gap: 12,
                  height: 140,
                  paddingTop: 20,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  minWidth: monthlyTrends.length > 6 ? monthlyTrends.length * 52 : 'auto',
                }}
              >
                {monthlyTrends.map((month) => {
                  const incomeHeight = Math.max(4, Math.round((month.income / maxTrendValue) * 110));
                  const expenseHeight = Math.max(4, Math.round((month.expense / maxTrendValue) * 110));
                  const isCurrent = month.yearMonth === selectedMonth;

                  return (
                    <div
                      key={month.yearMonth}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                        flex: 1,
                        maxWidth: 60,
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setViewScope('month');
                      }}
                      title={`${month.label}\nIncome: ₹${month.income.toLocaleString('en-IN')}\nExpense: ₹${month.expense.toLocaleString('en-IN')}\nNet: ₹${month.net.toLocaleString('en-IN')}`}
                    >
                      {/* Dual Bars Container */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: 4,
                          height: 110,
                          width: '100%',
                          justifyContent: 'center',
                        }}
                      >
                        {/* Income Bar (Emerald) */}
                        <div
                          style={{
                            width: 12,
                            height: incomeHeight,
                            background: '#34A853',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s ease',
                          }}
                        />

                        {/* Expense Bar (Crimson) */}
                        <div
                          style={{
                            width: 12,
                            height: expenseHeight,
                            background: '#EA4335',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s ease',
                          }}
                        />
                      </div>

                      {/* Month Label */}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: isCurrent ? 700 : 500,
                          color: isCurrent ? '#4285F4' : '#94A3B8',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {month.shortLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart Subtext / Hint */}
            <p style={{ fontSize: 11, color: '#64748B', marginTop: 10, textAlign: 'center' }}>
              Tap any month to inspect details
            </p>
          </div>
        )}

      </div>

      <FAB />
      <BottomNav />
      <TransactionModal />
    </div>
  );
}
