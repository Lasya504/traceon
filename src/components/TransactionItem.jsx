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
      {/* Category Icon in Glass Container */}
      <div
        className="cat-icon"
        style={{
          background: `radial-gradient(circle, ${meta.color}25 0%, ${meta.color}10 100%)`,
          color: meta.color,
          border: `1px solid ${meta.color}35`,
        }}
      >
        {meta.icon}
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#F1F5F9',
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
            color: '#94A3B8',
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: meta.color,
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 500 }}>{category}</span>
          <span style={{ color: '#475569' }}>·</span>
          <span>{formatDate(transaction.Date)}</span>
          {transaction.Payment_Mode && (
            <>
              <span style={{ color: '#475569' }}>·</span>
              <span
                style={{
                  fontSize: 11,
                  padding: '1px 6px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#CBD5E1',
                }}
              >
                {transaction.Payment_Mode}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Amount with Tabular Numerals & Semantic Color */}
      <p
        className="tabular-nums"
        style={{
          fontSize: 16,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          color: isIncome ? '#34A853' : '#F1F5F9',
          letterSpacing: '-0.02em',
        }}
      >
        <span style={{ color: isIncome ? '#34A853' : '#EA4335', marginRight: 2 }}>
          {isIncome ? '+' : '−'}
        </span>
        ₹{amount.toLocaleString('en-IN')}
      </p>
    </button>
  );
}
