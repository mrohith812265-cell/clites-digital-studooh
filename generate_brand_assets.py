#!/usr/bin/env python3
"""Rebuild the browser favicon from the current Clites leaf mark.

The site's three-leaf lockups are supplied assets and should not be redrawn:
    img/clites-logo-white.png
    img/clites-logo-black.png
    img/clites-leaf.png

This helper keeps the legacy favicon paths valid without touching the founder
portrait or any other site image. Run it after replacing img/clites-leaf.png.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
LEAF = ROOT / "img" / "clites-leaf.png"


def main() -> None:
    if not LEAF.exists():
        raise SystemExit(f"Missing leaf mark: {LEAF}")

    with Image.open(LEAF) as source:
        leaf = source.convert("RGBA")

    # Keep the mark on a transparent square canvas so ICO resizing never
    # stretches or crops it.
    side = max(leaf.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(leaf, ((side - leaf.width) // 2, (side - leaf.height) // 2), leaf)

    icon = canvas.resize((48, 48), Image.Resampling.LANCZOS)
    icon.save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    icon.resize((32, 32), Image.Resampling.LANCZOS).save(
        ROOT / "img" / "favicon.png", "PNG"
    )

    print("Rebuilt favicon.ico and img/favicon.png from img/clites-leaf.png")


if __name__ == "__main__":
    main()
