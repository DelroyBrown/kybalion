"""
Download the public-domain run of The Crisis (Nov 1910 - Dec 1930) from
the Internet Archive's `pub_crisis` collection.

Every monthly issue exists as one or two independent microfilm scans; both
OCR texts are fetched so build_crisis.py can keep whichever reads better.
Raw text lands in sources/crisis/raw/ (git-ignored — re-run this script to
regenerate) and the issue index in sources/crisis/index.json.

Usage:
    python scripts/download_crisis.py

Safe to re-run: files already on disk are skipped.
"""
import json
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "sources" / "crisis"
RAW_DIR = OUT_DIR / "raw"
INDEX_PATH = OUT_DIR / "index.json"

SEARCH_URL = (
    "https://archive.org/advancedsearch.php?"
    + urllib.parse.urlencode(
        {
            "q": "collection:(pub_crisis) AND date:[1910-01-01 TO 1930-12-31]",
            "fl[]": ["identifier", "title", "date"],
            "rows": "600",
            "sort[]": "date asc",
            "output": "json",
        },
        doseq=True,
    )
)

HEADERS = {"User-Agent": "the-perennial-library/1.0 (public-domain text ingest)"}


def fetch(url, timeout=60):
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def fetch_with_retry(url, attempts=4):
    for attempt in range(attempts):
        try:
            return fetch(url)
        except Exception:
            if attempt == attempts - 1:
                raise
            time.sleep(2 * (attempt + 1))


def build_index():
    """One entry per month: date, volume/issue, and every scan identifier."""
    data = json.loads(fetch_with_retry(SEARCH_URL))
    months = {}
    for doc in data["response"]["docs"]:
        month = doc["date"][:7]  # YYYY-MM
        entry = months.setdefault(month, {"date": month, "identifiers": []})
        entry["identifiers"].append(doc["identifier"])
        # Identifiers end in _<volume>_<issue>, e.g. sim_crisis_1910-11_1_1.
        match = re.search(r"_(\d+)_(\d+)$", doc["identifier"])
        if match:
            entry["volume"], entry["issue"] = int(match.group(1)), int(match.group(2))
    index = [months[key] for key in sorted(months)]
    INDEX_PATH.write_text(json.dumps(index, indent=1), encoding="utf-8")
    return index


def download_one(identifier):
    target = RAW_DIR / f"{identifier}.txt"
    if target.exists() and target.stat().st_size > 0:
        return identifier, "cached"
    url = f"https://archive.org/download/{identifier}/{identifier}_djvu.txt"
    body = fetch_with_retry(url)
    target.write_bytes(body)
    return identifier, f"{len(body) // 1024} KB"


def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    index = build_index()
    identifiers = [i for entry in index for i in entry["identifiers"]]
    print(f"{len(index)} issues, {len(identifiers)} scans to fetch")

    done = failed = 0
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(download_one, i): i for i in identifiers}
        for future in as_completed(futures):
            identifier = futures[future]
            try:
                _, note = future.result()
                done += 1
                if done % 25 == 0 or note != "cached":
                    print(f"[{done}/{len(identifiers)}] {identifier} ({note})", flush=True)
            except Exception as error:
                failed += 1
                print(f"FAILED {identifier}: {error}", flush=True)
    print(f"done: {done} fetched/cached, {failed} failed")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
