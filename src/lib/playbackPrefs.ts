export type UpscaleMode = 'off' | 'sharpen' | 'anime'

export type PlaybackPrefs = {
  seekBack: number
  seekFwd: number
  subDelay: number
  audioLang: 'ja' | 'en' | 'orig'
  subHold: number
  upscale: UpscaleMode
}

const KEY = 'mfy-playback-prefs'

const DEFAULTS: PlaybackPrefs = {
  seekBack: 15,
  seekFwd: 15,
  subDelay: 0,
  audioLang: 'ja',
  subHold: 0,
  upscale: 'off',
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, n))
}

export function loadPlaybackPrefs(): PlaybackPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    const up = raw.upscale
    return {
      seekBack: clamp(Number(raw.seekBack ?? DEFAULTS.seekBack), 1, 120),
      seekFwd: clamp(Number(raw.seekFwd ?? DEFAULTS.seekFwd), 1, 120),
      subDelay: clamp(Number(raw.subDelay ?? DEFAULTS.subDelay), -15, 15),
      audioLang: raw.audioLang === 'en' || raw.audioLang === 'orig' ? raw.audioLang : 'ja',
      subHold: clamp(Number(raw.subHold ?? DEFAULTS.subHold), 0, 8),
      upscale: up === 'sharpen' || up === 'anime' ? up : 'off',
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function savePlaybackPrefs(patch: Partial<PlaybackPrefs>) {
  const next = { ...loadPlaybackPrefs(), ...patch }
  next.seekBack = clamp(next.seekBack, 1, 120)
  next.seekFwd = clamp(next.seekFwd, 1, 120)
  next.subDelay = clamp(Number(next.subDelay.toFixed(1)), -15, 15)
  next.subHold = clamp(Number(next.subHold.toFixed(1)), 0, 8)
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
  return next
}
