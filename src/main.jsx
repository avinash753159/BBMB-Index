import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import '@fontsource/geist-sans/latin-400.css';
import '@fontsource/geist-mono/latin-400.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace' }}>
          <h2 style={{ color: '#c1292e' }}>Something crashed</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#333', marginTop: 12 }}>
            {this.state.error.message}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#888', marginTop: 8, fontSize: 12 }}>
            {this.state.error.stack}
          </pre>
          <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
