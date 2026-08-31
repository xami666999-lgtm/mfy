import json
with open('C:\\Users\\Noah\\Desktop\\mfy-app\\package.json', 'r') as f:
    d = json.load(f)
d['version'] = '1.2.32'
with open('C:\\Users\\Noah\\Desktop\\mfy-app\\package.json', 'w') as f:
    json.dump(d, f, indent=2)
print('Version set to 1.2.32')