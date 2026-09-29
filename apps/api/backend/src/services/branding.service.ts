import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import { ThemeTokens } from '../types';

const execFileAsync = promisify(execFile);

// ─── Color calculation utilities (Section 7 Design System) ───────────────────
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1).toUpperCase()}`;
}

function adjustLightness(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex);
  const factor = percent / 100;
  if (factor > 0) {
    return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
  } else {
    const absFactor = 1 + factor;
    return rgbToHex(r * absFactor, g * absFactor, b * absFactor);
  }
}

function blend(hex1: string, hex2: string, weight: number): string {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return rgbToHex(
    r1 * (1 - weight) + r2 * weight,
    g1 * (1 - weight) + g2 * weight,
    b1 * (1 - weight) + b2 * weight
  );
}

function calculateLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function calculateSaturation(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  const l = (max + min) / 2;
  return l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
}

export class BrandingService {
  /**
   * Analyse un logo d'équipe ou de club via le script Python autonome
   * ou fournit une palette harmonieuse de secours en cas d'indisponibilité.
   */
  static async extractThemeFromLogo(logoInput: string, clubOrTeamName: string = ''): Promise<ThemeTokens> {
    const pythonScriptPath = path.resolve(__dirname, '../../../scripts/analyze_logo.py');

    try {
      const { stdout } = await execFileAsync('python', [pythonScriptPath, logoInput || clubOrTeamName], {
        timeout: 5000,
        maxBuffer: 1024 * 1024 * 2,
      });

      const parsed = JSON.parse(stdout.trim());
      if (parsed?.primaryColor) {
        return this.buildCompleteTokens(
          parsed.primaryColor,
          parsed.secondaryColor || '#FFB800',
          parsed.accentColor || '#38BDF8',
          parsed
        );
      }
    } catch {
      // Fallback déterministe
    }

    return this.generateFallbackTokens(clubOrTeamName || logoInput);
  }

  static buildCompleteTokens(
    primary: string,
    secondary: string,
    accent: string,
    extra: Partial<ThemeTokens> = {}
  ): ThemeTokens {
    const primaryLight = adjustLightness(primary, 20);
    const primaryDark = adjustLightness(primary, -20);
    const primaryTint = blend(primary, '#FFFFFF', 0.88);
    const primaryShade = blend(primary, '#090A0F', 0.72);

    const secondaryLight = adjustLightness(secondary, 20);
    const secondaryDark = adjustLightness(secondary, -20);

    const lum = calculateLuminance(primary);
    const sat = calculateSaturation(primary);

    // Section 7 : Sélection Thème (Luminance > 60% → clair, sinon sombre ; Saturation > 70% → vibrant, sinon minimal)
    const themeType = lum > 0.6 ? 'light' : 'dark';
    const vibrationMode = sat > 0.7 ? 'vibrant' : 'minimal';

    const neutrals = {
      black: '#090A0F',
      gray1: '#1F2937',
      gray2: '#374151',
      gray3: '#6B7280',
      gray4: '#9CA3AF',
      gray5: '#E5E7EB',
      white: '#FFFFFF',
      transparent: 'rgba(0,0,0,0)',
    };

    const spacing = {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    };

    const typography = {
      bodyFont: "'Inter', sans-serif",
      headingFont: "'Poppins', sans-serif",
      bodySize: '14px',
      headingSize: '24px',
    };

    const elevation = {
      sm: '0 1px 3px rgba(0,0,0,0.1)',
      md: '0 4px 6px rgba(0,0,0,0.1)',
      lg: '0 10px 15px rgba(0,0,0,0.1)',
    };

    return {
      primary,
      primaryLight,
      primaryDark,
      primaryTint,
      primaryShade,
      secondary,
      secondaryLight,
      secondaryDark,
      accent,
      background: themeType === 'light' ? '#F9FAFB' : '#090A0F',
      surface: themeType === 'light' ? '#FFFFFF' : '#121621',
      textPrimary: themeType === 'light' ? '#090A0F' : '#FFFFFF',
      textSecondary: '#6B7280',
      border: themeType === 'light' ? '#E5E7EB' : primary,
      gradient: `linear-gradient(135deg, ${primary}, ${secondary})`,
      matchdayGradient: `radial-gradient(circle at 20% 20%, ${primary}55 0%, ${themeType === 'light' ? '#F3F4F6' : '#090A0F'} 75%)`,
      shadow: `0 16px 40px ${primary}55`,
      glow: `0 0 24px ${accent}66`,
      themeType,
      vibrationMode,
      palette: [primary, primaryLight, secondary, accent, neutrals.gray1, neutrals.white],
      contrastRatio: lum > 0.5 ? 4.8 : 7.2,
      visualStyle: extra.visualStyle || (themeType === 'light' ? 'clean_minimal' : 'modern_athletic'),
      shapeCharacteristics: extra.shapeCharacteristics || ['balanced_contrast', 'geometric_shield'],
      neutrals,
      spacing,
      typography,
      elevation,
      homeKit: extra.homeKit || {
        jerseyBase: primary,
        jerseyTrims: secondary,
        jerseyAccent: accent,
        textColor: '#FFFFFF',
        shortsBase: primary,
        pattern: 'gradient',
      },
      awayKit: extra.awayKit || {
        jerseyBase: '#F8FAFC',
        jerseyTrims: primary,
        jerseyAccent: secondary,
        textColor: '#0F172A',
        shortsBase: '#F8FAFC',
        pattern: 'stripes',
      },
    };
  }

  static generateFallbackTokens(seed: string): ThemeTokens {
    const palettes = [
      { primary: '#FF2A3B', secondary: '#FFB800', accent: '#38BDF8' }, // Feu & Solaire
      { primary: '#059669', secondary: '#EAB308', accent: '#38BDF8' }, // Émeraude & Or
      { primary: '#2563EB', secondary: '#06B6D4', accent: '#F59E0B' }, // Royal & Cyan
      { primary: '#7C3AED', secondary: '#EC4899', accent: '#F59E0B' }, // Pourpre & Rose
      { primary: '#EA580C', secondary: '#F97316', accent: '#38BDF8' }, // Orange Basketball
    ];

    const hash = (seed || 'club')
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const chosen = palettes[hash % palettes.length];
    return this.buildCompleteTokens(chosen.primary, chosen.secondary, chosen.accent);
  }
}
