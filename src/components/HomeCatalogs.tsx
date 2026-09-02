import { useEffect, useState } from 'react'
import { useStore } from '../store'

type Card = {
  id: string
  title: string
  image?: string
  sub?: string
  onOpen: () => void
}

function Row({ title, items }: { title: string; items: Card[] }) {
  if (!items.length) return null
  return (
    <section className="media-row">
      <div className="media-row-header">
        <h2 className="media-row-title">{title}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 px-1">
        {items.map((it) => (
          <button key={`${title}-${it.id}`} type="button" className="w-[130px] flex-shrink-0 text-left" onClick={it.onOpen}>
            <div className="w-[130px] h-[190px] rounded-lg overflow-hidden bg-[#14141c] border border-white/[0.06]">
              {it.image ? <img src={it.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-[11px] text-white/30 p-2 text-center">{it.title}</div>}
            </div>
            <p className="text-[11px] text-white mt-1.5 truncate">{it.title}</p>
            {it.sub && <p className="text-[10px] text-white/40 truncate">{it.sub}</p>}
          </button>
        ))}
      </div>
    </section>
  )
}

async function loadJson(file: string) {
  const res = await fetch(`./data/${file}`)
  if (!res.ok) throw new Error(file)
  return res.json()
}

export default function HomeCatalogs() {
  const { setCurrentPage, setCurrentStreamUrl, setSelectedMedia } = useStore()
  const [manga, setManga] = useState<Card[]>([])
  const [novels, setNovels] = useState<Card[]>([])
  const [animeA, setAnimeA] = useState<Card[]>([])
  const [animeB, setAnimeB] = useState<Card[]>([])
  const [upcoming, setUpcoming] = useState<Card[]>([])
  const [shows, setShows] = useState<Card[]>([])
  const [yt, setYt] = useState<Card[]>([])
  const [music, setMusic] = useState<Card[]>([])
  const [sports, setSports] = useState<Card[]>([])
  const [iptv, setIptv] = useState<Card[]>([])
  const [comics, setComics] = useState<Card[]>([])
  const [books, setBooks] = useState<Card[]>([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [mg, ym, zg, an, ss, nt, em, mt, ch] = await Promise.all([
          loadJson('manga.json').catch(() => ({ manga: [] })),
          loadJson('mangayomi.json').catch(() => ({ manga: [] })),
          loadJson('zangetsu.json').catch(() => ({ anime: [] })),
          loadJson('anime.json').catch(() => ({ anime: [] })),
          loadJson('simplstream.json').catch(() => ({ torrents: [] })),
          loadJson('noutube.json').catch(() => ({ videos: [] })),
          loadJson('eclipse-music.json').catch(() => ({ tracks: [] })),
          loadJson('metegol.json').catch(() => ({ events: [] })),
          loadJson('iptv-channels.json').catch(() => ({ channels: [] })),
        ])
        if (!alive) return
        const readOpen = (m: any): Card => ({
          id: String(m.id),
          title: m.title,
          image: m.coverImage,
          sub: `${m.averageScore || ''} ${m.status || ''}`.trim(),
          onOpen: () => setCurrentPage('library'),
        })
        const listMg = (ym.manga || mg.manga || []) as any[]
        setManga(listMg.slice(0, 8).map(readOpen))
        setNovels(listMg.slice(8, 16).map(readOpen))
        setComics(listMg.slice(0, 6).map((m: any) => ({ ...readOpen(m), id: `c-${m.id}` })))
        setBooks(listMg.slice(6, 12).map((m: any) => ({ ...readOpen(m), id: `b-${m.id}` })))

        const mapAnime = (a: any): Card => ({
          id: String(a.id),
          title: a.title,
          image: a.coverImage,
          sub: a.status || (a.averageScore ? `★ ${a.averageScore}` : ''),
          onOpen: () => setCurrentPage('anime'),
        })
        setAnimeA((zg.anime || []).map(mapAnime))
        setAnimeB((an.anime || []).map(mapAnime))
        setUpcoming((an.anime || []).filter((a: any) => /upcoming|not yet|unreleased/i.test(a.status || '')).map(mapAnime)
          .concat((an.anime || []).slice(-6).map(mapAnime)))

        setShows((ss.torrents || []).map((t: any) => ({
          id: String(t.id),
          title: t.title,
          image: t.coverImage,
          sub: `${t.type || ''} ${t.year || ''}`.trim(),
          onOpen: () => {
            setSelectedMedia({ id: Number(t.id) || 1, type: t.type === 'anime' ? 'tv' : t.type === 'series' ? 'tv' : 'movie' })
            setCurrentPage('detail')
          },
        })))

        setYt((nt.videos || []).map((v: any) => {
          const thumbs = v.videoThumbnails || []
          const img = thumbs.find((x: any) => x.quality === 'medium')?.url || thumbs[thumbs.length - 1]?.url
          return {
            id: v.videoId,
            title: v.title,
            image: img,
            sub: v.author,
            onOpen: () => {
              setCurrentStreamUrl(`https://www.youtube.com/embed/${v.videoId}`)
              setCurrentPage('player')
            },
          }
        }))

        setMusic((em.tracks || []).map((t: any) => ({
          id: String(t.id),
          title: t.title,
          image: t.artwork,
          sub: t.artist,
          onOpen: () => {
            if (t.url) setCurrentStreamUrl(t.url)
            setCurrentPage('player')
          },
        })))

        setSports((mt.events || []).map((e: any) => ({
          id: String(e.id),
          title: e.title,
          image: e.homeTeam?.logo || e.awayTeam?.logo,
          sub: `${e.competition || ''} · ${e.status || ''}`.trim(),
          onOpen: () => {
            const url = e.streams?.[0]?.url
            if (url) setCurrentStreamUrl(url)
            setCurrentPage('player')
          },
        })))

        setIptv((ch.channels || []).slice(0, 12).map((c: any) => ({
          id: String(c.id),
          title: c.name,
          image: c.logo,
          sub: c.group,
          onOpen: () => setCurrentPage('iptv'),
        })))
      } catch {
        /* offline files missing */
      }
    })()
    return () => { alive = false }
  }, [setCurrentPage, setCurrentStreamUrl, setSelectedMedia])

  return (
    <div>
      <Row title="Manga" items={manga} />
      <Row title="Novels" items={novels} />
      <Row title="Comics" items={comics} />
      <Row title="Books" items={books} />
      <Row title="Anime" items={animeA} />
      <Row title="Anime catalog" items={animeB} />
      <Row title="Upcoming Anime" items={upcoming} />
      <Row title="Series & movies" items={shows} />
      <Row title="Live sports" items={sports} />
      <Row title="TV channels" items={iptv} />
      <Row title="YouTube" items={yt} />
      <Row title="Music" items={music} />
    </div>
  )
}
