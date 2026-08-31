with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\api\\tmdb.ts', 'r') as f:
    lines = f.readlines()
for i in range(0, 150):
    print(f'{i+1}: {lines[i].rstrip()}')