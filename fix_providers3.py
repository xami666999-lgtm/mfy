with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    content = f.read()

# Fix all three sections properly with clean ternary structure

# Providers section fix
old_providers = '''            >
              {loadingProviders ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ flexShrink: 0, width: 320, minWidth: 280 }}>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
                      <div className="w-12 h-12 rounded-xl bg-white/[0.05] animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-white/[0.05] animate-pulse rounded" />
                        <div className="h-3 w-1/2 bg-white/[0.03] animate-pulse rounded" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} style={{ flexShrink: 0, width: 120 }}>
                          <div className="aspect-[2/3] bg-white/[0.05] animate-pulse rounded-lg mb-2" />
                          <div className="h-3 w-full bg-white/[0.05] animate-pulse rounded" />
                          <div className="h-2 w-3/4 bg-white/[0.03] animate-pulse rounded mt-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : providers.length > 0 ? (
                providers.slice(0, 8).map((provider) => (
                <div key={provider.id} style={{ flexShrink: 0, width: 320, minWidth: 280 }}>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4" style={{ cursor: 'pointer' }}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF1493]/20 to-[#00E5FF]/20 border border-[#FF1493]/30 flex items-center justify-center flex-shrink-0">
                      <Film className="w-6 h-6 text-[#FF1493]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{provider.name}</p>
                      <p className="text-[11px] text-white/35">{(provider.movies?.length || 0) + (provider.tv?.length || 0)} titles</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: 8 }}>
                    {(provider.movies?.slice(0, 4) || []).map((item: any) => (
                      <button key={item.id} onClick={() => goDetail(item.id, 'movie')} style={{ flexShrink: 0, width: 120 }} className="text-left">
                        <img src={`${POSTER_URL}${item.poster_path}`} alt="" className="w-full aspect-[2/3] rounded-lg object-cover mb-2" loading="lazy" />
                        <p className="text-[11px] font-medium text-white truncate">{item.title}</p>
                        <p className="text-[10px] text-white/30">{item.release_date?.slice(0,4) || ''}</p>
                      </button>
                    ))}
                    {(provider.tv?.slice(0, 4) || []).map((item: any) => (
                      <button key={item.id} onClick={() => goDetail(item.id, 'tv')} style={{ flexShrink: 0, width: 120 }} className="text-left">
                        <img src={`${POSTER_URL}${item.poster_path}`} alt="" className="w-full aspect-[2/3] rounded-lg object-cover mb-2" loading="lazy" />
                        <p className="text-[11px] font-medium text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-white/30">{item.first_air_date?.slice(0,4) || ''}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {!loadingProviders && providers.length === 0 && tmdbApiKey && (
              <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>
                No provider data available
              </div>
            )}
            {!loadingProviders && providers.length === 0 && !tmdbApiKey && (
              <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>
                Add TMDB API key in Settings to load provider data
              </div>
            )}
          </section>
        )}'''

new_providers = '''            >
              {loadingProviders
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{ flexShrink: 0, width: 320, minWidth: 280 }}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.05] animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 bg-white/[0.05] animate-pulse rounded" />
                          <div className="h-3 w-1/2 bg-white/[0.03] animate-pulse rounded" />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <div key={j} style={{ flexShrink: 0, width: 120 }}>
                            <div className="aspect-[2/3] bg-white/[0.05] animate-pulse rounded-lg mb-2" />
                            <div className="h-3 w-full bg-white/[0.05] animate-pulse rounded" />
                            <div className="h-2 w-3/4 bg-white/[0.03] animate-pulse rounded mt-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                : providers.length > 0
                ? providers.slice(0, 8).map((provider) => (
                    <div key={provider.id} style={{ flexShrink: 0, width: 320, minWidth: 280 }}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4" style={{ cursor: 'pointer' }}>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF1493]/20 to-[#00E5FF]/20 border border-[#FF1493]/30 flex items-center justify-center flex-shrink-0">
                          <Film className="w-6 h-6 text-[#FF1493]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{provider.name}</p>
                          <p className="text-[11px] text-white/35">{(provider.movies?.length || 0) + (provider.tv?.length || 0)} titles</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: 8 }}>
                        {(provider.movies?.slice(0, 4) || []).map((item: any) => (
                          <button key={item.id} onClick={() => goDetail(item.id, 'movie')} style={{ flexShrink: 0, width: 120 }} className="text-left">
                            <img src={`${POSTER_URL}${item.poster_path}`} alt="" className="w-full aspect-[2/3] rounded-lg object-cover mb-2" loading="lazy" />
                            <p className="text-[11px] font-medium text-white truncate">{item.title}</p>
                            <p className="text-[10px] text-white/30">{item.release_date?.slice(0,4) || ''}</p>
                          </button>
                        ))}
                        {(provider.tv?.slice(0, 4) || []).map((item: any) => (
                          <button key={item.id} onClick={() => goDetail(item.id, 'tv')} style={{ flexShrink: 0, width: 120 }} className="text-left">
                            <img src={`${POSTER_URL}${item.poster_path}`} alt="" className="w-full aspect-[2/3] rounded-lg object-cover mb-2" loading="lazy" />
                            <p className="text-[11px] font-medium text-white truncate">{item.name}</p>
                            <p className="text-[10px] text-white/30">{item.first_air_date?.slice(0,4) || ''}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                : tmdbApiKey
                ? (
                    <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', width: '100%' }}>
                      No provider data available
                    </div>
                  )
                : (
                    <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', width: '100%' }}>
                      Add TMDB API key in Settings to load provider data
                    </div>
                  )}
            </div>
          </section>
        )}'''

content = content.replace(old_providers, new_providers)

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'w') as f:
    f.write(content)

print("Fixed providers section")