from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
root = Path('dist')
class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ('href','src'):
            href = attrs.get(key, '')
            if href.startswith('/'):
                path = root / urlsplit(href).path.lstrip('/')
                if path.is_dir(): path = path / 'index.html'
                assert path.is_file(), f'Missing local resource: {href}'
for page in root.rglob('*.html'):
    Links().feed(page.read_text())
print('All local page and asset links resolve.')
