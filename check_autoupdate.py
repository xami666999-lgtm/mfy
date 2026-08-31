with open('C:\\Users\\Noah\\Desktop\\mfy-app\\electron\\main.ts', 'r') as f:
    content = f.read()
idx = content.find('autoUpdate')
if idx >= 0:
    print('Found autoUpdate in main.ts')
    start = max(0, idx-50)
    end = min(len(content), idx+200)
    print(content[start:end])
else:
    print('autoUpdate not found in main.ts')