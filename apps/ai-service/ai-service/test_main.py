"""
Tests du service FastAPI FIRE STONE AI — analyse de logo et génération de thème.

Utilise TestClient de FastAPI (basé sur httpx) pour des tests in-process,
sans démarrer un serveur HTTP réel.
"""
from __future__ import annotations

import io
import struct
import zlib
from typing import Any

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def make_png(width: int = 32, height: int = 32, r: int = 255, g: int = 42, b: int = 59) -> bytes:
    """Génère un PNG synthétique valide avec une couleur unie."""

    def _chunk(name: bytes, data: bytes) -> bytes:
        c = struct.pack(">I", len(data)) + name + data
        return c + struct.pack(">I", zlib.crc32(name + data) & 0xFFFFFFFF)

    # IHDR : largeur, hauteur, bit depth=8, colortype=2 (RGB)
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    ihdr = _chunk(b"IHDR", ihdr_data)

    # IDAT : données de pixels non compressées (RGB)
    raw_rows = b""
    for _ in range(height):
        row = bytes([0]) + bytes([r, g, b] * width)  # filtre = None (0)
        raw_rows += row
    compressed = zlib.compress(raw_rows, 9)
    idat = _chunk(b"IDAT", compressed)

    # IEND
    iend = _chunk(b"IEND", b"")

    return b"\x89PNG\r\n\x1a\n" + ihdr + idat + iend


def make_red_png() -> bytes:
    """PNG 32x32 rouge vif (#FF2A3B)."""
    return make_png(r=255, g=42, b=59)


def make_green_png() -> bytes:
    """PNG 32x32 vert (#059669)."""
    return make_png(r=5, g=150, b=105)


# ─── Tests : GET /health ──────────────────────────────────────────────────────

class TestHealth:
    def test_status_200(self) -> None:
        res = client.get("/health")
        assert res.status_code == 200

    def test_status_ok(self) -> None:
        res = client.get("/health")
        data = res.json()
        assert data["status"] == "ok"

    def test_service_name(self) -> None:
        res = client.get("/health")
        data = res.json()
        assert "service" in data
        assert "team-designer" in data["service"]

    def test_version_present(self) -> None:
        res = client.get("/health")
        data = res.json()
        assert "version" in data
        assert data["version"]


# ─── Tests : POST /api/theme/analyze-logo — erreurs ──────────────────────────

class TestAnalyzeLogoErrors:
    def test_no_file_returns_422(self) -> None:
        """Sans fichier → 422 Unprocessable Entity."""
        res = client.post("/api/theme/analyze-logo")
        assert res.status_code == 422

    def test_wrong_content_type_returns_415(self) -> None:
        """Fichier PDF → 415 Unsupported Media Type."""
        res = client.post(
            "/api/theme/analyze-logo",
            files={"logo": ("doc.pdf", b"fake-pdf-content", "application/pdf")},
        )
        assert res.status_code == 415

    def test_corrupted_image_returns_400(self) -> None:
        """Données PNG corrompues → 400 Bad Request."""
        fake_png = b"\x89PNG\r\n\x1a\nFAKE_DATA_NOT_A_REAL_PNG"
        res = client.post(
            "/api/theme/analyze-logo",
            files={"logo": ("broken.png", fake_png, "image/png")},
        )
        assert res.status_code == 400

    def test_oversized_file_returns_413(self) -> None:
        """Fichier > 8 Mo → 413 Request Entity Too Large."""
        big_data = b"A" * (8 * 1024 * 1024 + 1)
        res = client.post(
            "/api/theme/analyze-logo",
            files={"logo": ("big.png", big_data, "image/png")},
        )
        assert res.status_code == 413


# ─── Tests : POST /api/theme/analyze-logo — succès ───────────────────────────

class TestAnalyzeLogoSuccess:
    def setup_method(self) -> None:
        """Effectuer l'analyse une seule fois pour les tests de cette classe."""
        png_data = make_red_png()
        res = client.post(
            "/api/theme/analyze-logo",
            files={"logo": ("logo-rouge.png", png_data, "image/png")},
        )
        assert res.status_code == 200, f"Unexpected status: {res.status_code} — {res.text}"
        self.data: dict[str, Any] = res.json()

    # --- Structure de la réponse ---

    def test_response_has_filename(self) -> None:
        assert "filename" in self.data
        assert self.data["filename"] == "logo-rouge.png"

    def test_response_has_tokens(self) -> None:
        assert "tokens" in self.data
        assert isinstance(self.data["tokens"], dict)

    # --- Champs obligatoires du thème ---

    REQUIRED_FIELDS = [
        "primary", "secondary", "accent",
        "background", "surface",
        "textPrimary", "textSecondary", "border",
        "gradient", "shadow", "glow",
        "themeType",
    ]

    def test_all_required_fields_present(self) -> None:
        tokens = self.data["tokens"]
        for field in self.REQUIRED_FIELDS:
            assert field in tokens, f"Champ manquant : {field}"

    def test_primary_is_hex(self) -> None:
        import re
        primary = self.data["tokens"]["primary"]
        assert re.match(r"^#[0-9A-Fa-f]{6}$", primary), f"primary n'est pas un hex valide : {primary}"

    def test_secondary_is_hex(self) -> None:
        import re
        secondary = self.data["tokens"]["secondary"]
        assert re.match(r"^#[0-9A-Fa-f]{6}$", secondary)

    def test_theme_type_valid(self) -> None:
        assert self.data["tokens"]["themeType"] in ("dark", "light")

    def test_palette_present(self) -> None:
        tokens = self.data["tokens"]
        assert "palette" in tokens
        assert isinstance(tokens["palette"], list)
        assert len(tokens["palette"]) > 0

    def test_contrast_ratio_positive(self) -> None:
        tokens = self.data["tokens"]
        assert "contrastRatio" in tokens
        assert tokens["contrastRatio"] > 0

    # --- Maillots (kits) ---

    def test_home_kit_present(self) -> None:
        tokens = self.data["tokens"]
        assert "homeKit" in tokens
        kit = tokens["homeKit"]
        assert "jerseyBase" in kit
        assert "jerseyTrims" in kit
        assert "jerseyAccent" in kit
        assert "textColor" in kit
        assert "shortsBase" in kit
        assert "pattern" in kit

    def test_away_kit_present(self) -> None:
        tokens = self.data["tokens"]
        assert "awayKit" in tokens
        kit = tokens["awayKit"]
        assert "jerseyBase" in kit

    def test_away_kit_pattern_stripes(self) -> None:
        """Le kit extérieur a toujours le pattern 'stripes'."""
        away = self.data["tokens"]["awayKit"]
        assert away["pattern"] == "stripes"

    # --- Cohérence des couleurs extraites ---

    def test_primary_color_is_reddish(self) -> None:
        """Pour un PNG rouge, la couleur primaire devrait être rougeâtre."""
        import re
        primary = self.data["tokens"]["primary"]
        match = re.match(r"^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$", primary)
        assert match is not None
        r_val = int(match.group(1), 16)
        g_val = int(match.group(2), 16)
        b_val = int(match.group(3), 16)
        # Le rouge doit être dominant
        assert r_val > g_val, f"R ({r_val}) devrait être > G ({g_val})"
        assert r_val > b_val, f"R ({r_val}) devrait être > B ({b_val})"

    def test_theme_type_dark_for_red(self) -> None:
        """Un rouge vif (#FF2A3B) a une luminance < 0.42 → thème dark."""
        assert self.data["tokens"]["themeType"] == "dark"


# ─── Tests : JPEG et WEBP aussi acceptés ─────────────────────────────────────

class TestAnalyzeLogoFormats:
    def test_jpeg_accepted(self) -> None:
        """Un JPEG minimal valide doit être accepté."""
        # JPEG minimal valide (1x1 pixel blanc)
        jpeg_minimal = bytes([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
            0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
            0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
            0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
            0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
            0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
            0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
            0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
            0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0xF5, 0x0F,
            0xFF, 0xD9,
        ])
        res = client.post(
            "/api/theme/analyze-logo",
            files={"logo": ("test.jpg", jpeg_minimal, "image/jpeg")},
        )
        # Accepté (200) ou image invalide (400) mais pas 415
        assert res.status_code in (200, 400)

    def test_png_with_valid_red_image(self) -> None:
        """Un PNG bien formé doit retourner 200."""
        res = client.post(
            "/api/theme/analyze-logo",
            files={"logo": ("red-logo.png", make_red_png(), "image/png")},
        )
        assert res.status_code == 200

    def test_png_green_also_returns_200(self) -> None:
        """Un PNG vert doit aussi retourner 200."""
        res = client.post(
            "/api/theme/analyze-logo",
            files={"logo": ("green-logo.png", make_green_png(), "image/png")},
        )
        assert res.status_code == 200
