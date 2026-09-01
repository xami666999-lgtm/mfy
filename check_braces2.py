with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\PlayerPage.tsx', 'r') as f:
    content = f.read()

open_braces = 0
for i, ch in enumerate(content):
    if ch == '{':
        open_braces += 1
        print(f"Open at {i}: balance={open_braces}, context={content[max(0,i-30):i+30]}")
    elif ch == '}':
        open_braces -= 1
        if open_braces < 3:
            print(f"Close at {i}: balance={open_braces}, context={content[max(0,i-30):i+30]}")

print(f"Final brace balance: {open_braces}")