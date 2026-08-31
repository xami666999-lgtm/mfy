with open('C:\\Users\\Noah\\Desktop\\mfy-app\\electron\\main.ts', 'r') as f:
    content = f.read()
idx = content.find('version')
if idx >= 0:
    print(f'Found at position {idx}')
    print(content[max(0,idx-50):idx+100])
else:
    print('version not found')