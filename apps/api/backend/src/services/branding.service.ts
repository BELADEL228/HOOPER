import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import { ThemeTokens } from '../types';

const execFileAsync = promisify(execFile);

export class BrandingService {
  /**
   * Analyse un logo d'équipe ou de club via le script Python autonome
   * ou fournit une palette harmonieuse de secours en cas d'indisponibilité.
   */
  static async extractThemeFromLogo(logoInput: string, clubOrTeamName: string = ''): Promise<ThemeTokens> {
    const pythonScriptPath = path.resolve(__dirname, '../../../scripts/analyze_logo.py');

    try {
      // Exécution du script Python
      const { stdout } = await execFileAsync('python', [pythonScriptPath, logoInput || clubOrTeamName], {
        timeout: 5000,
        maxBuffer: 1024 * 1024 * 2,
      });

      const parsed = JSON.parse(stdout.trim());
      if (parsed?.primaryColor) {
        return {
          primary: parsed.primaryColor,
          secondary: parsed.secondaryColor || '#FFB800',
          accent: parsed.accentColor || '#38BDF8',
          background: parsed.backgroundColor || '#090A0F',
          surface: parsed.surfaceColor || '#121621',
          textPrimary: parsed.contrastColor || '#FFFFFF',
          textSecondary: '#CBD5E1',
          border: parsed.primaryColor,
          gradient: `linear-gradient(135deg, ${parsed.primaryColor}, ${parsed.secondaryColor || '#FFB800'})`,
          matchdayGradient: `radial-gradient(circle at 20% 20%, ${parsed.primaryColor}55 0%, #090A0F 75%)`,
          shadow: `0 16px 40px ${parsed.primaryColor}55`,
          glow: `0 0 24px ${parsed.accentColor || '#38BDF8'}66`,
          themeType: parsed.themeType || 'dark',
          palette: parsed.palette || [parsed.primaryColor, parsed.secondaryColor, parsed.accentColor],
          contrastRatio: parsed.contrastRatio || 5.5,
          visualStyle: parsed.visualStyle,
          shapeCharacteristics: parsed.shapeCharacteristics,
          homeKit: parsed.homeKit,
          awayKit: parsed.awayKit,
        };
      }
    } catch {
      // Fallback déterministe basé sur le nom du club
    }

    return this.generateFallbackTokens(clubOrTeamName || logoInput);
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

    return {
      primary: chosen.primary,
      secondary: chosen.secondary,
      accent: chosen.accent,
      background: '#090A0F',
      surface: '#121621',
      textPrimary: '#FFFFFF',
      textSecondary: '#CBD5E1',
      border: chosen.primary,
      gradient: `linear-gradient(135deg, ${chosen.primary}, ${chosen.secondary})`,
      matchdayGradient: `radial-gradient(circle at 20% 20%, ${chosen.primary}55 0%, #090A0F 75%)`,
      shadow: `0 16px 40px ${chosen.primary}55`,
      glow: `0 0 24px ${chosen.accent}66`,
      themeType: 'dark',
      palette: [chosen.primary, chosen.secondary, chosen.accent, '#121621', '#FFFFFF'],
      contrastRatio: 5.5,
      visualStyle: 'modern_athletic',
      shapeCharacteristics: ['balanced_contrast', 'geometric_shield'],
      homeKit: {
        jerseyBase: chosen.primary,
        jerseyTrims: chosen.secondary,
        jerseyAccent: chosen.accent,
        textColor: '#FFFFFF',
        shortsBase: chosen.primary,
        pattern: 'gradient',
      },
      awayKit: {
        jerseyBase: '#F8FAFC',
        jerseyTrims: chosen.primary,
        jerseyAccent: chosen.secondary,
        textColor: '#0F172A',
        shortsBase: '#F8FAFC',
        pattern: 'stripes',
      },
    };
  }
}
