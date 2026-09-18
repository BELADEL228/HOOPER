import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClubsDirectoryPage } from '../components/public/ClubsDirectoryPage';
import { ClubProfilePage } from '../components/public/ClubProfilePage';
import { ClubCreateModal } from '../components/club/ClubCreateModal';
import { clubApi, type ApiClub } from '../services/clubApi';
import type { Club } from '../types';

const mockClubs: ApiClub[] = [
  {
    id: 'club_fs',
    name: 'Fire Stone Basketball Club',
    slug: 'fire-stone',
    shortName: 'FSBC',
    city: 'Lomé',
    country: 'Togo',
    arena: 'Terrain Municipal de Lomé',
    description: 'Le club phare de basketball de Lomé.',
    isVerified: true,
    primaryColor: '#FF2A3B',
    secondaryColor: '#FFB800',
    teams: [
      {
        id: 'team_senior',
        clubId: 'club_fs',
        clubName: 'Fire Stone Basketball Club',
        name: 'Fire Stone Senior D1',
        slug: 'fire-stone-senior',
        category: 'SENIOR',
        division: 'Division 1 Nationale',
        coachName: 'Coach Jean-Paul',
        record: '18V - 4D',
      },
      {
        id: 'team_academy',
        clubId: 'club_fs',
        clubName: 'Fire Stone Basketball Club',
        name: 'Fire Stone Academy U20',
        slug: 'fire-stone-u20',
        category: 'ACADEMY',
        division: 'Championnat Espoirs',
        coachName: 'Coach Marc',
        record: '12V - 2D',
      },
    ],
  },
  {
    id: 'club_ef',
    name: 'Étoile Filante Basketball',
    slug: 'etoile-filante',
    shortName: 'EFB',
    city: 'Lomé',
    country: 'Togo',
    arena: 'Stade Omnisports de Lomé',
    description: 'Franchise historique.',
    isVerified: false,
    primaryColor: '#2563EB',
    teams: [
      {
        id: 'team_ef_senior',
        clubId: 'club_ef',
        name: 'Étoile Filante Senior',
        slug: 'ef-senior',
        category: 'SENIOR',
      },
    ],
  },
];

const mockFrontendClub: Club = {
  id: 'club_fs',
  name: 'Fire Stone Basketball Club',
  slug: 'fire-stone',
  shortName: 'FSBC',
  city: 'Lomé',
  country: 'Togo',
  arena: 'Terrain Municipal de Lomé',
  description: 'Le club phare de basketball de Lomé.',
  isVerified: true,
  primaryColor: '#FF2A3B',
  secondaryColor: '#FFB800',
  teams: [
    {
      id: 'team_senior',
      clubId: 'club_fs',
      clubName: 'Fire Stone Basketball Club',
      name: 'Fire Stone Senior D1',
      slug: 'fire-stone-senior',
      category: 'SENIOR',
      city: 'Lomé',
    },
  ],
};

describe('ClubsExperience — Clubs Directory & Profile', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('ClubsDirectoryPage charge et affiche la liste des clubs depuis clubApi', async () => {
    vi.spyOn(clubApi, 'fetchClubs').mockResolvedValue(mockClubs);
    const onSelectProfile = vi.fn();
    const onSelectTeamWorkspace = vi.fn();
    const onOpenAuth = vi.fn();

    render(
      <ClubsDirectoryPage
        onSelectClubProfile={onSelectProfile}
        onSelectTeamWorkspace={onSelectTeamWorkspace}
        onOpenAuth={onOpenAuth}
        currentUserRole="VISITOR"
        isAuthenticated={false}
      />
    );

    // Vérifier que les clubs s'affichent
    await waitFor(() => {
      expect(screen.getByText('Fire Stone Basketball Club')).toBeInTheDocument();
      expect(screen.getByText('Étoile Filante Basketball')).toBeInTheDocument();
    });

    // Badge vérifié pour Fire Stone
    expect(screen.getByTitle('Club vérifié officiel')).toBeInTheDocument();

    // Clic sur "Page Sociale Club"
    const viewButtons = screen.getAllByText('Page Sociale Club');
    fireEvent.click(viewButtons[0]);
    expect(onSelectProfile).toHaveBeenCalled();
  });

  it('ClubsDirectoryPage filtre les clubs avec le champ de recherche', async () => {
    vi.spyOn(clubApi, 'fetchClubs').mockResolvedValue(mockClubs);

    render(
      <ClubsDirectoryPage
        onSelectClubProfile={vi.fn()}
        onSelectTeamWorkspace={vi.fn()}
        onOpenAuth={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Fire Stone Basketball Club')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Rechercher un club, une ville/i);
    fireEvent.change(searchInput, { target: { value: 'Étoile' } });

    // Seul Étoile Filante reste visible
    expect(screen.queryByText('Fire Stone Basketball Club')).not.toBeInTheDocument();
    expect(screen.getByText('Étoile Filante Basketball')).toBeInTheDocument();
  });

  it('ClubProfilePage affiche les informations du club et permet de basculer entre les onglets', async () => {
    vi.spyOn(clubApi, 'fetchClubDetails').mockResolvedValue(mockClubs[0]);
    vi.spyOn(clubApi, 'fetchClubRoster').mockResolvedValue([
      {
        id: 'p_1',
        name: 'Marcus Vance',
        number: 7,
        position: 'Meneur (PG)',
        isCaptain: true,
        height: '1.88 m',
        weight: '84 kg',
        seasonStats: { ppg: 22.4, rpg: 5.1, apg: 8.7, efficiency: 24.5 },
      },
    ]);
    vi.spyOn(clubApi, 'fetchClubMatches').mockResolvedValue([]);
    vi.spyOn(clubApi, 'fetchClubNews').mockResolvedValue([]);
    vi.spyOn(clubApi, 'fetchClubStats').mockResolvedValue({
      wins: 14,
      losses: 2,
      played: 16,
      winRate: '87.5',
      avgPointsScored: 86.4,
      avgPointsAllowed: 71.2,
      last5: ['W', 'W', 'W', 'W', 'L'],
    });

    const onBack = vi.fn();
    const onEnterWorkspace = vi.fn();
    const onOpenAuth = vi.fn();

    render(
      <ClubProfilePage
        club={mockFrontendClub}
        onBack={onBack}
        onEnterWorkspace={onEnterWorkspace}
        onOpenAuth={onOpenAuth}
        currentRole="VISITOR"
      />
    );

    // Titre et nom du club
    expect(screen.getByText('Fire Stone Basketball Club')).toBeInTheDocument();

    // Navigation retour
    const backBtn = screen.getByText(/Annuaire des clubs/i);
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();

    // Onglet Effectif
    const rosterTab = screen.getByText(/Effectif/i);
    fireEvent.click(rosterTab);

    await waitFor(() => {
      expect(screen.getByText('Marcus Vance')).toBeInTheDocument();
      expect(screen.getByText(/22.4/i)).toBeInTheDocument();
    });

    // Onglet Statistiques
    const statsTab = screen.getByText(/Statistiques/i);
    fireEvent.click(statsTab);

    await waitFor(() => {
      expect(screen.getByText('Performances Officielles de la Franchise')).toBeInTheDocument();
      expect(screen.getByText('87.5')).toBeInTheDocument();
      expect(screen.getByText('14')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('ClubCreateModal s’ouvre et affiche les champs de création', () => {
    const onClose = vi.fn();

    render(
      <ClubCreateModal
        isOpen={true}
        onClose={onClose}
        isAuthenticated={true}
        currentUserRole="CLUB_MANAGER"
      />
    );

    expect(screen.getByText(/Inscrire ou Demander un Club/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ex: Fire Stone Basketball Club/i)).toBeInTheDocument();

    const closeBtn = screen.getByLabelText(/Fermer/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
