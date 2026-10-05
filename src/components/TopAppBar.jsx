import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

export default function TopAppBar() {
  const navigate = useNavigate();

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
            fontSize: '19px',
            fontWeight: 800,
            color: '#F1F5F9',
            letterSpacing: '-0.03em',
          }}
        >
          TraceOn
        </span>
      </button>

      {/* Account / Status Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Live Sheet Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: '99px',
            background: 'rgba(52, 168, 83, 0.1)',
            border: '1px solid rgba(52, 168, 83, 0.25)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#34A853',
              boxShadow: '0 0 6px #34A853',
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#34A853' }}>
            Live
          </span>
        </div>

        {/* Profile Avatar */}
        <button
          aria-label="Account profile"
          className="touch-scale"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1A73E8 0%, #4285F4 100%)',
            border: '2px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 0 12px rgba(26, 115, 232, 0.35)',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          T
        </button>
      </div>
    </header>
  );
}
