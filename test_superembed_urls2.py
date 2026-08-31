import urllib.request
import urllib.error

# Test different SuperEmbed URL formats with TMDB IDs
paths = [
    '/movie/550',  # Fight Club TMDB ID
    '/tv/1396/1/1',  # Breaking Bad S1E1
    '/embed/movie/550',
    '/embed/tv/1396/1/1',
    '/api/movie/550',
    '/api/tv/1396/1/1',
    '/api/embed/movie/550',
    '/api/embed/tv/1396/1/1',
    '/player/movie/550',
    '/player/tv/1396/1/1',
    '/play/movie/550',
    '/play/tv/1396/1/1',
    '/watch/movie/550',
    '/watch/tv/1396/1/1',
    '/stream/movie/550',
    '/stream/tv/1396/1/1',
    '/embed/movie/550',
    '/embed/tv/1396/1/1',
    '/movie/550',
    '/tv/1396/1/1',
]

for path in paths:
    url = 'https://superembed.stream' + path
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req, timeout=10)
        print(f'OK: {url} -> {response.getcode()}')
    except urllib.error.HTTPError as e:
        if e.code != 404:
            print(f'Other: {url} -> {e.code}')
    except Exception as e:
        pass