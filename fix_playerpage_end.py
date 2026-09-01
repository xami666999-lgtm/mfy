with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    lines = f.readlines()

# Find the last few lines and remove extra braces
# The file should end after the fmt function
new_lines = []
brace_count = 0
for i, line in enumerate(lines):
    if 'function fmt(s: number)' in line:
        # Found the fmt function, keep it and everything before it
        new_lines = lines[:i+7]  # fmt function is 7 lines
        break

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'w') as f:
    f.writelines(new_lines)
print("Fixed file end")