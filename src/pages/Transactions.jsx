import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import BottomNav from '../components/BottomNav';
import FAB from '../components/FAB';
import TransactionItem from '../components/TransactionItem';
import TransactionModal from '../components/TransactionModal';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function groupByMonth(transactions) {
  const groups = {};
  transactions.forEach((tx) => {
    if (!tx.Date) return;
    const [y, m] = tx.Date.split('-');
    const key = `${y}-${m}`;
    const label = `${MONTHS[parseInt(m) - 1]} ${y}`;
    if (!groups[key]) groups[key] = { label, items: [] };
    groups[key].items.push(tx);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, val]) => val);
}

export default function TransactionsPage() {
  const { transactions, loading, openEditModal } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.Description?.toLowerCase().includes(q) ||
          tx.Category?.toLowerCase().includes(q)
      );
    }

    if (filter === 'income') {
      result = result.filter((tx) => parseFloat(tx.Credit) > 0);
    } else if (filter === 'expenses') {
      result = result.filter((tx) => parseFloat(tx.Debit) > 0);
    }

    result.sort((a, b) => new Date(b.Date) - new Date(a.Date));
    return result;
  }, [transactions, search, filter]);

  const grouped = groupByMonth(filtered);

  return (
    <div className="app-shell pb-24 page-in">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[22px]">Transactions</h1>
      </div>

      <div className="px-5 mb-4 search-wrap">
        <svg
          className="search-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#718096"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions..."
        />
      </div>

      <div className="px-5 mb-6">
        <div className="filter-tabs">
          {['all', 'income', 'expenses'].map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        {loading ? (
          <div className="px-5 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl skeleton shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-32 skeleton" />
                  <div className="h-3 w-20 skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="empty-state">
            <p className="text-text-muted text-[15px]">No transactions found.</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label} className="mb-6">
              <h3 className="px-5 text-[14px] font-semibold text-text-muted mb-2">{group.label}</h3>
              <div className="divide-y divide-[#29364A]">
                {group.items.map((tx) => (
                  <TransactionItem
                    key={tx.Transaction_ID}
                    transaction={tx}
                    onClick={openEditModal}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <FAB />
      <BottomNav />
      <TransactionModal />
    </div>
  );
}
