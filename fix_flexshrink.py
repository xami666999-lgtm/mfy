with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    content = f.read()

# Fix duplicate flexShrink
content = content.replace('style={{ flexShrink: 0, width: 120, flexShrink: 0 }}', 'style={{ flexShrink: 0, width: 120 }}')

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'w') as f:
    f.write(content)

print("Fixed duplicate flexShrink")