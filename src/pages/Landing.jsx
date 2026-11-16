import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

export default function Landing() {
  const navigate = useNavigate();

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

      {/* Primary CTA */}
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
      </div>
    </div>
  );
}
