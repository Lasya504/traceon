/**
 * ═══════════════════════════════════════════════════
 * TraceOn — Google Identity Services (GIS) Service
 * ═══════════════════════════════════════════════════
 * Handles:
 * - Loading Google Identity Services script safely (once)
 * - Initializing OAuth 2.0 token client
 * - Requesting OAuth access token in-memory
 * - Fetching user profile information via userinfo API
 * - Revoking token on sign out
 */

const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

export const OAUTH_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
].join(' ');

let scriptLoadingPromise = null;

/**
 * Safely load the Google Identity Services browser script once.
 * Reuses existing script if present.
 * @returns {Promise<boolean>}
 */
export function loadGsiScript() {
  if (typeof window === 'undefined') return Promise.resolve(false);

  // If already loaded and ready
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve(true);
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    // Check if script element already exists
    const existingScript = document.querySelector(`script[src="${GSI_SCRIPT_URL}"]`);
    if (existingScript) {
      if (window.google?.accounts?.oauth2) {
        resolve(true);
        return;
      }
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = GSI_SCRIPT_URL;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.accounts?.oauth2) {
        resolve(true);
      } else {
        // Polling check in case window.google is set after onload fires
        let checks = 0;
        const interval = setInterval(() => {
          checks += 1;
          if (window.google?.accounts?.oauth2) {
            clearInterval(interval);
            resolve(true);
          } else if (checks > 10) {
            clearInterval(interval);
            reject(new Error('Google Identity Services loaded but oauth2 unavailable'));
          }
        }, 100);
      }
    };

    script.onerror = () => {
      reject(new Error('Network error loading Google Identity Services script'));
    };

    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

/**
 * Initialize Google OAuth2 Token Client.
 * @param {string} clientId
 * @param {Function} onTokenResponse
 * @param {Function} onErrorResponse
 * @returns {Object|null}
 */
export function createTokenClient(clientId, onTokenResponse, onErrorResponse) {
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services not ready');
  }

  if (!clientId) {
    throw new Error('Missing Google OAuth Client ID');
  }

  return window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: OAUTH_SCOPES,
    callback: onTokenResponse,
    error_callback: onErrorResponse,
  });
}

/**
 * Fetch basic user profile using access token.
 * Access token is NOT logged or leaked.
 * @param {string} token - In-memory access token
 * @returns {Promise<Object>}
 */
export async function fetchUserProfile(token) {
  if (!token) throw new Error('No access token provided');

  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile (${response.status})`);
  }

  const data = await response.json();
  return {
    id: data.sub,
    email: data.email,
    name: data.name,
    givenName: data.given_name,
    picture: data.picture,
    emailVerified: data.email_verified,
  };
}

/**
 * Revoke an OAuth 2.0 access token safely.
 * @param {string} token
 * @returns {Promise<void>}
 */
export function revokeAccessToken(token) {
  return new Promise((resolve) => {
    if (!token || !window.google?.accounts?.oauth2?.revoke) {
      resolve();
      return;
    }
    try {
      window.google.accounts.oauth2.revoke(token, () => {
        resolve();
      });
    } catch {
      resolve();
    }
  });
}
