#!/usr/bin/env python3
"""One-time script: inject SEO meta tags into all portfolio HTML pages."""

import os, re
from urllib.parse import quote

BASE   = "https://josephbruce.com"
FOLDER = os.path.dirname(os.path.abspath(__file__))

# ── Per-page data ──────────────────────────────────────────────────────────────
# image paths are relative filenames (will be URL-encoded automatically)
PAGES = {
    "index.html": {
        "url":   BASE + "/",
        "title": "Joe Bruce — Creative Advertising",
        "desc":  "Portfolio of Joe Bruce — Executive Creative Director and Creative Partner. Award-winning work for Nike, Formula 1, Camden Town Brewery, Sainsbury's and more.",
        "image": "OWN the floor thumb.png",
    },
    "bio.html": {
        "url":   BASE + "/bio.html",
        "title": "Full Bio · Joe Bruce",
        "desc":  "The full story of Joe Bruce — Executive Creative Director, writer and Creative Partner. Award-winning advertising spanning W+K London, Beyond and beyond.",
        "image": "Full face.jpg",
    },
    "nike-own-the-floor.html": {
        "url":   BASE + "/nike-own-the-floor.html",
        "title": "Nike — Own the Floor · Joe Bruce",
        "desc":  "Nike Own the Floor — a campaign by Joe Bruce, Creative Partner at Beyond.",
        "image": "OWN the floor thumb.png",
    },
    "nike-never-fade.html": {
        "url":   BASE + "/nike-never-fade.html",
        "title": "Nike — Never Fade · Joe Bruce",
        "desc":  "Nike Never Fade — a campaign by Joe Bruce, Creative Partner at Beyond.",
        "image": "Nike Fade Thumb.png",
    },
    "jamshed.html": {
        "url":   BASE + "/jamshed.html",
        "title": "Jamshed — There's No Such Thing As Too Jammy · Joe Bruce",
        "desc":  "Jamshed — There's No Such Thing As Too Jammy. Brand campaign by Joe Bruce, Creative Partner at Beyond.",
        "image": "Jamshed thumb.jpg",
    },
    "nike-a-beautiful-run.html": {
        "url":   BASE + "/nike-a-beautiful-run.html",
        "title": "Nike — A Beautiful Run · Joe Bruce",
        "desc":  "Nike A Beautiful Run — campaign by Joe Bruce, Creative Director on Nike at Wieden+Kennedy London.",
        "image": "Beatiful run thumb 2.png",
    },
    "camden-town-brewery-recall.html": {
        "url":   BASE + "/camden-town-brewery-recall.html",
        "title": "Camden Town Brewery — Recall · Joe Bruce",
        "desc":  "Camden Town Brewery Recall — campaign by Joe Bruce, Creative Director at Wieden+Kennedy London.",
        "image": "Camden recall thumb.png",
    },
    "f1-welcome-to-the-edge.html": {
        "url":   BASE + "/f1-welcome-to-the-edge.html",
        "title": "F1 — Welcome to the Edge · Joe Bruce",
        "desc":  "F1 Welcome to the Edge — campaign by Joe Bruce, Creative Director on Formula 1 at W+K London.",
        "image": "Welcome to the edge thumb.png",
    },
    "nike-like-a-lioness.html": {
        "url":   BASE + "/nike-like-a-lioness.html",
        "title": "Nike — Like a Lioness · Joe Bruce",
        "desc":  "Nike Like a Lioness — campaign celebrating women's football by Joe Bruce, Creative Director at Wieden+Kennedy London.",
        "image": "Like a lioness thumb.png",
    },
    "nike-human-race.html": {
        "url":   BASE + "/nike-human-race.html",
        "title": "Nike — Human Race · Joe Bruce",
        "desc":  "Nike Human Race — campaign by Joe Bruce, Creative Director on Nike at Wieden+Kennedy London.",
        "image": "Nike Human Race Thumb.png",
    },
    "sainsburys-christmas.html": {
        "url":   BASE + "/sainsburys-christmas.html",
        "title": "Sainsbury's — Home is Christmas · Joe Bruce",
        "desc":  "Sainsbury's Home is Christmas — campaign by Joe Bruce, Executive Creative Director.",
        "image": "Sainsburys thumb new.png",
    },
    "nike-berlin.html": {
        "url":   BASE + "/nike-berlin.html",
        "title": "Nike — Berlin Never Done · Joe Bruce",
        "desc":  "Nike Berlin Never Done — campaign by Joe Bruce, Creative Director on Nike at Wieden+Kennedy London.",
        "image": "Nike Fade Thumb.png",
    },
    "nike-kids-move.html": {
        "url":   BASE + "/nike-kids-move.html",
        "title": "Nike — Kids Move · Joe Bruce",
        "desc":  "Nike Kids Move — campaign by Joe Bruce, Creative Director on Nike at Wieden+Kennedy London.",
        "image": "Nike Kids Move Thumb.png",
    },
    "nike-rundown.html": {
        "url":   BASE + "/nike-rundown.html",
        "title": "Nike — The Rundown · Joe Bruce",
        "desc":  "Nike The Rundown — campaign by Joe Bruce, Creative Director on Nike at Wieden+Kennedy London.",
        "image": "Nike Rundown thumb.png",
    },
    "nike-ldnr.html": {
        "url":   BASE + "/nike-ldnr.html",
        "title": "Nike — Nothing Beats a Londoner · Joe Bruce",
        "desc":  "Nike Nothing Beats a Londoner — Cannes Grand Prix-winning campaign by Joe Bruce, Creative Director at Wieden+Kennedy London.",
        "image": "BARBER.gif",
    },
    "nike-wwc-2019.html": {
        "url":   BASE + "/nike-wwc-2019.html",
        "title": "Nike — Wall of Dreams · Joe Bruce",
        "desc":  "Nike Wall of Dreams — Women's World Cup 2019 campaign by Joe Bruce, Creative Director at Wieden+Kennedy London.",
        "image": "Nike WWC thumb.png",
    },
    "nike-hypervenom.html": {
        "url":   BASE + "/nike-hypervenom.html",
        "title": "Nike — Deceptive by Nature · Joe Bruce",
        "desc":  "Nike Deceptive by Nature — Hypervenom campaign by Joe Bruce, Creative Director on Nike at Wieden+Kennedy London.",
        "image": "Nike Deceptive by nature thumb.png",
    },
    "nike-we-run-with-it.html": {
        "url":   BASE + "/nike-we-run-with-it.html",
        "title": "Nike — We Run With It · Joe Bruce",
        "desc":  "Nike We Run With It — campaign by Joe Bruce, Creative Director on Nike at Wieden+Kennedy London.",
        "image": "Nike We Run With It thumb.png",
    },
    "camden-town-brewery-the-usual.html": {
        "url":   BASE + "/camden-town-brewery-the-usual.html",
        "title": "Camden Town Brewery — The Fresh Tour · Joe Bruce",
        "desc":  "Camden Town Brewery The Fresh Tour — campaign by Joe Bruce, Creative Director at Wieden+Kennedy London.",
        "image": "Camden Tour Thumb.png",
    },
    "f1-racing-reborn.html": {
        "url":   BASE + "/f1-racing-reborn.html",
        "title": "F1 — Racing Reborn · Joe Bruce",
        "desc":  "F1 Racing Reborn — campaign by Joe Bruce, helping relaunch Formula 1 as a global entertainment brand.",
        "image": "F1 racing reborn thumb.png",
    },
    "bud-light-box-heads.html": {
        "url":   BASE + "/bud-light-box-heads.html",
        "title": "Bud Light — Box Heads · Joe Bruce",
        "desc":  "Bud Light Box Heads — campaign by Joe Bruce, Executive Creative Director.",
        "image": "Bud light Box heads thumb.png",
    },
    "mcdonalds-family.html": {
        "url":   BASE + "/mcdonalds-family.html",
        "title": "McDonald's — Family · Joe Bruce",
        "desc":  "McDonald's Family — campaign by Joe Bruce, Creative Director.",
        "image": "McDonalds Family thumb.png",
    },
    "lurpak-hope.html": {
        "url":   BASE + "/lurpak-hope.html",
        "title": "Lurpak — Hope · Joe Bruce",
        "desc":  "Lurpak Hope — campaign by Joe Bruce, Executive Creative Director.",
        "image": "Lurpak Hope Thumb.png",
    },
    "national-art-fun.html": {
        "url":   BASE + "/national-art-fun.html",
        "title": "National Art Fund — Miss Nothing · Joe Bruce",
        "desc":  "National Art Fund Miss Nothing — campaign by Joe Bruce, Executive Creative Director.",
        "image": "National Art Fund thumb.png",
    },
    "paddy-power.html": {
        "url":   BASE + "/paddy-power.html",
        "title": "Paddy Power · Joe Bruce",
        "desc":  "Paddy Power 2012–2015 — award-winning creative work by Joe Bruce, Creative Director at Wieden+Kennedy London.",
        "image": "Paddy Power thumb.png",
    },
    "turkish-airlines-fly-africa.html": {
        "url":   BASE + "/turkish-airlines-fly-africa.html",
        "title": "Turkish Airlines — Fly Africa · Joe Bruce",
        "desc":  "Turkish Airlines Fly Africa — campaign by Joe Bruce, Executive Creative Director.",
        "image": "Fly africa thumb new.png",
    },
    "grolsch-beer.html": {
        "url":   BASE + "/grolsch-beer.html",
        "title": "Grolsch — Big Bold · Joe Bruce",
        "desc":  "Grolsch Big Bold — campaign by Joe Bruce, Executive Creative Director.",
        "image": "Grolsch Thumb.png",
    },
    "kennedys.html": {
        "url":   BASE + "/kennedys.html",
        "title": "The Kennedys · Joe Bruce",
        "desc":  "The Kennedys — Joe Bruce's award-winning internship programme at Wieden+Kennedy London, nurturing the next generation of creative talent.",
        "image": "Kennedys thumb gif.gif",
    },
    "more-stuff.html": {
        "url":   BASE + "/more-stuff.html",
        "title": "More Stuff · Joe Bruce",
        "desc":  "More work by Joe Bruce — Executive Creative Director and Creative Partner.",
        "image": "More Thumb.jpg",
    },
}

# ── JSON-LD for homepage only ──────────────────────────────────────────────────
HOMEPAGE_JSONLD = '''  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Joe Bruce",
    "jobTitle": "Executive Creative Director & Creative Partner",
    "url": "https://josephbruce.com",
    "sameAs": [
      "https://www.linkedin.com/in/joe-bruce-23833426/"
    ],
    "description": "Executive Creative Director and Creative Partner with award-winning work for Nike, Formula 1, Camden Town Brewery, Sainsbury's, Paddy Power and more. Cannes Grand Prix winner.",
    "knowsAbout": ["Advertising", "Creative Direction", "Copywriting", "Brand Strategy", "Nike", "Formula 1"]
  }
  </script>'''

def build_seo_block(page, data):
    img_url = BASE + "/" + quote(data["image"])
    lines = [
        f'  <meta name="description" content="{data["desc"]}" />',
        f'  <link rel="canonical" href="{data["url"]}" />',
        '',
        f'  <!-- Open Graph -->',
        f'  <meta property="og:type" content="website" />',
        f'  <meta property="og:url" content="{data["url"]}" />',
        f'  <meta property="og:title" content="{data["title"]}" />',
        f'  <meta property="og:description" content="{data["desc"]}" />',
        f'  <meta property="og:image" content="{img_url}" />',
        '',
        f'  <!-- Twitter Card -->',
        f'  <meta name="twitter:card" content="summary_large_image" />',
        f'  <meta name="twitter:url" content="{data["url"]}" />',
        f'  <meta name="twitter:title" content="{data["title"]}" />',
        f'  <meta name="twitter:description" content="{data["desc"]}" />',
        f'  <meta name="twitter:image" content="{img_url}" />',
    ]
    if page == "index.html":
        lines += ['', HOMEPAGE_JSONLD]
    return "\n".join(lines)

# ── Inject into each file ──────────────────────────────────────────────────────
SEO_GUARD = "<!-- SEO -->"

for filename, data in PAGES.items():
    filepath = os.path.join(FOLDER, filename)
    if not os.path.exists(filepath):
        print(f"  SKIP (not found): {filename}")
        continue

    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    if SEO_GUARD in html:
        print(f"  SKIP (already done): {filename}")
        continue

    seo_block = f"  {SEO_GUARD}\n" + build_seo_block(filename, data)

    # Insert after the viewport meta tag
    pattern = r'(<meta name="viewport"[^>]+>)'
    replacement = r'\1\n' + seo_block
    new_html, n = re.subn(pattern, replacement, html, count=1)

    if n == 0:
        print(f"  WARN (no viewport tag): {filename}")
        continue

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_html)

    print(f"  OK: {filename}")

print("\nDone.")
