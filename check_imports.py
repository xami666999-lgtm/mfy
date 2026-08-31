with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()
for i in range(0, 30):
    print(f'{i+1}: {lines[i].rstrip()}')