with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    content = f.read()
idx = content.find('<option value="vidy"')
if idx >= 0:
    print(content[idx:idx+300])