import { useStore } from '../store'

export default function MusicPage() {
  const setCurrentPage = useStore((s) => s.setCurrentPage)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: '#121212' }}>
      <button
        type="button"
        onClick={() => setCurrentPage('home')}
        style={{ position: 'absolute', top: 14, left: 14, zIndex: 2, height: 36, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(0,0,0,.55)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
      >
        Back
      </button>
      <iframe
        title="Mxsify"
        src="https://xami666999-lgtm.github.io/index.html"
        style={{ width: '100%', height: '100%', border: 0, background: '#121212', display: 'block' }}
        allow="autoplay; encrypted-media; fullscreen"
      />
    </div>
  )
}
