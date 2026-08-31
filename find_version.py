with open('C:\\Users\\Noah\\Desktop\\mfy-app\\electron\\main.ts', 'r') as f:
    content = f.read()
lines = content.split('\n')
for i, line in enumerate(lines):
    lower = line.lower()
    if any(kw in lower for kw in ['version', 'v1.', 'release', 'setup', 'setupcomplete']):
        print(f'Line {i+1}: {line.strip()[:150]}')