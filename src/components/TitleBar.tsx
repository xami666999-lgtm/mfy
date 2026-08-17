import { Minus, Square, X } from 'lucide-react'

export default function TitleBar() {
  const api = (window as any).electronAPI

  return (
    <div className="titlebar select-none">
      <div className="titlebar-spacer" />
      <div className="titlebar-controls">
        <button className="titlebar-button" onClick={() => api?.minimize()} aria-label="Minimize">
          <Minus />
        </button>
        <button className="titlebar-button" onClick={() => api?.maximize()} aria-label="Maximize">
          <Square />
        </button>
        <button className="titlebar-button close" onClick={() => api?.close()} aria-label="Close">
          <X />
        </button>
      </div>
    </div>
  )
}
