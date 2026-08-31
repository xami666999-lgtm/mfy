import urllib.request
import json

url = 'https://api.github.com/repos/xami666999-lgtm/mfy/releases/tags/v1.2.23'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
response = urllib.request.urlopen(req, timeout=15)
data = json.loads(response.read().decode())

for asset in data.get('assets', []):
    print(f'  {asset["name"]} ({asset["size"] // 1024} KB) - {asset["content_type"]}')