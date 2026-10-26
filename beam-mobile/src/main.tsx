import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Beam Mobile caught unexpected UI error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#07090e',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          <div style={{
            maxWidth: '360px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '28px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#f87171' }}>
              Interface Recovered
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px', lineHeight: 1.5 }}>
              A temporary camera/DOM error occurred, but the app was protected from crashing.
            </p>
            <p style={{ fontSize: '11px', color: '#cbd5e1', wordBreak: 'break-word', background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '12px', marginBottom: '20px' }}>
              {this.state.error?.message || 'Unexpected state'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '16px',
                background: '#9333ea',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Reload Beam
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
