with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    lines = f.readlines()

# Find the fmt function
for i, line in enumerate(lines):
    if 'function fmt(s: number)' in line:
        # Check previous lines for extra }
        j = i - 1
        removed = 0
        while j >= 0 and removed < 3:
            if lines[j].strip() == '}':
                lines.pop(j)
                removed += 1
                print("Removed extra at line " + str(j+1))
            j -= 1
        break

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'w') as f:
    f.writelines(lines)
print("Removed extra braces")