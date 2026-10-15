"""Packages the web build as the author's preview page on claude.ai.

The preview is published as an Artifact (a private claude.ai page). It can
only carry a handful of files, so the 336 card pictures are folded into the
app's script as data, and the page's paths are made relative.

    npm run preview        (builds dist/, then runs this)

Writes preview/: page.html, app.js and the fonts. Publish it with the
Artifact tool: file_path preview/page.html, url from HANDOFF.md, and
files {"app.js": "preview/app.js"} (add the fonts only on a first publish).
"""

import base64
import glob
import os
import re
import shutil

DIST = "dist"
OUT = "preview"


def main():
    scripts = glob.glob(os.path.join(DIST, "_expo/static/js/web/index-*.js"))
    if len(scripts) != 1:
        raise SystemExit("Run `npx expo export --platform web` first (expected one script in dist/).")
    js = open(scripts[0], encoding="utf-8").read()
    count = 0

    def inline(match):
        nonlocal count
        count += 1
        data = open(DIST + match.group(1), "rb").read()
        return '"data:image/webp;base64,' + base64.b64encode(data).decode()

    js = re.sub(r'"(/assets/assets/decks/[^"]+\.webp)', inline, js)
    js = js.replace('"/assets/node_modules', '"./assets/node_modules')

    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "app.js"), "w", encoding="utf-8") as f:
        f.write(js)
    shutil.copy("tools/preview/page.html", os.path.join(OUT, "page.html"))
    fonts = glob.glob(os.path.join(DIST, "assets/node_modules/**/*.ttf"), recursive=True)
    for font in fonts:
        dst = os.path.join(OUT, os.path.relpath(font, DIST))
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy(font, dst)
    size = os.path.getsize(os.path.join(OUT, "app.js")) / 1e6
    print(f"preview/: {count} card pictures inlined, app.js {size:.1f} MB, {len(fonts)} fonts")


if __name__ == "__main__":
    main()
