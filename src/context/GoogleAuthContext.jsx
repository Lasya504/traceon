import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { loadGsiScript, createTokenClient, fetchUserProfile, revokeAccessToken } from '../services/googleAuth';

const GoogleAuthContext = createContext(null);

export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext);
  if (!context) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * Session key for remembering that a user previously signed in.
 * This is stored in sessionStorage (tab-scoped, auto-cleared on close).
 * It is NOT a security boundary — it only tells us to attempt silent re-auth.
 */
const SESSION_KEY = 'traceon_session_active';

export function GoogleAuthProvider({ children }) {
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  // Stored strictly in memory in React state — NEVER in localStorage/sessionStorage/cookies
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // References for token client and pending promise resolvers
  const tokenClientRef = useRef(null);
  const pendingAuthPromiseRef = useRef(null);
  const tokenExpiryTimerRef = useRef(null);
  const silentAuthAttemptedRef = useRef(false);

  // Session-generation and explicit sign-out tracking to drop stale async auth responses
  const authSessionGenerationRef = useRef(0);
  const isSignedOutExplicitlyRef = useRef(false);

  // Clear any existing token expiry timer
  const clearExpiryTimer = useCallback(() => {
    if (tokenExpiryTimerRef.current) {
      clearTimeout(tokenExpiryTimerRef.current);
      tokenExpiryTimerRef.current = null;
    }
  }, []);

  /**
   * Attempt silent token re-acquisition (no popup).
   * This works when the user has previously granted consent in the same browser.
   */
  const attemptSilentAuth = useCallback(() => {
    if (!tokenClientRef.current || isSignedOutExplicitlyRef.current) return;

    try {
      authSessionGenerationRef.current += 1;
      tokenClientRef.current.requestAccessToken({ prompt: '' });
    } catch {
      console.log('[TraceOn] Silent re-auth not available');
    }
  }, []);

  /**
   * Core handler for a successful token response.
   * Shared by both explicit sign-in and silent re-auth.
   */
  const handleTokenSuccess = useCallback(async (tokenResponse, resolvePromise, rejectPromise, reqGeneration) => {
    // If sign-out happened or generation is stale, abort immediately
    if (
      isSignedOutExplicitlyRef.current ||
      (reqGeneration !== undefined && reqGeneration !== authSessionGenerationRef.current)
    ) {
      console.log('[TraceOn] Discarding token response: session invalidated or signed out');
      if (rejectPromise) {
        rejectPromise(new Error('Authentication aborted: signed out'));
      }
      return;
    }

    if (tokenResponse.error) {
      const errMsg = tokenResponse.error_description || tokenResponse.error || 'Authentication failed';
      // For silent auth failures, don't show error to user
      if (resolvePromise || rejectPromise) {
        setAuthError(errMsg);
      }
      setIsAuthenticating(false);
      if (rejectPromise) {
        rejectPromise(new Error(errMsg));
      }
      return;
    }

    if (tokenResponse.access_token) {
      const receivedToken = tokenResponse.access_token;
      if (
        isSignedOutExplicitlyRef.current ||
        (reqGeneration !== undefined && reqGeneration !== authSessionGenerationRef.current)
      ) {
        return;
      }

      setAccessToken(receivedToken);
      setAuthError(null);

      // Setup auto-expiry handling (buffer of 60 seconds before actual expiry)
      clearExpiryTimer();
      const expiresInMs = Math.max(((tokenResponse.expires_in || 3600) - 60) * 1000, 30000);
      tokenExpiryTimerRef.current = setTimeout(() => {
        if (!isSignedOutExplicitlyRef.current) {
          console.log('[TraceOn] Token expiring, attempting silent renewal...');
          attemptSilentAuth();
        }
      }, expiresInMs);

      // Fetch user profile info
      try {
        const userProfile = await fetchUserProfile(receivedToken);
        if (
          isSignedOutExplicitlyRef.current ||
          (reqGeneration !== undefined && reqGeneration !== authSessionGenerationRef.current)
        ) {
          return;
        }

        setUser(userProfile);
        setIsSignedIn(true);
        setIsAuthenticating(false);

        // Mark session as active (tab-scoped)
        try {
          sessionStorage.setItem(SESSION_KEY, '1');
        } catch { /* ignore */ }

        if (resolvePromise) {
          resolvePromise({ user: userProfile });
        }
      } catch (fetchErr) {
        if (
          isSignedOutExplicitlyRef.current ||
          (reqGeneration !== undefined && reqGeneration !== authSessionGenerationRef.current)
        ) {
          return;
        }

        // Even if profile fetch fails, token is valid
        setIsSignedIn(true);
        setIsAuthenticating(false);
        const fallbackUser = { email: '', name: 'Google User' };
        setUser(fallbackUser);

        try {
          sessionStorage.setItem(SESSION_KEY, '1');
        } catch { /* ignore */ }

        if (resolvePromise) {
          resolvePromise({ user: fallbackUser });
        }
      }
    }
  }, [clearExpiryTimer, attemptSilentAuth]);

  // Initialize GIS on mount
  useEffect(() => {
    let isMounted = true;

    if (!CLIENT_ID) {
      if (isMounted) {
        setIsGoogleReady(false);
        setAuthError('Google Client ID is not configured (VITE_GOOGLE_CLIENT_ID).');
      }
      return;
    }

    loadGsiScript()
      .then(() => {
        if (!isMounted) return;

        try {
          const client = createTokenClient(
            CLIENT_ID,
            // Token response callback — handles both explicit and silent auth
            async (tokenResponse) => {
              if (isSignedOutExplicitlyRef.current) {
                console.log('[TraceOn] Token response ignored: user explicitly signed out');
                return;
              }

              // Check if this is for a pending explicit sign-in promise
              const pending = pendingAuthPromiseRef.current;
              pendingAuthPromiseRef.current = null;

              await handleTokenSuccess(
                tokenResponse,
                pending?.resolve || null,
                pending?.reject || null,
                pending?.gen || authSessionGenerationRef.current
              );
            },
            // Error response callback
            (error) => {
              if (isSignedOutExplicitlyRef.current) {
                return;
              }

              const pending = pendingAuthPromiseRef.current;
              pendingAuthPromiseRef.current = null;

              // For silent auth errors, don't show error to user
              if (pending) {
                const errMsg = error?.message || 'Google Sign-In popup closed or cancelled';
                setAuthError(errMsg);
                setIsAuthenticating(false);
                pending.reject(new Error(errMsg));
              } else {
                // Silent auth failed silently — that's fine
                setIsAuthenticating(false);
                console.log('[TraceOn] Silent auth declined or unavailable');
              }
            }
          );

          tokenClientRef.current = client;
          setIsGoogleReady(true);

          // Attempt silent re-auth if the user had an active session in this tab
          if (!silentAuthAttemptedRef.current) {
            silentAuthAttemptedRef.current = true;
            try {
              const hadSession = sessionStorage.getItem(SESSION_KEY);
              if (hadSession && !isSignedOutExplicitlyRef.current) {
                console.log('[TraceOn] Previous session detected, attempting silent re-auth...');
                setIsAuthenticating(true);
                // Small delay to ensure the token client is fully ready
                setTimeout(() => {
                  if (isMounted && !isSignedOutExplicitlyRef.current) {
                    try {
                      authSessionGenerationRef.current += 1;
                      client.requestAccessToken({ prompt: '' });
                    } catch {
                      setIsAuthenticating(false);
                    }
                  } else {
                    setIsAuthenticating(false);
                  }
                }, 100);
              }
            } catch { /* sessionStorage not available */ }
          }
        } catch (initErr) {
          setAuthError(initErr.message || 'Failed to initialize Google Token Client');
          setIsGoogleReady(false);
        }
      })
      .catch((loadErr) => {
        if (!isMounted) return;
        setIsGoogleReady(false);
        setAuthError(loadErr.message || 'Failed to load Google Identity Services');
      });

    return () => {
      isMounted = false;
      clearExpiryTimer();
    };
  }, [clearExpiryTimer, handleTokenSuccess]);

  /**
   * Explicitly trigger Google Sign-In popup.
   */
  const signIn = useCallback(() => {
    setAuthError(null);
    isSignedOutExplicitlyRef.current = false;
    const reqGen = ++authSessionGenerationRef.current;

    if (!isGoogleReady || !tokenClientRef.current) {
      const err = new Error(
        !CLIENT_ID
          ? 'Google Client ID is missing. Check VITE_GOOGLE_CLIENT_ID.'
          : 'Google Identity Services is still loading. Please try again.'
      );
      setAuthError(err.message);
      return Promise.reject(err);
    }

    setIsAuthenticating(true);

    return new Promise((resolve, reject) => {
      pendingAuthPromiseRef.current = { resolve, reject, gen: reqGen };

      try {
        tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        setIsAuthenticating(false);
        pendingAuthPromiseRef.current = null;
        setAuthError(err.message || 'Failed to open Google Sign-In window');
        reject(err);
      }
    });
  }, [isGoogleReady]);

  /**
   * Sign out and clear in-memory credentials safely.
   * IMPORTANT: Does NOT clear localStorage cache (spreadsheet ID mapping).
   * Does NOT revoke Google OAuth consent.
   * Cancels any pending auth callbacks and removes the session marker.
   */
  const signOut = useCallback(async () => {
    isSignedOutExplicitlyRef.current = true;
    authSessionGenerationRef.current += 1;

    try {
      clearExpiryTimer();
    } catch { /* ignore */ }

    // Abort any pending explicit sign-in promise
    if (pendingAuthPromiseRef.current) {
      try {
        pendingAuthPromiseRef.current.reject(new Error('User signed out'));
      } catch { /* ignore */ }
      pendingAuthPromiseRef.current = null;
    }

    // Reset memory state immediately
    setAccessToken(null);
    setUser(null);
    setIsSignedIn(false);
    setIsAuthenticating(false);
    setAuthError(null);

    // Clear session marker so we don't attempt silent re-auth in this tab
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch { /* ignore */ }
  }, [clearExpiryTimer]);

  const value = {
    isGoogleReady,
    isSignedIn,
    accessToken, // In-memory only
    user,
    authError,
    isAuthenticating,
    signIn,
    signOut,
  };

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
}
