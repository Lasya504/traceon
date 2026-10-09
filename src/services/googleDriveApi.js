/**
 * ═══════════════════════════════════════════════════
 * TraceOn — Google Drive / Sheets Provisioning API
 * ═══════════════════════════════════════════════════
 * Framework-independent service for creating and managing
 * user-owned TraceOn Google Spreadsheets.
 */

const GOOGLE_SHEETS_API_ENDPOINT = 'https://sheets.googleapis.com/v4/spreadsheets';
const GOOGLE_DRIVE_API_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';

/**
 * Searches the authenticated user's Google Drive for an existing
 * spreadsheet named "TraceOn".
 *
 * Uses drive.file scope — only finds files created by this application.
 *
 * @param {string} accessToken - In-memory OAuth 2.0 access token
 * @returns {Promise<{ spreadsheetId: string, spreadsheetUrl: string, title: string } | null>}
 */
export async function findExistingTraceOnSpreadsheet(accessToken) {
  if (!accessToken) return null;

  try {
    // Search for spreadsheets named "TraceOn" owned by the user
    const query = encodeURIComponent("name = 'TraceOn' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
    const url = `${GOOGLE_DRIVE_API_ENDPOINT}?q=${query}&fields=files(id,name,webViewLink)&orderBy=createdTime desc&pageSize=1`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.warn('[TraceOn] Drive search failed:', response.status);
      return null;
    }

    const data = await response.json();
    const files = data?.files || [];

    if (files.length > 0) {
      const file = files[0];
      return {
        spreadsheetId: file.id,
        spreadsheetUrl: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
        title: file.name || 'TraceOn',
      };
    }

    return null;
  } catch (err) {
    console.warn('[TraceOn] Error searching for existing TraceOn spreadsheet:', err.message);
    return null;
  }
}

/**
 * Creates a brand-new Google Spreadsheet named "TraceOn"
 * in the authenticated user's Google Drive.
 *
 * @param {string} accessToken - In-memory OAuth 2.0 access token
 * @returns {Promise<{ spreadsheetId: string, spreadsheetUrl: string, title: string }>}
 */
export async function createTraceOnSpreadsheet(accessToken) {
  if (!accessToken) {
    throw new Error('Authentication required: Missing access token');
  }

  const payload = {
    properties: {
      title: 'TraceOn',
    },
  };

  let response;
  try {
    response = await fetch(GOOGLE_SHEETS_API_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (netErr) {
    throw new Error(`Network failure while contacting Google Sheets API: ${netErr.message}`);
  }

  // Always attempt to parse the response body — Google returns error details as JSON
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Invalid response format from Google API (HTTP ${response.status})`);
  }

  if (!response.ok) {
    // Build a sanitized error object from the Google API response
    // (never includes tokens, authorization headers, or secrets)
    const apiError = data?.error || {};
    const sanitizedError = {
      operation: 'createTraceOnSpreadsheet',
      httpStatus: response.status,
      status: apiError.status || undefined,
      code: apiError.code || response.status,
      message: apiError.message || `Google Sheets API error (HTTP ${response.status})`,
      reason: apiError.errors?.[0]?.reason || undefined,
      domain: apiError.errors?.[0]?.domain || undefined,
      errors: apiError.errors || undefined,
      details: apiError.details || undefined,
    };

    console.error('[TraceOn] createTraceOnSpreadsheet failed:', sanitizedError);

    // Build a human-readable message from the actual API response
    const parts = [`createTraceOnSpreadsheet (HTTP ${response.status})`];
    if (sanitizedError.status) parts.push(`[${sanitizedError.status}]`);
    parts.push(`— ${sanitizedError.message}`);
    if (sanitizedError.reason) parts.push(`(reason: ${sanitizedError.reason})`);

    throw new Error(parts.join(' '));
  }

  if (!data || !data.spreadsheetId) {
    throw new Error('Malformed response: Spreadsheet ID was not returned by Google.');
  }

  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: data.properties?.title || 'TraceOn',
  };
}

/**
 * Finds an existing TraceOn spreadsheet in the user's Drive, or creates a new one.
 * This is the primary entry point for spreadsheet provisioning.
 *
 * @param {string} accessToken - In-memory OAuth 2.0 access token
 * @returns {Promise<{ spreadsheetId: string, spreadsheetUrl: string, title: string, isExisting: boolean }>}
 */
export async function findOrCreateTraceOnSpreadsheet(accessToken) {
  // First, check if a TraceOn spreadsheet already exists in the user's Drive
  const existing = await findExistingTraceOnSpreadsheet(accessToken);
  if (existing) {
    console.log('[TraceOn] Found existing spreadsheet in Drive:', existing.spreadsheetId);
    return { ...existing, isExisting: true };
  }

  // No existing spreadsheet found — create a new one
  console.log('[TraceOn] No existing spreadsheet found, creating new one...');
  const created = await createTraceOnSpreadsheet(accessToken);
  return { ...created, isExisting: false };
}
