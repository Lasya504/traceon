import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import TopAppBar from '../components/TopAppBar';
import MonthSelector from '../components/MonthSelector';
import SummaryCards from '../components/SummaryCards';
import TransactionItem from '../components/TransactionItem';
import BottomNav from '../components/BottomNav';
import FAB from '../components/FAB';
import TransactionModal from '../components/TransactionModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const { filteredTransactions, loading, openEditModal } = useApp();

  const recentTxs = [...filteredTransactions]
    .sort((a, b) => new Date(b.Date) - new Date(a.Date))
    .slice(0, 5);

  return (
    <div className="app-shell pb-24 page-in">
      <TopAppBar />
      <MonthSelector />
      <SummaryCards />

      {/* Recent Transactions */}
      <div>
        <div className="px-5 mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text-secondary">Recent Transactions</h2>
        </div>

        {loading ? (
          <div className="px-5 space-y-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl skeleton shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-24 skeleton" />
                  <div className="h-3 w-16 skeleton" />
                </div>
                <div className="h-4 w-12 skeleton mt-1" />
              </div>
            ))}
          </div>
        ) : recentTxs.length === 0 ? (
          <div className="empty-state">
            <p className="text-text-muted text-[15px]">No transactions this month.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#29364A]">
            {recentTxs.map((tx) => (
              <TransactionItem
                key={tx.Transaction_ID}
                transaction={tx}
                onClick={openEditModal}
              />
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
