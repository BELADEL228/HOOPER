/**
 * Tests unitaires du composant MobileNavBar (navigation smartphone).
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

  it('cliquer sur Plus ouvre le tiroir avec les options supplémentaires', () => {
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

    // Le tiroir s'ouvre
    expect(screen.getByText(/Menu Rapide Mobile/i)).toBeInTheDocument();
    expect(screen.getByText('Terrains de Lomé')).toBeInTheDocument();
    expect(screen.getByText('AI Team Designer')).toBeInTheDocument();
  });

  it('sélectionner un module dans le tiroir appelle onSelectTab et ferme le menu', () => {
    const handleSelect = vi.fn();
    render(
      <MobileNavBar
        activeTab="accueil"
        onSelectTab={handleSelect}
        userRole="PLAYER"
      />
    );

    // Ouvrir le menu
    fireEvent.click(screen.getByText('Plus'));

    // Cliquer sur "AI Team Designer"
    fireEvent.click(screen.getByText('AI Team Designer'));

    expect(handleSelect).toHaveBeenCalledWith('designer');
    // Le tiroir doit être fermé
    expect(screen.queryByText(/Menu Rapide Mobile/i)).not.toBeInTheDocument();
  });
});
