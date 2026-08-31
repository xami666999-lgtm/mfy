with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'Airing Schedule' in line and i > 1000:
        print(f'{i+1}: {repr(line)}')