with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    lines = f.readlines()
print('Total lines:', len(lines))
for i in range(max(0, len(lines)-15), len(lines)):
    print('{}: {}'.format(i+1, repr(lines[i])))