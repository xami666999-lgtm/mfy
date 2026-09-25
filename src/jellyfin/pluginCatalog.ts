export type CatalogItem = {
  id: string
  name: string
  url: string
  slot: string
  description: string
  kind: 'jellyfin' | 'mfy' | 'standalone'
  platform: 'desktop' | 'ios' | 'both'
  manifest?: string
}

const KEY = 'mfy-jf-catalog'

export const BUILTIN: CatalogItem[] = [
  {
    id: 'sleekfin',
    name: 'SleekFin',
    url: 'https://github.com/varunaditya-plus/SleekFin',
    manifest: 'https://raw.githubusercontent.com/varunaditya-plus/SleekFin/main/manifest.json',
    slot: 'Themes',
    description: 'Jellyfin Web reskin. In MFY it also unlocks the SleekFin theme button next to Netflix / Apple TV / Max.',
    kind: 'jellyfin',
    platform: 'desktop',
  },
  {
    id: 'file-transform',
    name: 'File Transformation',
    url: 'https://github.com/IAmParadox27/jellyfin-plugin-file-transformation',
    manifest: 'https://www.iamparadox.dev/jellyfin/plugins/manifest.json',
    slot: 'Themes',
    description: 'Required so SleekFin can restyle Jellyfin Web. Install this first.',
    kind: 'jellyfin',
    platform: 'desktop',
  },
  {
    id: 'subsync',
    name: 'SubSync Starter',
    url: 'https://jellywatch.app/hub/subsync-starter',
    slot: 'Player → Subtitles',
    description: 'Adds Resync on every player subtitle menu. Click it to auto-shift subs.',
    kind: 'mfy',
    platform: 'desktop',
  },
  {
    id: 'badges',
    name: 'Achievement Badges',
    url: 'https://github.com/ZL154/AchievementBadges_for_Jellyfin',
    slot: 'Background',
    description: 'Watch milestones as MFY badges, not Jellyfin popups.',
    kind: 'jellyfin',
    platform: 'desktop',
  },
  {
    id: 'inplayer',
    name: 'In-player episode preview',
    url: 'https://github.com/Namo2/InPlayerEpisodePreview',
    slot: 'Player',
    description: 'Next-episode stills while you watch a series.',
    kind: 'jellyfin',
    platform: 'desktop',
  },
  {
    id: 'media-preview',
    name: 'Media Preview',
    url: 'https://github.com/spkesDE/jellyfin-media-preview-plugin',
    slot: 'Home trailers',
    description: 'Replaces the trailer hover with a media preview clip.',
    kind: 'jellyfin',
    platform: 'desktop',
  },
  {
    id: 'startrack',
    name: 'StarTrack',
    url: 'https://github.com/ZL154/jellyfin-plugin-startrack',
    slot: 'Background',
    description: 'Fallback ratings sync when Letterboxd is not connected.',
    kind: 'jellyfin',
    platform: 'desktop',
  },
  {
    id: 'getavatar',
    name: 'GetAvatar',
    url: 'https://github.com/cedev-1/jellyfin-plugin-GetAvatar',
    slot: 'Who’s watching',
    description: 'Avatar pack used when you create a profile.',
    kind: 'jellyfin',
    platform: 'both',
  },
  {
    id: 'intro-skipper',
    name: 'Intro Skipper',
    url: 'https://github.com/intro-skipper/intro-skipper',
    manifest: 'https://intro-skipper.org/manifest.json',
    slot: 'Every player',
    description: 'Skip intro on shows/anime. MFY already has a Skip intro button via IntroDB; this plugin feeds local Jellyfin analysis too.',
    kind: 'jellyfin',
    platform: 'desktop',
  },
  {
    id: 'lb-sync',
    name: 'Letterboxd Sync',
    url: 'https://github.com/Gizmo091/jellyfin-plugin-letterboxd-sync',
    slot: 'Onboarding',
    description: 'After Simkl login, force-install then log into Letterboxd so ratings sync.',
    kind: 'jellyfin',
    platform: 'desktop',
  },
  {
    id: 'animethemes',
    name: 'AnimeThemes',
    url: 'https://github.com/EusthEnoptEron/jellyfin-plugin-animethemes',
    slot: 'Themes → Anime',
    description: 'Opening / ending themes on anime titles.',
    kind: 'jellyfin',
    platform: 'desktop',
  },
  {
    id: 'hikka',
    name: 'Hikka',
    url: 'https://github.com/HotMasya/jellyfin-plugin-hikka',
    slot: 'Manga',
    description: 'Manga metadata. MFY manga page stays the reader; this fills missing titles.',
    kind: 'jellyfin',
    platform: 'desktop',
  },
  {
    id: 'applemusic',
    name: 'Apple Music',
    url: 'https://github.com/lyarenei/jellyfin-plugin-applemusic',
    slot: 'Music',
    description: 'Apple Music metadata for the Music section (section still WIP).',
    kind: 'jellyfin',
    platform: 'desktop',
  },
  {
    id: 'dedupe-cw',
    name: 'Dedupe Continue Watching',
    url: 'https://github.com/SloMR/jellyfin-plugin-dedupe-continue-watching',
    slot: 'Home',
    description: 'Stops the same title showing twice on Continue Watching.',
    kind: 'jellyfin',
    platform: 'desktop',
  },
  {
    id: 'rpc',
    name: 'Jellyfin RPC',
    url: 'https://github.com/kennethsible/jellyfin-rpc',
    slot: 'Background',
    description: 'Discord rich presence, labeled as MFY instead of Jellyfin.',
    kind: 'standalone',
    platform: 'desktop',
  },
  {
    id: 'discord-auth',
    name: 'Discord login',
    url: 'https://github.com/EvanTrow/Jellyfin-Discord-Auth',
    slot: 'Onboarding',
    description: 'Not installed as a Jellyfin plugin. Discord is an optional first-run login on MFY.',
    kind: 'mfy',
    platform: 'both',
  },
  {
    id: 'oscars',
    name: 'Oscars',
    url: 'https://github.com/FizzyMUC/jellyfin-oscars-plugin',
    slot: 'Movies / Shows',
    description: 'Award badges on posters after install.',
    kind: 'jellyfin',
    platform: 'desktop',
  },
  {
    id: 'playlifin',
    name: 'Playlifin',
    url: 'https://gitlab.com/Krafting/playlifin-gtk',
    slot: 'Music',
    description: 'GTK app that turns a YouTube playlist into a music library. Not a Jellyfin zip.',
    kind: 'standalone',
    platform: 'desktop',
  },
  {
    id: 'multiscrobbler',
    name: 'Multi-scrobbler',
    url: 'https://github.com/FoxxMD/multi-scrobbler',
    slot: 'Music',
    description: 'Standalone scrobbler for music listens.',
    kind: 'standalone',
    platform: 'desktop',
  },
  {
    id: 'explo',
    name: 'Explo',
    url: 'https://github.com/LumePart/Explo',
    slot: 'Music',
    description: 'Music discovery helper. Standalone, not a JF plugin zip.',
    kind: 'standalone',
    platform: 'desktop',
  },
  {
    id: 'rewind',
    name: 'Jellyfin Rewind',
    url: 'https://github.com/Chaphasilor/jellyfin-rewind',
    slot: 'Settings → Recap',
    description: 'Monthly hours-watched recap inside the app.',
    kind: 'standalone',
    platform: 'desktop',
  },
]

export function loadCatalog(): CatalogItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    const extra: CatalogItem[] = raw ? JSON.parse(raw) : []
    const ids = new Set(BUILTIN.map((x) => x.url.toLowerCase()))
    return [...BUILTIN, ...extra.filter((x) => x?.url && !ids.has(x.url.toLowerCase()))]
  } catch {
    return [...BUILTIN]
  }
}

export function saveCatalog(list: CatalogItem[]) {
  const extra = list.filter((x) => !BUILTIN.some((b) => b.url === x.url))
  try { localStorage.setItem(KEY, JSON.stringify(extra)) } catch {}
  return loadCatalog()
}

export function addLinks(text: string, existing: CatalogItem[]) {
  const rows = String(text || '').split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
  const extra: CatalogItem[] = []
  for (const row of rows) {
    const url = row.split(/\s+/).find((p) => /^https?:\/\//i.test(p)) || row
    extra.push({
      id: url,
      name: basename(url),
      url,
      slot: 'Custom',
      description: 'Pasted link',
      kind: /\.zip($|\?)/i.test(url) ? 'jellyfin' : 'standalone',
      platform: 'desktop',
    })
  }
  return saveCatalog([...existing, ...extra])
}

function basename(url: string) {
  try { return decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || 'plugin') }
  catch { return 'plugin' }
}
