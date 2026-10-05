import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Landing() {
  const navigate = useNavigate();

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
      {/* Ambient background glows */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 340,
          height: 340,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(66, 133, 244, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(30px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52, 168, 83, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(30px)',
        }}
      />

      {/* Brand Icon with Glow */}
      <div
        style={{
          marginBottom: 24,
          padding: 16,
          borderRadius: 28,
          background: 'rgba(26, 29, 41, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 0 30px rgba(66, 133, 244, 0.25)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <Logo size={72} />
      </div>

      {/* Brand Title */}
      <h1
        style={{
          fontSize: 38,
          fontWeight: 800,
          color: '#F1F5F9',
          letterSpacing: '-0.04em',
          marginBottom: 10,
          lineHeight: 1.1,
        }}
      >
        TraceOn
      </h1>

      {/* Tagline */}
      <p
        style={{
          fontSize: 16,
          color: '#94A3B8',
          fontWeight: 400,
          marginBottom: 48,
          lineHeight: 1.5,
          maxWidth: 280,
        }}
      >
        Track today. Own tomorrow. Effortless finances synced to your sheet.
      </p>

      {/* Primary CTA */}
      <div style={{ width: '100%', maxWidth: 300 }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary touch-scale"
          style={{ fontSize: 16, padding: '16px 28px', borderRadius: 14 }}
          type="button"
        >
          <span>Get Started</span>
          <svg
            width="18"
            height="18"
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

      {/* Bottom Subtext */}
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: '#64748B',
          letterSpacing: '0.02em',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34A853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>Powered by Google Sheets</span>
      </div>
    </div>
  );
}
