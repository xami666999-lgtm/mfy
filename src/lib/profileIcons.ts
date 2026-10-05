import { tmdb } from '../api/tmdb'

export type ProfileIcon = { id: number; name: string; src: string }
export type IconRow = { title: string; items: ProfileIcon[] }
export type IconShelf = { label: string; rows: IconRow[] }

function norm(value: string) {
  return String(value || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim()
}

async function anilistRows(format: string): Promise<IconRow[]> {
  const query = `query ($format: MediaFormat) {
    Page(perPage: 6) {
      media(type: ANIME, format: $format, sort: POPULARITY_DESC, isAdult: false) {
        id
        title { english romaji }
        characters(perPage: 8, sort: [ROLE]) {
          nodes { id name { full } image { large } }
        }
      }
    }
  }`
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables: { format } }),
  })
  const json = await res.json()
  return (json?.data?.Page?.media || []).map((show: any) => ({
    title: show?.title?.english || show?.title?.romaji || 'Anime',
    items: (show?.characters?.nodes || [])
      .filter((c: any) => c?.image?.large)
      .map((c: any) => ({ id: c.id, name: c?.name?.full || 'Character', src: c.image.large })),
  })).filter((row: IconRow) => row.items.length)
}

async function tvmazeCharacters(title: string): Promise<ProfileIcon[]> {
  const found = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(title)}`).then((r) => r.json()).catch(() => [])
  const want = norm(title)
  const hit = (Array.isArray(found) ? found : []).find((row: any) => norm(row?.show?.name) === want)
  if (!hit?.show?.id) return []
  const cast = await fetch(`https://api.tvmaze.com/shows/${hit.show.id}/cast`).then((r) => r.json()).catch(() => [])
  return (Array.isArray(cast) ? cast : [])
    .filter((row: any) => row?.character?.image?.medium)
    .slice(0, 8)
    .map((row: any) => ({
      id: row.character.id,
      name: row.character.name || 'Character',
      src: row.character.image.original || row.character.image.medium,
    }))
}

async function rowsFromTitles(titles: string[]): Promise<IconRow[]> {
  const rows = await Promise.all(titles.map(async (title) => ({
    title,
    items: await tvmazeCharacters(title),
  })))
  return rows.filter((row) => row.items.length)
}

export async function loadProfileIcons(): Promise<IconShelf[]> {
  const [movies, shows, animeSeries, animeFilms] = await Promise.all([
    tmdb.getPopular('movie').catch(() => null),
    tmdb.getPopular('tv').catch(() => null),
    anilistRows('TV').catch(() => []),
    anilistRows('MOVIE').catch(() => []),
  ])
  const movieTitles = (movies?.results || []).slice(0, 6).map((row: any) => row.title).filter(Boolean)
  const showTitles = (shows?.results || []).slice(0, 6).map((row: any) => row.name).filter(Boolean)
  const [movieChars, showChars] = await Promise.all([
    rowsFromTitles(movieTitles),
    rowsFromTitles(showTitles),
  ])
  const shelves: IconShelf[] = [
    { label: 'TV Shows', rows: showChars },
    { label: 'Movies', rows: [...animeFilms, ...movieChars] },
    { label: 'Anime', rows: animeSeries },
  ]
  return shelves.filter((shelf) => shelf.rows.length)
}
