/**
 * Tests du composant MarketplacePage (Boutique & Billetterie)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MarketplacePage } from '../components/MarketplacePage';
import type { MarketplaceProduct, TicketingMatch } from '../types';

const MOCK_PRODUCTS: MarketplaceProduct[] = [
  {
    id: 'prod-001',
    name: 'Maillot Officiel Domicile FIRE STONE 2026',
    slug: 'maillot-domicile-fire-stone-2026',
    category: 'JERSEYS',
    priceXOF: 18000,
    description: 'Le maillot officiel de match porté au Terrain du Lycée d’Adétikopé.',
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc',
    isOfficial: true,
    customizable: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    inStock: true,
    rating: 4.9,
    reviewsCount: 38,
    badge: 'BEST-SELLER',
  },
  {
    id: 'prod-003',
    name: 'Ballon Officiel FIBA FIRE STONE All-Court',
    slug: 'ballon-fiba-fire-stone',
    category: 'GEAR',
    priceXOF: 22500,
    description: 'Ballon officiel taille 7 en cuir composite.',
    imageUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf',
    isOfficial: true,
    customizable: false,
    inStock: true,
    rating: 5.0,
    reviewsCount: 44,
    badge: 'HOMOLOGUÉ FIBA',
  },
];

const MOCK_MATCHES: TicketingMatch[] = [
  {
    id: 'match-tkt-001',
    homeTeamName: 'FIRE STONE Elite',
    awayTeamName: 'Éperviers BBC',
    competition: 'Championnat National D1 Togo — J1',
    date: '2026-09-12',
    time: '16:00',
    arenaName: 'Terrain du Lycée d’Adétikopé',
    arenaCity: 'Lomé',
    isHotMatch: true,
    tiers: [
      {
        id: 'tier-pop-1',
        tierName: 'Tribune Populaire',
        priceXOF: 1000,
        description: 'Accès gradins extérieurs et buvette.',
        availableSeats: 280,
        totalSeats: 300,
        perks: ['Entrée générale', 'Placement libre gradins'],
      },
      {
        id: 'tier-vip-1',
        tierName: 'Tribune Couverte Courtside VIP',
        priceXOF: 3500,
        description: 'Siège réservé au bord du terrain.',
        availableSeats: 42,
        totalSeats: 50,
        perks: ['Siège premier rang', 'Boisson fraîche'],
      },
    ],
  },
];

beforeEach(() => {
  // Mock localStorage
  const store: Record<string, string> = {};
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        for (const k in store) delete store[k];
      }),
    },
    writable: true,
  });

  // Mock global fetch
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/marketplace/products')) {
      return Promise.resolve({
        ok: true,
        json: async () => MOCK_PRODUCTS,
      });
    }
    if (url.includes('/api/tickets/matches')) {
      return Promise.resolve({
        ok: true,
        json: async () => MOCK_MATCHES,
      });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({ success: true }),
    });
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MarketplacePage Component', () => {
  it('affiche le titre principal et les 4 onglets de navigation', async () => {
    render(<MarketplacePage />);

    expect(screen.getByText(/Boutique Officielle & Billetterie/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Boutique & Maillots/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Billetterie Matchday/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mes Billets & Commandes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Contrôle d.*Accès/i })).toBeInTheDocument();
  });

  it('affiche les produits du catalogue après chargement', async () => {
    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText(/Maillot Officiel Domicile FIRE STONE 2026/i)).toBeInTheDocument();
      expect(screen.getByText(/Ballon Officiel FIBA FIRE STONE All-Court/i)).toBeInTheDocument();
    });
  });

  it('permet de basculer vers l onglet Billetterie Matchday', async () => {
    render(<MarketplacePage />);

    const ticketsTab = screen.getByRole('button', { name: /Billetterie Matchday/i });
    fireEvent.click(ticketsTab);

    await waitFor(() => {
      expect(screen.getByText('FIRE STONE Elite')).toBeInTheDocument();
      expect(screen.getByText('Éperviers BBC')).toBeInTheDocument();
      expect(screen.getByText('Tribune Populaire')).toBeInTheDocument();
      expect(screen.getByText('Tribune Couverte Courtside VIP')).toBeInTheDocument();
    });
  });

  it('permet de basculer vers l onglet Contrôle d Accès', async () => {
    render(<MarketplacePage />);

    const scanTab = screen.getByRole('button', { name: /Contrôle d.*Accès/i });
    fireEvent.click(scanTab);

    await waitFor(() => {
      expect(screen.getByText(/Scanner de Contrôle d’Accès/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Tapez ou collez le code billet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Composter/i })).toBeInTheDocument();
    });
  });

  it('ajoute un article au panier et ouvre le panier latéral', async () => {
    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText(/Ballon Officiel FIBA FIRE STONE All-Court/i)).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /^Ajouter$/i });
    expect(addButtons.length).toBeGreaterThan(0);

    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Votre Panier/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Passer la commande/i })).toBeInTheDocument();
    });
  });

  it('ouvre le modal de personnalisation de flocage pour le maillot', async () => {
    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText(/Maillot Officiel Domicile FIRE STONE 2026/i)).toBeInTheDocument();
    });

    const customizeButton = screen.getByRole('button', { name: /Floquer/i });
    fireEvent.click(customizeButton);

    await waitFor(() => {
      expect(screen.getByText(/Personnalisation du Maillot/i)).toBeInTheDocument();
      expect(screen.getByText(/Nom sur le maillot \(Flocage\)/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('KOFFI')).toBeInTheDocument();
      expect(screen.getByDisplayValue('23')).toBeInTheDocument();
    });
  });

  it('ouvre le modal de paiement lors du passage de commande', async () => {
    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText(/Ballon Officiel FIBA FIRE STONE All-Court/i)).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /^Ajouter$/i });
    fireEvent.click(addButtons[0]);

    const checkoutBtn = await screen.findByRole('button', { name: /Passer la commande/i });
    fireEvent.click(checkoutBtn);

    await waitFor(() => {
      expect(screen.getByText(/Finaliser votre Réservation/i)).toBeInTheDocument();
      expect(screen.getByText(/T-Money/i)).toBeInTheDocument();
      expect(screen.getByText(/Flooz/i)).toBeInTheDocument();
      expect(screen.getByText(/Cash au Terrain/i)).toBeInTheDocument();
    });
  });
});
