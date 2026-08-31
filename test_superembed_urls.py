import urllib.request
import urllib.error

# Test different SuperEmbed URL formats with IMDB IDs
test_urls = [
    'https://superembed.stream/movie/tt0111161',
    'https://www.superembed.stream/movie/tt0111161',
    'https://superembed.stream/embed/movie/tt0111161',
    'https://www.superembed.stream/embed/movie/tt0111161',
    'https://superembed.stream/movie/tt0111161?autoPlay=true',
    'https://superembed.stream/api/movie/tt0111161',
    'https://superembed.stream/api/embed/movie/tt0111161',
    'https://superembed.stream/tv/tt0903747/1/1',
    'https://www.superembed.stream/tv/tt0903747/1/1',
    'https://superembed.stream/embed/tv/tt0903747/1/1',
    'https://www.superembed.stream/embed/tv/tt0903747/1/1',
]

for url in test_urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req, timeout=10)
        print(f'{url} -> {response.getcode()}')
    except urllib.error.HTTPError as e:
        print(f'{url} -> HTTP {e.code}')
    except Exception as e:
        print(f'{url} -> ERROR: {e}')