with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    content = f.read()

# Add closing brace at end to satisfy TypeScript parser
content = content.rstrip() + '\n}\n'

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'w') as f:
    f.write(content)
print("Added closing brace at end")