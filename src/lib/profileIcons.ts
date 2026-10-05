import { tmdb, PROFILE_URL } from '../api/tmdb'

export type ProfileIcon = { id: number; name: string; src: string }
export type IconRow = { title: string; items: ProfileIcon[] }
export type IconShelf = { label: string; rows: IconRow[] }

function facesFromCredits(detail: any): ProfileIcon[] {
  return (detail?.credits?.cast || [])
    .filter((c: any) => c.profile_path)
    .slice(0, 8)
    .map((c: any) => ({ id: c.id, name: c.name || c.character || 'Cast', src: `${PROFILE_URL}${c.profile_path}` }))
}

async function shelvesFromTmdb(label: string, kind: 'movie' | 'tv', data: any): Promise<IconShelf> {
  const top = (data?.results || []).slice(0, 4)
  const details = await Promise.all(top.map((row: any) => (
    kind === 'movie' ? tmdb.getMovieDetail(row.id) : tmdb.getTVDetail(row.id)
  ).catch(() => null)))
  const rows = details.map((detail: any, i: number) => ({
    title: detail?.title || detail?.name || top[i]?.title || top[i]?.name || label,
    items: facesFromCredits(detail),
  })).filter((row) => row.items.length)
  return { label, rows }
}

async function animeShelf(): Promise<IconShelf> {
  const query = `query {
    Page(perPage: 5) {
      media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
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
    body: JSON.stringify({ query }),
  })
  const json = await res.json()
  const media = json?.data?.Page?.media || []
  const rows: IconRow[] = media.map((show: any) => ({
    title: show?.title?.english || show?.title?.romaji || 'Anime',
    items: (show?.characters?.nodes || [])
      .filter((c: any) => c?.image?.large)
      .map((c: any) => ({ id: c.id, name: c?.name?.full || 'Character', src: c.image.large })),
  })).filter((row: IconRow) => row.items.length)
  return { label: 'Anime', rows }
}

export async function loadProfileIcons(): Promise<IconShelf[]> {
  const [movies, shows, anime] = await Promise.all([
    tmdb.getPopular('movie').then((data) => shelvesFromTmdb('Movies', 'movie', data)).catch(() => ({ label: 'Movies', rows: [] })),
    tmdb.getPopular('tv').then((data) => shelvesFromTmdb('TV Shows', 'tv', data)).catch(() => ({ label: 'TV Shows', rows: [] })),
    animeShelf().catch(() => ({ label: 'Anime', rows: [] })),
  ])
  return [movies, shows, anime].filter((shelf) => shelf.rows.length)
}
