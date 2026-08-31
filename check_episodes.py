with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    content = f.read()
lines = content.split('\n')
for i, line in enumerate(lines):
    lower = line.lower()
    if 'episode' in lower and ('onClick' in line or 'disabled' in line or 'title=' in line):
        print(f'Line {i+1}: {line.strip()[:150]}')