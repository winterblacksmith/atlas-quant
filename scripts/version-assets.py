"""Give local asset URLs content versions so browsers fetch changed files."""
import hashlib
import re
import sys
from pathlib import Path

root = Path(sys.argv[1] if len(sys.argv) > 1 else 'dist')
pattern = re.compile(r'(?P<attr>\b(?:href|src)=)(?P<quote>[\"\x27])(?P<url>/assets/[^\"\x27?#]+)(?:\?[^\"\x27#]*)?(?P<fragment>#[^\"\x27]*)?(?P=quote)')

def version(match):
    asset = root / match['url'].lstrip('/')
    digest = hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
    return f"{match['attr']}{match['quote']}{match['url']}?v={digest}{match['fragment'] or ''}{match['quote']}"

for page in root.rglob('*.html'):
    original = page.read_text()
    updated = pattern.sub(version, original)
    if updated != original:
        page.write_text(updated)
