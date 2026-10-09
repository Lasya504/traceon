import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { useApp } from '../context/AppContext';
import { findOrCreateTraceOnSpreadsheet } from '../services/googleDriveApi';
import { initializeTraceOnSpreadsheet } from '../services/googleSheetsApi';

export default function Landing() {
  const navigate = useNavigate();
  const { isGoogleReady, isSignedIn, accessToken, user, isAuthenticating, authError, signIn, signOut } = useGoogleAuth();
  const {
    activeSpreadsheetId,
    setActiveSpreadsheetId,
    activeSpreadsheetUrl,
    setActiveSpreadsheetUrl,
    isSheetConnected,
    loadTransactions,
    resetAppState,
  } = useApp();

  const [createdSheet, setCreatedSheet] = useState(null);
  const [creatingSheet, setCreatingSheet] = useState(false);
  const [sheetError, setSheetError] = useState(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [initError, setInitError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Sync existing active spreadsheet if user already has a valid connected one
  useEffect(() => {
    if (isSignedIn && activeSpreadsheetId && isSheetConnected) {
      setCreatedSheet({
        spreadsheetId: activeSpreadsheetId,
        spreadsheetUrl: activeSpreadsheetUrl || `https://docs.google.com/spreadsheets/d/${activeSpreadsheetId}/edit`,
        title: 'TraceOn',
      });
      setIsInitialized(true);
      navigate('/dashboard');
    } else if (!activeSpreadsheetId) {
      setCreatedSheet(null);
      setIsInitialized(false);
    }
  }, [isSignedIn, activeSpreadsheetId, activeSpreadsheetUrl, isSheetConnected, navigate]);

  const handleCreateSheet = async () => {
    if (!accessToken) {
      setSheetError('No active Google access token. Please sign in again.');
      return;
    }
    setCreatingSheet(true);
    setSheetError(null);
    try {
      let created = createdSheet;
      if (!created?.spreadsheetId) {
        created = await findOrCreateTraceOnSpreadsheet(accessToken);
        setCreatedSheet(created);
      }

      await initializeTraceOnSpreadsheet(accessToken, created.spreadsheetId);

      setActiveSpreadsheetId(created.spreadsheetId, created.spreadsheetUrl);
      setIsInitialized(true);
      setSheetError(null);

      await loadTransactions();
    } catch (err) {
      console.error('[TraceOn] Spreadsheet creation/initialization failed:', err);
      setIsInitialized(false);
      setActiveSpreadsheetId(null);
      setSheetError(err.message || 'Failed to initialize your TraceOn spreadsheet.');
    } finally {
      setCreatingSheet(false);
    }
  };

  const handleInitializeSheet = async () => {
    if (!accessToken) {
      setInitError('No active Google access token. Please sign in again.');
      return;
    }
    if (!createdSheet?.spreadsheetId) {
      setInitError('No spreadsheet created yet.');
      return;
    }
    setInitializing(true);
    setInitError(null);
    try {
      await initializeTraceOnSpreadsheet(accessToken, createdSheet.spreadsheetId);
      setActiveSpreadsheetId(createdSheet.spreadsheetId, createdSheet.spreadsheetUrl);
      setIsInitialized(true);
      setInitError(null);
      await loadTransactions();
    } catch (err) {
      console.error('[TraceOn] Spreadsheet initialization failed:', err);
      setIsInitialized(false);
      setActiveSpreadsheetId(null);
      setInitError(err.message || 'Failed to initialize spreadsheet');
    } finally {
      setInitializing(false);
    }
  };

  const handleSignOut = async () => {
    setCreatedSheet(null);
    setSheetError(null);
    setIsInitialized(false);
    setInitializing(false);
    setInitError(null);

    try {
      resetAppState?.();
    } catch (err) {
      console.warn('[TraceOn] Error resetting app state on sign-out:', err);
    }

    try {
      await signOut?.();
    } catch (err) {
      console.warn('[TraceOn] Error signing out:', err);
    }
  };

  const handleGetStarted = async () => {
    if (isSignedIn && isSheetConnected) {
      navigate('/dashboard');
      return;
    }
    if (!isSignedIn) {
      setIsConnecting(true);
      try {
        await signIn();
      } catch {
        // Handled in context
      } finally {
        setIsConnecting(false);
      }
    }
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
          marginBottom: 40,
          lineHeight: 1.5,
          maxWidth: 290,
        }}
      >
        Track today. Own tomorrow. Effortless personal finances synced directly to your sheet.
      </p>

      {/* Primary CTA */}
      <div style={{ width: '100%', maxWidth: 310, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={handleGetStarted}
          disabled={isConnecting || isAuthenticating || !isGoogleReady}
          className="btn-primary touch-scale"
          style={{ fontSize: 15, padding: '15px 28px', opacity: (isConnecting || isAuthenticating || !isGoogleReady) ? 0.7 : 1 }}
          type="button"
        >
          <span>{isConnecting || isAuthenticating ? 'Connecting…' : 'Get Started'}</span>
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

        {/* Auth / Connection Card */}
        <div
          className="card-surface"
          style={{
            padding: '12px 14px',
            borderRadius: 18,
            fontSize: 13,
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            alignItems: 'center',
          }}
        >
          {!isSignedIn ? (
            <>
              <button
                type="button"
                onClick={() => signIn()}
                disabled={!isGoogleReady || isAuthenticating}
                className="touch-scale"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  borderRadius: 9999,
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid var(--border-medium)',
                  cursor: !isGoogleReady || isAuthenticating ? 'not-allowed' : 'pointer',
                  opacity: !isGoogleReady || isAuthenticating ? 0.6 : 1,
                  boxShadow: '0 2px 6px -1px rgba(0, 0, 0, 0.05)',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>{isAuthenticating ? 'Connecting…' : isGoogleReady ? 'Continue with Google' : 'Loading…'}</span>
              </button>
              {authError && (
                <div style={{ color: 'var(--expense)', fontSize: 11, textAlign: 'center' }}>
                  {authError}
                </div>
              )}
            </>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* User row */}
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || 'User'}
                      style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--btn-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--btn-primary-text)', fontWeight: 700 }}>
                      {user?.name?.[0] || 'U'}
                    </div>
                  )}
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                    {user?.name || user?.email || 'Connected'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                    cursor: 'pointer',
                    padding: '2px 4px',
                    textDecoration: 'underline',
                  }}
                >
                  Sign Out
                </button>
              </div>

              {/* Divider */}
              <div style={{ width: '100%', height: 1, background: 'var(--border-solid)' }} />

              {/* Create & Initialize Sheet Flow */}
              {!createdSheet ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                  <button
                    type="button"
                    onClick={handleCreateSheet}
                    disabled={creatingSheet}
                    className="touch-scale"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 9999,
                      background: 'var(--income-dim)',
                      color: 'var(--income)',
                      fontSize: 12,
                      fontWeight: 600,
                      border: '1px solid var(--income-border)',
                      cursor: creatingSheet ? 'not-allowed' : 'pointer',
                      opacity: creatingSheet ? 0.7 : 1,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M9 21V9" />
                    </svg>
                    <span>{creatingSheet ? 'Creating Sheet…' : 'Setup TraceOn Sheet'}</span>
                  </button>

                  {sheetError && (
                    <div style={{ color: 'var(--expense)', fontSize: 11, textAlign: 'center', wordBreak: 'break-word' }}>
                      {sheetError}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: 14,
                    background: 'var(--income-dim)',
                    border: '1px solid var(--income-border)',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--income)', fontSize: 12, fontWeight: 700 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Sheet Connected</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    ID: {createdSheet.spreadsheetId}
                  </div>
                  <a
                    href={createdSheet.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      textDecoration: 'underline',
                    }}
                  >
                    <span>Open in Google Sheets</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>

                  {!isInitialized ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={handleInitializeSheet}
                        disabled={initializing}
                        className="btn-primary touch-scale"
                        style={{
                          padding: '7px 10px',
                          fontSize: 11,
                          opacity: initializing ? 0.7 : 1,
                        }}
                      >
                        <span>{initializing ? 'Initializing…' : 'Initialize Sheet'}</span>
                      </button>

                      {(initError || sheetError) && (
                        <div style={{ color: 'var(--expense)', fontSize: 10, textAlign: 'center', wordBreak: 'break-word' }}>
                          {initError || sheetError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="btn-primary touch-scale"
                        style={{
                          padding: '8px 12px',
                          fontSize: 12,
                        }}
                      >
                        <span>Open Dashboard</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Subtext */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: 'var(--text-secondary)',
          letterSpacing: '0.01em',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--income)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>Powered by Google Sheets</span>
      </div>
    </div>
  );
}
