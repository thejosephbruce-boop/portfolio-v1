#!/usr/bin/env python3
"""Stamp style.css / script.js references with a content hash.

The host's CDN caches static assets for a week and ignores our headers for
copies it already holds, so editing style.css in place can leave visitors on a
stale copy for days. The HTML itself is never edge-cached, so pointing it at
`style.css?v=<hash>` gives a URL nothing has cached yet — the change lands
immediately, and only when the file's contents actually change.

Run after build_work_pages.py:
    python3 stamp_assets.py
"""
import hashlib
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
ASSETS = ("style.css", "script.js")


def digest(name):
    with open(os.path.join(ROOT, name), "rb") as f:
        return hashlib.sha1(f.read()).hexdigest()[:8]


def main():
    versions = {a: digest(a) for a in ASSETS}

    targets = [f for f in os.listdir(ROOT) if f.endswith(".html")]
    targets += [os.path.join("templates", "project.html")]

    changed = 0
    for rel in targets:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            html = f.read()
        original = html
        for asset, ver in versions.items():
            # Match the asset with or without an existing ?v=, so re-running
            # replaces the old stamp rather than stacking another one on.
            html = re.sub(
                rf'((?:href|src)=")({re.escape(asset)})(?:\?v=[a-f0-9]+)?(")',
                rf'\g<1>\g<2>?v={ver}\g<3>',
                html,
            )
        if html != original:
            with open(path, "w", encoding="utf-8") as f:
                f.write(html)
            changed += 1

    print("Stamped " + ", ".join(f"{a}?v={v}" for a, v in versions.items()))
    print(f"Updated {changed} file(s)")


if __name__ == "__main__":
    main()
