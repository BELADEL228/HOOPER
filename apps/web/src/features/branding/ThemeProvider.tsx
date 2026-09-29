import React, { useEffect } from 'react';
import { useClub } from '../../context/ClubContext';

// ─── Color calculations for Section 7 tokens ────────────────────────────────
const hexToRgbValues = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const n = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1).toUpperCase()}`;
};

const adjustLightness = (hex: string, percent: number): string => {
  const [r, g, b] = hexToRgbValues(hex);
  const factor = percent / 100;
  if (factor > 0) {
    return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
  }
  const absFactor = 1 + factor;
  return rgbToHex(r * absFactor, g * absFactor, b * absFactor);
};

const blendColors = (hex1: string, hex2: string, weight: number): string => {
  const [r1, g1, b1] = hexToRgbValues(hex1);
  const [r2, g2, b2] = hexToRgbValues(hex2);
  return rgbToHex(
    r1 * (1 - weight) + r2 * weight,
    g1 * (1 - weight) + g2 * weight,
    b1 * (1 - weight) + b2 * weight
  );
};

/**
 * ThemeProvider — Injecte dynamiquement les variables CSS du club actif
 * dans :root selon le cahier des charges officiel HOOPER (Section 7).
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeClub } = useClub();

  useEffect(() => {
    let savedTokens: Record<string, any> = {};
    try {
      savedTokens = typeof activeClub.themeJson === 'string'
        ? JSON.parse(activeClub.themeJson)
        : (activeClub.themeJson || {});
    } catch {
      // A malformed historic value must not prevent the workspace from rendering.
    }

    const primary = activeClub.primaryColor || '#FF2A3B';
    const secondary = activeClub.secondaryColor || '#FFB800';
    const accent = activeClub.accentColor || '#38BDF8';

    // Nuances de la palette officielle HOOPER (Section 7)
    const primaryLight = savedTokens.primaryLight || adjustLightness(primary, 20);
    const primaryDark = savedTokens.primaryDark || adjustLightness(primary, -20);
    const primaryTint = savedTokens.primaryTint || blendColors(primary, '#FFFFFF', 0.88);
    const primaryShade = savedTokens.primaryShade || blendColors(primary, '#090A0F', 0.72);

    const secondaryLight = savedTokens.secondaryLight || adjustLightness(secondary, 20);
    const secondaryDark = savedTokens.secondaryDark || adjustLightness(secondary, -20);

    const [r, g, b] = hexToRgbValues(primary);
    const [sr, sg, sb] = hexToRgbValues(secondary);
    const [ar, ag, ab] = hexToRgbValues(accent);

    const root = document.documentElement;

    // ─── Section 7 : Variables CSS du Système de Design Automatisé ───
    root.style.setProperty('--color-primary', primary);
    root.style.setProperty('--color-primary-light', primaryLight);
    root.style.setProperty('--color-primary-dark', primaryDark);
    root.style.setProperty('--color-primary-tint', primaryTint);
    root.style.setProperty('--color-primary-shade', primaryShade);

    root.style.setProperty('--color-secondary', secondary);
    root.style.setProperty('--color-secondary-light', secondaryLight);
    root.style.setProperty('--color-secondary-dark', secondaryDark);

    root.style.setProperty('--color-text-primary', savedTokens.textPrimary || '#090A0F');
    root.style.setProperty('--color-text-secondary', savedTokens.textSecondary || '#6B7280');
    root.style.setProperty('--color-background', savedTokens.background || '#FFFFFF');
    root.style.setProperty('--color-border', savedTokens.border || '#E5E7EB');
    root.style.setProperty('--color-surface', savedTokens.surface || '#F9FAFB');

    // Spacing
    root.style.setProperty('--space-xs', '4px');
    root.style.setProperty('--space-sm', '8px');
    root.style.setProperty('--space-md', '16px');
    root.style.setProperty('--space-lg', '24px');
    root.style.setProperty('--space-xl', '32px');

    // Typography
    root.style.setProperty('--font-family-body', "'Inter', sans-serif");
    root.style.setProperty('--font-family-heading', "'Poppins', sans-serif");
    root.style.setProperty('--font-size-body', '14px');
    root.style.setProperty('--font-size-heading', '24px');

    // Elevation
    root.style.setProperty('--shadow-sm', '0 1px 3px rgba(0,0,0,0.1)');
    root.style.setProperty('--shadow-md', '0 4px 6px rgba(0,0,0,0.1)');
    root.style.setProperty('--shadow-lg', '0 10px 15px rgba(0,0,0,0.1)');

    // ─── Variables de compatibilité existantes ───
    root.style.setProperty('--club-primary', primary);
    root.style.setProperty('--club-secondary', secondary);
    root.style.setProperty('--club-accent', accent);
    root.style.setProperty('--club-primary-rgb', `${r} ${g} ${b}`);
    root.style.setProperty('--club-secondary-rgb', `${sr} ${sg} ${sb}`);
    root.style.setProperty('--club-accent-rgb', `${ar} ${ag} ${ab}`);
    root.style.setProperty('--club-name', JSON.stringify(activeClub.name));
    root.dataset.clubTheme = 'true';

    root.style.setProperty('--bg-main', savedTokens.background || '#090A0F');
    root.style.setProperty('--panel', savedTokens.surface || 'rgba(18, 22, 33, 0.72)');
    root.style.setProperty('--text-primary', savedTokens.textPrimary || '#F8FAFC');
    root.style.setProperty('--text-muted', savedTokens.textSecondary || '#CBD5E1');
    root.style.setProperty('--tw-ring-color', `${primary}60`);

    return () => {
      root.style.setProperty('--club-primary', '#FF2A3B');
      root.style.setProperty('--club-secondary', '#FFB800');
      root.style.setProperty('--club-accent', '#38BDF8');
      root.style.setProperty('--club-primary-rgb', '255 42 59');
      root.style.setProperty('--club-secondary-rgb', '255 184 0');
      root.style.setProperty('--club-accent-rgb', '56 189 248');
      root.style.setProperty('--bg-main', '#090A0F');
      root.style.setProperty('--panel', 'rgba(18, 22, 33, 0.72)');
      root.style.setProperty('--text-primary', '#F8FAFC');
      root.style.setProperty('--text-muted', '#CBD5E1');
      delete root.dataset.clubTheme;
    };
  }, [activeClub]);

  return <>{children}</>;
};

export default ThemeProvider;
