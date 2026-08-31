import urllib.request
import urllib.error

# Test VidKing URLs
urls = [
    'https://vidking.net/embed/movie/550',
    'https://vidking.net/embed/tv/1396/1/1',
    'https://vidking.net/movie/550',
    'https://vidking.net/tv/1396/1/1',
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req, timeout=10)
        print(f'OK: {url} -> {response.getcode()}')
        final_url = response.geturl()
        if final_url != url:
            print(f'  Redirects to: {final_url}')
    except urllib.error.HTTPError as e:
        print(f'HTTP {e.code}: {url}')
    except Exception as e:
        print(f'ERROR: {url} -> {e}')