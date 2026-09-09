import { useEffect, useState } from 'react'
import { Play, X } from 'lucide-react'
import { BACKDROP_URL, POSTER_URL } from '../api/tmdb'
import { aggregateStreams, type AggStream } from '../api/stremioAgg'

export default function SourceSheet({
  detail,
  media,
  onClose,
  onPlay,
}: {
  detail: any
  media: any
  onClose: () => void
  onPlay: (url: string, engine: string) => void
}) {
  const [rows, setRows] = useState<AggStream[]>([])
  const [loading, setLoading] = useState(true)
  const [addons, setAddons] = useState(false)
  const title = String(detail?.title || detail?.name || media?.title || '')
  const year = String(detail?.release_date || detail?.first_air_date || '').slice(0, 4)
  const runtime = detail?.runtime || detail?.episode_run_time?.[0] || 0
  const score = Number(detail?.vote_average || 0).toFixed(1)
  const genres = (detail?.genres || []).map((g: any) => g.name || g).slice(0, 6)
  const crew = detail?.credits?.crew || []
  const directors = crew.filter((c: any) => /director|creator/i.test(c.job || '')).slice(0, 3)
  const cast = (detail?.credits?.cast || []).slice(0, 4)
  const bg = detail?.backdrop_path ? `${BACKDROP_URL}${detail.backdrop_path}` : (detail?.poster_path ? `${POSTER_URL}${detail.poster_path}` : '')

  useEffect(() => {
    let live = true
    setLoading(true)
    aggregateStreams({
      type: media?.type === 'movie' ? 'movie' : 'tv',
      tmdbId: media?.id,
      season: media?.season || 1,
      episode: media?.episode || 1,
      anime: /anime/i.test(String(media?.type || '')),
      title,
    }).then((list) => {
      if (live) setRows(list)
    }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [media?.id, media?.season, media?.episode])

  function sizeGuess(t: string) {
    const m = String(t).match(/(\d+(?:\.\d+)?)\s?(GB|MB|GiB)/i)
    return m ? `${m[1]} ${m[2].toUpperCase()}` : ''
  }
  function resOf(r: AggStream) {
    const t = `${r.quality} ${r.title}`.toUpperCase()
    if (/2160|4K|UHD/.test(t)) return '4K'
    if (/1080/.test(t)) return '1080P'
    if (/720/.test(t)) return '720P'
    return (r.quality || 'STREAM').toUpperCase()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 280, background: '#0b0b0b', color: '#fff', fontFamily: '"Source Sans 3", Helvetica, Arial, sans-serif' }}>
      <img src={bg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.05)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,8,6,0.92) 0%, rgba(10,8,6,0.55) 48%, rgba(12,12,12,0.92) 72%, #111 100%)' }} />
      <button type="button" onClick={onClose} style={{ position: 'absolute', top: 18, left: 18, zIndex: 3, width: 36, height: 36, borderRadius: 20, background: 'rgba(0,0,0,0.45)', color: '#fff', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
      <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', height: '100%' }}>
        <div style={{ padding: '72px 48px 40px', maxWidth: 640 }}>
          <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e8a56a', marginBottom: 22 }}>{title}</h1>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 28 }}>
            {runtime > 0 && <span>{runtime} min</span>}
            {year && <span>{year}</span>}
            {Number(score) > 0 && <span>{score} <b style={{ background: '#f5c518', color: '#111', fontSize: 10, padding: '1px 4px', borderRadius: 2, marginLeft: 4 }}>IMDb</b></span>}
          </div>
          {!!genres.length && (
            <div style={{ marginBottom: 22 }}>
              <p style={{ fontSize: 11, letterSpacing: 0.12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>GENRES</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {genres.map((g: string) => <span key={g} style={{ padding: '6px 12px', borderRadius: 16, background: 'rgba(255,255,255,0.08)', fontSize: 13 }}>{g}</span>)}
              </div>
            </div>
          )}
          {!!directors.length && (
            <div style={{ marginBottom: 22 }}>
              <p style={{ fontSize: 11, letterSpacing: 0.12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>DIRECTORS</p>
              <div style={{ display: 'flex', gap: 8 }}>{directors.map((d: any) => <span key={d.id || d.name} style={{ padding: '6px 12px', borderRadius: 16, background: 'rgba(255,255,255,0.08)', fontSize: 13 }}>{d.name}</span>)}</div>
            </div>
          )}
          {!!cast.length && (
            <div style={{ marginBottom: 22 }}>
              <p style={{ fontSize: 11, letterSpacing: 0.12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>CAST</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{cast.map((d: any) => <span key={d.id || d.name} style={{ padding: '6px 12px', borderRadius: 16, background: 'rgba(255,255,255,0.08)', fontSize: 13 }}>{d.name}</span>)}</div>
            </div>
          )}
          {detail?.overview && (
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 11, letterSpacing: 0.12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>SUMMARY</p>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.72)', maxWidth: 520 }}>{String(detail.overview).slice(0, 220)}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ height: 40, padding: '0 16px', borderRadius: 22, background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>Watch Trailer</button>
          </div>
        </div>
        <div style={{ background: 'rgba(16,16,16,0.72)', backdropFilter: 'blur(10px)', padding: '56px 22px 22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', padding: '0 14px', marginBottom: 18, fontSize: 14 }}>EZRemux</div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {loading && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Finding sources…</p>}
            {!loading && rows.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No torrent/HTTP sources yet. Use Show all addons.</p>}
            {rows.map((r) => (
              <button key={r.url} type="button" onClick={() => onPlay(r.url, /magnet|infohash/i.test(r.url) ? 'vlc' : 'pipe')} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 8px', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 14, letterSpacing: 0.08 }}>| {resOf(r)} |</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{sizeGuess(r.title) || r.addon}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setAddons((v) => !v)} style={{ marginTop: 12, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
            {addons ? 'Hide addons' : 'Show all addons »'}
          </button>
          {addons && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {['vlc', 'pipe', 'torrentio', 'comet', 'playtorrio', 'simplstream', 'vidy'].map((id) => (
                <button key={id} type="button" onClick={() => onPlay('', id)} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' }}>{id}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
