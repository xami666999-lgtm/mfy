with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()

# The fragment opened at line 933 (index 932) needs to close before line 1005 (index 1004)
# Line 1005 is "            </div>" which closes the flex container
# We need to insert "</>" before that line

# Find the exact line index for "            </div>" at the flex container level
# It should be at index 1004 (line 1005)
# But after the fix_fragment.py ran, the indices may have shifted

# Let's find the pattern: after "              )}" (closes the TV shows conditional)
# Then "            </div>" (closes flex container)

inserted = False
for i, line in enumerate(lines):
    if i > 1000 and '            </div>' in line and not inserted:
        # Check if previous non-empty line was "              )}" 
        # This indicates we're at the flex container close
        prev_idx = i - 1
        while prev_idx >= 0 and lines[prev_idx].strip() == '':
            prev_idx -= 1
        if prev_idx >= 0 and '              )}' in lines[prev_idx]:
            # Insert </> before this </div>
            lines.insert(i, '              </>\n')
            inserted = True
            print(f"Inserted </> before line {i+1}")
            break

if not inserted:
    print("Could not find insertion point")
else:
    with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'w') as f:
        f.writelines(lines)
    print("Fixed!")