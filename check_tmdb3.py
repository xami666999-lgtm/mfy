with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\api\\tmdb.ts', 'r') as f:
    lines = f.readlines()
for i in range(190, 250):
    if i < len(lines):
        print(f'{i+1}: {lines[i].rstrip()}')