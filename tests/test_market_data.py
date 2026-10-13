import importlib.util
from datetime import datetime, timedelta, timezone
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('refresh', 'scripts/refresh-market-data.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def fixture():
    dates = []
    day = datetime(2020, 1, 2, 16, tzinfo=m.NY)
    end = datetime(2026, 10, 2, 16, tzinfo=m.NY)
    while day <= end:
        if day.weekday() < 5:
            dates.append(int(day.timestamp()))
        day += timedelta(days=1)
    return {'chart': {'result': [{'meta': {'symbol': 'SPY'}, 'timestamp': dates,
            'indicators': {'adjclose': [{'adjclose': [300.0] * len(dates)}]}}], 'error': None}}


class MarketDataTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 10, 2, 23, 30, tzinfo=timezone.utc)
        self.payload = fixture()

    def test_completed_session_and_hash(self):
        data = m.normalize(self.payload, self.now)
        self.assertEqual(data['dataThrough'], '2026-10-02')
        self.assertEqual(len(data['sha256']), 64)
        self.assertEqual(data['sha256'], m.normalize(self.payload, self.now)['sha256'])

    def test_unfinished_session_is_excluded(self):
        data = m.normalize(self.payload, self.now.replace(hour=19))
        self.assertEqual(data['dataThrough'], '2026-10-01')

    def test_weekend_retains_friday(self):
        self.assertEqual(m.normalize(self.payload, self.now + timedelta(days=2))['dataThrough'], '2026-10-02')

    def test_rejects_stale_missing_invalid_and_wrong_ticker(self):
        with self.assertRaises(ValueError):
            m.normalize(self.payload, self.now + timedelta(days=9))
        with self.assertRaises(ValueError):
            m.normalize(self.payload, self.now, {'rows': [{'date': '2026-10-05'}]})
        r = self.payload['chart']['result'][0]
        r['indicators']['adjclose'][0]['adjclose'][-1] = None
        with self.assertRaises(ValueError):
            m.normalize(self.payload, self.now)
        r['meta']['symbol'] = 'OTHER'
        with self.assertRaises(ValueError):
            m.normalize(self.payload, self.now)

    def test_failure_preserves_existing_file(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'spy.json'
            path.write_text('{"rows":[]}')
            with self.assertRaises(ValueError):
                m.refresh(path, self.now, lambda: {'chart': {'error': 'rate limited'}})
            self.assertEqual(path.read_text(), '{"rows":[]}')
            self.assertFalse(path.with_suffix('.json.tmp').exists())

    def test_duplicate_dates_rejected(self):
        r = self.payload['chart']['result'][0]
        r['timestamp'][-1] = r['timestamp'][-2]
        with self.assertRaises(ValueError):
            m.normalize(self.payload, self.now)


if __name__ == '__main__':
    unittest.main()
