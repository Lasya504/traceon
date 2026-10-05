import { useApp } from '../context/AppContext';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useApp();
  const [year, monthNum] = selectedMonth.split('-');
  const monthLabel = `${MONTHS[parseInt(monthNum) - 1]} ${year}`;

  return (
    <div style={{ padding: '4px 20px 18px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
      <label className="month-pill touch-scale" title="Select Month">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4285F4"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>

        <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
          {monthLabel}
        </span>

        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.6, marginLeft: 2 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>

        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            cursor: 'pointer',
            width: '100%',
            height: '100%',
          }}
          aria-label="Select month"
        />
      </label>
    </div>
  );
}
