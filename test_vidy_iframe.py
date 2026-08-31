import urllib.request
import urllib.error

# Test if Vidy URLs work in iframe context (check for iframe-busting headers)
urls = [
    'https://vidy.st/movie/550',
    'https://vidy.st/tv/1396/1/1',
    'https://www.vidy.st/movie/550',
    'https://www.vidy.st/tv/1396/1/1',
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req, timeout=15)
        print(f'OK: {url} -> {response.getcode()}')
        final_url = response.geturl()
        if final_url != url:
            print(f'  Redirects to: {final_url}')
        # Check for iframe-busting headers
        for header, value in response.headers.items():
            if 'frame' in header.lower() or 'content-security' in header.lower() or 'x-frame' in header.lower():
                print(f'  Header: {header}: {value}')
    except urllib.error.HTTPError as e:
        print(f'HTTP {e.code}: {url}')
    except Exception as e:
        print(f'ERROR: {url} -> {e}')