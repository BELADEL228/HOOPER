import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ClubProvider } from '../context/ClubContext';
import { ThemeProvider } from '../features/branding/ThemeProvider';

describe('ThemeProvider', () => {
  it('publishes the active club palette as CSS tokens', () => {
    render(
      <ClubProvider initialClub={{
        id: 'club-1', name: 'Les Lions', slug: 'les-lions', city: 'Lomé', category: 'SENIOR',
        primaryColor: '#123456', secondaryColor: '#ABCDEF', accentColor: '#FEDCBA',
        themeJson: JSON.stringify({ background: '#101820', surface: '#1E293B', textPrimary: '#FFFFFF' }),
      }}>
        <ThemeProvider><div>workspace</div></ThemeProvider>
      </ClubProvider>,
    );

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--club-primary')).toBe('#123456');
    expect(root.style.getPropertyValue('--club-secondary')).toBe('#ABCDEF');
    expect(root.style.getPropertyValue('--club-accent')).toBe('#FEDCBA');
    expect(root.style.getPropertyValue('--bg-main')).toBe('#101820');
    expect(root.dataset.clubTheme).toBe('true');
  });
});
