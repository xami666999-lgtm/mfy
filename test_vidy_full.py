import urllib.request
import urllib.error

# Test Vidy URLs thoroughly
urls = [
    'https://vidy.st/movie/550',
    'https://vidy.st/embed/movie/550',
    'https://vidy.st/tv/1396/1/1',
    'https://vidy.st/embed/tv/1396/1/1',
    'https://www.vidy.st/movie/550',
    'https://www.vidy.st/embed/movie/550',
    'https://www.vidy.st/tv/1396/1/1',
    'https://www.vidy.st/embed/tv/1396/1/1',
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req, timeout=15)
        print(f'OK: {url} -> {response.getcode()}')
        final_url = response.geturl()
        if final_url != url:
            print(f'  Redirects to: {final_url}')
    except urllib.error.HTTPError as e:
        print(f'HTTP {e.code}: {url}')
    except Exception as e:
        print(f'ERROR: {url} -> {e}')