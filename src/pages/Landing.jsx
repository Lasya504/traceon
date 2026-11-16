import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useApp } from '../context/AppContext';

export default function Landing() {
  const navigate = useNavigate();
  const { excelFileName, downloadExcel } = useApp();

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  return (
    <div
      className="app-shell page-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        padding: '48px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Bar Theme Toggle */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 30 }}>
        <ThemeToggle />
      </div>

      {/* Brand Icon Card */}
      <div
        className="touch-scale"
        style={{
          marginBottom: 20,
          padding: 16,
          borderRadius: 24,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card-elevated)',
        }}
      >
        <Logo size={68} />
      </div>

      {/* Brand Title */}
      <h1
        style={{
          fontSize: 36,
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.04em',
          marginBottom: 8,
          lineHeight: 1.1,
        }}
      >
        TraceOn
      </h1>

      {/* Tagline */}
      <p
        style={{
          fontSize: 15,
          color: 'var(--text-secondary)',
          fontWeight: 400,
          marginBottom: 36,
          lineHeight: 1.5,
          maxWidth: 320,
        }}
      >
        Track today. Own tomorrow. Effortless personal finances saved locally to your Excel sheet.
      </p>

      {/* Primary CTA & Storage Info */}
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={handleGetStarted}
          className="btn-primary touch-scale"
          style={{ fontSize: 15, padding: '15px 28px' }}
          type="button"
        >
          <span>Open Dashboard</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>

        {/* Local Storage Card */}
        <div
          className="card-surface"
          style={{
            padding: '14px 16px',
            borderRadius: 18,
            fontSize: 13,
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            alignItems: 'center',
            textAlign: 'left',
          }}
        >
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'var(--income-dim)',
                border: '1px solid var(--income-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--income)',
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Local Excel Storage
              </div>
              <div style={{ fontSize: 11, color: 'var(--income)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {excelFileName || 'Traceon_Transactions.xlsx'}
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: 1, background: 'var(--border-solid)' }} />

          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              100% private • No login needed
            </span>
            <button
              type="button"
              onClick={downloadExcel}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--income)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '2px 4px',
                textDecoration: 'underline',
              }}
            >
              Download .xlsx
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
