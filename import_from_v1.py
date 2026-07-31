#!/usr/bin/env python3
"""One-off importer: pull the case-study *media* out of the original
josephbruce.com pages (Portfolio V1) into data/projects.json.

Media only — titles, body copy, navigation and buttons stay as V2 has them.
For each project it records `blocks`: the ordered stack of images, films and
embeds, with each block's layout, column count and child aspect-ratio read
from that page's own CSS so the arrangement matches the source.

Locally-hosted images/posters referenced by V1 are copied into
assets/media/ (recompressed if oversized) and repointed.

    python3 import_from_v1.py
"""
import json
import os
import re
import shutil
from html.parser import HTMLParser
from urllib.parse import unquote

ROOT = os.path.dirname(os.path.abspath(__file__))
V1 = os.path.abspath(os.path.join(ROOT, "..", "Portfolio V1"))
DATA_PATH = os.path.join(ROOT, "data", "projects.json")
MEDIA_DIR = os.path.join(ROOT, "assets", "media")

MAX_DIM = 2000       # generous for full-bleed hero imagery
JPEG_QUALITY = 82

# V2 slug -> V1 filename (V1 filenames match slugs except where noted)
SLUG_TO_V1 = {
    "nike-own-the-floor": "nike-own-the-floor.html",
    "nike-never-fade": "nike-never-fade.html",
    "jamshed": "jamshed.html",
    "sainsburys-christmas": "sainsburys-christmas.html",
    "nike-a-beautiful-run": "nike-a-beautiful-run.html",
    "camden-town-brewery-recall": "camden-town-brewery-recall.html",
    "nike-ldnr": "nike-ldnr.html",
    "f1-welcome-to-the-edge": "f1-welcome-to-the-edge.html",
    "nike-like-a-lioness": "nike-like-a-lioness.html",
    "nike-human-race": "nike-human-race.html",
    "nike-berlin": "nike-berlin.html",
    "nike-kids-move": "nike-kids-move.html",
    "nike-rundown": "nike-rundown.html",
    "nike-wwc-2019": "nike-wwc-2019.html",
    "nike-hypervenom": "nike-hypervenom.html",
    "nike-we-run-with-it": "nike-we-run-with-it.html",
    "camden-town-brewery-the-usual": "camden-town-brewery-the-usual.html",
    "f1-racing-reborn": "f1-racing-reborn.html",
    "bud-light-box-heads": "bud-light-box-heads.html",
    "mcdonalds-family": "mcdonalds-family.html",
    "lurpak-hope": "lurpak-hope.html",
    "national-art-fund": "national-art-fun.html",
    "paddy-power": "paddy-power.html",
    # Off the homepage grid ("hidden"), but kept live and linked from bio.html.
    "turkish-airlines-fly-africa": "turkish-airlines-fly-africa.html",
    "grolsch-beer": "grolsch-beer.html",
    "kennedys": "kennedys.html",
}


# ── parsing ──────────────────────────────────────────────────────────────
class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = self.client = self.brief = None
        self.blocks = []
        self._target = None
        self._buf = []
        self._block = None
        self._block_depth = 0
        self._vw = None
        self._vw_depth = 0
        self._depth = 0

    def _start_text(self, target):
        self._target, self._buf = target, []

    def _end_text(self):
        if self._target:
            setattr(self, self._target, re.sub(r"\s+", " ", "".join(self._buf)).strip())
            self._target, self._buf = None, []

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        cls = (d.get("class") or "").split()

        if tag == "div":
            self._depth += 1
            if self._block is not None and "video-wrap" in cls:
                self._vw = {"type": "video", "hls": d.get("data-hls"), "poster": None}
                self._vw_depth = self._depth
            elif self._block is None:
                media_cls = next((c for c in cls if c.startswith("media-")), None)
                if media_cls:
                    self._block = {"class": media_cls, "items": []}
                    self._block_depth = self._depth
        elif tag == "img" and self._block is not None and d.get("src"):
            self._block["items"].append({"type": "image", "src": d["src"]})
        elif tag == "video" and self._vw is not None:
            self._vw["poster"] = d.get("poster")
        elif tag == "iframe" and self._block is not None and d.get("src"):
            self._block["items"].append({"type": "embed", "src": d["src"]})
        elif tag == "h1" and "project-title" in cls:
            self._start_text("title")
        elif tag == "p" and "project-client" in cls:
            self._start_text("client")
        elif tag == "p" and "project-brief" in cls:
            self._start_text("brief")

    def handle_endtag(self, tag):
        if tag in ("h1", "p"):
            self._end_text()
        if tag == "div":
            if self._vw is not None and self._depth == self._vw_depth:
                self._block["items"].append(self._vw)
                self._vw = None
            if self._block is not None and self._depth == self._block_depth:
                if self._block["items"]:
                    self.blocks.append(self._block)
                self._block = None
            self._depth -= 1

    def handle_data(self, data):
        if self._target:
            self._buf.append(data)


def css_geometry(style_text, cls):
    """Read declared column count + child aspect-ratio from the page's own CSS."""
    cols, aspect = 1, None
    m = re.search(r"\.%s\s*\{([^}]*)\}" % re.escape(cls), style_text)
    if m:
        body = m.group(1)
        rep = re.search(r"grid-template-columns:\s*repeat\((\d+)", body)
        if rep:
            cols = int(rep.group(1))
        else:
            plain = re.search(r"grid-template-columns:\s*([^;]+);", body)
            if plain:
                cols = len(plain.group(1).split())
    for child in ("img", "video", ".video-wrap video", "iframe"):
        m2 = re.search(r"\.%s\s+%s\s*\{([^}]*)\}" % (re.escape(cls), re.escape(child)), style_text)
        if m2:
            ar = re.search(r"aspect-ratio:\s*([0-9.]+)\s*/\s*([0-9.]+)", m2.group(1))
            if ar:
                aspect = f"{ar.group(1)} / {ar.group(2)}"
                break
    return cols, aspect


def normalise(block):
    """V1's many bespoke class names -> a small layout vocabulary."""
    cls = block["class"]
    cols, aspect = block["cols"], block["aspect"]
    contained = "contained" in cls

    if cls in ("media-full",):
        return {"layout": "full", "items": block["items"]}
    if cls.startswith("media-contained"):
        return {"layout": "contained", "items": block["items"]}

    out = {"layout": "grid", "cols": max(cols, 1), "items": block["items"]}
    if aspect:
        out["aspect"] = aspect
    if contained:
        out["contained"] = True
    # A single item in a "grid" is really just one block.
    if len(block["items"]) == 1 and out["cols"] <= 1:
        return {"layout": "contained" if contained else "full", "items": block["items"]}
    return out


# ── local asset handling ─────────────────────────────────────────────────
def localise(path, cache):
    """Copy a V1-local asset into assets/media/, compressing big images."""
    if not path or path.startswith(("http://", "https://")):
        return path
    if path in cache:
        return cache[path]

    src = os.path.join(V1, unquote(path))
    if not os.path.isfile(src):
        print(f"    ! missing local asset: {path}")
        cache[path] = path
        return path

    os.makedirs(MEDIA_DIR, exist_ok=True)
    base = re.sub(r"[^a-z0-9]+", "-", os.path.splitext(unquote(path))[0].lower()).strip("-")
    ext = os.path.splitext(src)[1].lower()

    if ext in (".png", ".jpg", ".jpeg", ".webp"):
        try:
            from PIL import Image
            im = Image.open(src).convert("RGB")
            w, h = im.size
            if max(w, h) > MAX_DIM:
                s = MAX_DIM / max(w, h)
                im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
            out_name = f"{base}.jpg"
            im.save(os.path.join(MEDIA_DIR, out_name), "JPEG",
                    quality=JPEG_QUALITY, optimize=True)
        except Exception as exc:                     # noqa: BLE001
            print(f"    ! could not recompress {path} ({exc}); copying as-is")
            out_name = f"{base}{ext}"
            shutil.copy2(src, os.path.join(MEDIA_DIR, out_name))
    else:
        out_name = f"{base}{ext}"
        shutil.copy2(src, os.path.join(MEDIA_DIR, out_name))

    rel_path = f"assets/media/{out_name}"
    cache[path] = rel_path
    return rel_path


def main():
    with open(DATA_PATH, encoding="utf-8") as f:
        projects = json.load(f)

    cache = {}
    imported = 0

    for p in projects:
        fname = SLUG_TO_V1.get(p["slug"])
        if not fname:
            print(f"{p['slug']}: no V1 page — leaving as-is")
            continue

        path = os.path.join(V1, fname)
        with open(path, encoding="utf-8") as f:
            page = f.read()
        style_text = "\n".join(re.findall(r"<style>(.*?)</style>", page, re.S))
        body = page.split("<body>", 1)[1]

        parser = PageParser()
        parser.feed(body)

        blocks = []
        for b in parser.blocks:
            b["cols"], b["aspect"] = css_geometry(style_text, b["class"])
            nb = normalise(b)
            for item in nb["items"]:
                if item["type"] == "image":
                    item["src"] = localise(item["src"], cache)
                elif item["type"] == "video":
                    item["poster"] = localise(item.get("poster"), cache)
            blocks.append(nb)

        # Media only — titles, copy and page furniture stay as V2 has them.
        p["blocks"] = blocks

        # The flat media lists are superseded by `blocks`.
        for key in ("images", "gifs", "videos"):
            p.pop(key, None)

        n_items = sum(len(b["items"]) for b in blocks)
        print(f"{p['slug']:32s} {len(blocks):2d} blocks / {n_items:3d} media items")
        imported += 1

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(projects, f, indent=2, ensure_ascii=False)

    print(f"\nImported {imported} of {len(projects)} projects into {DATA_PATH}")


if __name__ == "__main__":
    main()
