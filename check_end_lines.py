with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    lines = f.readlines()
for i in range(410, len(lines)):
    print(f'{i+1}: {repr(lines[i])}')