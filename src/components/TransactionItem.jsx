import { getCategoryMeta } from './constants';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export default function TransactionItem({ transaction, onClick }) {
  const isIncome = parseFloat(transaction.Credit) > 0;
  const amount = isIncome ? parseFloat(transaction.Credit) : parseFloat(transaction.Debit);
  const category = isIncome ? 'Income' : transaction.Category;
  const meta = getCategoryMeta(category);

  return (
    <button
      className="tx-item w-full text-left"
      onClick={() => onClick?.(transaction)}
    >
      <div 
        className="cat-icon"
        style={{ background: `${meta.color}1A`, color: meta.color }}
      >
        {meta.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-text truncate">
          {transaction.Description}
        </p>
        <p className="text-[13px] text-text-muted mt-0.5">
          {category} · {formatDate(transaction.Date)}
        </p>
      </div>

      <p className={`text-[15px] font-semibold whitespace-nowrap ${isIncome ? 'text-[#52D6A1]' : 'text-[#F5F7FA]'}`}>
        {isIncome ? '+' : '-'} ₹{amount.toLocaleString('en-IN')}
      </p>
    </button>
  );
}
