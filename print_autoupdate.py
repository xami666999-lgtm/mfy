with open('C:\\Users\\Noah\\Desktop\\mfy-app\\electron\\main.ts', 'r') as f:
    content = f.read()
lines = content.split('\n')
# Print lines 126-160
for i in range(125, min(160, len(lines))):
    print(f'Line {i+1}: {lines[i].strip()[:200]}')