with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\api\\vidy.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # Skip SUPEREMBED_BASE constant
    if 'const SUPEREMBED_BASE =' in line:
        continue
    # Skip superembedUrl function
    if 'export function superembedUrl' in line:
        # Skip until closing brace
        continue
    if 'export function superembedUrl' in line:
        # We'll handle this by skipping lines until we see the closing brace
        pass
    if 'export function superembedUrl' in line:
        # Start skipping
        pass
    # We'll handle function skipping differently
    
    # Skip lines with SUPEREMBED_BASE
    if 'SUPEREMBED_BASE' in line:
        continue
    
    # Remove superembed from getPlayerUrl
    if "if (source === 'superembed')" in line:
        # Skip until matching closing brace
        pass
    if "if (source === 'superembed')" in line:
        # Skip until we see a closing brace at the right indentation
        pass
    
    # Remove superembed from getFallbackSources
    if "source: 'superembed'" in line:
        continue
    
    # Remove superembed from PlayerSource type
    if "export type PlayerSource = 'vidy' | 'vidking' | 'superembed'" in line:
        line = line.replace("export type PlayerSource = 'vidy' | 'vidking' | 'superembed'", "export type PlayerSource = 'vidy' | 'vidking'")
    
    # Remove superembed from isPlayerEmbed
    if "url.includes('superembed.stream')" in line:
        line = line.replace("url.includes('superembed.stream') || ", '')
    
    new_lines.append(line)

# Actually, let's just rebuild the file properly
# Read the original file again
with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\api\\vidy.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove SUPEREMBED_BASE constant
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
old_superembed_player = """  if (source === 'superembed') {
    if (type === 'movie') return `\${SUPEREMBED_BASE}/movie/\${tmdbId}`
    const s = season ?? 1
    const e = episode ?? 1
    return `\${SUPEREMBED_BASE}/tv/\${tmdbId}/\${s}/\${e}`
  }
"""
content = content.replace(old_superembed_player, '')

# Remove superembed from getFallbackSources
content = content.replace("""    { source: 'superembed', url: `\${SUPEREMBED_BASE}/\${type === 'movie' ? 'movie' : 'tv'}/\${tmdbId}\${type === 'tv' ? `\${season ?? 1}/\${episode ?? 1}\`` : ''}` },""", '')

# Remove superembed from PlayerSource type
content = content.replace("export type PlayerSource = 'vidy' | 'vidking' | 'superembed'", "export type PlayerSource = 'vidy' | 'vidking'")

# Remove superembed from isPlayerEmbed
content = content.replace("url.includes('superembed.stream') || ", '')

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\api\\vidy.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')