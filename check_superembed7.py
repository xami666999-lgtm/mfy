import urllib.request

url = 'https://www.superembed.stream/dooplay.html'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req, timeout=10)
    html = response.read().decode('utf-8')
    print(f'Page: {response.getcode()}')
    print(f'HTML length: {len(html)}')
    print(f'First 2000 chars:')
    print(html[:2000])
    print('...')
    print('Last 500 chars:')
    print(html[-500:])
except Exception as e:
    print(f'Error: {e}')