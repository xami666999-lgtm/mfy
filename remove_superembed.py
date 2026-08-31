with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\api\\vidy.ts', 'r') as f:
    content = f.read()

# Remove SuperEmbed references
content = content.replace("const SUPEREMBED_BASE = 'https://superembed.stream'\n", '')

# Remove superembedUrl function
old_superembed = """\
/** Build a SuperEmbed embed URL for a movie / TV show (TMDB ids) */
export function superembedUrl(type: 'movie' | 'tv', tmdbId: number | string, season?: number, episode?: number): string {
  if (type === 'movie') return `\${SUPEREMBED_BASE}/movie/\${tmdbId}`
  const s = season ?? 1
  const e = episode ?? 1
  return `\${SUPEREMBED_BASE}/tv/\${tmdbId}/\${s}/\${e}`
}

"""
content = content.replace(old_superembed, '')

# Remove superembed from getPlayerUrl
old_superembed_player = """\
  if (source === 'superembed') {
    if (type === 'movie') return `\${SUPEREMBED_BASE}/movie/\${tmdbId}`
    const s = season ?? 1
    const e = episode ?? 1
    return `\${SUPEREMBED_BASE}/tv/\${tmdbId}/\${s}/\${e}`
  }
"""
content = content.replace(old_superembed_player, '')

# Remove superembed from getFallbackSources
content = content.replace(
    "    { source: 'superembed', url: `\${SUPEREMBED_BASE}/\${type === 'movie' ? 'movie' : 'tv'}/\${tmdbId}\${type === 'tv' ? `\${season ?? 1}/\${episode ?? 1}` : ''}` },",
    ''
)

# Remove superembed from PlayerSource type
content = content.replace("export type PlayerSource = 'vidy' | 'vidking' | 'superembed'", "export type PlayerSource = 'vidy' | 'vidking'")

# Remove superembed from isPlayerEmbed
content = content.replace("url.includes('superembed.stream') || ", '')

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\api\\vidy.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')