import urllib.request
import re

url = 'https://superembed.stream/'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req, timeout=10)
    html = response.read().decode('utf-8')
    print(f'Main page: {response.getcode()}')
    print(f'HTML length: {len(html)}')
    # Look for any API or embed related patterns
    patterns = [
        r'embed',
        r'player',
        r'stream',
        r'api',
        r'movie',
        r'tv',
        r'season',
        r'episode',
    ]
    for p in patterns:
        matches = [m for m in re.finditer(p, html, re.IGNORECASE)]
        if matches:
            print(f'Pattern "{p}" found {len(matches)} times')
            for m in matches[:5]:
                start = max(0, m.start()-50)
                end = min(len(html), m.end()+50)
                print(f'  ...{html[start:end]}...')
except Exception as e:
    print(f'Error: {e}')