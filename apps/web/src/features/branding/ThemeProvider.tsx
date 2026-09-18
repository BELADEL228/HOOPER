import React from 'react';
import { useEffect } from 'react';
import { useClub } from '../../context/ClubContext';

/**
 * ThemeProvider — Injecte dynamiquement les variables CSS du club actif
 * dans :root, permettant a tous les composants de s'adapter au branding
 * du club selectionne sans aucune duplication de code.
 *
 * Variables injectees :
 *   --club-primary     : couleur principale du club
 *   --club-secondary   : couleur secondaire
 *   --club-accent      : couleur d'accent
 *   --club-primary-rgb : valeurs R G B separees (pour rgba())
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeClub } = useClub();

  useEffect(() => {
    let savedTokens: Record<string, string> = {};
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

    // Convertir hex en RGB
    const hexToRgb = (hex: string): string => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
        : '255 42 59';
    };

    const root = document.documentElement;
    root.style.setProperty('--club-primary', primary);
    root.style.setProperty('--club-secondary', secondary);
    root.style.setProperty('--club-accent', accent);
    root.style.setProperty('--club-primary-rgb', hexToRgb(primary));
    root.style.setProperty('--club-secondary-rgb', hexToRgb(secondary));
    root.style.setProperty('--club-accent-rgb', hexToRgb(accent));
    root.style.setProperty('--club-name', JSON.stringify(activeClub.name));
    root.dataset.clubTheme = 'true';

    // Full tokens are optional, but when available they let shared surfaces and
    // typography follow the analysed light/dark identity as well.
    root.style.setProperty('--bg-main', savedTokens.background || '#090A0F');
    root.style.setProperty('--panel', savedTokens.surface || 'rgba(18, 22, 33, 0.72)');
    root.style.setProperty('--text-primary', savedTokens.textPrimary || '#F8FAFC');
    root.style.setProperty('--text-muted', savedTokens.textSecondary || '#CBD5E1');

    // Appliquer la couleur de selection au texte selectionne
    root.style.setProperty('--tw-ring-color', `${primary}60`);

    return () => {
      // Restaurer les valeurs par defaut FIRE STONE si necessaire
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
