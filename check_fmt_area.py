with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    lines = f.readlines()

# Check around line 229
for i in range(220, 240):
    if i < len(lines):
        print(f'{i+1}: {repr(lines[i])}')