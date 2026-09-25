import { useEffect, useState } from 'react'
import { useStore } from '../store'
import {
  getJellyfinItems,
  getJellyfinPlugins,
  getJellyfinSystem,
  jellyfinImage,
  jellyfinStreamUrl,
  persistJellyfin,
  type JellyfinItem,
  type JellyfinPlugin,
} from '../api/jellyfin'

export default function JellyfinPage() {
  const { jellyfinUrl, jellyfinApiKey, setJellyfinUrl, setJellyfinApiKey, setSelectedMedia, setCurrentPage, setCurrentStreamUrl } = useStore() as any
  const [url, setUrl] = useState(jellyfinUrl || '')
  const [key, setKey] = useState(jellyfinApiKey || '')
  const [msg, setMsg] = useState('')
  const [items, setItems] = useState<JellyfinItem[]>([])
  const [plugins, setPlugins] = useState<JellyfinPlugin[]>([])
  const [name, setName] = useState('')

  async function connect() {
    setJellyfinUrl(url.trim())
    setJellyfinApiKey(key.trim())
    persistJellyfin({ url: url.trim(), apiKey: key.trim() })
    const api = (window as any).electronAPI
    await api?.set?.('jellyfinUrl', url.trim())
    await api?.set?.('jellyfinApiKey', key.trim())
    const cfg = { url: url.trim(), apiKey: key.trim() }
    try {
      const sys = await getJellyfinSystem(cfg)
      setName(sys.ServerName || 'Jellyfin')
      setPlugins(await getJellyfinPlugins(cfg))
      const lib = await getJellyfinItems(cfg, 0, 60)
      setItems(lib.Items || [])
      setMsg('Connected')
    } catch (e: any) {
      setMsg(e?.message || 'Could not reach server')
    }
  }

  useEffect(() => { if (jellyfinUrl && jellyfinApiKey) connect() }, [])

  const cfg = url && key ? { url, apiKey: key } : null

  return (
    <div className="nv-page" style={{ padding: '72px 16px 80px' }}>
      <h1 className="nv-h">Jellyfin</h1>
      <p style={{ color: '#9a9a9a', fontSize: 13, maxWidth: 520, margin: '0 0 16px' }}>
        Plugins are installed on your Jellyfin server, not inside MFY. Connect the server and MFY uses resume, next-up, library images, and stream URLs those plugins feed.
      </p>
      <div style={{ display: 'grid', gap: 8, maxWidth: 520, marginBottom: 16 }}>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://192.168.1.10:8096" style={{ height: 40, borderRadius: 10, border: '1px solid #333', background: '#111', color: '#fff', padding: '0 12px' }} />
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="API key" type="password" style={{ height: 40, borderRadius: 10, border: '1px solid #333', background: '#111', color: '#fff', padding: '0 12px' }} />
        <button type="button" onClick={connect} style={{ height: 40, borderRadius: 10, border: 0, background: '#fff', color: '#000', fontWeight: 700 }}>Connect</button>
        {msg && <p style={{ fontSize: 12, color: msg === 'Connected' ? '#8f8' : '#f88' }}>{msg}{name ? ` · ${name}` : ''}</p>}
      </div>
      {plugins.length > 0 && (
        <section className="nv-row" style={{ paddingLeft: 0 }}>
          <h2 className="nv-h">Server plugins</h2>
          <div className="nv-sc">
            {plugins.map((p) => (
              <div key={p.Id || p.Name} className="nv-wide" style={{ background: '#161616', display: 'flex', alignItems: 'flex-end', padding: 10 }}>
                <b>{p.Name}</b>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="nv-row" style={{ paddingLeft: 0 }}>
        <h2 className="nv-h">Library</h2>
        <div className="nv-sc">
          {items.map((it) => (
            <button key={it.Id} type="button" className="nv-poster" onClick={() => {
              if (!cfg) return
              const tmdb = it.ProviderIds?.Tmdb || it.ProviderIds?.tmdb
              setSelectedMedia({ id: tmdb || it.Id, jellyfinId: it.Id, type: it.Type === 'Movie' ? 'movie' : 'tv', title: it.Name, source: 'jellyfin' })
              setCurrentStreamUrl(jellyfinStreamUrl(cfg, it.Id))
              setCurrentPage('detail')
            }}>
              <img src={cfg ? jellyfinImage(cfg, it) : ''} alt="" />
              <p>{it.Name}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
