with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()
for i in range(1002, 1012):
    if i < len(lines):
        print(f'{i+1}: {repr(lines[i])}')