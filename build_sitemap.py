#!/usr/bin/env python3
"""Regenerate sitemap.xml from data/projects.json.

Run alongside build_work_pages.py whenever pages are added or removed:
    python3 build_sitemap.py
"""
import json
import os
from datetime import date

ROOT = os.path.dirname(os.path.abspath(__file__))
BASE = "https://josephbruce.com"

with open(os.path.join(ROOT, "data", "projects.json"), encoding="utf-8") as f:
    projects = json.load(f)

today = date.today().isoformat()

# Homepage and bio first, then every project page (including the ones kept off
# the grid but linked from the bio).
urls = [(f"{BASE}/", "1.0"), (f"{BASE}/bio.html", "0.8")]
urls += [(f"{BASE}/{p['slug']}.html", "0.6") for p in projects]

lines = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ""]
for loc, priority in urls:
    lines += ["  <url>",
              f"    <loc>{loc}</loc>",
              f"    <lastmod>{today}</lastmod>",
              "    <changefreq>monthly</changefreq>",
              f"    <priority>{priority}</priority>",
              "  </url>", ""]
lines.append("</urlset>")

with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"Wrote sitemap.xml with {len(urls)} URLs")
