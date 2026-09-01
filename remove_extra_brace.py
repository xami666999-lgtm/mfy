with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    lines = f.readlines()

# Remove the extra closing brace at line 418 (index 417)
if lines[-1].strip() == '}':
    lines.pop()
    print("Removed extra closing brace at end")

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'w') as f:
    f.writelines(lines)
print("Done")