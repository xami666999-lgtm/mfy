with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()

# Find the airing section in the JSX return
# It starts with "        {/* Airing Schedule Section */}"
# and ends before "      </div>\n    </div>\n  )"

start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if '        {/* Airing Schedule Section */}' in line and i > 1000:
        start_idx = i
        print(f"Found start at line {i+1}")
        break

if start_idx is not None:
    # Find the end - look for the closing of the section
    brace_count = 0
    in_section = False
    for i in range(start_idx, len(lines)):
        line = lines[i]
        if '        {/* Airing Schedule Section */}' in line:
            in_section = True
        if in_section:
            # Count opening/closing braces for the outer section
            if '          </section>' in line:
                # Check if this is the right one
                end_idx = i
                print(f"Found end at line {i+1}")
                break
    
    if end_idx is not None:
        print(f"Replacing lines {start_idx+1} to {end_idx+1}")
        # Replace with new simpler version
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
    else:
        print("Could not find end")
else:
    print("Could not find start")