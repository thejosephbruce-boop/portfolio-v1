#!/usr/bin/env python3
"""Generate <slug>.html at the site root for every project in data/projects.json.

Each project carries an ordered list of media `blocks`, mirroring the layout of
the original josephbruce.com case studies:

    {"layout": "full",      "items": [...]}                  full-bleed
    {"layout": "contained", "items": [...]}                  centred, max-width
    {"layout": "grid", "cols": 3, "aspect": "1 / 1", ...}     n-up grid

Items are one of:
    {"type": "image", "src": ...}
    {"type": "video", "hls": ...,  "poster": ...}   Squarespace HLS stream
    {"type": "video", "mp4": ...,  "poster": ...}   local mp4
    {"type": "embed", "src": ...}                   Vimeo / YouTube iframe

Run after editing data/projects.json:
    python3 build_work_pages.py
"""
import html
import json
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(ROOT, "data", "projects.json")
TEMPLATE_PATH = os.path.join(ROOT, "templates", "project.html")
OUT_DIR = ROOT  # project pages sit at the site root, matching the live URLs


def render_image(item, alt):
    return f'<img src="{item["src"]}" alt="{alt}" loading="lazy" />'


def render_video(item):
    poster = item.get("poster") or ""
    if item.get("mp4"):
        source = f'data-mp4="{item["mp4"]}"'
    else:
        source = f'data-hls="{item["hls"]}"'
    # Some films open on a slate; `start` skips to the first real frame.
    start = f' data-start="{item["start"]}"' if item.get("start") else ""
    return (
        f'<div class="video-wrap" {source}{start}>'
        f'<video poster="{poster}" preload="none" playsinline></video>'
        f'<div class="video-overlay"><div class="play-btn"></div></div>'
        f"</div>"
    )


def render_embed(item):
    return (
        f'<div class="embed-wrap"><iframe src="{item["src"]}" loading="lazy" '
        f'allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>'
    )


def render_item(item, alt):
    kind = item.get("type")
    if kind == "image":
        return render_image(item, alt)
    if kind == "video":
        return render_video(item)
    if kind == "embed":
        return render_embed(item)
    return ""


def render_block(block, alt):
    layout = block.get("layout", "full")
    items = block.get("items", [])
    if not items:
        return ""

    inner = "\n".join(f"    {render_item(it, alt)}" for it in items)

    if layout == "grid":
        classes = "media-grid" + (" is-contained" if block.get("contained") else "")
        style = f'--cols: {block.get("cols", 2)};'
        if block.get("aspect"):
            style += f' --aspect: {block["aspect"]};'
        return f'  <div class="{classes}" style="{style}">\n{inner}\n  </div>'

    if layout == "contained":
        return f'  <div class="media-contained">\n{inner}\n  </div>'

    return f'  <div class="media-full">\n{inner}\n  </div>'


def meta_description(project):
    text = project.get("description") or ""
    if len(text) > 155:
        text = text[:155].rsplit(" ", 1)[0] + "…"
    return text


def main():
    with open(DATA_PATH, encoding="utf-8") as f:
        projects = json.load(f)
    with open(TEMPLATE_PATH, encoding="utf-8") as f:
        template = f.read()

    os.makedirs(OUT_DIR, exist_ok=True)

    for p in projects:
        title = html.escape(p["title"])
        alt = title

        # `prepend_blocks` is hand-authored media that sits above the imported
        # stack. The V1 importer only ever rewrites `blocks`, so anything here
        # survives a re-import.
        extra = p.get("prepend_blocks", [])

        blocks = p.get("blocks")
        if not blocks:
            # Fall back to the flat media lists for any project not yet imported.
            blocks = []
            for v in p.get("videos", []):
                item = dict(v)
                if "playlist_url" in item:
                    item = {"type": "video", "hls": v["playlist_url"], "poster": v.get("thumbnail_url")}
                elif item.get("type") == "mp4":
                    item = {"type": "video", "mp4": v["src"], "poster": v.get("poster"),
                            "start": v.get("start")}
                blocks.append({"layout": "full", "items": [item]})
            for src in p.get("images", []) + p.get("gifs", []):
                blocks.append({"layout": "full", "items": [{"type": "image", "src": src}]})

        blocks_html = "\n\n".join(
            b for b in (render_block(x, alt) for x in extra + blocks) if b
        )

        desc = p.get("description", "")
        desc_html = (
            f'  <div class="project-desc">\n    <p>{html.escape(desc)}</p>\n  </div>'
            if desc else ""
        )

        og = p.get("hero", "")
        page = (
            template.replace("{{SLUG}}", p["slug"])
            .replace("{{TITLE}}", title)
            .replace("{{META_DESC}}", html.escape(meta_description(p)))
            .replace("{{OG_IMAGE}}", og)
            .replace("{{DESC}}", desc_html)
            .replace("{{BLOCKS}}", blocks_html)
        )

        with open(os.path.join(OUT_DIR, f"{p['slug']}.html"), "w", encoding="utf-8") as f:
            f.write(page)

    print(f"Generated {len(projects)} project pages in {OUT_DIR}")
    missing = [p["slug"] for p in projects if not p.get("blocks")]
    if missing:
        print(f"  (no imported blocks, used flat media lists: {', '.join(missing)})")


if __name__ == "__main__":
    main()
