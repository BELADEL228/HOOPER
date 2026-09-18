/**
 * Tests du composant LandingHero (Page d'accueil club, Annonces, Vidéos & Aperçu d'équipe)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { LandingHero } from '../components/LandingHero';
import { TeamOverviewModal } from '../components/TeamOverviewModal';

describe('LandingHero & Page d\'accueil', () => {
  const mockNavigate = vi.fn();
  const mockOpenAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rend directement TeamOverviewModal sans erreur', () => {
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
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByTestId('team-overview-modal')).toBeInTheDocument();
  });

  it('affiche le bandeau des annonces officielles, les stories et le titre principal', () => {
    render(
      <LandingHero
        currentRole="VISITOR"
        onNavigate={mockNavigate}
        onOpenAuth={mockOpenAuth}
      />
    );

    // Annonce officielle ticker
    expect(screen.getByText(/Annonce Officielle/i)).toBeInTheDocument();

    // Stories bar
    expect(screen.getByText(/Stories & Événements Flash/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Entraînement/i)).toBeInTheDocument();

    // Titre principal (H1)
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/L'énergie du FEU/i);
    expect(h1).toHaveTextContent(/La solidité de la PIERRE/i);
  });

  it('affiche la section des équipes officielles du club', () => {
    render(
      <LandingHero
        currentRole="VISITOR"
        onNavigate={mockNavigate}
        onOpenAuth={mockOpenAuth}
      />
    );

    expect(screen.getByText(/Découvrez Nos Équipes Officielles/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /FIRE STONE Elite \(Pro D1\)/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /FIRE STONE U20 Espoirs/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /FIRE STONE Féminin/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /Académie FIRE STONE Adétikopé/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /Éperviers BBC/i })).toBeInTheDocument();
  });

  it('ouvre le modal d\'aperçu complet lorsqu\'on clique sur une équipe', async () => {
    render(
      <LandingHero
        currentRole="VISITOR"
        onNavigate={mockNavigate}
        onOpenAuth={mockOpenAuth}
      />
    );

    // Cliquer sur la carte de FIRE STONE Elite
    const eliteCard = screen.getByTestId('team-card-team-001');
    fireEvent.click(eliteCard);

    // Le modal d'aperçu s'ouvre
    await waitFor(() => {
      const modal = screen.getByTestId('team-overview-modal');
      expect(modal).toBeInTheDocument();
      expect(within(modal).getByText(/Présentation du Pôle/i)).toBeInTheDocument();
      expect(within(modal).getByRole('button', { name: /Effectif Joueurs/i })).toBeInTheDocument();
      expect(within(modal).getByRole('button', { name: /Matchs & Calendrier/i })).toBeInTheDocument();
      expect(within(modal).getByRole('button', { name: /Boutique Maillots/i })).toBeInTheDocument();
    });

    const modal = screen.getByTestId('team-overview-modal');
    // Basculer vers l'onglet Effectif
    const rosterTab = within(modal).getByRole('button', { name: /Effectif Joueurs/i });
    fireEvent.click(rosterTab);

    await waitFor(() => {
      expect(within(modal).getByText(/Joueurs enregistrés dans l'effectif/i)).toBeInTheDocument();
    });
  });

  it('affiche le fil d\'actualité social avec badge vidéo et filtres', () => {
    render(
      <LandingHero
        currentRole="VISITOR"
        onNavigate={mockNavigate}
        onOpenAuth={mockOpenAuth}
      />
    );

    expect(screen.getByText(/Publications Récentes & Vidéos/i)).toBeInTheDocument();
    expect(screen.getByText(/Vidéos uniquement 🎬/i)).toBeInTheDocument();
    expect(screen.getByText(/Vidéo Officielle/i)).toBeInTheDocument();
  });

  it('permet de filtrer les publications pour n\'afficher que les vidéos', async () => {
    render(
      <LandingHero
        currentRole="VISITOR"
        onNavigate={mockNavigate}
        onOpenAuth={mockOpenAuth}
      />
    );

    const videoFilterBtn = screen.getByRole('button', { name: /Vidéos uniquement 🎬/i });
    fireEvent.click(videoFilterBtn);

    await waitFor(() => {
      expect(screen.getByText(/Vidéo Officielle/i)).toBeInTheDocument();
    });
  });

  it('permet d\'interagir avec les réactions emojis et d\'ajouter un commentaire', async () => {
    render(
      <LandingHero
        currentRole="VISITOR"
        onNavigate={mockNavigate}
        onOpenAuth={mockOpenAuth}
      />
    );

    // Emoji reaction
    const fireEmojiButtons = screen.getAllByRole('button', { name: /🔥/i });
    expect(fireEmojiButtons.length).toBeGreaterThan(0);
    fireEvent.click(fireEmojiButtons[0]);

    // Ouvrir l'espace commentaires
    const commentToggleBtns = screen.getAllByRole('button', { name: /Commentaires/i });
    fireEvent.click(commentToggleBtns[0]);

    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText(/Ajouter un commentaire officiel en tant que visiteur/i);
      expect(inputs.length).toBeGreaterThan(0);
    });
  });
});
