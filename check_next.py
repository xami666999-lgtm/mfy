with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    content = f.read()
lines = content.split('\n')
for i, line in enumerate(lines):
    lower = line.lower()
    if 'next' in lower or 'episode' in lower or 'previous' in lower:
        print(f'Line {i+1}: {line.strip()}')