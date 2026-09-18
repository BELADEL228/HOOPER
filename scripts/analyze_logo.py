#!/usr/bin/env python3
"""
FIRE STONE — Logo & Visual Identity Analyzer Script
Extracts dominant colors, secondary, accent, contrast, and visual styling characteristics
from a club/team logo. Outputs pure JSON to stdout for direct consumption by backend/frontend.
"""

from __future__ import annotations
import sys
import os
import json
import math
import io
import base64
import urllib.request

def to_hex(r: int, g: int, b: int) -> str:
    return f"#{int(r):02X}{int(g):02X}{int(b):02X}"

def parse_color(color_tuple: tuple) -> tuple[int, int, int]:
    return (int(color_tuple[0]), int(color_tuple[1]), int(color_tuple[2]))

def luminance(r: int, g: int, b: int) -> float:
    channels = [c / 255.0 for c in (r, g, b)]
    lin = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]

def contrast_ratio(c1: tuple[int, int, int], c2: tuple[int, int, int]) -> float:
    l1 = luminance(*c1)
    l2 = luminance(*c2)
    hi = max(l1, l2)
    lo = min(l1, l2)
    return round((hi + 0.05) / (lo + 0.05), 2)

def contrast_text(c: tuple[int, int, int]) -> str:
    return "#FFFFFF" if luminance(*c) < 0.42 else "#0F172A"

def color_distance(c1: tuple[int, int, int], c2: tuple[int, int, int]) -> float:
    return math.sqrt(sum((float(a) - float(b)) ** 2 for a, b in zip(c1, c2)))

def fallback_palette_from_name(seed_name: str) -> dict:
    """Deterministic, sober athletic basketball palette fallback."""
    hash_val = sum(ord(c) for c in seed_name) if seed_name else 42
    # Professional, sober athletic presets
    presets = [
        ("#BE123C", "#E11D48", "#94A3B8", "athletic_crimson", ["shield", "modern"]),
        ("#0F172A", "#1E293B", "#EA580C", "slate_court", ["geometric", "minimal"]),
        ("#1E3A8A", "#2563EB", "#94A3B8", "championship_blue", ["speed", "classic"]),
        ("#065F46", "#059669", "#D97706", "heritage_green", ["vitality", "crest"]),
        ("#334155", "#475569", "#E2E8F0", "monochrome_graphite", ["sharp", "minimal"]),
    ]
    p, s, a, style, shapes = presets[hash_val % len(presets)]
    return {
        "primaryColor": p,
        "secondaryColor": s,
        "accentColor": a,
        "contrastColor": "#FFFFFF",
        "backgroundColor": "#0A0D14",
        "surfaceColor": "#121621",
        "visualStyle": style,
        "shapeCharacteristics": shapes,
        "themeType": "dark",
        "palette": [p, s, a, "#121621", "#FFFFFF"],
        "contrastRatio": 6.2,
    }

def analyze_image_bytes(image_data: bytes, filename: str = "") -> dict:
    try:
        from PIL import Image
        image = Image.open(io.BytesIO(image_data))
        rgba = image.convert("RGBA").resize((128, 128))
        raw_colors: list[tuple[int, int, int]] = []
        alpha_pixels = 0
        total_pixels = 128 * 128

        for r, g, b, a in rgba.getdata():
            if a > 40:
                alpha_pixels += 1
                sat = max(r, g, b) - min(r, g, b)
                if sat > 14 or (a > 200 and (r > 235 or r < 25)):
                    raw_colors.append((r, g, b))

        if not raw_colors:
            return fallback_palette_from_name(filename)

        # Quantize colors into 7 dominant clusters
        pal_img = Image.new("RGB", (len(raw_colors), 1))
        for i, c in enumerate(raw_colors):
            pal_img.putpixel((i, 0), c)
        quantized = pal_img.quantize(colors=7).convert("RGB")
        candidates = [quantized.getpixel((i, 0)) for i in range(quantized.width)]

        freq: dict[tuple[int, int, int], int] = {}
        for c in candidates:
            freq[c] = freq.get(c, 0) + 1

        sorted_colors = sorted(freq.keys(), key=lambda c: freq[c], reverse=True)
        primary = sorted_colors[0]
        secondary = next((c for c in sorted_colors[1:] if color_distance(primary, c) > 40), primary)
        accent = next((c for c in sorted_colors[1:] if color_distance(primary, c) > 75 and color_distance(secondary, c) > 40), secondary)

        lum = luminance(*primary)
        dark_theme = lum < 0.48
        bg = (10, 13, 20) if dark_theme else (248, 250, 252)
        surface = (18, 22, 33) if dark_theme else (255, 255, 255)

        alpha_ratio = alpha_pixels / total_pixels
        shapes = []
        if alpha_ratio < 0.45:
            shapes.append("isolated_crest")
        elif alpha_ratio < 0.70:
            shapes.append("circular_emblem")
        else:
            shapes.append("full_badge")

        return {
            "primaryColor": to_hex(*primary),
            "secondaryColor": to_hex(*secondary),
            "accentColor": to_hex(*accent),
            "contrastColor": contrast_text(primary),
            "backgroundColor": to_hex(*bg),
            "surfaceColor": to_hex(*surface),
            "visualStyle": "modern_athletic" if dark_theme else "clean_classic",
            "shapeCharacteristics": shapes,
            "themeType": "dark" if dark_theme else "light",
            "palette": [to_hex(*c) for c in sorted_colors[:5]],
            "contrastRatio": contrast_ratio(primary, bg),
            "homeKit": {
                "jerseyBase": to_hex(*primary),
                "jerseyTrims": to_hex(*secondary),
                "jerseyAccent": to_hex(*accent),
                "textColor": contrast_text(primary),
                "shortsBase": to_hex(*primary if dark_theme else surface),
                "pattern": "solid",
            },
            "awayKit": {
                "jerseyBase": to_hex(*(248, 250, 252) if dark_theme else (15, 23, 42)),
                "jerseyTrims": to_hex(*primary),
                "jerseyAccent": to_hex(*secondary),
                "textColor": contrast_text((248, 250, 252) if dark_theme else (15, 23, 42)),
                "shortsBase": to_hex(*(248, 250, 252) if dark_theme else (15, 23, 42)),
                "pattern": "solid",
            }
        }
    except Exception:
        return fallback_palette_from_name(filename)

def main():
    if len(sys.argv) < 2:
        # No arguments: return fallback immediately without hanging on stdin
        print(json.dumps(fallback_palette_from_name("default"), indent=2))
        return

    target = sys.argv[1].strip()

    # Check for base64 data URL
    if target.startswith("data:image"):
        try:
            b64_data = target.split(",", 1)[1] if "," in target else target
            data = base64.b64decode(b64_data)
            result = analyze_image_bytes(data, "base64_image")
            print(json.dumps(result, indent=2))
            return
        except Exception:
            pass

    # Check for HTTP/HTTPS URL
    if target.startswith("http://") or target.startswith("https://"):
        try:
            req = urllib.request.Request(target, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = resp.read()
            result = analyze_image_bytes(data, os.path.basename(target))
            print(json.dumps(result, indent=2))
            return
        except Exception:
            pass

    # Check for local file path
    if os.path.exists(target):
        try:
            with open(target, "rb") as f:
                data = f.read()
            result = analyze_image_bytes(data, os.path.basename(target))
            print(json.dumps(result, indent=2))
            return
        except Exception:
            pass

    # Fallback deterministically on the target string (e.g. club name)
    result = fallback_palette_from_name(target)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
