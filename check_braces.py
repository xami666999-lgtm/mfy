with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    content = f.read()

open_braces = 0
for i, ch in enumerate(content):
    if ch == '{':
        open_braces += 1
    elif ch == '}':
        open_braces -= 1
    if open_braces < 0:
        print(f"Negative at position {i}: {content[max(0,i-20):i+20]}")
        break

print(f"Final brace balance: {open_braces}")