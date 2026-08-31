with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()

# The issue might be with the ternary structure. Let's simplify by 
# extracting the airing content into a variable before the return statement

# Find the start of the airing section in the return
# and replace the entire complex ternary with a simpler approach

# First, let's see what lines the airing section spans
for i, line in enumerate(lines):
    if 'Airing Schedule Section' in line:
        print(f"Start at line {i+1}: {line.strip()}")
    if i > 1010 and 'function ProviderGrid' in line:
        print(f"End before line {i+1}: {line.strip()}")
        break