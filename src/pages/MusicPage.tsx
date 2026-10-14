import { useStore } from '../store'

const MXSIFY = `${import.meta.env.BASE_URL}mxsify.html?v=exact-6ac41458`

export default function MusicPage() {
  const setCurrentPage = useStore((s) => s.setCurrentPage)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: '#121212' }}>
      <iframe
        key={MXSIFY}
        title="Mxsify"
        src={MXSIFY}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, background: '#121212' }}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
      />
      <button
        type="button"
        onClick={() => setCurrentPage('home')}
        style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, height: 32, padding: '0 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,.25)', background: 'rgba(0,0,0,.55)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
      >
        Back
      </button>
    </div>
  )
}
