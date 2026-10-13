"""Fetch completed SPY daily adjusted closes; validate before atomic replacement."""
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
import math
from pathlib import Path
import time
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

NY = ZoneInfo('America/New_York')
START = '2020-01-02'


def normalize(payload, now, previous=None):
    chart = payload.get('chart', {})
    if chart.get('error') or not chart.get('result'):
        raise ValueError('Provider returned an error or empty result')
    result = chart['result'][0]
    if result.get('meta', {}).get('symbol') != 'SPY':
        raise ValueError('Unexpected ticker in provider response')
    timestamps = result.get('timestamp', [])
    prices = result['indicators']['adjclose'][0]['adjclose']
    if len(timestamps) != len(prices):
        raise ValueError('Price and timestamp counts differ')
    local = now.astimezone(NY)
    # Conservative buffer after the regular close; also safe on early-close days.
    cutoff = local.date() if local.hour >= 18 else local.date() - timedelta(days=1)
    rows = []
    for stamp, price in zip(timestamps, prices):
        date = datetime.fromtimestamp(stamp, NY).date()
        if date > cutoff:
            continue  # Never admit the current session's unfinished daily bar.
        if not isinstance(price, (int, float)) or isinstance(price, bool) or not math.isfinite(price) or price <= 0:
            raise ValueError(f'Invalid adjusted close on {date}')
        iso = date.isoformat()
        if date.weekday() >= 5 or iso < START or (rows and iso <= rows[-1]['date']):
            raise ValueError('Unexpected, duplicate, or unordered trading dates')
        rows.append({'date': iso, 'close': round(price, 6)})
    if len(rows) < 1000 or rows[0]['date'] != START:
        raise ValueError('Incomplete historical response')
    latest = datetime.fromisoformat(rows[-1]['date']).date()
    if (cutoff - latest).days > 5:
        raise ValueError('Provider data is more than five calendar days behind')
    if previous:
        dates = {r['date'] for r in rows}
        if any(r['date'] not in dates for r in previous['rows']):
            raise ValueError('Refresh would remove previously available observations')
    digest = hashlib.sha256(json.dumps(rows, separators=(',', ':')).encode()).hexdigest()
    return {
        'ticker': 'SPY', 'source': 'Yahoo Finance daily adjusted close',
        'sourceUrl': 'https://finance.yahoo.com/quote/SPY/history/',
        'retrieved': now.astimezone(timezone.utc).isoformat(),
        'dataThrough': rows[-1]['date'], 'frequency': 'daily',
        'refreshPolicy': 'Weekdays at 23:30 UTC after deployment of the scheduled workflow.',
        'priceBasis': 'Dividend and split adjusted close; full history refreshed together.',
        'sha256': digest, 'rows': rows,
    }


def refresh(output, now, fetch):
    previous = json.loads(output.read_text()) if output.exists() else None
    data = normalize(fetch(), now, previous)
    temp = output.with_suffix('.json.tmp')
    try:
        temp.write_text(json.dumps(data, separators=(',', ':')) + '\n')
        temp.replace(output)
    finally:
        temp.unlink(missing_ok=True)
    return data


def fetch_yahoo(now):
    end = int(now.timestamp())
    url = f'https://query1.finance.yahoo.com/v8/finance/chart/SPY?period1=1577836800&period2={end}&interval=1d'
    request = Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json'})
    for attempt in range(3):
        try:
            with urlopen(request, timeout=25) as response:
                return json.load(response)
        except (OSError, ValueError):
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=Path('dist/assets/quant/spy.json'))
    args = parser.parse_args()
    now = datetime.now(timezone.utc)
    data = refresh(args.output, now, lambda: fetch_yahoo(now))
    print(f"SPY: {len(data['rows'])} daily observations; data through {data['dataThrough']}; sha256 {data['sha256']}")
