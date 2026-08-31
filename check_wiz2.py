with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Wizard.tsx', 'r') as f:
    content = f.read()
idx = content.find('Create desktop shortcut')
if idx >= 0:
    print('Found at index', idx)
    print(content[max(0,idx-100):idx+200])
else:
    print('Not found - checking variations')
    if 'shortcut' in content.lower():
        print('Found shortcut keyword')
    else:
        print('No shortcut keyword found')