import urllib.request
import json

url = 'https://api.github.com/repos/xami666999-lgtm/mfy/releases?per_page=5'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
response = urllib.request.urlopen(req, timeout=15)
data = json.loads(response.read().decode())

for release in data:
    tag = release['tag_name']
    name = release.get('name', '')
    draft = release.get('draft', False)
    prerelease = release.get('prerelease', False)
    created = release['created_at']
    assets_count = len(release.get('assets', []))
    print(f'{tag} | {created} | Draft: {draft} | Pre-release: {prerelease} | Assets: {assets_count}')
    if name:
        print(f'  Name: {name}')