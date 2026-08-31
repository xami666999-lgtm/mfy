with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()

# The airing section in JSX return starts at line 987 (comment)
# and ends at line 1144 (the `        )}` that closes the conditional)
# Let me verify
print(f"Line 987: {repr(lines[986])}")
print(f"Line 1144: {repr(lines[1143])}")

# Replace from line 987 to line 1144
start_idx = 986
end_idx = 1143

new_lines = lines[:start_idx+1]  # Keep the comment line
new_lines.append('        {(airingAnime.length > 0 || airingTVShows.length > 0 || loadingAiring) && (\n')
new_lines.append('          <section style={{ marginTop: 16 }}>\n')
new_lines.append('            <div style={{ \n')
new_lines.append('              display: \'flex\', \n')
new_lines.append('              justifyContent: \'space-between\', \n')
new_lines.append('              alignItems: \'center\', \n')
new_lines.append('              marginBottom: 16 \n')
new_lines.append('            }}>\n')
new_lines.append('              <h2 style={{ fontSize: \'1.25rem\', fontWeight: \'bold\', color: \'white\', margin: 0 }}>\n')
new_lines.append('                Airing Schedule\n')
new_lines.append('              </h2>\n')
new_lines.append('              {(airingAnime.length > 0 || airingTVShows.length > 0) && (\n')
new_lines.append('                <button \n')
new_lines.append('                  style={{ \n')
new_lines.append('                    color: \'rgba(255,255,255,0.5)\', \n')
new_lines.append('                    background: \'none\', \n')
new_lines.append('                    border: \'none\', \n')
new_lines.append('                    fontSize: \'0.875rem\', \n')
new_lines.append('                    cursor: \'pointer\',\n')
new_lines.append('                    padding: 0,\n')
new_lines.append('                    display: \'flex\',\n')
new_lines.append('                    alignItems: \'center\',\n')
new_lines.append('                    gap: 4\n')
new_lines.append('                  }}\n')
new_lines.append('                  onClick={() => setCurrentPage(\'airing\')}\n')
new_lines.append('                >\n')
new_lines.append('                  View All\n')
new_lines.append('                  <ArrowRight size={14} style={{ display: \'inline\', verticalAlign: \'middle\' }} />\n')
new_lines.append('                </button>\n')
new_lines.append('              )}\n')
new_lines.append('            </div>\n')
new_lines.append('            {airingContent}\n')
new_lines.append('          </section>\n')
new_lines.append('        )}\n')
new_lines.extend(lines[end_idx+1:])

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'w') as f:
    f.writelines(new_lines)

print("Replaced airing section in JSX return")