import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PublicLandingPage } from '../components/public/PublicLandingPage';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { AboutPage } from '../components/public/AboutPage';
import { ContactPage } from '../components/public/ContactPage';
import { PublicFooter } from '../components/public/PublicFooter';
import { App } from '../App';

describe('Refonte Vitrine Publique Ligue & Espace Club', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('affiche la PublicNavbar avec le logo HOOPERS PRO et les liens de navigation', () => {
    const mockNavigate = vi.fn();
    const mockOpenAuth = vi.fn();
    const mockEnterWorkspace = vi.fn();

    render(
      <PublicNavbar
        activeTab="accueil"
        onNavigate={mockNavigate}
        onOpenAuth={mockOpenAuth}
        onEnterWorkspace={mockEnterWorkspace}
        isAuthenticated={false}
        theme="dark"
        onToggleTheme={vi.fn()}
      />
    );

    // Marque de la Ligue
    expect(screen.getAllByText(/HOOPERS/i)[0]).toBeInTheDocument();
    // PRO badge exact match (text content is exactly "PRO")
    const proBadges = screen.getAllByText(/^PRO$/i);
    expect(proBadges.length).toBeGreaterThan(0);

    // Liens de navigation
    expect(screen.getByRole('button', { name: /Accueil/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Franchises & Clubs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Joueurs Stars/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Équipe du Mois/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /À Propos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Contact/i })).toBeInTheDocument();

    // Boutons d'accès
    const createBtn = screen.getByRole('button', { name: /Créer un compte/i });
    expect(createBtn).toBeInTheDocument();
    fireEvent.click(createBtn);
    expect(mockOpenAuth).toHaveBeenCalledWith('register');
  });

  it('rend PublicLandingPage avec le hero épuré, les MVPs, l’Équipe du Mois et les franchises', () => {
    const mockOpenAuth = vi.fn();
    const mockSelectTeam = vi.fn();
    const mockNavigateTab = vi.fn();

    render(
      <PublicLandingPage
        onOpenAuth={mockOpenAuth}
        onSelectTeamWorkspace={mockSelectTeam}
        onNavigateTab={mockNavigateTab}
      />
    );

    // Titre Hero
    expect(screen.getByText(/L'art du jeu/i)).toBeInTheDocument();
    expect(screen.getByText(/L'intensité du/i)).toBeInTheDocument();

    // MVPs de chaque équipe
    expect(screen.getByText(/Le Meilleur Joueur de Chaque Équipe/i)).toBeInTheDocument();
    expect(screen.getByText(/Marcus "Apex" Vance/i)).toBeInTheDocument();
    expect(screen.getByText(/Malik "Viper" Diallo/i)).toBeInTheDocument();
    expect(screen.getByText(/Darius "The Wall" Jackson/i)).toBeInTheDocument();
    expect(screen.getByText(/Koffi "Thunder" Mensah/i)).toBeInTheDocument();

    // Analyse Équipe du Mois
    expect(screen.getByText(/L'Équipe du Mois : FIRE STONE Elite/i)).toBeInTheDocument();
    expect(screen.getByText(/Bilan Mensuel & Données de Match/i)).toBeInTheDocument();
    expect(screen.getByText(/Points \/ Match/i)).toBeInTheDocument();
    expect(screen.getByText(/Différentiel Net/i)).toBeInTheDocument();

    // Liste des franchises
    expect(screen.getByText(/Toutes les Franchises de la Ligue/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Cobras de Dakar/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Éperviers BBC/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Abidjan Basket Club/i).length).toBeGreaterThan(0);

    // Clic pour entrer dans l'Espace Club
    const clubBtns = screen.getAllByRole('button', { name: /Espace Club/i });
    expect(clubBtns.length).toBeGreaterThan(0);
    fireEvent.click(clubBtns[0]);
    expect(mockSelectTeam).toHaveBeenCalled();
  });

  it('rend la page À Propos avec les 4 piliers fondateurs', () => {
    render(<AboutPage onOpenAuth={vi.fn()} onEnterWorkspace={vi.fn()} />);

    expect(screen.getByText(/À Propos de HOOPERS/i)).toBeInTheDocument();
    expect(screen.getByText(/L'Écosystème Digital du/i)).toBeInTheDocument();
    expect(screen.getByText(/Compétition & Rigueur/i)).toBeInTheDocument();
    expect(screen.getByText(/Détection & Académies/i)).toBeInTheDocument();
    expect(screen.getByText(/Digital & Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Rayonnement Régional/i)).toBeInTheDocument();
  });

  it('rend la page Contact avec le formulaire interactif', async () => {
    render(<ContactPage />);

    expect(screen.getByText(/Contact & Relations Publiques/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ex: Jean-Marc Vance/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/contact@organisation.com/i)).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/Ex: Jean-Marc Vance/i);
    const emailInput = screen.getByPlaceholderText(/contact@organisation.com/i);
    const messageInput = screen.getByPlaceholderText(/Précisez votre demande/i);
    const submitBtn = screen.getByRole('button', { name: /Envoyer la demande officielle/i });

    fireEvent.change(nameInput, { target: { value: 'Jean Dupont' } });
    fireEvent.change(emailInput, { target: { value: 'jean@example.com' } });
    fireEvent.change(messageInput, { target: { value: 'Proposition de sponsoring officiel.' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Message transmis avec succès/i)).toBeInTheDocument();
    });
  });

  it('rend PublicFooter avec les mentions et coordonnées de la ligue', () => {
    render(<PublicFooter onNavigate={vi.fn()} onEnterWorkspace={vi.fn()} />);

    expect(screen.getAllByText(/HOOPERS/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Siège & Informations/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Portail Club/i })).toBeInTheDocument();
  });

  it('App démarre en mode public (ZÉRO Sidebar) et bascule vers l’espace club sur action', () => {
    render(<App />);

    // En mode public : la PublicNavbar est présente
    expect(screen.getAllByText(/HOOPERS/i)[0]).toBeInTheDocument();

    // En mode public : le Hero Ligue est présent
    expect(screen.getByText(/L'art du jeu/i)).toBeInTheDocument();

    // En mode public : la Sidebar d'équipe n'est PAS dans le document principal
    expect(screen.queryByText(/Super Admin Console/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Trésorerie & Cotisations/i)).not.toBeInTheDocument();

    // Clic sur "Espace Club" pour une franchise
    const clubBtns = screen.getAllByRole('button', { name: /Espace Club/i });
    expect(clubBtns.length).toBeGreaterThan(0);
    fireEvent.click(clubBtns[0]);

    // L'interface a basculé vers le mode Club Workspace
    // Le bandeau de retour au portail public doit être présent
    expect(screen.getByText(/Portail Public \(Ligue\)/i)).toBeInTheDocument();

    // Clic pour revenir au portail public
    const backBtn = screen.getByRole('button', { name: /Portail Public \(Ligue\)/i });
    fireEvent.click(backBtn);

    // De retour au portail public
    expect(screen.getByText(/L'art du jeu/i)).toBeInTheDocument();
  });
});
