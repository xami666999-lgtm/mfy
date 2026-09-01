with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    lines = f.readlines()

# Find the line with "} \n\nfunction fmt"
for i, line in enumerate(lines):
    if 'function fmt(s: number)' in line:
        print(f'Found at line {i+1}: {repr(lines[i])}')
        print(f'Previous line: {repr(lines[i-1])}')
        print(f'Line before that: {repr(lines[i-2])}')
        break