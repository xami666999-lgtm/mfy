with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    lines = f.readlines()

# Find the start and end of the sections I added (outside the component)
# They start at line 741 (index 740) with "        {/* Providers Section */}"
# and end before "function Poster({" at around line 1071 (index 1070)

# Find the start index
start_idx = None
for i, line in enumerate(lines):
    if '{/* Providers Section */}' in line and i > 700:
        start_idx = i
        break

# Find the end index - the line before "function Poster({"
end_idx = None
for i, line in enumerate(lines):
    if i > 700 and line.strip().startswith('function Poster({'):
        end_idx = i
        break

print(f"Start index: {start_idx}, End index: {end_idx}")
if start_idx is not None and end_idx is not None:
    print(f"Removing lines {start_idx+1} to {end_idx}")
    # Remove the inserted sections
    del lines[start_idx:end_idx]
    
    with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'w') as f:
        f.writelines(lines)
    print("Done removing!")
else:
    print("Could not find markers")