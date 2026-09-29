import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClubsDirectoryPage } from '../components/public/ClubsDirectoryPage';
import { ClubProfilePage } from '../components/public/ClubProfilePage';
import type { Team } from '../types';

const mockTeam: Team = {
  id: 'team-fire-stone',
  name: 'FIRE STONE Elite',
  slug: 'fire-stone-elite',
  city: 'Lomé',
  category: 'SENIOR',
  primaryColor: '#FF2A3B',
  secondaryColor: '#FFB800',
  accentColor: '#38BDF8',
};

describe('Composants Publics — Annuaire & Profils Clubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ClubsDirectoryPage', () => {
    it('affiche le titre de l annuaire, la barre de recherche et les filtres', () => {
      render(
        <ClubsDirectoryPage
          onSelectTeamWorkspace={vi.fn()}
          onSelectClubProfile={vi.fn()}
        />
      );

      // Barre de recherche
      const searchInput = screen.getByPlaceholderText(/Rechercher un club/i);
      expect(searchInput).toBeInTheDocument();

      fireEvent.change(searchInput, { target: { value: 'Fire' } });
      expect(searchInput).toHaveValue('Fire');
    });
  });

  describe('ClubProfilePage', () => {
    it('affiche le nom du club, la ville et le bouton retour', () => {
      const handleBack = vi.fn();
      const handleEnterWorkspace = vi.fn();

      render(
        <ClubProfilePage
          club={mockTeam}
          onBack={handleBack}
          onEnterWorkspace={handleEnterWorkspace}
          onOpenAuth={vi.fn()}
        />
      );

      expect(screen.getAllByText(/FIRE STONE Elite/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Lomé/i).length).toBeGreaterThan(0);

      // Bouton retour vers l'annuaire
      const backBtn = screen.getByRole('button', { name: /Annuaire des clubs/i });
      expect(backBtn).toBeInTheDocument();
      fireEvent.click(backBtn);
      expect(handleBack).toHaveBeenCalled();
    });
  });
});
