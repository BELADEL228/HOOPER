/**
 * Tests unitaires des utilitaires partagés du projet FIRE STONE.
 * Ces fonctions sont extraites ou répliquées depuis les modules internes
 * pour s'assurer de leur correction sans dépendance UI.
 */
import { describe, it, expect } from 'vitest';

// ─── Helpers de couleur ─────────────────────────────────────────────────────

/** Valide qu'une chaîne est un code hex CSS valide (3, 4, 6 ou 8 chiffres). */
function isValidHex(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color);
}

/** Convertit un triplet RGB en hex. */
function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0').toUpperCase()).join('')}`;
}

/** Calcule la luminance relative d'une couleur RGB (WCAG 2.1). */
function luminance(r: number, g: number, b: number): number {
  const channels = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Retourne la couleur de texte contrastée (#FFFFFF ou #0F172A) selon la luminance. */
function contrastText(r: number, g: number, b: number): '#FFFFFF' | '#0F172A' {
  return luminance(r, g, b) < 0.42 ? '#FFFFFF' : '#0F172A';
}

// ─── Helpers de formatage ────────────────────────────────────────────────────

/** Génère un slug URL-safe depuis un nom d'équipe. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[àâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Formate une date ISO en chaîne lisible (ex: "12 sept. 2026"). */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Tests : isValidHex ──────────────────────────────────────────────────────

describe('isValidHex', () => {
  it('accepte un hex à 6 chiffres', () => {
    expect(isValidHex('#FF2A3B')).toBe(true);
  });

  it('accepte un hex à 3 chiffres', () => {
    expect(isValidHex('#F2B')).toBe(true);
  });

  it('accepte un hex à 8 chiffres (avec alpha)', () => {
    expect(isValidHex('#FF2A3BCC')).toBe(true);
  });

  it('accepte les couleurs en minuscules', () => {
    expect(isValidHex('#ffb800')).toBe(true);
  });

  it('rejette une chaîne sans #', () => {
    expect(isValidHex('FF2A3B')).toBe(false);
  });

  it('rejette une chaîne vide', () => {
    expect(isValidHex('')).toBe(false);
  });

  it('rejette une longueur invalide (5 chiffres)', () => {
    expect(isValidHex('#FF2A3')).toBe(false);
  });

  it('rejette des caractères hors hex', () => {
    expect(isValidHex('#GGHHII')).toBe(false);
  });
});

// ─── Tests : toHex ───────────────────────────────────────────────────────────

describe('toHex', () => {
  it('convertit le rouge pur', () => {
    expect(toHex(255, 0, 0)).toBe('#FF0000');
  });

  it('convertit le noir', () => {
    expect(toHex(0, 0, 0)).toBe('#000000');
  });

  it('convertit le blanc', () => {
    expect(toHex(255, 255, 255)).toBe('#FFFFFF');
  });

  it('convertit la couleur primaire FIRE STONE', () => {
    expect(toHex(255, 42, 59)).toBe('#FF2A3B');
  });

  it('arrondit les valeurs flottantes', () => {
    expect(toHex(255.4, 42.6, 59.1)).toBe('#FF2B3B');
  });
});

// ─── Tests : luminance ───────────────────────────────────────────────────────

describe('luminance', () => {
  it('noir absolu a une luminance de 0', () => {
    expect(luminance(0, 0, 0)).toBeCloseTo(0, 4);
  });

  it('blanc absolu a une luminance de 1', () => {
    expect(luminance(255, 255, 255)).toBeCloseTo(1, 4);
  });

  it('rouge pur a une luminance entre 0 et 1', () => {
    const lum = luminance(255, 0, 0);
    expect(lum).toBeGreaterThan(0);
    expect(lum).toBeLessThan(1);
  });

  it('couleur sombre a une luminance < 0.5', () => {
    // #090A0F (background FIRE STONE)
    expect(luminance(9, 10, 15)).toBeLessThan(0.5);
  });
});

// ─── Tests : contrastText ────────────────────────────────────────────────────

describe('contrastText', () => {
  it('retourne blanc sur fond sombre (noir)', () => {
    expect(contrastText(0, 0, 0)).toBe('#FFFFFF');
  });

  it('retourne sombre sur fond clair (blanc)', () => {
    expect(contrastText(255, 255, 255)).toBe('#0F172A');
  });

  it('retourne blanc sur le rouge FIRE STONE (#FF2A3B)', () => {
    expect(contrastText(255, 42, 59)).toBe('#FFFFFF');
  });

  it('retourne sombre sur le jaune (#FFB800)', () => {
    // Le jaune est lumineux → texte sombre
    expect(contrastText(255, 184, 0)).toBe('#0F172A');
  });
});

// ─── Tests : slugify ─────────────────────────────────────────────────────────

describe('slugify', () => {
  it('convertit un nom simple', () => {
    expect(slugify('Fire Stone Elite')).toBe('fire-stone-elite');
  });

  it('supprime les accents', () => {
    expect(slugify('Éperviers BBC')).toBe('eperviers-bbc');
  });

  it('supprime les caractères spéciaux', () => {
    expect(slugify('Team (2026) & Co!')).toBe('team-2026-co');
  });

  it('réduit les espaces et tirets multiples', () => {
    expect(slugify('A   B--C')).toBe('a-b-c');
  });

  it('gère les chaînes vides', () => {
    expect(slugify('')).toBe('');
  });
});

// ─── Tests : formatDate ──────────────────────────────────────────────────────

describe('formatDate', () => {
  it('retourne une chaîne non vide pour une date ISO valide', () => {
    const result = formatDate('2026-09-12T00:00:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it("contient l'année 2026", () => {
    const result = formatDate('2026-09-12T00:00:00Z');
    expect(result).toContain('2026');
  });
});
