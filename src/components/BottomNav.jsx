import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  {
    label: 'Home',
    path: '/dashboard',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#FFFFFF' : '#8E95A5'} strokeWidth={active ? '2.3' : '1.8'}
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Transactions',
    path: '/transactions',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#FFFFFF' : '#8E95A5'} strokeWidth={active ? '2.3' : '1.8'}
        strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#FFFFFF' : '#8E95A5'} strokeWidth={active ? '2.3' : '1.8'}
        strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav" aria-label="Bottom Navigation">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.label}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => item.path !== '#' && navigate(item.path)}
            aria-label={item.label}
            type="button"
          >
            {item.icon(isActive)}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
