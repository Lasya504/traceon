import { getCategoryMeta } from './constants';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export default function TransactionItem({ transaction, onClick }) {
  const isIncome = parseFloat(transaction.Credit) > 0;
  const amount = isIncome
    ? parseFloat(transaction.Credit)
    : parseFloat(transaction.Debit);
  const category = isIncome ? 'Income' : transaction.Category;
  const meta = getCategoryMeta(category);

  return (
    <button
      className="tx-item"
      onClick={() => onClick?.(transaction)}
      type="button"
    >
      {/* Category Icon with Soft Tinted Rounded Badge */}
      <div
        className="cat-icon"
        style={{
          background: meta.bg || 'var(--bg-surface-subtle)',
          color: meta.color,
          border: '1px solid var(--border-subtle)',
        }}
      >
        {meta.icon}
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}
        >
          {transaction.Description}
        </p>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginTop: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              borderRadius: '50%',
              backgroundColor: meta.color,
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 500 }}>{category}</span>
          <span style={{ color: 'var(--text-dim)' }}>·</span>
          <span>{formatDate(transaction.Date)}</span>
          {transaction.Payment_Mode && (
            <>
              <span style={{ color: 'var(--text-dim)' }}>·</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  background: 'var(--bg-surface-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                {transaction.Payment_Mode}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Amount with Tabular Numerals & Clear Sign */}
      <p
        className="tabular-nums"
        style={{
          fontSize: 15,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          color: isIncome ? 'var(--income)' : 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}
      >
        <span style={{ color: isIncome ? 'var(--income)' : 'var(--text-muted)', marginRight: 2 }}>
          {isIncome ? '+' : '−'}
        </span>
        ₹{amount.toLocaleString('en-IN')}
      </p>
    </button>
  );
}
