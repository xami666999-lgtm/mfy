import urllib.request
import re

url = 'https://www.superembed.stream/dooplay.html'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req, timeout=10)
    html = response.read().decode('utf-8')
    print(f'Page: {response.getcode()}')
    print(f'HTML length: {len(html)}')
    
    patterns = [
        r'src=["\']([^"\']*embed[^"\']*)["\']',
        r'src=["\']([^"\']*player[^"\']*)["\']',
        r'src=["\']([^"\']*player[^"\']*)["\']',
        r'iframe[^>]*src=["\']([^"\']*)["\']',
        r'/embed/[^"\s>]+',
        r'/player/[^"\s>]+',
        r'/api/[^"\s>]+',
        r'/api/v[0-9]/[^"\s>]+',
    ]
    for p in patterns:
        matches = re.findall(p, content)
        if matches:
            print(f'Pattern "{p}" found {len(matches)} matches:')
            for m in matches[:10]:
                print(f'  {m}')
                
    embed_urls = re.findall(r'(https?://[^"\'>\s]*superembed\.stream[^"\'>\s]*)', content)
    if embed_urls:
        print('\nFound SuperEmbed URLs:')
        for u in embed_urls[:20]:
            print(f'  {u}')
            
except Exception as e:
    print(f'Error: {e}')