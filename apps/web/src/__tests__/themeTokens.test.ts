/**
 * Tests unitaires du type ThemeTokens et des valeurs par défaut de FIRE STONE.
 * Vérifie la structure, les valeurs hex et la logique de fusion.
 */
import { describe, it, expect } from 'vitest';
import type { ThemeTokens, JerseyKitConfig } from '../types';

// ─── Tokens par défaut (copie de TeamDesignerPage.tsx) ───────────────────────

const DEFAULT_FIRE_STONE_TOKENS: ThemeTokens = {
  primary: '#FF2A3B',
  secondary: '#FFB800',
  accent: '#38BDF8',
  background: '#090A0F',
  surface: '#121621',
  textPrimary: '#FFFFFF',
  textSecondary: '#CBD5E1',
  border: '#841B23',
  gradient: 'linear-gradient(135deg, #FF2A3B 0%, #FFB800 100%)',
  matchdayGradient: 'radial-gradient(circle at 20% 20%, rgba(255, 42, 59, 0.35) 0%, #090A0F 75%)',
  shadow: '0 16px 40px rgba(255, 42, 59, 0.35)',
  glow: '0 0 24px rgba(56, 189, 248, 0.4)',
  themeType: 'dark',
  palette: ['#FF2A3B', '#FFB800', '#38BDF8', '#121621', '#FFFFFF'],
  contrastRatio: 5.4,
  homeKit: {
    jerseyBase: '#FF2A3B',
    jerseyTrims: '#FFB800',
    jerseyAccent: '#38BDF8',
    textColor: '#FFFFFF',
    shortsBase: '#121621',
    pattern: 'gradient',
  },
  awayKit: {
    jerseyBase: '#F8FAFC',
    jerseyTrims: '#FF2A3B',
    jerseyAccent: '#FFB800',
    textColor: '#0F172A',
    shortsBase: '#F8FAFC',
    pattern: 'stripes',
  },
};

// ─── Regex de validation hex ─────────────────────────────────────────────────

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
const isHex = (v: string) => HEX_REGEX.test(v);

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('DEFAULT_FIRE_STONE_TOKENS — structure', () => {
  it('possède toutes les propriétés obligatoires', () => {
    const required: (keyof ThemeTokens)[] = [
      'primary',
      'secondary',
      'accent',
      'background',
      'surface',
      'textPrimary',
      'textSecondary',
      'border',
      'gradient',
      'shadow',
      'glow',
      'themeType',
    ];
    required.forEach((key) => {
      expect(DEFAULT_FIRE_STONE_TOKENS).toHaveProperty(key);
    });
  });

  it('themeType vaut "dark"', () => {
    expect(DEFAULT_FIRE_STONE_TOKENS.themeType).toBe('dark');
  });

  it('palette contient exactement 5 entrées', () => {
    expect(DEFAULT_FIRE_STONE_TOKENS.palette).toHaveLength(5);
  });

  it('contrastRatio est supérieur à 4.5 (WCAG AA)', () => {
    expect(DEFAULT_FIRE_STONE_TOKENS.contrastRatio).toBeGreaterThanOrEqual(4.5);
  });
});

describe('DEFAULT_FIRE_STONE_TOKENS — valeurs hex', () => {
  const hexFields: (keyof ThemeTokens)[] = [
    'primary',
    'secondary',
    'accent',
    'background',
    'surface',
    'textPrimary',
    'textSecondary',
    'border',
  ];

  hexFields.forEach((field) => {
    it(`${field} est une couleur hex valide`, () => {
      const value = DEFAULT_FIRE_STONE_TOKENS[field] as string;
      expect(isHex(value)).toBe(true);
    });
  });

  it('toutes les entrées de palette sont des hex valides', () => {
    DEFAULT_FIRE_STONE_TOKENS.palette?.forEach((color) => {
      expect(isHex(color)).toBe(true);
    });
  });
});

describe('ThemeTokens — homeKit', () => {
  const kit = DEFAULT_FIRE_STONE_TOKENS.homeKit as JerseyKitConfig;

  it('homeKit est défini', () => {
    expect(kit).toBeDefined();
  });

  it('jerseyBase correspond à la couleur primaire', () => {
    expect(kit.jerseyBase).toBe(DEFAULT_FIRE_STONE_TOKENS.primary);
  });

  it('jerseyTrims correspond à la couleur secondaire', () => {
    expect(kit.jerseyTrims).toBe(DEFAULT_FIRE_STONE_TOKENS.secondary);
  });

  it('pattern du home kit est "gradient"', () => {
    expect(kit.pattern).toBe('gradient');
  });

  it('textColor est blanc (fond sombre)', () => {
    expect(kit.textColor).toBe('#FFFFFF');
  });
});

describe('ThemeTokens — awayKit', () => {
  const kit = DEFAULT_FIRE_STONE_TOKENS.awayKit as JerseyKitConfig;

  it('awayKit est défini', () => {
    expect(kit).toBeDefined();
  });

  it('jerseyBase est clair (away sur fond sombre home)', () => {
    // Le kit away doit être clair
    expect(kit.jerseyBase).toBe('#F8FAFC');
  });

  it('pattern du away kit est "stripes"', () => {
    expect(kit.pattern).toBe('stripes');
  });

  it('textColor est sombre (fond clair)', () => {
    expect(kit.textColor).toBe('#0F172A');
  });
});

describe('Fusion de ThemeTokens (merge)', () => {
  it('fusionne correctement un thème partiel sur les tokens par défaut', () => {
    const partial: Partial<ThemeTokens> = {
      primary: '#059669',
      secondary: '#EAB308',
      themeType: 'dark',
    };
    const merged: ThemeTokens = { ...DEFAULT_FIRE_STONE_TOKENS, ...partial };

    expect(merged.primary).toBe('#059669');
    expect(merged.secondary).toBe('#EAB308');
    // Les clés non surchargées restent celles par défaut
    expect(merged.accent).toBe(DEFAULT_FIRE_STONE_TOKENS.accent);
    expect(merged.background).toBe(DEFAULT_FIRE_STONE_TOKENS.background);
  });

  it('un thème light override correctement le themeType', () => {
    const light: Partial<ThemeTokens> = {
      themeType: 'light',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
    };
    const merged: ThemeTokens = { ...DEFAULT_FIRE_STONE_TOKENS, ...light };
    expect(merged.themeType).toBe('light');
    expect(merged.background).toBe('#F8FAFC');
    expect(merged.primary).toBe(DEFAULT_FIRE_STONE_TOKENS.primary);
  });

  it('la fusion préserve homeKit et awayKit par défaut', () => {
    const merged: ThemeTokens = { ...DEFAULT_FIRE_STONE_TOKENS, primary: '#2563EB' };
    expect(merged.homeKit).toEqual(DEFAULT_FIRE_STONE_TOKENS.homeKit);
    expect(merged.awayKit).toEqual(DEFAULT_FIRE_STONE_TOKENS.awayKit);
  });
});
