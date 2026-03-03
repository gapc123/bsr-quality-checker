import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';

// Clerk publishable key (public, safe to embed)
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_cmVsYXhpbmctcmF5LTE5LmNsZXJrLmFjY291bnRzLmRldiQ';

// Debug logging for troubleshooting
console.log('🔧 BSR Quality Checker - Initializing...');
console.log('📍 Environment:', import.meta.env.MODE);
console.log('🔑 Clerk Key Available:', clerkPubKey ? 'Yes' : 'No');
console.log('🔑 Clerk Key Prefix:', clerkPubKey?.substring(0, 15) + '...');

// Error boundary for better debugging
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#dc2626' }}>⚠️ Application Error</h1>
          <p>Something went wrong loading the application.</p>
          <details style={{ marginTop: '20px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Error Details
            </summary>
            <pre style={{
              background: '#fee',
              padding: '10px',
              borderRadius: '5px',
              overflow: 'auto',
              marginTop: '10px'
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <p style={{ marginTop: '20px', color: '#666' }}>
            Check the browser console (F12) for more details.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('🚨 Failed to find root element!');
  document.body.innerHTML = '<div style="padding: 20px;"><h1>⚠️ Initialization Error</h1><p>Root element not found. This is a critical error.</p></div>';
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <ClerkProvider publishableKey={clerkPubKey}>
            <App />
          </ClerkProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log('✅ Application mounted successfully');
  } catch (error) {
    console.error('🚨 Failed to mount application:', error);
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1 style="color: #dc2626;">⚠️ Initialization Error</h1>
        <p>Failed to start the application.</p>
        <pre style="background: #fee; padding: 10px; border-radius: 5px; overflow: auto;">${error}</pre>
        <p style="margin-top: 20px; color: #666;">Check the browser console (F12) for more details.</p>
      </div>
    `;
  }
}
// Force rebuild Mon 03 Mar 2026 10:30:00 GMT
