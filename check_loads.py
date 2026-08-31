with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()

# Check load functions are called
for i, line in enumerate(lines):
    if 'loadProviders' in line or 'loadFranchises' in line or 'loadManga' in line or 'loadAiringSchedule' in line:
        print(f'Line {i+1}: {line.strip()}')