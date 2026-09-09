/** Free / self-hosted scrobble targets. Each needs the user's own keys. */

async function post(url: string, body: any, headers: Record<string, string> = {}) {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  try {
    if (api?.fetchJson) {
      await api.fetchJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), timeoutMs: 10000 })
      return
    }
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
  } catch {}
}

async function put(url: string, body: any, headers: Record<string, string> = {}) {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  try {
    if (api?.fetchJson) {
      await api.fetchJson(url, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), timeoutMs: 10000 })
      return
    }
    await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
  } catch {}
}

function ls(k: string) {
  try { return String(localStorage.getItem(k) || '').trim() } catch { return '' }
}

function pct(p: number, d: number) {
  return Math.max(1, Math.min(99, (Math.max(0, p) / Math.max(d, 1)) * 100))
}

export async function scrobbleAll(media: any, progressSec: number, durationSec: number, done = false) {
  const tmdb = Number(media?.id || 0)
  const imdb = String(media?.imdb_id || media?.imdb || '')
  const title = String(media?.title || media?.name || '')
  const isMovie = media?.type === 'movie' || media?.mediaType === 'movie'
  const season = Number(media?.season || 1)
  const episode = Number(media?.episode || 1)
  const progress = +pct(progressSec, durationSec).toFixed(2)

  const simklId = ls('mfy-simkl-client')
  const simklTok = ls('mfy-simkl-token')
  if (simklId && simklTok) {
    const body: any = { progress }
    if (isMovie) body.movie = { title, ids: { tmdb, ...(imdb ? { imdb } : {}) } }
    else body.show = { title, ids: { tmdb, ...(imdb ? { imdb } : {}) } }, body.episode = { season, number: episode }
    const path = done || progress >= 80 ? 'stop' : 'start'
    await post(`https://api.simkl.com/scrobble/${path}?client_id=${encodeURIComponent(simklId)}&app-name=mfy&app-version=1.6`, body, {
      Authorization: `Bearer ${simklTok}`,
      'User-Agent': 'MFY/1.6',
      'simkl-api-key': simklId,
    })
  }

  const mt = ls('mfy-mediatracker').replace(/\/+$/, '')
  const mtTok = ls('mfy-mediatracker-token')
  if (mt && mtTok) {
    await put(`${mt}/api/progress/by-external-id?token=${encodeURIComponent(mtTok)}`, {
      mediaType: isMovie ? 'movie' : 'tv',
      id: { tmdbId: tmdb, ...(imdb ? { imdbId: imdb } : {}) },
      seasonNumber: isMovie ? undefined : season,
      episodeNumber: isMovie ? undefined : episode,
      action: done ? 'paused' : 'playing',
      progress: Math.min(1, progress / 100),
      duration: durationSec * 1000,
    })
  }

  const fl = ls('mfy-floppy').replace(/\/+$/, '')
  const flTok = ls('mfy-floppy-token')
  if (fl && flTok) {
    await post(`${fl}/api/v1/scrobble`, {
      media_type: isMovie ? 'movie' : 'tv',
      tmdb_id: tmdb,
      imdb_id: imdb || undefined,
      season: isMovie ? undefined : season,
      episode: isMovie ? undefined : episode,
      progress,
      completed: done || progress >= 80,
    }, { Authorization: `Bearer ${flTok}` })
  }

  if (done && !isMovie && tmdb) {
    try {
      const { serializdApi } = await import('./serializd')
      await serializdApi.logEpisodes(tmdb, season, [episode]).catch(() => {})
    } catch {}
  }
}
