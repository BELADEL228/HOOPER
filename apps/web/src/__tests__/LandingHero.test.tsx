/**
 * Tests du composant LandingHero (Espace Club Workspace) et TeamOverviewModal
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { LandingHero } from '../components/LandingHero';
import { TeamOverviewModal } from '../components/TeamOverviewModal';
import { ClubProvider } from '../context/ClubContext';
import type { Team } from '../types';

const mockClub: Team = {
  id: 'team-fire-stone',
  name: 'FIRE STONE Elite',
  slug: 'fire-stone-elite',
  city: 'Lomé',
  category: 'SENIOR',
  primaryColor: '#FF2A3B',
  secondaryColor: '#FFB800',
  accentColor: '#38BDF8',
};

describe('LandingHero & TeamOverviewModal', () => {
  const mockNavigate = vi.fn();
  const mockOpenAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TeamOverviewModal', () => {
    it('rend TeamOverviewModal et permet de naviguer entre les onglets', async () => {
      render(
        <TeamOverviewModal
          team={{
            id: 'team-001',
            name: 'FIRE STONE Elite',
            category: 'SENIOR PRO',
            city: 'Lomé',
          }}
          isOpen={true}
          onClose={vi.fn()}
          onNavigate={mockNavigate}
          players={[
            {
              id: 'p-1',
              name: 'Koffi Mensah',
              number: 7,
              position: 'Meneur',
              category: 'SENIOR',
              photo: 'https://example.com/p1.jpg',
              pointsPerGame: 18.5,
              reboundsPerGame: 4.2,
              assistsPerGame: 7.1,
              isInjured: false,
              isSuspended: false,
              stats: {
                played: 12,
                points: 220,
                rebounds: 50,
                assists: 85,
                steals: 20,
                blocks: 3,
                turnovers: 18,
                minutes: 360,
                fouls: 15,
                threePointersMade: 25,
                threePointersAttempted: 60,
                fieldGoalsMade: 80,
                fieldGoalsAttempted: 160,
                freeThrowsMade: 35,
                freeThrowsAttempted: 42,
              },
            },
          ]}
        />
      );

      const modal = screen.getByTestId('team-overview-modal');
      expect(modal).toBeInTheDocument();
      expect(within(modal).getByText(/Présentation du Pôle/i)).toBeInTheDocument();

      // Basculer vers l'onglet Effectif
      const rosterTab = within(modal).getByRole('button', { name: /Effectif Joueurs/i });
      fireEvent.click(rosterTab);

      await waitFor(() => {
        expect(within(modal).getByText(/Koffi Mensah/i)).toBeInTheDocument();
      });

      // Basculer vers l'onglet Boutique
      const shopTab = within(modal).getByRole('button', { name: /Boutique Maillots/i });
      fireEvent.click(shopTab);

      await waitFor(() => {
        expect(within(modal).getByText(/Boutique Officielle/i)).toBeInTheDocument();
      });
    });
  });

  describe('LandingHero — Espace Club', () => {
    it('affiche l\'identité du club, le badge Espace club et les boutons d\'action', () => {
      render(
        <ClubProvider initialClub={mockClub}>
          <LandingHero
            currentRole="VISITOR"
            onNavigate={mockNavigate}
            onOpenAuth={mockOpenAuth}
          />
        </ClubProvider>
      );

      // Titre principal avec le nom du club
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent(/FIRE STONE Elite/i);

      // Badge Espace club
      expect(screen.getByText(/Espace club/i)).toBeInTheDocument();

      // Bouton Gérer l'effectif
      const rosterBtn = screen.getByRole('button', { name: /Gérer l’effectif/i });
      expect(rosterBtn).toBeInTheDocument();
      fireEvent.click(rosterBtn);
      expect(mockNavigate).toHaveBeenCalledWith('equipe');

      // Bouton Voir les matchs
      const matchesBtn = screen.getByRole('button', { name: /Voir les matchs/i });
      expect(matchesBtn).toBeInTheDocument();
      fireEvent.click(matchesBtn);
      expect(mockNavigate).toHaveBeenCalledWith('matchs');
    });

    it('affiche la section Prochain match avec lien calendrier', () => {
      render(
        <ClubProvider initialClub={mockClub}>
          <LandingHero
            currentRole="VISITOR"
            onNavigate={mockNavigate}
            onOpenAuth={mockOpenAuth}
          />
        </ClubProvider>
      );

      expect(screen.getByText(/Prochain match/i)).toBeInTheDocument();
      const calBtn = screen.getByRole('button', { name: /Calendrier/i });
      expect(calBtn).toBeInTheDocument();
      fireEvent.click(calBtn);
      expect(mockNavigate).toHaveBeenCalledWith('matchs');
    });

    it('affiche la section Actualités avec lien voir tout', () => {
      render(
        <ClubProvider initialClub={mockClub}>
          <LandingHero
            currentRole="VISITOR"
            onNavigate={mockNavigate}
            onOpenAuth={mockOpenAuth}
          />
        </ClubProvider>
      );

      expect(screen.getByText(/Actualités/i)).toBeInTheDocument();
      const newsBtn = screen.getByRole('button', { name: /Voir tout/i });
      expect(newsBtn).toBeInTheDocument();
      fireEvent.click(newsBtn);
      expect(mockNavigate).toHaveBeenCalledWith('actualites');
    });

    it('affiche les statistiques clés et le lien vers la page de statistiques', () => {
      render(
        <ClubProvider initialClub={mockClub}>
          <LandingHero
            currentRole="VISITOR"
            onNavigate={mockNavigate}
            onOpenAuth={mockOpenAuth}
          />
        </ClubProvider>
      );

      expect(screen.getByText(/Matchs joués/i)).toBeInTheDocument();
      expect(screen.getByText(/Victoires/i)).toBeInTheDocument();
      expect(screen.getByText(/Défaites/i)).toBeInTheDocument();
      expect(screen.getByText(/Joueurs inscrits/i)).toBeInTheDocument();

      const statsBtn = screen.getByRole('button', { name: /Statistiques/i });
      expect(statsBtn).toBeInTheDocument();
      fireEvent.click(statsBtn);
      expect(mockNavigate).toHaveBeenCalledWith('stats');
    });
  });
});
