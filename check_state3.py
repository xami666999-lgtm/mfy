with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()
for i in range(250, 350):
    if i < len(lines):
        print(f'{i+1}: {lines[i].rstrip()}')