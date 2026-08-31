with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    content = f.read()

# Fix manga section
old_manga = '''            >
              {loadingManga ? (
                Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} style={{ flexShrink: 0, width: POSTER_W }}>
                    <div className="aspect-[2/3] bg-white/[0.05] animate-pulse rounded-lg mb-2" />
                    <div className="h-4 w-full bg-white/[0.05] animate-pulse rounded" />
                    <div className="h-3 w-3/4 bg-white/[0.03] animate-pulse rounded mt-1" />
                  </div>
                ))
              ) : manga.length > 0 ? (
                manga.slice(0, 16).map((item) => (
                <div
                  key={item.id}
                  className="poster-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    // Open manga detail page
                    setCurrentPage('manga-detail')
                  }}
                  style={{ flexShrink: 0, width: POSTER_W }}
                >
                  {item.coverImage ? (
                    <img 
                      src={item.coverImage} 
                      alt={item.title} 
                      loading="lazy" 
                      style={{ width: '100%', height: POSTER_H, objectFit: 'cover' }}
                      onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none'; el.parentElement?.classList.add('has-fallback') }}
                    />
                  ) : (
                    <div className="poster-fallback">{item.title}</div>
                  )}
                  <div className="poster-play"><Play size={18} fill="#fff" /></div>
                  <div className="poster-overlay">
                    <div className="poster-meta-title">{item.title}</div>
                    <div className="poster-meta-sub">
                      <Stars value={item.averageScore ? item.averageScore / 10 : 0} size={12} />
                      <span className="ml-1 text-[10px] text-white/60">{item.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {!loadingManga && manga.length === 0 && (
              <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>
                No manga data available
              </div>
            )}
          </section>
        )}'''

new_manga = '''            >
              {loadingManga
                ? Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} style={{ flexShrink: 0, width: POSTER_W }}>
                      <div className="aspect-[2/3] bg-white/[0.05] animate-pulse rounded-lg mb-2" />
                      <div className="h-4 w-full bg-white/[0.05] animate-pulse rounded" />
                      <div className="h-3 w-3/4 bg-white/[0.03] animate-pulse rounded mt-1" />
                    </div>
                  ))
                : manga.length > 0
                ? manga.slice(0, 16).map((item) => (
                    <div
                      key={item.id}
                      className="poster-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        // Open manga detail page
                        setCurrentPage('manga-detail')
                      }}
                      style={{ flexShrink: 0, width: POSTER_W }}
                    >
                      {item.coverImage ? (
                        <img 
                          src={item.coverImage} 
                          alt={item.title} 
                          loading="lazy" 
                          style={{ width: '100%', height: POSTER_H, objectFit: 'cover' }}
                          onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none'; el.parentElement?.classList.add('has-fallback') }}
                        />
                      ) : (
                        <div className="poster-fallback">{item.title}</div>
                      )}
                      <div className="poster-play"><Play size={18} fill="#fff" /></div>
                      <div className="poster-overlay">
                        <div className="poster-meta-title">{item.title}</div>
                        <div className="poster-meta-sub">
                          <Stars value={item.averageScore ? item.averageScore / 10 : 0} size={12} />
                          <span className="ml-1 text-[10px] text-white/60">{item.status}</span>
                        </div>
                      </div>
                    </div>
                  ))
                : (
                    <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', width: '100%' }}>
                      No manga data available
                    </div>
                  )}
            </div>
          </section>
        )}'''

content = content.replace(old_manga, new_manga)

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'w') as f:
    f.write(content)

print("Fixed manga section")