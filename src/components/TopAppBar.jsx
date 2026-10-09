import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { useApp } from '../context/AppContext';

export default function TopAppBar() {
  const navigate = useNavigate();
  const { user, isSignedIn, signOut } = useGoogleAuth();
  const { isSheetConnected, activeSpreadsheetId, resetAppState } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  const isConnected = Boolean(isSignedIn && isSheetConnected && activeSpreadsheetId);

  const handleSignOut = async () => {
    setMenuOpen(false);

    try {
      resetAppState?.();
    } catch (err) {
      console.warn('[TraceOn] Error during resetAppState:', err);
    }

    try {
      await signOut?.();
    } catch (err) {
      console.warn('[TraceOn] Error during signOut:', err);
    }

    try {
      navigate('/', { replace: true });
    } catch (err) {
      console.warn('[TraceOn] Error navigating to landing:', err);
    }
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
        {/* Live Sheet Indicator Pill */}
        <div
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
            {isConnected ? 'Synced' : 'Offline'}
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
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name || 'User'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            (user?.name?.[0] || 'T').toUpperCase()
          )}
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
                minWidth: 230,
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
              {/* User details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--btn-primary-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--btn-primary-text)',
                    fontWeight: 700,
                    fontSize: 13,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {user?.picture ? (
                    <img src={user.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (user?.name?.[0] || 'U').toUpperCase()
                  )}
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
                      maxWidth: 155,
                    }}
                  >
                    {user?.name || 'Google User'}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 155,
                    }}
                  >
                    {user?.email || 'Connected'}
                  </span>
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border-solid)' }} />

              {/* Sign out action */}
              <button
                type="button"
                onClick={handleSignOut}
                className="btn-destructive touch-scale"
                style={{ padding: '9px 14px', fontSize: 13, borderRadius: 9999 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
