/**
 * Tests unitaires du composant MobileNavBar (navigation smartphone).
 * Le menu "AI Team Designer" est réservé au SUPER_ADMIN uniquement.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileNavBar } from '../components/MobileNavBar';

describe('MobileNavBar — Rendu et interactions', () => {
  it('affiche les onglets sociaux principaux et le bouton Plus', () => {
    const handleSelect = vi.fn();
    render(
      <MobileNavBar
        activeTab="accueil"
        onSelectTab={handleSelect}
        userRole="PLAYER"
        unreadCount={2}
      />
    );

    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Explorer')).toBeInTheDocument();
    expect(screen.getByLabelText(/Créer une publication ou une story/i)).toBeInTheDocument();
    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Profil')).toBeInTheDocument();
    expect(screen.getByText('Plus')).toBeInTheDocument();
  });

  it('cliquer sur Explorer déclenche onSelectTab avec "explorer"', () => {
    const handleSelect = vi.fn();
    render(
      <MobileNavBar
        activeTab="accueil"
        onSelectTab={handleSelect}
        userRole="PLAYER"
      />
    );

    fireEvent.click(screen.getByText('Explorer'));
    expect(handleSelect).toHaveBeenCalledWith('explorer');
  });

  it('cliquer sur Plus ouvre le tiroir avec les options supplémentaires (PLAYER ne voit pas le designer)', () => {
    const handleSelect = vi.fn();
    render(
      <MobileNavBar
        activeTab="accueil"
        onSelectTab={handleSelect}
        userRole="PLAYER"
      />
    );

    // Initialement le tiroir est fermé
    expect(screen.queryByText(/Menu Rapide Mobile/i)).not.toBeInTheDocument();

    // Cliquer sur le bouton Plus
    fireEvent.click(screen.getByText('Plus'));

    // Le tiroir s'ouvre — Terrains visible pour PLAYER, AI Team Designer NON
    expect(screen.getByText(/Menu Rapide Mobile/i)).toBeInTheDocument();
    expect(screen.getByText('Terrains de Lomé')).toBeInTheDocument();
    expect(screen.queryByText('AI Team Designer')).not.toBeInTheDocument();
  });

  it('SUPER_ADMIN voit "AI Team Designer" dans le tiroir et peut y naviguer', () => {
    const handleSelect = vi.fn();
    render(
      <MobileNavBar
        activeTab="accueil"
        onSelectTab={handleSelect}
        userRole="SUPER_ADMIN"
      />
    );

    // Ouvrir le menu
    fireEvent.click(screen.getByText('Plus'));

    // AI Team Designer visible pour SUPER_ADMIN
    expect(screen.getByText('AI Team Designer')).toBeInTheDocument();

    // Cliquer sur "AI Team Designer"
    fireEvent.click(screen.getByText('AI Team Designer'));
    expect(handleSelect).toHaveBeenCalledWith('designer');

    // Le tiroir doit être fermé
    expect(screen.queryByText(/Menu Rapide Mobile/i)).not.toBeInTheDocument();
  });
});
