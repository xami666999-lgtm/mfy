with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    content = f.read()

# Add airingContent variable before the return statement
# Find the line with "const movieRow = useMemo"
old = '''  const movieRow = useMemo(() => trending.filter((x) => x.media_type !== 'tv'), [trending])

  if (loading) {'''

new = '''  const movieRow = useMemo(() => trending.filter((x) => x.media_type !== 'tv'), [trending])

  // Airing schedule content - computed outside JSX to avoid ternary parsing issues
  const airingContent = (() => {
    if (loadingAiring) {
      return (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: 16 }}>
          <div style={{ flexShrink: 0, width: 320, minWidth: 280 }}>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-white/[0.05] animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-white/[0.03] animate-pulse rounded" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} style={{ flexShrink: 0, width: 140 }}>
                  <div className="aspect-[2/3] bg-white/[0.05] animate-pulse rounded-lg mb-2" />
                  <div className="h-3 w-full bg-white/[0.05] animate-pulse rounded" />
                  <div className="h-2 w-3/4 bg-white/[0.03] animate-pulse rounded mt-1" />
                </div>
              ))}
            </div>
          </div>
          <div style={{ flexShrink: 0, width: 320, minWidth: 280 }}>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-white/[0.05] animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-white/[0.03] animate-pulse rounded" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} style={{ flexShrink: 0, width: 140 }}>
                  <div className="aspect-[2/3] bg-white/[0.05] animate-pulse rounded-lg mb-2" />
                  <div className="h-3 w-full bg-white/[0.05] animate-pulse rounded" />
                  <div className="h-2 w-3/4 bg-white/[0.03] animate-pulse rounded mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (airingAnime.length === 0 && airingTVShows.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', width: '100%' }}>
          No airing schedule data available
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: 16 }}>
        {airingAnime.length > 0 && (
          <div style={{ flexShrink: 0, width: 320, minWidth: 280 }}>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4" style={{ cursor: 'pointer' }}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF1493]/20 to-[#00E5FF]/20 border border-[#FF1493]/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-[#FF1493]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Airing Anime</p>
                <p className="text-[11px] text-white/35">{airingAnime.length} airing now</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: 8 }}>
              {airingAnime.slice(0, 8).map((anime) => (
                <div key={anime.id} style={{ flexShrink: 0, width: 140 }} className="text-left">
                  <div style={{ position: 'relative', width: '100%', paddingTop: '150%' }}>
                    {anime.coverImage ? (
                      <img src={anime.coverImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} loading="lazy" />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={24} color="rgba(255,255,255,0.3)" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-white text-xs truncate">{anime.titleEnglish || anime.titleRomaji || anime.title}</p>
                    <p className="text-white/40 text-[10px]">
                      Ep {anime.nextAiringEpisode || '?'} \u00b7 {anime.timeUntilAiring ? `${Math.round(anime.timeUntilAiring / 60)}m` : 'Soon'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {airingTVShows.length > 0 && (
          <div style={{ flexShrink: 0, width: 320, minWidth: 280 }}>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4" style={{ cursor: 'pointer' }}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF1493]/20 to-[#00E5FF]/20 border border-[#FF1493]/30 flex items-center justify-center flex-shrink-0">
                <Tv className="w-6 h-6 text-[#FF1493]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Airing TV Shows</p>
                <p className="text-[11px] text-white/35">{airingTVShows.length} airing now</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: 8 }}>
              {airingTVShows.slice(0, 4).map((show) => (
                <div key={show.id} style={{ flexShrink: 0, width: 140 }} className="text-left">
                  <div style={{ position: 'relative', width: '100%', paddingTop: '150%' }}>
                    {show.posterPath ? (
                      <img src={`${POSTER_URL}${show.posterPath}`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} loading="lazy" />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Tv size={24} color="rgba(255,255,255,0.3)" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-white text-xs truncate">{show.name}</p>
                    <p className="text-white/40 text-[10px]">
                      Ep {show.nextEpisodeToAir?.episodeNumber || '?'} \u00b7 {show.nextEpisodeToAir?.airDate ? new Date(show.nextEpisodeToAir.airDate).toLocaleDateString() : 'Soon'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  })()

  if (loading) {'''

content = content.replace(old, new)

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'w') as f:
    f.write(content)

print("Added airingContent variable")