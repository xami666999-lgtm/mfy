with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Sports.tsx', 'r') as f:
    content = f.read()
lines = content.split('\n')
for i in range(25, 50):
    print(f'{i+1}: {lines[i]}')