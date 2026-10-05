import { PosterStatus } from './PosterTile'
import { watchFace } from '../lib/watchProgress'
import { useStore } from '../store'

const GENRE: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi', 10766: 'Soap', 10767: 'Talk', 10768: 'War',
}

export function posterYear(item: any) {
  return String(item.release_date || item.first_air_date || item.startDate?.year || '').slice(0, 4)
}

export function scoreOf(item: any): number {
  const v = Number(item.vote_average)
  if (Number.isFinite(v) && v > 0) return v > 10 ? v / 10 : v
  const s = Number(item.score)
  if (Number.isFinite(s) && s > 0) return s > 10 ? s / 10 : s
  const a = Number(item.averageScore ?? item.meanScore)
  if (Number.isFinite(a) && a > 0) return a > 10 ? a / 10 : a
  return 0
}

export function genreOf(item: any): string {
  if (Array.isArray(item?.genres) && item.genres.length) {
    const g = item.genres[0]
    if (typeof g === 'string') return g
    if (g?.name) return String(g.name)
  }
  if (typeof item?.genre === 'string') return item.genre
  const id = Number(item?.genre_ids?.[0])
  return GENRE[id] || ''
}

export function PosterMarks({ item, rank }: { item: any; rank?: number }) {
  const hist = useStore((s) => s.watchHistory)
  const id = item.id ?? item.mediaId
  const face = watchFace(hist, id, item)
  return (
    <PosterStatus
      genre={genreOf(item)}
      score={scoreOf(item)}
      state={face.state}
      pct={face.pct}
      label={face.label}
      pending={face.pending}
      rank={rank}
    />
  )
}
