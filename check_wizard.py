with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\pages\\Wizard.tsx', 'r') as f:
    content = f.read()
lines = content.split('\n')
step_count = 0
for i, line in enumerate(lines):
    if 'step' in line.lower() and ('setStep' in line or 'step ===' in line.lower()):
        print(f'Line {i+1}: {line.strip()}')
    if 'step === ' in line:
        step_count += 1
print(f'\\nTotal step checks: {step_count}')