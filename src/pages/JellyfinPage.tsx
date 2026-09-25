import { useEffect, useState } from 'react'
import { useStore } from '../store'

export default function JellyfinPage() {
  const { jellyfinUrl, jellyfinApiKey, setJellyfinUrl, setJellyfinApiKey } = useStore() as any
  const api = (window as any).electronAPI
  const [st, setSt] = useState<any>(null)
  const [url, setUrl] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function refresh() {
    if (!api?.jellyfinStatus) { setMsg('Sidecar only works in the Windows app, not the browser preview.'); return }
    setSt(await api.jellyfinStatus())
  }

  useEffect(() => { refresh() }, [])

  async function run(fn: () => Promise<any>) {
    setBusy(true); setMsg('')
    try {
      const r = await fn()
      setSt(r)
      if (r?.error) setMsg(r.error)
      if (r?.url && !jellyfinUrl) {
        setJellyfinUrl(r.url)
        await api?.set?.('jellyfinUrl', r.url)
      }
    } catch (e: any) {
      setMsg(e?.message || 'failed')
    }
    setBusy(false)
  }

  return (
    <div className="nv-page" style={{ padding: '72px 16px 80px', maxWidth: 640 }}>
      <h1 className="nv-h">Jellyfin plugins</h1>
      <p style={{ color: '#9a9a9a', fontSize: 13, margin: '0 0 16px' }}>
        Real plugins run in a local Jellyfin Server MFY starts on this PC. First start downloads the official Windows build.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <button type="button" disabled={busy} onClick={() => run(() => api.jellyfinStart())} style={btn}>Start local Jellyfin</button>
        <button type="button" disabled={busy} onClick={() => run(() => api.jellyfinStop())} style={btn2}>Stop</button>
        <button type="button" disabled={busy} onClick={() => run(() => api.jellyfinPickPlugin())} style={btn}>Install plugin file</button>
        <button type="button" onClick={() => api?.jellyfinOpenDashboard?.()} style={btn2}>Open dashboard</button>
        <button type="button" onClick={() => api?.jellyfinOpenPlugins?.()} style={btn2}>Open plugins folder</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/plugin.zip" style={inp} />
        <button type="button" disabled={busy || !url.trim()} onClick={() => run(() => api.jellyfinInstallUrl(url.trim()))} style={btn}>Install URL</button>
      </div>
      {msg && <p style={{ color: '#f88', fontSize: 12 }}>{msg}</p>}
      <pre style={{ background: '#111', padding: 12, borderRadius: 10, fontSize: 12, color: '#ccc', overflow: 'auto' }}>
        {st ? JSON.stringify({
          running: st.running,
          url: st.url,
          installed: st.installed,
          pluginDir: st.pluginDir,
          plugins: st.plugins,
          error: st.error,
          log: st.log,
        }, null, 2) : 'No status yet'}
      </pre>
      <p style={{ color: '#777', fontSize: 12, marginTop: 16 }}>API key (Dashboard → API Keys) so MFY can read the library:</p>
      <input value={jellyfinApiKey || ''} onChange={(e) => { setJellyfinApiKey(e.target.value); api?.set?.('jellyfinApiKey', e.target.value) }} placeholder="Jellyfin API key" style={{ ...inp, width: '100%', marginTop: 6 }} />
    </div>
  )
}

const btn: React.CSSProperties = { height: 36, padding: '0 12px', borderRadius: 10, border: 0, background: '#fff', color: '#000', fontWeight: 700 }
const btn2: React.CSSProperties = { ...btn, background: '#222', color: '#fff', border: '1px solid #333' }
const inp: React.CSSProperties = { flex: 1, height: 36, borderRadius: 10, border: '1px solid #333', background: '#111', color: '#fff', padding: '0 10px' }
