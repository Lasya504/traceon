import { useApp } from '../context/AppContext';

function ArrowDownLeft() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="17" y1="7" x2="7" y2="17" />
      <polyline points="17 17 7 17 7 7" />
    </svg>
  );
}

function ArrowUpRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export default function SummaryCards() {
  const { summary } = useApp();

  const cards = [
    {
      key: 'income',
      label: 'Income',
      value: summary.income,
      color: 'var(--income)',
      bgGlow: 'var(--income-dim)',
      icon: <ArrowDownLeft />,
    },
    {
      key: 'expense',
      label: 'Expenses',
      value: summary.expenses,
      color: 'var(--expense)',
      bgGlow: 'var(--expense-dim)',
      icon: <ArrowUpRight />,
    },
    {
      key: 'savings',
      label: 'Net Saved',
      value: summary.savings,
      color: summary.savings >= 0 ? 'var(--text-primary)' : 'var(--expense)',
      bgGlow: summary.savings >= 0 ? 'var(--bg-surface-subtle)' : 'var(--expense-dim)',
      icon: <SparklesIcon />,
    },
  ];

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <div className="summary-row">
        {cards.map((card) => (
          <div key={card.key} className="summary-card touch-scale">
            {/* Icon + Label Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 8px',
                borderRadius: '9999px',
                backgroundColor: card.bgGlow,
                color: card.color,
                marginBottom: 10,
              }}
            >
              {card.icon}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}
              >
                {card.label}
              </span>
            </div>

            {/* Currency Value with Tabular Numeral Formatting */}
            <p
              className="tabular-nums"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {card.key === 'savings' && card.value < 0 ? '−' : ''}₹{Math.abs(card.value).toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
