with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    lines = f.readlines()

# Unindent fmt function
for i in range(len(lines)):
    if lines[i].startswith('  function fmt('):
        lines[i] = lines[i][2:]
        print(f"Unindented fmt at line {i+1}")
        break

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'w') as f:
    f.writelines(lines)
print("Fixed fmt")