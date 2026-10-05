import { useApp } from '../context/AppContext';

function ArrowDownLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="17" y1="7" x2="7" y2="17" />
      <polyline points="17 17 7 17 7 7" />
    </svg>
  );
}

function ArrowUpRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
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
      color: '#34A853',
      bgGlow: 'rgba(52, 168, 83, 0.12)',
      icon: <ArrowDownLeft />,
    },
    {
      key: 'expense',
      label: 'Expenses',
      value: summary.expenses,
      color: '#EA4335',
      bgGlow: 'rgba(234, 67, 53, 0.12)',
      icon: <ArrowUpRight />,
    },
    {
      key: 'savings',
      label: 'Net Saved',
      value: summary.savings,
      color: '#4285F4',
      bgGlow: 'rgba(66, 133, 244, 0.12)',
      icon: <SparklesIcon />,
    },
  ];

  return (
    <div style={{ padding: '0 20px 24px' }}>
      <div className="summary-row">
        {cards.map((card) => (
          <div key={card.key} className={`summary-card ${card.key} touch-scale`}>
            {/* Icon + Label Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px 4px 6px',
                borderRadius: '8px',
                backgroundColor: card.bgGlow,
                color: card.color,
                marginBottom: 12,
              }}
            >
              {card.icon}
              <span
                style={{
                  fontSize: 11,
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
                fontSize: 17,
                fontWeight: 700,
                color: '#F1F5F9',
                letterSpacing: '-0.03em',
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
