with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()
for i in range(len(lines)-50, len(lines)):
    if i >= 0:
        print(f'{i+1}: {lines[i].rstrip()}')