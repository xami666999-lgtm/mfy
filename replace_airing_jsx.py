with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    content = f.read()

# Replace the airing section JSX in the return with just {airingContent}
old_airing_jsx = '''        {/* Airing Schedule Section */}
        {(airingAnime.length > 0 || airingTVShows.length > 0 || loadingAiring) && (
          <section style={{ marginTop: 16 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 16 
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
                Airing Schedule
              </h2>
              {(airingAnime.length > 0 || airingTVShows.length > 0) && (
                <button 
                  style={{ 
                    color: 'rgba(255,255,255,0.5)', 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '0.875rem', 
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  onClick={() => setCurrentPage('airing')}
                >
                  View All
                  <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </button>
              )}
            </div>
            {airingContent}
            {!loadingAiring && airingAnime.length === 0 && airingTVShows.length === 0 && (
              <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', width: '100%' }}>
                No airing schedule data available
              </div>
            )}
          </section>
        )}'''

new_airing_jsx = '''        {/* Airing Schedule Section */}
        {(airingAnime.length > 0 || airingTVShows.length > 0 || loadingAiring) && (
          <section style={{ marginTop: 16 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 16 
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
                Airing Schedule
              </h2>
              {(airingAnime.length > 0 || airingTVShows.length > 0) && (
                <button 
                  style={{ 
                    color: 'rgba(255,255,255,0.5)', 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '0.875rem', 
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  onClick={() => setCurrentPage('airing')}
                >
                  View All
                  <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </button>
              )}
            </div>
            {airingContent}
          </section>
        )}'''

content = content.replace(old_airing_jsx, new_airing_jsx)

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'w') as f:
    f.write(content)

print("Replaced airing section JSX")