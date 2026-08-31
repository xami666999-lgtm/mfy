with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()

# The issue: fragment close at line 1005 is AFTER ternary close at line 1004
# Need to move </> to be BEFORE the )} at line 1004

# Find line 1004 (index 1003) which has "              )}"
# And line 1005 (index 1004) which has "              </>"
# Swap them

if '              )}' in lines[1003] and '              </>' in lines[1004]:
    # Swap lines 1003 and 1004
    lines[1003], lines[1004] = lines[1004], lines[1003]
    print("Swapped fragment close with ternary close")
    with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'w') as f:
        f.writelines(lines)
    print("Fixed!")
else:
    print(f"Line 1003: {repr(lines[1003])}")
    print(f"Line 1004: {repr(lines[1004])}")