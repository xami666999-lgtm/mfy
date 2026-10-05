import { useStore } from '../store'

const MXSIFY = 'https://xami666999-lgtm.github.io/index.html?v=6ac41458'

export default function MusicPage() {
  const setCurrentPage = useStore((s) => s.setCurrentPage)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: '#121212', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 48, flex: 'none', display: 'flex', alignItems: 'center', padding: '0 14px', background: '#0e0e0e', borderBottom: '1px solid #2a2a2a' }}>
        <button
          type="button"
          onClick={() => setCurrentPage('home')}
          style={{ height: 32, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
        >
          Back
        </button>
      </div>
      <iframe
        key={MXSIFY}
        title="Mxsify"
        src={MXSIFY}
        style={{ flex: 1, width: '100%', border: 0, background: '#121212' }}
        allow="autoplay; encrypted-media; fullscreen"
      />
    </div>
  )
}
