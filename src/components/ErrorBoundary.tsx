import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            height: '100vh',
            background: '#06050a',
            color: '#fff',
            padding: 32,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h1 style={{ fontSize: 18, marginBottom: 12 }}>MFY hit an error</h1>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontSize: 12,
              color: '#ff8fab',
              background: 'rgba(255,255,255,0.04)',
              padding: 16,
              borderRadius: 12,
              maxWidth: 720,
            }}
          >
            {this.state.error.message}
          </pre>
          <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            Press Ctrl+Shift+I for more details, or restart the app.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 16,
              height: 36,
              padding: '0 16px',
              borderRadius: 999,
              border: 'none',
              background: '#FF1493',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
