with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    lines = f.readlines()
for i in range(280, 310):
    if i < len(lines):
        print(f'{i+1}: {lines[i].rstrip()}')