import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { useGoogleAuth } from './context/GoogleAuthContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';

/**
 * Route guard: requires authenticated Google user + connected TraceOn spreadsheet.
 * Returns null while auth or spreadsheet sync is still initializing (avoids redirect loops).
 */
function ProtectedRoute({ children }) {
  const { isGoogleReady, isSignedIn, isAuthenticating } = useGoogleAuth();
  const { isSheetConnected, isSheetSyncDone } = useApp();

  // Auth still initializing (GIS loading or silent re-auth in progress)
  if (!isGoogleReady || isAuthenticating) {
    return null;
  }

  // Auth complete, user not signed in
  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  // Signed in but spreadsheet sync hasn't completed yet
  if (!isSheetSyncDone) {
    return null;
  }

  // Signed in, sync complete, but no sheet connected
  if (!isSheetConnected) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      </Routes>
    </AppProvider>
  );
}
