with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()

# Find the line with the fragment closing issue
# The issue is around line 1005 where </div> appears but the fragment isn't closed

# Let's find the exact lines and fix them
for i, line in enumerate(lines):
    if '            </div>' in line and i > 990 and i < 1020:
        print(f'Line {i+1}: {repr(line)}')
    if '            )}' in line and i > 990 and i < 1020:
        print(f'Line {i+1}: {repr(line)}')
    if '          </section>' in line and i > 990 and i < 1020:
        print(f'Line {i+1}: {repr(line)}')
    if '        )}' in line and i > 990 and i < 1020:
        print(f'Line {i+1}: {repr(line)}')