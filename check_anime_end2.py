with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()
for i in range(1060, 1130):
    if i < len(lines):
        print(f'{i+1}: {lines[i].rstrip()}')