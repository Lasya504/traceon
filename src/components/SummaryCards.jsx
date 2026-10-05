import { useApp } from '../context/AppContext';

export default function SummaryCards() {
  const { summary } = useApp();

  return (
    <div className="px-5 mb-6">
      <div className="summary-row">
        {/* Income */}
        <div className="summary-card">
          <p className="text-[12px] font-medium text-text-muted mb-1 uppercase tracking-wide">Income</p>
          <p className="text-[17px] font-semibold" style={{ color: 'var(--color-income)' }}>
            ₹{summary.income.toLocaleString('en-IN')}
          </p>
        </div>
        
        {/* Expenses */}
        <div className="summary-card">
          <p className="text-[12px] font-medium text-text-muted mb-1 uppercase tracking-wide">Expenses</p>
          <p className="text-[17px] font-semibold" style={{ color: 'var(--color-expense)' }}>
            ₹{summary.expenses.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Savings */}
        <div className="summary-card">
          <p className="text-[12px] font-medium text-text-muted mb-1 uppercase tracking-wide">Savings</p>
          <p className="text-[17px] font-semibold" style={{ color: 'var(--color-primary)' }}>
            ₹{summary.savings.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
}
