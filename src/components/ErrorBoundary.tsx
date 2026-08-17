import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#050810] text-white p-8">
          <h1 className="text-lg font-semibold tracking-tight">MFY hit a snag</h1>
          <p className="text-xs text-white/50 text-center max-w-md font-mono break-words">
            {String(this.state.error?.message || this.state.error)}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="h-8 px-4 rounded-lg bg-[#FF1493]/15 border border-[#FF1493]/40 text-xs text-[#FF1493] hover:bg-[#FF1493]/25 transition-all"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}