from __future__ import annotations

import io
import math
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

app = FastAPI(title="FIRE STONE AI Team Designer", version="1.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000", "http://127.0.0.1:5173", "http://127.0.0.1:5000", "*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

MAX_IMAGE_BYTES = 8 * 1024 * 1024


def to_hex(color: tuple[int, int, int]) -> str:
    return "#%02X%02X%02X" % (int(color[0]), int(color[1]), int(color[2]))


def luminance(color: tuple[int, int, int]) -> float:
    red, green, blue = [channel / 255.0 for channel in color]
    channels = [
        value / 12.92 if value <= 0.03928 else ((value + 0.055) / 1.055) ** 2.4
        for value in (red, green, blue)
    ]
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]


def contrast_ratio(color_a: tuple[int, int, int], color_b: tuple[int, int, int]) -> float:
    lum_a = luminance(color_a)
    lum_b = luminance(color_b)
    l1 = max(lum_a, lum_b)
    l2 = min(lum_a, lum_b)
    return round((l1 + 0.05) / (l2 + 0.05), 2)


def contrast_text(color: tuple[int, int, int]) -> str:
    return "#FFFFFF" if luminance(color) < 0.42 else "#0F172A"


def color_distance(left: tuple[int, int, int], right: tuple[int, int, int]) -> float:
    return math.sqrt(sum((float(a) - float(b)) ** 2 for a, b in zip(left, right)))


def analyze_image(image: Image.Image) -> dict[str, Any]:
    rgba = image.convert("RGBA").resize((128, 128))
    raw_colors: list[tuple[int, int, int]] = []
    
    # Échantillonnage en ignorant les pixels transparents et quasi-neutres
    for red, green, blue, alpha in rgba.getdata():
        if alpha > 35:
            # Rejeter les gris extrêmes quasi invisibles sauf s'il n'y a rien d'autre
            saturation = max(red, green, blue) - min(red, green, blue)
            if saturation > 12 or (alpha > 200 and (red > 240 or red < 20)):
                raw_colors.append((red, green, blue))
    
    if not raw_colors:
        raw_colors = [(255, 42, 59), (255, 184, 0), (56, 189, 248), (15, 23, 42)]

    # Quantification de palette
    palette_image = Image.new("RGB", (len(raw_colors), 1))
    for index, color in enumerate(raw_colors):
        palette_image.putpixel((index, 0), color)
    quantized_palette = palette_image.quantize(colors=7).convert("RGB")
    
    candidates: list[tuple[int, int, int]] = [
        quantized_palette.getpixel((index, 0)) for index in range(quantized_palette.width)
    ]
    
    # Compter les occurrences pour trier par fréquence
    freq: dict[tuple[int, int, int], int] = {}
    for c in candidates:
        freq[c] = freq.get(c, 0) + 1
    
    sorted_unique = sorted(freq.keys(), key=lambda c: freq[c], reverse=True)
    
    primary = sorted_unique[0]
    secondary = next((c for c in sorted_unique[1:] if color_distance(primary, c) > 40), primary)
    accent = next((c for c in sorted_unique[1:] if color_distance(primary, c) > 75 and color_distance(secondary, c) > 40), secondary)
    
    # Si trop proche, générer une couleur accent vibrante
    if color_distance(primary, accent) < 30:
        accent = (56, 189, 248) if luminance(primary) < 0.5 else (255, 42, 59)

    dark = luminance(primary) < 0.45
    background = (9, 10, 15) if dark else (248, 250, 252)
    surface = (18, 22, 33) if dark else (255, 255, 255)
    border = tuple(round((channel * 0.4 + background[index] * 0.6)) for index, channel in enumerate(primary))

    palette_hex = [to_hex(c) for c in sorted_unique[:5]]

    # Configuration des maillots virtuels (Home & Away kits)
    home_is_dark = luminance(primary) < 0.5
    home_kit = {
        "jerseyBase": to_hex(primary),
        "jerseyTrims": to_hex(secondary),
        "jerseyAccent": to_hex(accent),
        "textColor": contrast_text(primary),
        "shortsBase": to_hex(primary if home_is_dark else surface),
        "pattern": "gradient",
    }

    away_base = (248, 250, 252) if home_is_dark else (15, 23, 42)
    away_kit = {
        "jerseyBase": to_hex(away_base),
        "jerseyTrims": to_hex(primary),
        "jerseyAccent": to_hex(secondary),
        "textColor": contrast_text(away_base),
        "shortsBase": to_hex(away_base),
        "pattern": "stripes",
    }

    return {
        "primary": to_hex(primary),
        "secondary": to_hex(secondary),
        "accent": to_hex(accent),
        "background": to_hex(background),
        "surface": to_hex(surface),
        "textPrimary": contrast_text(background),
        "textSecondary": to_hex((203, 213, 225) if dark else (71, 85, 105)),
        "border": to_hex(border),
        "gradient": f"linear-gradient(135deg, {to_hex(primary)}, {to_hex(secondary)})",
        "matchdayGradient": f"radial-gradient(circle at 20% 20%, {to_hex(primary)}40 0%, {to_hex(background)} 75%)",
        "shadow": f"0 16px 40px {to_hex(primary)}55",
        "glow": f"0 0 24px {to_hex(accent)}66",
        "themeType": "dark" if dark else "light",
        "palette": palette_hex,
        "contrastRatio": contrast_ratio(primary, background),
        "homeKit": home_kit,
        "awayKit": away_kit,
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "team-designer", "version": "1.1.0"}


@app.post("/api/theme/analyze-logo")
async def analyze_logo(logo: UploadFile = File(...)) -> dict[str, Any]:
    if logo.content_type not in {"image/png", "image/jpeg", "image/webp", "image/svg+xml"}:
        raise HTTPException(status_code=415, detail="Format accepté : PNG, JPEG, WEBP.")
    data = await logo.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Logo limité à 8 Mo.")
    try:
        image = Image.open(io.BytesIO(data))
        image.load()
    except (UnidentifiedImageError, OSError) as error:
        raise HTTPException(status_code=400, detail="Image invalide ou corrompue.") from error
    return {"filename": logo.filename, "tokens": analyze_image(image)}
