with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    lines = f.readlines()

# Find the line with "function fmt(s: number) {"
for i, line in enumerate(lines):
    if 'function fmt(s: number)' in line:
        print(f'Found fmt at line {i+1} (index {i})')
        # Insert 1 more closing brace before this line
        lines.insert(i, '}\n')
        print(f"Inserted 1 closing brace before line {i+1}")
        break

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'w') as f:
    f.writelines(lines)
print("Done")