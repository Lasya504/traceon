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

function SkeletonBlock({ height = 80, width = '100%', borderRadius = 14 }) {
  return (
    <div
      className="skeleton"
      style={{ height, width, borderRadius, margin: '6px 0' }}
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
    setSelectedMonth,
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

  // Top 5 spending categories (for dedicated section)
  const topCategories = useMemo(() => {
    return calculateCategoryBreakdown(activeTransactions).slice(0, 5);
  }, [activeTransactions]);

  const hasAnyData = transactions.length > 0;
  const hasScopedData = activeTransactions.length > 0;
  const monthName = formatMonthYearFull(selectedMonth);

  return (
    <div className="app-shell page-in" style={{ paddingBottom: 104 }}>
      <TopAppBar />

      {/* Page Title & Scope Toggle */}
      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Analytics
          </h1>

          {/* Scope Toggle (Pill Control) */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-surface-subtle)',
              borderRadius: 9999,
              padding: 3,
              gap: 2,
            }}
          >
            <button
              type="button"
              onClick={() => setViewScope('month')}
              className="touch-scale"
              style={{
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: viewScope === 'month' ? 'var(--tab-active-bg)' : 'transparent',
                color: viewScope === 'month' ? 'var(--tab-active-text)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewScope('all')}
              className="touch-scale"
              style={{
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: viewScope === 'all' ? 'var(--tab-active-bg)' : 'transparent',
                color: viewScope === 'all' ? 'var(--tab-active-text)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Month Selector (shown when scope is 'month') */}
        {viewScope === 'month' && (
          <div style={{ margin: '0 -20px -6px -20px' }}>
            <MonthSelector />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

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
              background: 'var(--expense-dim)',
              border: '1px solid var(--expense-border)',
              borderRadius: 22,
              padding: '28px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              marginTop: 6,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: 'var(--expense-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--expense)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Unable to load analytics
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 260, lineHeight: 1.4 }}>
              Failed to connect to Google Sheets. Please check your network and try again.
            </p>
            <button
              onClick={() => loadTransactions()}
              className="btn-primary touch-scale"
              style={{ width: 'auto', padding: '9px 20px', fontSize: 13, marginTop: 4, borderRadius: 9999 }}
              type="button"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Empty State (when no transactions exist at all) */}
        {!loading && !error && !hasAnyData && (
          <div className="empty-card">
            <div className="empty-icon-glow">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              No transaction data yet
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 260, lineHeight: 1.5 }}>
              Add your first transaction to view your spending insights.
            </p>
            <button
              onClick={openAddModal}
              className="btn-primary touch-scale"
              style={{ width: 'auto', padding: '10px 22px', fontSize: 13, marginTop: 4, borderRadius: 9999 }}
              type="button"
            >
              + Add Transaction
            </button>
          </div>
        )}

        {/* Empty State for Selected Month */}
        {!loading && !error && hasAnyData && !hasScopedData && (
          <div className="empty-card">
            <div className="empty-icon-glow">
              📅
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              No transactions in {monthName}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 260, lineHeight: 1.4 }}>
              Add an expense for {monthName}, or switch to "All Time" to view total insights.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button
                onClick={() => setViewScope('all')}
                style={{
                  padding: '9px 16px',
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 600,
                  background: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-medium)',
                  cursor: 'pointer',
                }}
                type="button"
              >
                View All Time
              </button>
              <button
                onClick={openAddModal}
                className="btn-primary touch-scale"
                style={{ width: 'auto', padding: '9px 16px', fontSize: 13, borderRadius: 9999 }}
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
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {viewScope === 'month' ? `${monthName} Overview` : 'All Time Overview'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                {metrics.transactionCount} {metrics.transactionCount === 1 ? 'transaction' : 'transactions'}
              </span>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {/* Total Income */}
              <div
                className="card-surface touch-scale"
                style={{
                  padding: '14px 14px',
                  borderRadius: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--income)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    Income
                  </span>
                </div>
                <p className="tabular-nums" style={{ fontSize: 17, fontWeight: 700, color: 'var(--income)' }}>
                  ₹{metrics.totalIncome.toLocaleString('en-IN')}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  {metrics.incomeTransactionCount} deposits
                </p>
              </div>

              {/* Total Expenses */}
              <div
                className="card-surface touch-scale"
                style={{
                  padding: '14px 14px',
                  borderRadius: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--expense)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    Expenses
                  </span>
                </div>
                <p className="tabular-nums" style={{ fontSize: 17, fontWeight: 700, color: 'var(--expense)' }}>
                  ₹{metrics.totalExpenses.toLocaleString('en-IN')}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  {metrics.expenseTransactionCount} spendings
                </p>
              </div>

              {/* Net Balance */}
              <div
                className="card-surface touch-scale"
                style={{
                  padding: '14px 14px',
                  borderRadius: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-primary)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    Net Balance
                  </span>
                </div>
                <p
                  className="tabular-nums"
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: metrics.netBalance >= 0 ? 'var(--text-primary)' : 'var(--expense)',
                  }}
                >
                  {metrics.netBalance < 0 ? '−' : ''}₹{Math.abs(metrics.netBalance).toLocaleString('en-IN')}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  {metrics.netBalance >= 0 ? 'Surplus' : 'Deficit'}
                </p>
              </div>

              {/* Average Expense per Expense Transaction */}
              <div
                className="card-surface touch-scale"
                style={{
                  padding: '14px 14px',
                  borderRadius: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-amber)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    Avg Expense
                  </span>
                </div>
                <p className="tabular-nums" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                  ₹{metrics.averageExpense.toLocaleString('en-IN')}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  per expense
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Expense Category Breakdown (Horizontal Bar Chart) */}
        {!loading && !error && categoryBreakdown.length > 0 && (
          <div
            className="card-surface"
            style={{
              padding: '18px 18px',
              borderRadius: 22,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  Expenses by Category
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Ranked by highest spending
                </p>
              </div>
              <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                ₹{metrics.totalExpenses.toLocaleString('en-IN')}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {categoryBreakdown.map((cat) => {
                const meta = getCategoryMeta(cat.category);
                return (
                  <div key={cat.category}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            background: meta.bg || 'var(--bg-surface-subtle)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                          }}
                        >
                          {meta.icon || '🏷️'}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
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
                            borderRadius: 9999,
                            background: 'var(--bg-surface-subtle)',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                          }}
                        >
                          {cat.percentage}%
                        </span>
                      </div>
                      <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{cat.total.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Horizontal Bar */}
                    <div
                      style={{
                        width: '100%',
                        height: 5,
                        borderRadius: 9999,
                        background: 'var(--bg-surface-subtle)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(4, cat.percentage)}%`,
                          height: '100%',
                          borderRadius: 9999,
                          backgroundColor: meta.color || 'var(--btn-primary-bg)',
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
            className="card-surface"
            style={{
              padding: '18px 18px',
              borderRadius: 22,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  Monthly Trends
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Income vs Expenses over time
                </p>
              </div>

              {/* Chart Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--income)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Income</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--expense)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Expense</span>
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
                  paddingTop: 16,
                  borderBottom: '1px solid var(--border-solid)',
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
                        setSelectedMonth(month.yearMonth);
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
                            width: 10,
                            height: incomeHeight,
                            background: 'var(--income)',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s ease',
                          }}
                        />

                        {/* Expense Bar (Rose) */}
                        <div
                          style={{
                            width: 10,
                            height: expenseHeight,
                            background: 'var(--expense)',
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
                          color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
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
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, textAlign: 'center' }}>
              Tap any month bar to inspect that month’s details
            </p>
          </div>
        )}

        {/* 4. Top Spending Categories (top 5) */}
        {!loading && !error && topCategories.length > 0 && (
          <div
            className="card-surface"
            style={{
              padding: '18px 18px',
              borderRadius: 22,
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Top Spending Ranking
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {viewScope === 'month' ? monthName : 'All time'} · top {topCategories.length}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topCategories.map((cat, idx) => {
                const meta = getCategoryMeta(cat.category);
                return (
                  <div
                    key={cat.category}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    {/* Rank */}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        width: 14,
                        textAlign: 'right',
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    {/* Icon */}
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
                        flexShrink: 0,
                      }}
                    >
                      {meta.icon || '🏷️'}
                    </span>
                    {/* Name + bar */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cat.category}
                        </span>
                        <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginLeft: 8, flexShrink: 0 }}>
                          ₹{cat.total.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, borderRadius: 9999, background: 'var(--bg-surface-subtle)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.max(4, cat.percentage)}%`,
                              height: '100%',
                              borderRadius: 9999,
                              backgroundColor: meta.color || 'var(--btn-primary-bg)',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, flexShrink: 0, width: 32, textAlign: 'right' }}>
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      <FAB />
      <BottomNav />
      <TransactionModal />
    </div>
  );
}
