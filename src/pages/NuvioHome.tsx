import { useEffect, useState } from 'react'
import { Play, Info } from 'lucide-react'
import { tmdb, BACKDROP_URL, POSTER_URL, PROFILE_URL } from '../api/tmdb'
import { streamingServices } from '../api/streaming'
import { useStore } from '../store'
import TitleLogo from '../components/TitleLogo'
import TitleSheet from '../components/TitleSheet'
import { PosterTile, PosterStatus } from '../components/PosterTile'
import { sourceBadge, BadgeImg } from '../components/QualityBadges'
import BrandCard, { ArtLogo } from '../components/BrandCard'
import { ANIME_FRANCHISES, ANIME_STUDIOS, FILM_FRANCHISES } from '../data/brands'
import { getPlayerUrl } from '../api/vidy'
import { isFinished, watchFace, watchPercent } from '../lib/watchProgress'
import { skippedIds, skipTitle } from '../lib/skip'
import '../nuvio-home.css'

function kindOf(item: any) {
  return item?.media_type === 'tv' || item?.first_air_date ? 'tv' : 'movie'
}
function titleOf(item: any) {
  return item?.title || item?.name || ''
}
function yearOf(item: any) {
  return String(item?.release_date || item?.first_air_date || '').slice(0, 4)
}
function cleanParams(p: object): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(p as Record<string, unknown>)) {
    if (v == null || v === '') continue
    out[k] = String(v)
  }
  return out
}
function leftLabel(progress: number, duration: number) {
  const left = Math.max(0, (duration || 0) - (progress || 0))
  if (left < 60) return ''
  const m = Math.round(left / 60)
  if (m < 60) return `${m}m left`
  return `${Math.floor(m / 60)}h ${m % 60}m left`
}
function stopLine(h: any) {
  const sec = Number(h?.progress) || 0
  const m = Math.round(sec / 60)
  const ep = h?.mediaType === 'tv' && h?.season ? `S${h.season} E${h.episode || 1}` : ''
  const stopped = m >= 1 && m < 300 ? `Stopped at ${m}m` : ''
  return [ep, stopped].filter(Boolean).join(' · ')
}

const STUDIOS = [
  { id: 'marvel', name: 'MARVEL', color: '#c8102e', accent: '#fff', logo: './logos/marvel-word.svg', franchise: 'marvel' },
  { id: 'dc', name: 'DC', color: '#0476c0', accent: '#fff', logo: './logos/dc-white.svg', franchise: 'dc' },
  { id: 'a24', name: 'A24', color: '#111111', accent: '#fff', logo: './logos/a24.svg', company: '41077' },
  { id: 'pixar', name: 'PIXAR', color: '#222222', accent: '#f5c518', logo: './logos/pixar.svg', company: '3' },
  { id: 'disney', name: 'DISNEY', color: '#0b1f4d', accent: '#7eb6ff', logo: './logos/disney.svg', company: '2' },
  { id: 'ghibli', name: 'GHIBLI', color: '#16352a', accent: '#b7e4c7', logo: './logos/ghibli.svg', company: '10342' },
  { id: 'universal', name: 'UNIVERSAL', color: '#141414', accent: '#f5c518', logo: './logos/universal.svg', company: '33' },
  { id: 'wb', name: 'WB', color: '#041e42', accent: '#d6e4ff', logo: './logos/wb.svg', company: '174' },
  { id: 'blum', name: 'BLUMHOUSE', color: '#2a0a10', accent: '#e50914', logo: './logos/blumhouse.svg', company: '3172' },
]

const NETWORKS = [
  { id: '6', name: 'NBC' },
  { id: '16', name: 'CBS' },
  { id: '2', name: 'ABC' },
  { id: '19', name: 'FOX' },
  { id: '71', name: 'CW' },
  { id: '14', name: 'PBS' },
]

const GENRES = [
  { id: '28', name: 'Action' },
  { id: '35', name: 'Comedy' },
  { id: '18', name: 'Drama' },
  { id: '878', name: 'Sci-Fi' },
  { id: '27', name: 'Horror' },
  { id: '80', name: 'Crime' },
  { id: '14', name: 'Fantasy' },
  { id: '9648', name: 'Mystery' },
  { id: '10749', name: 'Romance' },
]

const THEMES = [
  { id: '362567', name: 'Mindfuck' },
  { id: '275311', name: 'Crazy Plot Twists' },
  { id: '10051', name: 'Heist' },
  { id: '9715', name: 'Superhero' },
  { id: '12377', name: 'Zombie' },
]

const SHOWS = [
  { id: 1399, name: 'Game of Thrones' },
  { id: 1398, name: 'The Sopranos' },
  { id: 56570, name: 'Outlander' },
  { id: 76479, name: 'The Boys' },
  { id: 1396, name: 'Breaking Bad' },
  { id: 73586, name: 'Yellowstone' },
]

const ANIME_CATS = [
  { id: 'pop', name: 'Popular', tint: '#4c1d95', params: { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc', 'vote_count.gte': '40' } },
  { id: 'top', name: 'Top Rated', tint: '#9a3412', params: { with_genres: '16', with_original_language: 'ja', sort_by: 'vote_average.desc', 'vote_count.gte': '300' } },
  { id: 'prem', name: 'Premieres', tint: '#1e3a8a', params: { with_genres: '16', with_original_language: 'ja', sort_by: 'first_air_date.desc', 'vote_count.gte': '12' } },
  { id: 'dub', name: 'Dubbed', tint: '#9f1239', params: { with_genres: '16', with_origin_country: 'JP', sort_by: 'popularity.desc', 'vote_count.gte': '80' } },
]

const DECADES = [
  { id: '2020', label: '2020s', gte: '2020-01-01', lte: '2029-12-31' },
  { id: '2010', label: '2010s', gte: '2010-01-01', lte: '2019-12-31' },
  { id: '2000', label: '2000s', gte: '2000-01-01', lte: '2009-12-31' },
  { id: '1990', label: '1990s', gte: '1990-01-01', lte: '1999-12-31' },
  { id: '1980', label: '1980s', gte: '1980-01-01', lte: '1989-12-31' },
  { id: '1970', label: '1970s', gte: '1970-01-01', lte: '1979-12-31' },
  { id: '1960', label: '1960s', gte: '1960-01-01', lte: '1969-12-31' },
]

const WORLD = [
  { code: 'br', name: 'Brazilian', country: 'BR' },
  { code: 'cn', name: 'Chinese', country: 'CN' },
  { code: 'fr', name: 'French', country: 'FR' },
  { code: 'de', name: 'German', country: 'DE' },
  { code: 'in', name: 'Indian', country: 'IN' },
  { code: 'it', name: 'Italian', country: 'IT' },
  { code: 'jp', name: 'Japanese', country: 'JP' },
  { code: 'kr', name: 'Korean', country: 'KR' },
  { code: 'mx', name: 'Mexican', country: 'MX' },
]

const BASED = [
  { id: 'true', name: 'True stories', kw: '9672' },
  { id: 'comics', name: 'Comics', kw: '9717' },
  { id: 'games', name: 'Video games', kw: '41645' },
  { id: 'books', name: 'Books', kw: '818' },
  { id: 'bio', name: 'Biographies', kw: '5565' },
]

const HOLIDAYS = [
  { id: 'xmas', name: 'Christmas', kw: '207317' },
  { id: 'thanks', name: 'Thanksgiving', kw: '4543' },
  { id: 'hall', name: 'Halloween', kw: '3335' },
  { id: 'vday', name: "Valentine's Day", kw: '160404' },
]

const EVERYONE = [
  { id: 'ta', name: 'Trending\nAnime', media: 'tv' as const, params: { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc', 'vote_count.gte': '40' } },
  { id: 'tm', name: 'Trending\nMovies', media: 'movie' as const, mode: 'trending' as const },
  { id: 'ts', name: 'Trending\nShows', media: 'tv' as const, mode: 'trending' as const },
  { id: 'la', name: 'Latest\nAnime', media: 'tv' as const, params: { with_genres: '16', with_original_language: 'ja', sort_by: 'first_air_date.desc', 'vote_count.gte': '8', 'first_air_date.lte': new Date().toISOString().slice(0, 10) } },
  { id: 'lm', name: 'Latest\nMovies', media: 'movie' as const, params: { sort_by: 'primary_release_date.desc', 'vote_count.gte': '15', 'primary_release_date.lte': new Date().toISOString().slice(0, 10) } },
  { id: 'ls', name: 'Latest\nShows', media: 'tv' as const, params: { sort_by: 'first_air_date.desc', 'vote_count.gte': '10', 'first_air_date.lte': new Date().toISOString().slice(0, 10) } },
]

const RUNTIMES = [
  { id: 's', label: '<90', caption: 'Short (<90 min)', params: { 'with_runtime.lte': '89', sort_by: 'popularity.desc', 'vote_count.gte': '80' } },
  { id: 'm', label: '<150', caption: 'Standard (90–150 min)', params: { 'with_runtime.gte': '90', 'with_runtime.lte': '150', sort_by: 'popularity.desc', 'vote_count.gte': '80' } },
  { id: 'l', label: '<180', caption: 'Long (150–180 min)', params: { 'with_runtime.gte': '151', 'with_runtime.lte': '180', sort_by: 'popularity.desc', 'vote_count.gte': '40' } },
  { id: 'e', label: '+180', caption: 'Epic (180+ min)', params: { 'with_runtime.gte': '181', sort_by: 'popularity.desc', 'vote_count.gte': '40' } },
]

const ACTORS = [
  { id: 6193, name: 'Leonardo DiCaprio' },
  { id: 30614, name: 'Ryan Gosling' },
  { id: 234352, name: 'Margot Robbie' },
  { id: 1190668, name: 'Timothée Chalamet' },
  { id: 6384, name: 'Keanu Reeves' },
  { id: 131, name: 'Jake Gyllenhaal' },
  { id: 505710, name: 'Zendaya' },
  { id: 1892, name: 'Matt Damon' },
  { id: 192, name: 'Morgan Freeman' },
  { id: 3223, name: 'Robert Downey Jr.' },
  { id: 11856, name: 'Daniel Day-Lewis' },
  { id: 380, name: 'Robert De Niro' },
  { id: 112, name: 'Cate Blanchett' },
  { id: 2037, name: 'Cillian Murphy' },
]

const DIRECTORS = [
  { id: 138, name: 'Quentin Tarantino' },
  { id: 525, name: 'Christopher Nolan' },
  { id: 488, name: 'Steven Spielberg' },
  { id: 1032, name: 'Martin Scorsese' },
  { id: 2710, name: 'James Cameron' },
  { id: 137427, name: 'Denis Villeneuve' },
  { id: 5602, name: 'Greta Gerwig' },
]

const DISCOVER = [
  { id: 'soon', name: 'Anticipated', gradient: 'linear-gradient(160deg,#7f1d1d,#1c1917)', media: 'movie' as const, params: { sort_by: 'popularity.desc', 'primary_release_date.gte': new Date().toISOString().slice(0, 10) } },
  { id: 'latest', name: 'Latest', gradient: 'linear-gradient(160deg,#1e3a5f,#0f172a)', media: 'movie' as const, params: { sort_by: 'primary_release_date.desc', 'vote_count.gte': '30' } },
  { id: 'pop', name: 'Popular', gradient: 'linear-gradient(160deg,#134e4a,#0f172a)', media: 'movie' as const, params: { sort_by: 'popularity.desc' } },
  { id: 'trend', name: 'Trending', gradient: 'linear-gradient(160deg,#9a3412,#1c1917)', media: 'movie' as const, mode: 'trending' as const },
  { id: 'top', name: 'Top Rated', gradient: 'linear-gradient(160deg,#1e3a8a,#0f172a)', media: 'movie' as const, params: { sort_by: 'vote_average.desc', 'vote_count.gte': '800' } },
]

function Flag({ code }: { code: string }) {
  if (code === 'br') return <svg viewBox="0 0 60 40"><rect width="60" height="40" fill="#009b3a" /><polygon points="30,4 56,20 30,36 4,20" fill="#fedd00" /><circle cx="30" cy="20" r="7.5" fill="#002776" /></svg>
  if (code === 'cn') return <svg viewBox="0 0 60 40"><rect width="60" height="40" fill="#de2910" /><polygon points="12,8 13.1,11.4 16.7,11.4 13.8,13.5 14.9,16.9 12,14.8 9.1,16.9 10.2,13.5 7.3,11.4 10.9,11.4" fill="#ffde00" /></svg>
  if (code === 'fr') return <svg viewBox="0 0 60 40"><rect width="20" height="40" fill="#0055A4" /><rect x="20" width="20" height="40" fill="#fff" /><rect x="40" width="20" height="40" fill="#EF4135" /></svg>
  if (code === 'de') return <svg viewBox="0 0 60 40"><rect width="60" height="13.4" fill="#000" /><rect y="13.3" width="60" height="13.4" fill="#DD0000" /><rect y="26.6" width="60" height="13.4" fill="#FFCE00" /></svg>
  if (code === 'in') return <svg viewBox="0 0 60 40"><rect width="60" height="13.4" fill="#FF9933" /><rect y="13.3" width="60" height="13.4" fill="#fff" /><rect y="26.6" width="60" height="13.4" fill="#138808" /><circle cx="30" cy="20" r="4" fill="none" stroke="#000080" strokeWidth="1.2" /></svg>
  if (code === 'it') return <svg viewBox="0 0 60 40"><rect width="20" height="40" fill="#009246" /><rect x="20" width="20" height="40" fill="#fff" /><rect x="40" width="20" height="40" fill="#CE2B37" /></svg>
  if (code === 'jp') return <svg viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff" /><circle cx="30" cy="20" r="8" fill="#BC002D" /></svg>
  if (code === 'kr') return <svg viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff" /><path d="M22 20a8 8 0 0 1 16 0" fill="#CD2E3A" /><path d="M38 20a8 8 0 0 1-16 0" fill="#0047A0" /></svg>
  return <svg viewBox="0 0 60 40"><rect width="20" height="40" fill="#006847" /><rect x="20" width="20" height="40" fill="#fff" /><rect x="40" width="20" height="40" fill="#CE1126" /></svg>
}

export default function NuvioHome() {
  const { setSelectedMedia, setCurrentPage, watchHistory, setCurrentStreamUrl, setSelectedProviderId, setSelectedFranchiseId, profiles, currentProfile, addToWatchlist, removeHistory } = useStore() as any
  const [heroPool, setHeroPool] = useState<any[]>([])
  const [idx, setIdx] = useState(0)
  const [heroDetail, setHeroDetail] = useState<any>(null)
  const [genreNames, setGenreNames] = useState<Record<number, string>>({})
  const [popularM, setPopularM] = useState<any[]>([])
  const [trendTv, setTrendTv] = useState<any[]>([])
  const [top, setTop] = useState<any[]>([])
  const [spots, setSpots] = useState<any[]>([])
  const [action, setAction] = useState<any[]>([])
  const [comedy, setComedy] = useState<any[]>([])
  const [because, setBecause] = useState<{ title: string; items: any[] } | null>(null)
  const [genreArt, setGenreArt] = useState<Record<string, string>>({})
  const [themeArt, setThemeArt] = useState<Record<string, string>>({})
  const [netArt, setNetArt] = useState<Record<string, string[]>>({})
  const [showArt, setShowArt] = useState<Record<number, string>>({})
  const [sources, setSources] = useState<Record<string, string>>({})
  const [sheet, setSheet] = useState<any | null>(null)
  const [dirArt, setDirArt] = useState<Record<number, string>>({})
  const [frArt, setFrArt] = useState<Record<string, string>>({})
  const [decadeArt, setDecadeArt] = useState<Record<string, string>>({})
  const [moreArt, setMoreArt] = useState<Record<string, string>>({})
  const [eyeArt, setEyeArt] = useState<Record<string, string[]>>({})
  const [runArt, setRunArt] = useState<Record<string, string>>({})
  const [actorArt, setActorArt] = useState<Record<number, string>>({})
  const [leftMap, setLeftMap] = useState<Record<string, string>>({})
  const [upArt, setUpArt] = useState('')
  const [night, setNight] = useState<any>(null)
  const [facet, setFacet] = useState<'story' | 'pull' | 'before'>('story')
  const [skips, setSkips] = useState<Set<string>>(() => skippedIds())
  const [openFriend, setOpenFriend] = useState<string | null>(null)

  const hero = heroPool[idx]

  useEffect(() => {
    tmdb.getTrending('all', 'week').then((d) => setHeroPool((d?.results || []).filter((x: any) => x.backdrop_path).slice(0, 8)))
    tmdb.getPopular('movie').then((d) => setPopularM((d?.results || []).filter((x: any) => x.poster_path)))
    tmdb.getTrending('tv', 'week').then((d) => setTrendTv((d?.results || []).filter((x: any) => x.poster_path)))
    tmdb.getTrending('all', 'day').then((d) => setTop((d?.results || []).filter((x: any) => x.poster_path).slice(0, 10)))
    tmdb.getPopular('tv').then((d) => setSpots((d?.results || []).filter((x: any) => x.backdrop_path).slice(0, 3)))
    tmdb.discoverMovies({ with_genres: '28', sort_by: 'popularity.desc' }).then((d) => setAction((d?.results || []).filter((x: any) => x.poster_path))).catch(() => {})
    tmdb.discoverMovies({ with_genres: '35', sort_by: 'popularity.desc' }).then((d) => setComedy((d?.results || []).filter((x: any) => x.poster_path))).catch(() => {})
    Promise.all([tmdb.getMovieGenres(), tmdb.getTVGenres()]).then(([m, t]) => {
      const map: Record<number, string> = {}
      for (const g of [...(m?.genres || []), ...(t?.genres || [])]) map[g.id] = g.name
      setGenreNames(map)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    let dead = false
    Promise.all(GENRES.map((g) => tmdb.discoverMovies({ with_genres: g.id, sort_by: 'popularity.desc' }).then((d) => [g.id, d?.results?.find((x: any) => x.backdrop_path)?.backdrop_path || '']).catch(() => [g.id, '']))).then((rows) => {
      if (dead) return
      const map: Record<string, string> = {}
      for (const [id, path] of rows) if (path) map[id as string] = path as string
      setGenreArt(map)
    })
    Promise.all(THEMES.map((g) => tmdb.discoverMovies({ with_keywords: g.id, sort_by: 'popularity.desc', 'vote_count.gte': '80' }).then((d) => [g.id, d?.results?.find((x: any) => x.backdrop_path)?.backdrop_path || '']).catch(() => [g.id, '']))).then((rows) => {
      if (dead) return
      const map: Record<string, string> = {}
      for (const [id, path] of rows) if (path) map[id as string] = path as string
      setThemeArt(map)
    })
    Promise.all(NETWORKS.map((n) => tmdb.discoverTV({ with_networks: n.id, sort_by: 'popularity.desc' }).then((d) => [n.id, (d?.results || []).filter((x: any) => x.poster_path).slice(0, 4).map((x: any) => x.poster_path)]).catch(() => [n.id, []]))).then((rows) => {
      if (dead) return
      const map: Record<string, string[]> = {}
      for (const [id, paths] of rows) map[id as string] = paths as string[]
      setNetArt(map)
    })
    Promise.all(SHOWS.map((s) => tmdb.getTVDetail(s.id).then((d) => [s.id, d?.backdrop_path || '']).catch(() => [s.id, '']))).then((rows) => {
      if (dead) return
      const map: Record<number, string> = {}
      for (const [id, path] of rows) if (path) map[id as number] = path as string
      setShowArt(map)
    })
    DIRECTORS.forEach((d) => {
      tmdb.getPersonDetail(d.id).then((p) => {
        if (!dead && p?.profile_path) setDirArt((prev) => ({ ...prev, [d.id]: p.profile_path }))
      }).catch(() => {})
    })
    ANIME_FRANCHISES.forEach((s) => {
      tmdb.getTVDetail(s.id).then((d) => {
        const path = d?.backdrop_path
        if (!dead && path) setFrArt((prev) => ({ ...prev, [`a${s.id}`]: path }))
      }).catch(() => {})
    })
    FILM_FRANCHISES.forEach((f) => {
      if (!f.collection) return
      tmdb.getCollection(f.collection).then((d) => {
        const path = d?.backdrop_path || d?.parts?.find((x: any) => x.backdrop_path)?.backdrop_path
        if (!dead && path) setFrArt((prev) => ({ ...prev, [`f${f.id}`]: path }))
      }).catch(() => {})
    })
    ANIME_CATS.forEach((c) => {
      tmdb.discoverTV(cleanParams(c.params)).then((d) => {
        const path = (d?.results || []).find((x: any) => x.backdrop_path)?.backdrop_path
        if (!dead && path) setFrArt((prev) => ({ ...prev, [`c${c.id}`]: path }))
      }).catch(() => {})
    })
    DECADES.forEach((d) => {
      tmdb.discoverMovies({ 'primary_release_date.gte': d.gte, 'primary_release_date.lte': d.lte, sort_by: 'popularity.desc', 'vote_count.gte': '200' }).then((res) => {
        const path = (res?.results || []).find((x: any) => x.backdrop_path)?.backdrop_path
        if (!dead && path) setDecadeArt((prev) => ({ ...prev, [d.id]: path }))
      }).catch(() => {})
    })
    ;[...BASED, ...HOLIDAYS].forEach((g) => {
      tmdb.discoverMovies({ with_keywords: g.kw, sort_by: 'popularity.desc', 'vote_count.gte': '40' }).then((res) => {
        const path = (res?.results || []).find((x: any) => x.backdrop_path)?.backdrop_path
        if (!dead && path) setMoreArt((prev) => ({ ...prev, [g.id]: path }))
      }).catch(() => {})
    })
    EVERYONE.forEach((c) => {
      const run = c.mode === 'trending'
        ? tmdb.getTrending(c.media, 'week')
        : (c.media === 'tv' ? tmdb.discoverTV : tmdb.discoverMovies)(cleanParams(c.params || {}))
      run.then((d) => {
        const paths = (d?.results || []).filter((x: any) => x.poster_path).slice(0, 4).map((x: any) => x.poster_path)
        if (!dead && paths.length) setEyeArt((prev) => ({ ...prev, [c.id]: paths }))
      }).catch(() => {})
    })
    RUNTIMES.forEach((r) => {
      tmdb.discoverMovies(cleanParams(r.params)).then((res) => {
        const path = (res?.results || []).find((x: any) => x.backdrop_path)?.backdrop_path
        if (!dead && path) setRunArt((prev) => ({ ...prev, [r.id]: path }))
      }).catch(() => {})
    })
    ACTORS.forEach((a) => {
      tmdb.getPersonDetail(a.id).then((p) => {
        if (!dead && p?.profile_path) setActorArt((prev) => ({ ...prev, [a.id]: p.profile_path }))
      }).catch(() => {})
    })
    return () => { dead = true }
  }, [])

  useEffect(() => {
    let dead = false
    const last = (watchHistory || []).find((h: any) => h.mediaType === 'tv' || h.mediaType === 'movie')
    const load = (mediaType: string, mediaId: number, label: string) => {
      const fn = mediaType === 'tv' ? tmdb.getTVDetail : tmdb.getMovieDetail
      fn(Number(mediaId)).then((d) => {
        const gid = d?.genres?.[0]?.id
        if (!gid || dead) return
        const disc = mediaType === 'tv'
          ? tmdb.discoverTV({ with_genres: String(gid), sort_by: 'popularity.desc' })
          : tmdb.discoverMovies({ with_genres: String(gid), sort_by: 'popularity.desc' })
        disc.then((row) => {
          if (dead) return
          setBecause({ title: label || titleOf(d), items: (row?.results || []).filter((x: any) => x.poster_path && x.id !== Number(mediaId)).slice(0, 16) })
        }).catch(() => {})
      }).catch(() => {})
    }
    if (last?.mediaId) {
      load(last.mediaType, Number(last.mediaId), last.title || '')
      return () => { dead = true }
    }
    tmdb.getTrending('tv', 'week').then((d) => {
      const item = (d?.results || []).find((x: any) => x.poster_path)
      if (!item || dead) return
      load('tv', item.id, titleOf(item))
    }).catch(() => {})
    return () => { dead = true }
  }, [watchHistory])

  useEffect(() => {
    const pool = [...top.slice(0, 8), ...popularM.slice(0, 6), ...trendTv.slice(0, 6), ...action.slice(0, 6), ...comedy.slice(0, 6), ...(because?.items || []).slice(0, 6)]
    if (!pool.length) return
    let dead = false
    Promise.all(pool.map(async (item) => {
      const type = kindOf(item) === 'tv' ? 'tv' : 'movie'
      try {
        const d = await tmdb.getWatchProviders(type as 'movie' | 'tv', item.id)
        const region = d?.results?.US || d?.results?.GB || Object.values(d?.results || {})[0] as any
        const names = [...(region?.flatrate || []), ...(region?.ads || [])].map((p: any) => p.provider_name).filter(Boolean)
        return [String(item.id), names.join(' ')] as const
      } catch {
        return [String(item.id), ''] as const
      }
    })).then((rows) => {
      if (dead) return
      const map: Record<string, string> = {}
      for (const [id, names] of rows) if (names) map[id] = sourceBadge(names)
      setSources(map)
    })
    return () => { dead = true }
  }, [top, popularM, trendTv, action, comedy, because])

  useEffect(() => {
    if (heroPool.length < 2) return
    const t = setInterval(() => setIdx((i) => (i + 1) % heroPool.length), 9000)
    return () => clearInterval(t)
  }, [heroPool.length])

  useEffect(() => {
    if (!hero?.id) return
    const fn = kindOf(hero) === 'tv' ? tmdb.getTVDetail : tmdb.getMovieDetail
    fn(hero.id).then(setHeroDetail).catch(() => setHeroDetail(null))
  }, [hero?.id])

  useEffect(() => {
    const sync = () => setSkips(skippedIds())
    window.addEventListener('mfy-skip', sync)
    return () => window.removeEventListener('mfy-skip', sync)
  }, [])

  useEffect(() => {
    const meId = currentProfile?.id || 'default'
    const mineIds = new Set((watchHistory || []).filter((h: any) => (h.profileId || 'default') === meId).map((h: any) => String(h.mediaId)))
    let pick: any = null
    for (const p of profiles || []) {
      if (!p || p.id === meId) continue
      const seen = new Set<string>()
      for (const h of watchHistory || []) {
        if (h.profileId !== p.id) continue
        const k = String(h.mediaId)
        if (seen.has(k) || mineIds.has(k) || skips.has(k)) continue
        seen.add(k)
        pick = { ...h, friend: p.name }
        break
      }
      if (pick) break
    }
    if (!pick?.mediaId) {
      setNight(null)
      return
    }
    let dead = false
    const fn = pick.mediaType === 'movie' ? tmdb.getMovieDetail : tmdb.getTVDetail
    fn(Number(pick.mediaId)).then((d) => {
      if (!dead && d) setNight({ ...d, media_type: pick.mediaType === 'movie' ? 'movie' : 'tv', friend: pick.friend })
    }).catch(() => { if (!dead) setNight(null) })
    return () => { dead = true }
  }, [watchHistory, profiles, currentProfile, skips])

  useEffect(() => {
    const rows = (watchHistory || []).slice(0, 12).filter((h: any) => h.mediaType === 'tv' && Number(h.season) > 0 && Number(h.episode) > 0)
    const ids = [...new Set(rows.map((h: any) => String(h.mediaId)))].slice(0, 8)
    if (!ids.length) return
    let dead = false
    ids.forEach((id) => {
      tmdb.getTVDetail(Number(id)).then((d) => {
        if (dead || !d?.seasons) return
        const next: Record<string, string> = {}
        for (const h of rows) {
          if (String(h.mediaId) !== id) continue
          const season = (d.seasons || []).find((x: any) => Number(x.season_number) === Number(h.season))
          const left = season ? Number(season.episode_count) - Number(h.episode) : 0
          if (left > 0) next[`${id}-${h.season}`] = left === 1 ? '1 left this season' : `${left} left this season`
        }
        setLeftMap((prev) => ({ ...prev, ...next }))
      }).catch(() => {})
    })
    return () => { dead = true }
  }, [watchHistory])

  function open(item: any, type?: string) {
    const t = type || kindOf(item)
    setSelectedMedia({ id: item.id, type: t, title: titleOf(item) })
    setCurrentPage('detail')
  }

  function play(item: any) {
    const t = kindOf(item)
    setSelectedMedia({ id: item.id, type: t, title: titleOf(item) })
    setCurrentStreamUrl(getPlayerUrl(t === 'tv' && /anime|jp/i.test(String(item.original_language || '')) ? 'zangetsu' : 'playtorrio', t, item.id, 1, 1))
    setCurrentPage('player')
  }

  function openShelf(title: string, media: 'movie' | 'tv', params?: Record<string, string>, mode?: 'trending') {
    try { sessionStorage.setItem('mfy-shelf', JSON.stringify({ title, media, params, mode: mode || 'discover' })) } catch {}
    setCurrentPage('shelf')
  }

  function openPerson(person: { id: number; name: string }) {
    try { sessionStorage.setItem('mfy-person', JSON.stringify({ source: 'tmdb', id: person.id, name: person.name })) } catch {}
    setCurrentPage('people')
  }

  function openHist(h: any) {
    const tv = h.mediaType === 'tv'
    setSheet({
      id: Number(h.mediaId),
      title: h.title,
      name: h.title,
      poster_path: h.posterPath,
      media_type: tv ? 'tv' : 'movie',
      ...(tv ? { first_air_date: '2000-01-01' } : { release_date: '2000-01-01' }),
    })
  }

  function faceOf(id: number | string, item?: any) {
    return watchFace(watchHistory, id, item)
  }

  function pctOf(id: number | string) {
    const rows = (watchHistory || []).filter((h: any) => String(h.mediaId) === String(id))
    return rows.reduce((n: number, h: any) => Math.max(n, watchPercent(h)), 0)
  }

  const cw = (watchHistory || []).slice(0, 12)
  const genreLine = (heroDetail?.genres?.length ? heroDetail.genres.slice(0, 2).map((g: any) => g.name) : (hero?.genre_ids || []).slice(0, 2).map((id: number) => genreNames[id]).filter(Boolean))
  const seasons = heroDetail?.number_of_seasons
  const match = hero?.vote_average ? Math.round(hero.vote_average * 10) : 0

  const meId = currentProfile?.id || 'default'
  const mineRows = (watchHistory || []).filter((h: any) => (h.profileId || 'default') === meId)
  const mineIds = new Set(mineRows.map((h: any) => String(h.mediaId)))
  const friendCards = (profiles || []).filter((p: any) => p && p.id !== meId).map((p: any) => {
    const byId = new Map<string, any>()
    for (const h of watchHistory || []) {
      if (h.profileId !== p.id) continue
      const k = String(h.mediaId)
      const prev = byId.get(k)
      if (!prev || String(h.watchedAt || '') > String(prev.watchedAt || '')) byId.set(k, h)
    }
    const unique = [...byId.values()]
    const shared = unique.filter((h) => mineIds.has(String(h.mediaId)))
    const only = unique.filter((h) => !mineIds.has(String(h.mediaId)) && !skips.has(String(h.mediaId)))
    let ahead = ''
    for (const h of shared) {
      if (h.mediaType !== 'tv') continue
      const theirEp = (Number(h.season) || 0) * 1000 + (Number(h.episode) || 0)
      const myEp = mineRows.filter((m: any) => String(m.mediaId) === String(h.mediaId)).reduce((n: number, m: any) => Math.max(n, (Number(m.season) || 0) * 1000 + (Number(m.episode) || 0)), 0)
      if (theirEp > myEp && h.title) { ahead = h.title; break }
    }
    return { profile: p, shared, only, ahead }
  })
  const picked = friendCards.find((f: any) => f.profile.id === openFriend) || null

  return (
    <div className="nv-page">
      {hero && (
        <section className="nv-hero" key={hero.id}>
          <div className="nv-hero-bg" style={{ backgroundImage: `url(${BACKDROP_URL}${hero.backdrop_path})` }} />
          <div className="nv-hero-fade" />
          <div className="nv-hero-copy">
            <TitleLogo id={hero.id} type={kindOf(hero)} title={titleOf(hero)} />
            {idx === 0 && <p className="nv-rankline">No. 1 in Trending</p>}
            <p className="nv-genre">
              {[genreLine[0], yearOf(hero), kindOf(hero) === 'tv' && seasons ? `${seasons} Season${seasons === 1 ? '' : 's'}` : kindOf(hero) === 'movie' ? 'Movie' : 'Series'].filter(Boolean).join('  ·  ')}
            </p>
            <p className="nv-syn">{hero.overview}</p>
            <div className="nf-actions">
              <button type="button" className="nf-play" onClick={() => play(hero)}><Play size={18} fill="currentColor" /> Play</button>
              <button type="button" className="nf-info" onClick={() => open(hero)}><Info size={18} /> More Info</button>
            </div>
          </div>
          {match >= 70 && <div className="nf-hero-badges"><span>{match}% match</span></div>}
          <div className="nv-dots">
            {heroPool.map((_, i) => (
              <button key={i} type="button" className={`nv-dot${i === idx ? ' on' : ''}`} onClick={() => setIdx(i)} aria-label={`Featured ${i + 1}`} />
            ))}
          </div>
        </section>
      )}

      {cw.length > 0 && (
        <section className="nv-row">
          <h2 className="nv-h">Continue Watching</h2>
          <div className="nv-sc">
            {cw.map((h: any) => {
              const face = watchFace([h], h.mediaId, h)
              return (
                <div key={`${h.mediaId}-${h.season}-${h.episode}`} className="nv-cw">
                  <button type="button" className="nv-cw-open" onClick={() => open({ id: h.mediaId, title: h.title, media_type: h.mediaType }, h.mediaType || 'movie')}>
                    <div className="nv-shot">
                      {h.backdropPath || h.posterPath
                        ? <img src={`${h.backdropPath ? BACKDROP_URL : POSTER_URL}${h.backdropPath || h.posterPath}`} alt="" />
                        : <div className="ph" />}
                      <PosterStatus
                        state={face.state === 'fresh' ? 'progress' : face.state}
                        pct={Math.max(8, face.pct)}
                        label={face.label || leftLabel(h.progress, h.duration)}
                      />
                      <TitleLogo id={h.mediaId} type={h.mediaType === 'movie' ? 'movie' : 'tv'} title={h.title || ''} className="cw-logo" />
                    </div>
                    <p>{h.title || 'Title'}</p>
                    {[stopLine(h), leftMap[`${h.mediaId}-${h.season}`]].filter(Boolean).length > 0 && (
                      <small>{[stopLine(h), leftMap[`${h.mediaId}-${h.season}`]].filter(Boolean).join(' · ')}</small>
                    )}
                  </button>
                  <button
                    type="button"
                    className="nv-x"
                    aria-label={`Remove ${h.title || 'title'} from Continue Watching`}
                    onClick={() => removeHistory(h.mediaId, h.mediaType)}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="nv-row">
        <h2 className="nv-kicker">With friends</h2>
        {friendCards.length === 0 ? (
          <p className="lens-sub">Add another profile. What they finish, and what only they have seen, shows up here.</p>
        ) : (
          <>
            <div className="circle-row">
              {friendCards.map((f: any) => (
                <button key={f.profile.id} type="button" className="circle-card" onClick={() => setOpenFriend(openFriend === f.profile.id ? null : f.profile.id)}>
                  {f.profile.avatar ? <img src={f.profile.avatar} alt="" /> : <span className="circle-ava">{(f.profile.name || '?')[0]}</span>}
                  <b>{f.profile.name}</b>
                  <small>{f.shared.length} in common{f.ahead ? ` · ahead on ${f.ahead}` : ''}</small>
                </button>
              ))}
            </div>
            {picked && (
              <div className="compare">
                <h3>You and {picked.profile.name}</h3>
                <p>{picked.shared.length} titles in common{picked.ahead ? ` · ${picked.profile.name} is ahead on ${picked.ahead}` : ''}</p>
                {picked.shared.length > 0 && (
                  <>
                    <h3>Shows you both watch</h3>
                    <div className="compare-row">
                      {picked.shared.slice(0, 10).map((h: any) => {
                        let lead = ''
                        if (h.mediaType === 'tv') {
                          const theirEp = (Number(h.season) || 0) * 1000 + (Number(h.episode) || 0)
                          const myEp = mineRows.filter((m: any) => String(m.mediaId) === String(h.mediaId)).reduce((n: number, m: any) => Math.max(n, (Number(m.season) || 0) * 1000 + (Number(m.episode) || 0)), 0)
                          lead = myEp > theirEp ? 'You · ahead' : theirEp > myEp ? `${picked.profile.name} · ahead` : ''
                        }
                        return (
                          <button key={h.mediaId} type="button" className="compare-card" onClick={() => openHist(h)}>
                            {h.posterPath ? <img src={`${String(h.posterPath).startsWith('http') ? '' : POSTER_URL}${h.posterPath}`} alt="" /> : <i />}
                            <b>{h.title}</b>
                            {lead ? <em className="lead-chip">{lead}</em> : null}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
                {picked.only.length > 0 && (
                  <>
                    <h3>Only {picked.profile.name} watched</h3>
                    <div className="compare-row">
                      {picked.only.slice(0, 10).map((h: any) => (
                        <button key={h.mediaId} type="button" className="compare-card" onClick={() => openHist(h)}>
                          {h.posterPath ? <img src={`${String(h.posterPath).startsWith('http') ? '' : POSTER_URL}${h.posterPath}`} alt="" /> : <i />}
                          <b>{h.title}</b>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {night && !skips.has(String(night.id)) && (
        <section className="nv-row">
          <h2 className="nv-kicker">Worth your night</h2>
          <p className="lens-sub">Only {night.friend} has watched this. Enough context to decide.</p>
          <div className="night">
            {night.backdrop_path || night.poster_path
              ? <img src={`${night.backdrop_path ? BACKDROP_URL : POSTER_URL}${night.backdrop_path || night.poster_path}`} alt="" />
              : <div />}
            <div className="night-body">
              <b>Only {night.friend} watched</b>
              <h3 style={{ margin: '6px 0 0', fontSize: 22 }}>{night.title || night.name}</h3>
              <div className="lens-facets">
                {(['story', 'pull', 'before'] as const).map((id) => (
                  <button key={id} type="button" className={facet === id ? 'on' : ''} onClick={() => setFacet(id)}>
                    {id === 'story' ? 'The experience' : id === 'pull' ? 'What pulls you' : 'Before you watch'}
                  </button>
                ))}
              </div>
              {facet === 'story' && <p>{night.overview || 'No synopsis yet.'}</p>}
              {facet === 'pull' && <p>{(night.genres || []).map((g: any) => g.name).join(' · ') || 'No genres yet.'}</p>}
              {facet === 'before' && <p>{[String(night.release_date || night.first_air_date || '').slice(0, 4), night.runtime ? `${night.runtime} min` : night.episode_run_time?.[0] ? `${night.episode_run_time[0]} min` : '', night.vote_average ? `★ ${Number(night.vote_average).toFixed(1)}` : ''].filter(Boolean).join(' · ')}</p>}
              <div className="nf-actions">
                <button type="button" className="nf-play" onClick={() => setSheet({ ...night, media_type: night.media_type })}>Know the story</button>
                <button type="button" className="nf-info" onClick={() => addToWatchlist({ mediaId: Number(night.id), mediaType: night.media_type === 'movie' ? 'movie' : 'tv', title: night.title || night.name || 'Title', posterPath: night.poster_path || null, addedAt: new Date().toISOString() })}>+ My list</button>
                <button type="button" className="nf-info" onClick={() => skipTitle(night.id)}>Not for me</button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="nv-row">
        <h2 className="nv-kicker">Streaming</h2>
        <div className="svc-row">
          {streamingServices.map((s, i) => (
            <Plate key={s.id} name={s.name} color={s.color} logo={s.logo || undefined} delay={i * 0.45} onClick={() => { setSelectedProviderId(s.id); setCurrentPage('provider') }} />
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">Everyone's Watching</h2>
        <div className="eye-row">
          {EVERYONE.map((c) => (
            <button
              key={c.id}
              type="button"
              className="eye"
              onClick={() => openShelf(c.name.replace('\n', ' '), c.media, c.params ? cleanParams(c.params) : undefined, c.mode)}
            >
              <span className="eye-card">
                <span className="eye-mosaic">
                  {(eyeArt[c.id] || []).map((p) => <img key={p} src={`${POSTER_URL}${p}`} alt="" />)}
                </span>
                <b>{c.name}</b>
              </span>
              <span>{c.name.replace('\n', ' ')}</span>
            </button>
          ))}
        </div>
      </section>

      {top.length > 0 && (
        <section className="nv-row">
          <h2 className="nv-h">Top 10 Today</h2>
          <div className="nf-top">
            {top.map((item, i) => {
              const face = faceOf(item.id, item)
              return (
              <button key={`${item.id}-${i}`} type="button" className="nf-rank" onClick={() => setSheet(item)}>
                <b>{i + 1}</b>
                <span className="nf-shot">
                  <img src={`${POSTER_URL}${item.poster_path}`} alt={titleOf(item)} />
                  <PosterStatus
                    genre={genreNames[item.genre_ids?.[0]]}
                    score={item.vote_average}
                    state={face.state}
                    pct={face.pct}
                    label={face.label}
                  />
                </span>
                {sources[String(item.id)] && <BadgeImg className="nv-badge" src={sources[String(item.id)]} alt="" />}
              </button>
              )
            })}
          </div>
        </section>
      )}

      <section className="nv-row">
        <h2 className="nv-kicker">Studios</h2>
        <div className="studio-row">
          {STUDIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="studio"
              style={{ background: s.color, color: s.accent }}
              onClick={() => {
                if (s.franchise) { setSelectedFranchiseId(s.franchise); setCurrentPage('franchise'); return }
                openShelf(s.name, 'movie', { with_companies: s.company || '', sort_by: 'popularity.desc', 'vote_count.gte': '80' })
              }}
            >
              {s.logo ? <img src={s.logo} alt={s.name} /> : <b>{s.name}</b>}
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">Networks</h2>
        <div className="net-row">
          {NETWORKS.map((n) => (
            <button key={n.id} type="button" className="net" onClick={() => openShelf(n.name, 'tv', { with_networks: n.id, sort_by: 'popularity.desc' })}>
              <span className="net-mosaic">
                {(netArt[n.id] || []).map((p) => <img key={p} src={`${POSTER_URL}${p}`} alt="" />)}
              </span>
              <b>{n.name}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-h">Discover</h2>
        <div className="disc-row">
          {DISCOVER.map((d) => (
            <button key={d.id} type="button" className="disc" style={{ background: d.gradient }} onClick={() => openShelf(d.name, d.media, d.params ? cleanParams(d.params) : undefined, d.mode)}>
              {d.name}
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">Genres</h2>
        <div className="tile-row">
          {GENRES.map((g) => (
            <button key={g.id} type="button" className="tile" onClick={() => openShelf(g.name, 'movie', { with_genres: g.id, sort_by: 'popularity.desc' })}>
              {genreArt[g.id] && <img src={`${BACKDROP_URL}${genreArt[g.id]}`} alt="" />}
              <b>{g.name}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">Themes</h2>
        <div className="tile-row">
          {THEMES.map((g) => (
            <button key={g.id} type="button" className="tile wide" onClick={() => openShelf(g.name, 'movie', { with_keywords: g.id, sort_by: 'popularity.desc', 'vote_count.gte': '50' })}>
              {themeArt[g.id] && <img src={`${BACKDROP_URL}${themeArt[g.id]}`} alt="" />}
              <b>{g.name}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">Decades</h2>
        <div className="decade-row">
          {DECADES.map((d) => (
            <button
              key={d.id}
              type="button"
              className="decade"
              onClick={() => openShelf(d.label, 'movie', { 'primary_release_date.gte': d.gte, 'primary_release_date.lte': d.lte, sort_by: 'popularity.desc', 'vote_count.gte': '80' })}
            >
              {decadeArt[d.id] ? <img src={`${BACKDROP_URL}${decadeArt[d.id]}`} alt="" /> : null}
              <b>{d.label}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">Runtime</h2>
        <div className="decade-row">
          {RUNTIMES.map((r) => (
            <div className="run-cap" key={r.id}>
              <button type="button" className="decade" onClick={() => openShelf(r.caption, 'movie', cleanParams(r.params))}>
                {runArt[r.id] ? <img src={`${BACKDROP_URL}${runArt[r.id]}`} alt="" /> : null}
                <b>{r.label}</b>
              </button>
              <span>{r.caption}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">World</h2>
        <div className="flag-row">
          {WORLD.map((w) => (
            <button key={w.code} type="button" className="flag-card" onClick={() => openShelf(w.name, 'movie', { with_origin_country: w.country, sort_by: 'popularity.desc', 'vote_count.gte': '40' })}>
              <Flag code={w.code} />
              <span>{w.name}</span>
            </button>
          ))}
        </div>
      </section>

      {because && because.items.length > 0 && (
        <section className="nv-row">
          <h2 className="nv-kicker">Because You Watched {because.title}</h2>
          <div className="nv-sc">
            {because.items.map((m) => (
              <PosterTile key={m.id} poster={m.poster_path} title={titleOf(m)} genre={genreNames[m.genre_ids?.[0]]} score={m.vote_average} year={yearOf(m)} mediaId={m.id} item={m} pct={pctOf(m.id)} badge={sources[String(m.id)]} onClick={() => setSheet(m)} />
            ))}
          </div>
        </section>
      )}

      {popularM.length > 0 && (
        <section className="nv-row">
          <h2 className="nv-h">We think you'll love this</h2>
          <div className="nf-love">
            {popularM.filter((m) => m.backdrop_path).slice(0, 8).map((item) => {
              const face = faceOf(item.id, item)
              return (
              <button key={item.id} type="button" onClick={() => setSheet(item)}>
                <img src={`${BACKDROP_URL}${item.backdrop_path}`} alt={titleOf(item)} />
                {face.state !== 'fresh' && (
                  <PosterStatus state={face.state} pct={face.pct} label={face.label} />
                )}
              </button>
              )
            })}
          </div>
        </section>
      )}

      {spots.length > 0 && (
        <section className="nv-row">
          <div className="nf-spots">
            {spots.map((item) => (
              <article key={item.id} className="nf-spot" style={{ backgroundImage: `url(${BACKDROP_URL}${item.backdrop_path})` }}>
                <TitleLogo id={item.id} type="tv" title={titleOf(item)} />
                <div>
                  <button type="button" onClick={() => play(item)}><Play size={13} fill="currentColor" /> Play</button>
                  <button type="button" onClick={() => open(item, 'tv')}><Info size={13} /> More Info</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="nv-row">
        <h2 className="nv-kicker">Actors</h2>
        <div className="actor-row">
          {ACTORS.map((a) => (
            <button key={a.id} type="button" className="actor" onClick={() => openPerson(a)}>
              {actorArt[a.id] ? <img src={`${PROFILE_URL}${actorArt[a.id]}`} alt="" /> : <i>{a.name[0]}</i>}
              <b>{a.name}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">Directors</h2>
        <div className="dir-row">
          {DIRECTORS.map((d) => (
            <button key={d.id} type="button" className="dir" onClick={() => openPerson(d)}>
              {dirArt[d.id] ? <img src={`${PROFILE_URL}${dirArt[d.id]}`} alt="" /> : <i>{d.name[0]}</i>}
              <b>{d.name}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">Based on</h2>
        <div className="tile-row">
          {BASED.map((g) => (
            <button key={g.id} type="button" className="tile wide" onClick={() => openShelf(g.name, 'movie', { with_keywords: g.kw, sort_by: 'popularity.desc', 'vote_count.gte': '40' })}>
              {moreArt[g.id] && <img src={`${BACKDROP_URL}${moreArt[g.id]}`} alt="" />}
              <b>{g.name}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">Holiday specials</h2>
        <div className="tile-row">
          {HOLIDAYS.map((g) => (
            <button key={g.id} type="button" className="tile wide" onClick={() => openShelf(g.name, 'movie', { with_keywords: g.kw, sort_by: 'popularity.desc', 'vote_count.gte': '20' })}>
              {moreArt[g.id] && <img src={`${BACKDROP_URL}${moreArt[g.id]}`} alt="" />}
              <b>{g.name}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">Franchises</h2>
        <div className="svc-row">
          {FILM_FRANCHISES.map((f, i) => (
            <ArtLogo
              key={f.id}
              name={f.name}
              color={f.color}
              logo={f.logo}
              delay={i * 0.28}
              art={frArt[`f${f.id}`] ? `${BACKDROP_URL}${frArt[`f${f.id}`]}` : undefined}
              onClick={() => { setSelectedFranchiseId(f.franchise); setCurrentPage('franchise') }}
            />
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">TV Collections</h2>
        <div className="banner-row">
          {SHOWS.map((s) => (
            <button key={s.id} type="button" className="banner short" onClick={() => open({ id: s.id, name: s.name, first_air_date: 'tv' }, 'tv')}>
              {showArt[s.id] && <img src={`${BACKDROP_URL}${showArt[s.id]}`} alt="" />}
              <b>{s.name}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">Anime</h2>
        <div className="svc-row">
          {ANIME_CATS.map((c, i) => (
            <ArtLogo
              key={c.id}
              name={c.name}
              color={c.tint}
              kicker="Anime"
              delay={i * 0.28}
              art={frArt[`c${c.id}`] ? `${BACKDROP_URL}${frArt[`c${c.id}`]}` : undefined}
              onClick={() => openShelf(c.name, 'tv', cleanParams(c.params))}
            />
          ))}
          {ANIME_FRANCHISES.map((s, i) => (
            <ArtLogo
              key={s.id}
              name={s.name}
              color={s.color}
              logo={s.logo}
              delay={(ANIME_CATS.length + i) * 0.28}
              art={frArt[`a${s.id}`] ? `${BACKDROP_URL}${frArt[`a${s.id}`]}` : undefined}
              onClick={() => setSheet({ id: s.id, name: s.name, first_air_date: '2000-01-01', media_type: 'tv', isAnime: true, backdrop_path: frArt[`a${s.id}`] })}
            />
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">Anime Studios</h2>
        <div className="house-row">
          {ANIME_STUDIOS.map((s) => (
            <div className="house" key={s.id}>
              <button type="button" onClick={() => openShelf(s.name, 'tv', { with_companies: s.company, with_genres: '16', sort_by: 'popularity.desc' })}>
                <img src={s.logo} alt={s.name} />
              </button>
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      <PosterRow title="Trending TV" items={trendTv} genres={genreNames} pctOf={pctOf} badges={sources} onOpen={setSheet} />
      <PosterRow title="Action & Adventure" items={action} genres={genreNames} pctOf={pctOf} badges={sources} onOpen={setSheet} />
      <PosterRow title="Laugh Out Loud" items={comedy} genres={genreNames} pctOf={pctOf} badges={sources} onOpen={setSheet} />

      {sheet && <TitleSheet item={sheet} onClose={() => setSheet(null)} />}
    </div>
  )
}

function Plate({ name, color, logo, delay = 0, ink = false, onClick }: { name: string; color: string; logo?: string; delay?: number; ink?: boolean; onClick: () => void }) {
  return (
    <div className="plate">
      <BrandCard name={name} color={color} logo={logo} delay={delay} ink={ink} onClick={onClick} />
      <span>{name}</span>
    </div>
  )
}

function PosterRow({ title, items, genres, pctOf, badges, onOpen }: { title: string; items: any[]; genres: Record<number, string>; pctOf: (id: any) => number; badges: Record<string, string>; onOpen: (item: any) => void }) {
  if (!items.length) return null
  return (
    <section className="nv-row">
      <h2 className="nv-h">{title}</h2>
      <div className="nv-sc">
        {items.map((m, i) => (
          <PosterTile
            key={m.id}
            poster={m.poster_path}
            title={titleOf(m)}
            genre={genres[m.genre_ids?.[0]]}
            score={m.vote_average}
            year={yearOf(m)}
            mediaId={m.id}
            item={m}
            pct={pctOf(m.id)}
            rank={/trend|today|top/i.test(title) ? i + 1 : 0}
            badge={badges[String(m.id)]}
            onClick={() => onOpen(m)}
          />
        ))}
      </div>
    </section>
  )
}
