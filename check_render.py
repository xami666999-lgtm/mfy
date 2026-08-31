with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()

# Find the main return statement
in_return = False
for i, line in enumerate(lines):
    if 'return (' in line and i > 300 and i < 400:
        in_return = True
        print(f'Return starts at line {i+1}')
    if in_return:
        if 'Providers Section' in line or 'Franchises Section' in line or 'Manga Section' in line or 'Airing Schedule Section' in line:
            print(f'Line {i+1}: {line.strip()}')
        # Look for closing of main return
        if line.strip() == ')' and i > 500:
            # Check next few lines
            for j in range(i, min(i+5, len(lines))):
                print(f'Line {j+1}: {lines[j].strip()}')
            break