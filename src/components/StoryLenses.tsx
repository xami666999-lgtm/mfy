import { useEffect, useState } from 'react'
import { tmdb, POSTER_URL } from '../api/tmdb'
import { useStore } from '../store'

type Stack = {
  label: string
  because: string
  items: any[]
  featured?: any
}

const FALLBACK = [
  { id: '9715', name: 'Superhero' },
  { id: '10051', name: 'Heist' },
  { id: '818', name: 'Based on a book' },
]

export default function StoryLenses({ mode }: { mode: 'scene' | 'looks' | 'stories' }) {
  const { watchHistory, setSelectedMedia, setCurrentPage, addToWatchlist } = useStore()
  const [stacks, setStacks] = useState<Stack[]>([])
  const [facet, setFacet] = useState<'story' | 'themes' | 'before'>('story')

  useEffect(() => {
    let dead = false
    const seen = new Set((watchHistory || []).map((h) => String(h.mediaId)))
    const recent = (watchHistory || []).slice(0, 3)

    async function fromHistory() {
      const out: Stack[] = []
      for (const h of recent) {
        const type = h.mediaType === 'tv' ? 'tv' : 'movie'
        const d = type === 'tv' ? await tmdb.getTVDetail(Number(h.mediaId)) : await tmdb.getMovieDetail(Number(h.mediaId))
        const g = d?.genres?.[0]
        if (!g) continue
        const row = await tmdb.discoverMovies({ with_genres: String(g.id), sort_by: 'popularity.desc', 'vote_count.gte': '80' })
        const items = (row?.results || []).filter((x: any) => x.poster_path && !seen.has(String(x.id))).slice(0, 4)
        if (items.length) out.push({ label: g.name, because: h.title || d.title || d.name || 'a title you watched', items, featured: { ...d, media_type: type } })
      }
      return out
    }

    async function fromKeywords() {
      const out: Stack[] = []
      for (const k of FALLBACK) {
        const row = await tmdb.discoverMovies({ with_keywords: k.id, sort_by: 'popularity.desc', 'vote_count.gte': '100' })
        const items = (row?.results || []).filter((x: any) => x.poster_path && !seen.has(String(x.id))).slice(0, 4)
        const also = (watchHistory || []).find((h) => items.some((x: any) => String(x.id) === String(h.mediaId)))
        if (items.length) out.push({ label: k.name, because: also?.title || '', items })
      }
      return out
    }

    const run = recent.length ? fromHistory() : fromKeywords()
    run.then((out) => { if (!dead) setStacks(out.slice(0, 3)) }).catch(() => {})
    return () => { dead = true }
  }, [mode, watchHistory])

  function open(item: any) {
    const type = item.media_type === 'tv' || item.first_air_date ? 'tv' : 'movie'
    setSelectedMedia({ id: item.id, type, title: item.title || item.name })
    setCurrentPage('detail')
  }

  function save(item: any) {
    const type = item.media_type === 'tv' || item.first_air_date ? 'tv' : 'movie'
    addToWatchlist({
      mediaId: Number(item.id),
      mediaType: type,
      title: item.title || item.name || 'Title',
      posterPath: item.poster_path || null,
      addedAt: new Date().toISOString(),
    })
  }

  const lead = stacks[0]
  const feature = lead?.featured || lead?.items?.[0]

  if ((mode === 'scene' || mode === 'looks') && feature) {
    const year = String(feature.release_date || feature.first_air_date || '').slice(0, 4)
    const share = lead?.because
      ? `Shares “${lead.label}” with ${lead.because}, which you watched`
      : lead?.label
    return (
      <div className="lens-look">
        <div className="lens-still" style={{ backgroundImage: feature.backdrop_path ? `url(https://image.tmdb.org/t/p/w780${feature.backdrop_path})` : undefined }}>
          <b>{feature.title || feature.name}</b>
          <small>{share}</small>
        </div>
        <div>
          <p className="lens-kicker">{mode === 'scene' ? 'Step into the scene' : 'Other looks'}</p>
          <p className="lens-sub">{mode === 'scene' ? 'A title next to something you already sat through.' : 'The same kind of title, from a different angle.'}</p>
          <div className="lens-facets">
            {(['story', 'themes', 'before'] as const).map((id) => (
              <button key={id} type="button" className={facet === id ? 'on' : ''} onClick={() => setFacet(id)}>
                {id === 'story' ? 'The story' : id === 'themes' ? 'Themes' : 'Before you watch'}
              </button>
            ))}
          </div>
          {facet === 'story' && <p className="lens-copy">{feature.overview || 'No synopsis yet.'}</p>}
          {facet === 'themes' && <p className="lens-copy">{(feature.genres || []).map((g: any) => g.name).join(' · ') || lead?.label}</p>}
          {facet === 'before' && <p className="lens-copy">{[year, feature.runtime ? `${feature.runtime} min` : '', feature.vote_average ? `★ ${Number(feature.vote_average).toFixed(1)}` : ''].filter(Boolean).join(' · ') || 'Details land with the title.'}</p>}
          <div className="nf-actions">
            <button type="button" className="nf-play" onClick={() => open(feature)}>Know the story</button>
            <button type="button" className="nf-info" onClick={() => save(feature)}>+ My list</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="lens-kicker">Stories that connect</p>
      <p className="lens-sub">Themes from what you already watched, in titles you have not.</p>
      <div className="lens-stacks">
        {stacks.map((s) => (
          <button key={s.label} type="button" className="lens-stack" onClick={() => open(s.items[0])}>
            <span>
              {s.items.slice(0, 3).map((it, i) => (
                <img key={it.id} src={`${POSTER_URL}${it.poster_path}`} alt="" style={{ ['--i' as string]: String(i) }} />
              ))}
            </span>
            <b>{s.label}</b>
            <small>{s.because ? `Also marks ${s.because}, which you watched` : `${s.items.length} titles`}</small>
          </button>
        ))}
        {!stacks.length && <p className="lens-sub">Watch something and this fills in from your history.</p>}
      </div>
    </div>
  )
}