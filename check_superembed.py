import urllib.request
import urllib.error
import re

# Check the main page
url = 'https://superembed.stream/'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req, timeout=10)
    html = response.read().decode('utf-8')
    print(f'Main page: {response.getcode()}')
    # Look for patterns
    embeds = re.findall(r'/(embed|movie|tv|api)/[^"\s>]+', html)
    print('Found embed paths:', embeds[:20])
except Exception as e:
    print(f'Error: {e}')