with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Board.tsx', 'r') as f:
    content = f.read()

# Find the airing section and replace it entirely
start_marker = '        {/* Airing Schedule Section */}'
end_marker = '      </div>\n    </div>\n  )\n}'

start_idx = content.find(start_marker)
if start_idx == -1:
    print("Start marker not found")
else:
    # Find the end - look for the closing of the Board component
    end_idx = content.find(end_marker, start_idx)
    if end_idx == -1:
        print("End marker not found")
    else:
        print(f"Found section from {start_idx} to {end_idx}")
        print(f"Length: {end_idx - start_idx}")

# Let's instead just rewrite the whole file from a known good state
# But first, let's see what the exact structure is around the error lines

print("\n=== Around line 892 ===")
lines = content.split('\n')
for i in range(888, 900):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}")

print("\n=== Around line 1005 ===")
for i in range(1000, 1020):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}")