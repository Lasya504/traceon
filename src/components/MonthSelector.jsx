import { useApp } from '../context/AppContext';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useApp();
  const [year, monthNum] = selectedMonth.split('-');
  const monthLabel = `${MONTHS[parseInt(monthNum) - 1]} ${year}`;

  const handleChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  return (
    <div className="px-5 pb-3">
      <label className="month-pill">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {monthLabel}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 ml-1">
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <input
          type="month"
          value={selectedMonth}
          onChange={handleChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
    </div>
  );
}
