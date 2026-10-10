import { Component } from 'react';

/**
 * Top-level error boundary for TraceOn.
 * Catches runtime React errors and shows a recovery UI
 * instead of a blank page.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[TraceOn] Uncaught error:', error, info);
  }

  handleReload() {
    // Clear caches and reload
    if ('caches' in window) {
      caches.keys().then((keys) =>
        Promise.all(keys.map((k) => caches.delete(k))).then(() =>
          window.location.reload()
        )
      );
    } else {
      window.location.reload();
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const errMsg = this.state.error?.message || 'An unexpected error occurred.';

    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          textAlign: 'center',
          fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
          background: '#F6F7F9',
          color: '#11141A',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: '#FFF1F2',
            border: '1px solid rgba(225,29,72,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            marginBottom: 8,
          }}
        >
          ⚠️
        </div>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: 0,
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            fontSize: 13,
            color: '#647082',
            maxWidth: 300,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {errMsg}
        </p>
        <button
          onClick={this.handleReload}
          style={{
            marginTop: 8,
            padding: '12px 28px',
            background: '#16181F',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 9999,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Reload App
        </button>
        <details
          style={{
            marginTop: 12,
            fontSize: 11,
            color: '#94A3B8',
            maxWidth: 320,
            wordBreak: 'break-all',
            textAlign: 'left',
          }}
        >
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
            Error details
          </summary>
          <pre
            style={{
              marginTop: 8,
              padding: '8px 12px',
              background: '#EEF0F4',
              borderRadius: 10,
              overflow: 'auto',
              fontSize: 10,
              lineHeight: 1.5,
            }}
          >
            {String(this.state.error)}
          </pre>
        </details>
      </div>
    );
  }
}
