with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    content = f.read()
lines = content.split('\n')
for i in range(270, 320):
    print(f'{i+1}: {lines[i]}')