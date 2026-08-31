import urllib.request
import re

url = 'https://www.superembed.stream/dooplay.html'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req, timeout=10)
    html = response.read().decode('utf-8')
    print(f'Page: {response.getcode()}')
    print(f'HTML length: {len(html)}')
    
    # Look for embed/player patterns
    patterns = [
        r'src=["\']([^"\']*embed[^"\']*)["\']',
        r'src=["\']([^"\']*player[^"\']*)["\']',
        r'iframe[^>]*src=["\']([^"\']*)["\']',
        r'/embed/[^"\s>]+',
        r'/player/[^"\s>]+',
        r'/api/[^"\s>]+',
        r'/api/v[0-9]/[^"\s>]+',
        r'src=["\']([^"\']*)["\']',
    ]
    for p in patterns:
        matches = re.findall(p, content)
        if matches:
            print(f'Pattern "{p}" found {len(matches)} matches:')
            for m in matches[:20]:
                print(f'  {m}')
                
    # Look for any URL with parameters like ?imdb= or ?tmdb= or ?id=
    param_urls = re.findall(r'(https?://[^"\'>\s]*\?(?:imdb|tmdb|id|video_id|v)=[^"\'>\s]+)', content)
    if param_urls:
        print('\nURLs with parameters:')
        for u in param_urls[:30]:
            print(f'  {u}')
            
    # Check for any URL with imdb or tmdb
    imdb_urls = re.findall(r'(https?://[^"\'>\s]*imdb[^"\'>\s]*)', content)
    if imdb_urls:
        print('\nIMDB URLs:')
        for u in imdb_urls[:20]:
            print(f'  {u}')
            
    tmdb_urls = re.findall(r'(https?://[^"\'>\s]*tmdb[^"\'>\s]*)', content)
    if tmdb_urls:
        print('\nTMDB URLs:')
        for u in tmdb_urls[:20]:
            print(f'  {u}')
            
    # Check for any API documentation
    api_patterns = re.findall(r'(https?://[^"\'>\s]*api[^"\'>\s]*)', content)
    if api_patterns:
        print('\nAPI URLs:')
        for u in api_patterns[:20]:
            print(f'  {u}')
            
except Exception as e:
    print(f'Error: {e}')