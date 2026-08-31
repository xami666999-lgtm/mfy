with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()
print('Total lines:', len(lines))
# Check for the new sections
for i, line in enumerate(lines):
    if 'Providers Section' in line or 'Franchises Section' in line or 'Manga Section' in line or 'Airing Schedule Section' in line:
        print(f'Line {i+1}: {line.strip()}')