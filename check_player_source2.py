with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    lines = f.readlines()
for i in range(250, 280):
    print(f'{i+1}: {lines[i].rstrip()}')