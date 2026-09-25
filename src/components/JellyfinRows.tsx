import { useEffect, useState } from 'react'
import { useStore } from '../store'
import {
  getJellyfinResume,
  getJellyfinNextUp,
  getJellyfinItems,
  getJellyfinPlugins,
  getJellyfinSystem,
  jellyfinImage,
  jellyfinStreamUrl,
  persistJellyfin,
  type JellyfinConfig,
  type JellyfinItem,
  type JellyfinPlugin,
} from '../api/jellyfin'

export default function JellyfinRows() {
  const { jellyfinUrl, jellyfinApiKey, setSelectedMedia, setCurrentPage, setCurrentStreamUrl } = useStore() as any
  const [resume, setResume] = useState<JellyfinItem[]>([])
  const [nextUp, setNextUp] = useState<JellyfinItem[]>([])
  const [latest, setLatest] = useState<JellyfinItem[]>([])
  const [plugins, setPlugins] = useState<JellyfinPlugin[]>([])
  const [server, setServer] = useState('')

  const cfg: JellyfinConfig | null = jellyfinUrl && jellyfinApiKey ? { url: jellyfinUrl, apiKey: jellyfinApiKey } : null

  useEffect(() => {
    if (!cfg) return
    persistJellyfin(cfg)
    getJellyfinSystem(cfg).then((s) => setServer(s.ServerName || 'Jellyfin')).catch(() => setServer(''))
    getJellyfinResume(cfg).then((d) => setResume(d.Items || [])).catch(() => setResume([]))
    getJellyfinNextUp(cfg).then((d) => setNextUp(d.Items || [])).catch(() => setNextUp([]))
    getJellyfinItems(cfg, 0, 18).then((d) => setLatest(d.Items || [])).catch(() => setLatest([]))
    getJellyfinPlugins(cfg).then(setPlugins).catch(() => setPlugins([]))
  }, [jellyfinUrl, jellyfinApiKey])

  if (!cfg) return null

  function open(item: JellyfinItem) {
    const tmdb = item.ProviderIds?.Tmdb || item.ProviderIds?.tmdb
    const type = item.Type === 'Movie' ? 'movie' : 'tv'
    setSelectedMedia({ id: tmdb || item.Id, jellyfinId: item.Id, type, title: item.Name, source: 'jellyfin' })
    setCurrentStreamUrl(jellyfinStreamUrl(cfg!, item.Id))
    setCurrentPage('detail')
  }

  function row(title: string, items: JellyfinItem[]) {
    if (!items.length) return null
    return (
      <section className="nv-row">
        <h2 className="nv-h">{title}</h2>
        <div className="nv-sc">
          {items.map((it) => (
            <button key={it.Id} type="button" className="nv-poster" onClick={() => open(it)}>
              <img src={jellyfinImage(cfg!, it)} alt="" />
              <p>{it.Name}</p>
              <small>{it.ProductionYear || it.Type}</small>
            </button>
          ))}
        </div>
      </section>
    )
  }

  return (
    <>
      {server ? (
        <section className="nv-row">
          <h2 className="nv-h">Jellyfin · {server}</h2>
          <p style={{ color: '#888', fontSize: 12, margin: '-4px 0 10px' }}>
            Plugins live on the server. MFY reads them: {plugins.length ? plugins.map((p) => p.Name).filter(Boolean).slice(0, 8).join(', ') : 'none listed'}
          </p>
        </section>
      ) : null}
      {row('Jellyfin — Continue', resume)}
      {row('Jellyfin — Next Up', nextUp)}
      {row('Jellyfin — Library', latest)}
    </>
  )
}
