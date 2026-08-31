with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    content = f.read()

# Fix manga title access - title is a string, not an object
content = content.replace('item.title?.english || item.title?.romaji || item.title', 'item.title')

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'w') as f:
    f.write(content)

print("Fixed manga title access")