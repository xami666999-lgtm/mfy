with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    content = f.read()
lines = content.split('\n')
for i, line in enumerate(lines[250:350]):
    print(f'{i+251}: {line}')