import urllib.request
import re

# Check for the actual embed URL patterns
url = 'https://superembed.stream/'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req, timeout=10)
    html = response.read().decode('utf-8')
    
    # Look for iframe or embed URL patterns
    patterns = [
        r'src=["\']([^"\']*embed[^"\']*)["\']',
        r'src=["\']([^"\']*embed[^"\']*)["\']',
        r'iframe[^>]*src=["\']([^"\']*)["\']',
        r'superembed\.stream/[^"\s>]+',
        r'superembed\.stream/[^"\s>]+',
        r'/embed/[^"\s>]+',
        r'/player/[^"\s>]+',
    ]
    for p in patterns:
        matches = re.findall(p, html)
        if matches:
            print(f'Pattern "{p}" found {len(matches)} matches:')
            for m in matches[:10]:
                print(f'  {m}')
                
    # Also look for any JavaScript that constructs embed URLs
    embed_urls = re.findall(r'(https?://[^"\'>\s]*superembed\.stream[^"\'>\s]*)', html)
    if embed_urls:
        print('\nFound SuperEmbed URLs:')
        for u in embed_urls[:20]:
            print(f'  {u}')
            
    # Look for API documentation or examples
    api_patterns = re.findall(r'(https?://[^"\'>\s]*api[^"\'>\s]*)', html)
    if api_patterns:
        print('\nAPI URLs:')
        for u in api_patterns[:10]:
            print(f'  {u}')
            
except Exception as e:
    print(f'Error: {e}')