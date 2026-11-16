import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { useApp } from '../context/AppContext';

export default function TopAppBar() {
  const navigate = useNavigate();
  const { isExcelConnected, excelFileName, downloadExcel, loadTransactions, resetAppState } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  const isConnected = Boolean(isExcelConnected);

  const handleDownload = () => {
    setMenuOpen(false);
    downloadExcel();
  };

  const handleRefresh = () => {
    setMenuOpen(false);
    loadTransactions();
  };

  return (
    <header className="top-bar">
      {/* Brand */}
      <button
        onClick={() => navigate('/dashboard')}
        className="touch-scale"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <Logo size={32} />
        <span
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
          }}
        >
          TraceOn
        </span>
      </button>

      {/* Account / Controls Cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        {/* Live Excel Indicator Pill */}
        <div
          title={`Active file: ${excelFileName || 'Traceon_Transactions.xlsx'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: '9999px',
            background: isConnected ? 'var(--income-dim)' : 'var(--bg-surface-subtle)',
            border: isConnected ? '1px solid var(--income-border)' : '1px solid var(--border-medium)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: isConnected ? 'var(--income)' : 'var(--text-muted)',
              boxShadow: isConnected ? '0 0 4px var(--income)' : 'none',
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: isConnected ? 'var(--income)' : 'var(--text-secondary)',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {isConnected ? 'Excel Synced' : 'Offline'}
          </span>
        </div>

        {/* Day / Dark Mode Toggle */}
        <ThemeToggle />

        {/* Profile Avatar Button */}
        <button
          aria-label="Account profile and settings"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
          className="touch-scale"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--btn-primary-bg)',
            border: '2px solid var(--bg-surface)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            color: 'var(--btn-primary-text)',
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            overflow: 'hidden',
            padding: 0,
          }}
        >
          T
        </button>

        {/* Profile Popover Menu */}
        {menuOpen && (
          <>
            <div
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 90,
              }}
            />
            <div
              className="card-surface"
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                zIndex: 100,
                minWidth: 240,
                padding: '16px',
                borderRadius: 20,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                boxShadow: 'var(--shadow-card-elevated)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {/* Local Storage details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--income-dim)',
                    border: '1px solid var(--income-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--income)',
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Local Storage
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--income)',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {excelFileName || 'Traceon_Transactions.xlsx'}
                  </span>
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border-solid)' }} />

              {/* Download Excel Sheet Action */}
              <button
                type="button"
                onClick={handleDownload}
                className="btn-primary touch-scale"
                style={{ padding: '9px 14px', fontSize: 13, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download Excel Sheet</span>
              </button>

              {/* Refresh / Re-read File Action */}
              <button
                type="button"
                onClick={handleRefresh}
                className="touch-scale"
                style={{
                  padding: '8px 12px',
                  fontSize: 12,
                  borderRadius: 9999,
                  background: 'var(--bg-surface-subtle)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-medium)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontWeight: 600,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                <span>Re-sync from Disk</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
