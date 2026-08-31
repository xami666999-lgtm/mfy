with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Sports.tsx', 'r') as f:
    lines = f.readlines()
for i in range(110, 125):
    print(f'{i+1}: {lines[i].rstrip()}')