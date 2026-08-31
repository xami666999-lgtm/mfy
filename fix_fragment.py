with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()

# The issue is the fragment opened at line 933 (index 932) is never closed
# The flex container div closes at line 1005 (index 1004)
# We need to add </> before that </div>

# Find the line with "            </div>" at index around 1004
# Insert </> before it

new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    # After the fragment content ends and before the flex container div closes
    if i == 1003 and '            </div>' in line:
        # Add the closing fragment tag before this div close
        new_lines.insert(-1, '              </>\n')

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'w') as f:
    f.writelines(new_lines)

print("Fixed fragment closing")