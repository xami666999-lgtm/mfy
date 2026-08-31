with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()

# Find line 933 (index 932) which has "<>" and replace with "<div>"
# Find the corresponding closing fragment and replace with "</div>"

for i, line in enumerate(lines):
    if i == 932 and '<>' in line.strip():
        lines[i] = line.replace('<>', '<div>')
        print(f"Fixed line {i+1}: {lines[i].strip()}")
    if i > 932 and '</>' in line.strip() and '1004' in str(i+1):
        lines[i] = line.replace('</>', '</div>')
        print(f"Fixed line {i+1}: {lines[i].strip()}")

# Let's find the actual fragment close
for i, line in enumerate(lines):
    if i > 995 and i < 1010 and '</>' in line:
        print(f"Found fragment close at line {i+1}: {repr(line)}")
        lines[i] = line.replace('</>', '</div>')
        print(f"Fixed line {i+1}: {lines[i].strip()}")

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'w') as f:
    f.writelines(lines)

print("Done")