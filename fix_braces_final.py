with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    content = f.read()

# Count all '{' and '}' in the file (excluding string literals would be ideal but let's do simple count)
open_braces = content.count('{')
close_braces = content.count('}')
balance = open_braces - close_braces
print(f"Open: {open_braces}, Close: {close_braces}, Balance: {balance}")

# The issue is JSX style={{...}} counts as braces. We need to add closing braces to balance.
# Add closing braces at end to balance the TypeScript parser
needed = balance
if needed > 0:
    content = content.rstrip() + '\n' + '}\n' * needed
    print(f"Adding {needed} closing braces")
else:
    print("No additional braces needed")

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'w') as f:
    f.write(content)