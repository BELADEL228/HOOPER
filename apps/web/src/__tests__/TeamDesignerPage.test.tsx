/**
 * Tests du composant TeamDesignerPage (rendu, interactions UI).
 * Les appels réseau sont mockés avec vi.stubGlobal('fetch', ...).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamDesignerPage } from '../components/TeamDesignerPage';

// ─── Mock fetch global ────────────────────────────────────────────────────────

const MOCK_TEAMS = [
  {
    id: 'team-001',
    name: 'FIRE STONE Elite',
    slug: 'fire-stone-elite',
    city: 'Lomé',
    category: 'SENIOR',
    primaryColor: '#FF2A3B',
    secondaryColor: '#FFB800',
    accentColor: '#38BDF8',
    themeType: 'dark',
    themeJson: null,
  },
  {
    id: 'team-002',
    name: 'Éperviers BBC',
    slug: 'eperviers-bbc',
    city: 'Kara',
    category: 'SENIOR',
    primaryColor: '#059669',
    secondaryColor: '#EAB308',
    accentColor: '#38BDF8',
    themeType: 'dark',
    themeJson: null,
  },
];

function createFetchMock(overrides?: Record<string, unknown>) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => overrides ?? MOCK_TEAMS,
  } as Response);
}

beforeEach(() => {
  // Mock du localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    },
    writable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Tests de rendu ────────────────────────────────────────────────────────────

describe('TeamDesignerPage — rendu initial', () => {
  it('affiche le titre de la page', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<TeamDesignerPage />);
    expect(screen.getByText(/Identité Visuelle/i)).toBeInTheDocument();
  });

  it('affiche le label "AI Team Designer"', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<TeamDesignerPage />);
    expect(screen.getByText(/AI Team Designer/i)).toBeInTheDocument();
  });

  it('affiche la section "Étape 2 : Importation & Analyse IA"', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<TeamDesignerPage />);
    expect(screen.getByText(/Importation.*Analyse IA/i)).toBeInTheDocument();
  });

  it("affiche le label de la zone d'upload", async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<TeamDesignerPage />);
    expect(screen.getByText(/Glissez ou cliquez pour importer/i)).toBeInTheDocument();
  });

  it("affiche l'input de fichier caché", async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<TeamDesignerPage />);
    const input = document.getElementById('logo-uploader');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('accept', 'image/png,image/jpeg,image/webp,image/svg+xml');
  });
});

// ─── Tests : bouton d'analyse ────────────────────────────────────────────────

describe('TeamDesignerPage — bouton "Analyser les couleurs"', () => {
  it("est désactivé quand aucun fichier n'est sélectionné", async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<TeamDesignerPage />);
    const btn = screen.getByText(/Analyser les couleurs/i).closest('button');
    expect(btn).toBeDisabled();
  });

  it("devient actif après sélection d'un fichier image", async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<TeamDesignerPage />);

    const input = document.getElementById('logo-uploader') as HTMLInputElement;
    const file = new File(['fake-png-data'], 'logo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const btn = screen.getByText(/Analyser les couleurs/i).closest('button');
      expect(btn).not.toBeDisabled();
    });
  });

  it('affiche un aperçu du nom de fichier après sélection', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<TeamDesignerPage />);

    const input = document.getElementById('logo-uploader') as HTMLInputElement;
    const file = new File(['fake-png-data'], 'mon-logo-equipe.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/mon-logo-equipe\.png/i)).toBeInTheDocument();
    });
  });
});

// ─── Tests : presets ─────────────────────────────────────────────────────────

describe('TeamDesignerPage — presets', () => {
  it('affiche au moins 1 preset dans la section presets', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<TeamDesignerPage />);
    // Le texte "FIRE STONE Elite" est un preset
    expect(screen.getAllByText(/FIRE STONE Elite/i).length).toBeGreaterThan(0);
  });
});

// ─── Tests : chargement des équipes ─────────────────────────────────────────

describe('TeamDesignerPage — chargement des équipes', () => {
  it("charge et affiche les équipes depuis l'API", async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<TeamDesignerPage />);

    await waitFor(() => {
      // Le select doit contenir les noms des équipes mockées
      expect(screen.getByText(/FIRE STONE Elite.*Lomé/i)).toBeInTheDocument();
    });
  });

  it("affiche un fallback si l'API est indisponible", async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    render(<TeamDesignerPage />);

    await waitFor(() => {
      // En mode hors ligne, le select affiche l'option de fallback
      expect(screen.getAllByText(/FIRE STONE Elite/i).length).toBeGreaterThan(0);
    });
  });
});

// ─── Tests : onglets du studio ───────────────────────────────────────────────

describe('TeamDesignerPage — onglets du studio visuel', () => {
  it('affiche les 4 onglets du studio', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<TeamDesignerPage />);

    expect(screen.getByText(/Maillots Officiels/i)).toBeInTheDocument();
    expect(screen.getByText(/Carte Club Pro/i)).toBeInTheDocument();
    expect(screen.getByText(/Affiche Matchday/i)).toBeInTheDocument();
    expect(screen.getByText(/Guide UI/i)).toBeInTheDocument();
  });

  it('affiche la vue Maillots par défaut', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<TeamDesignerPage />);
    expect(screen.getByText(/Kit Officiel de Match/i)).toBeInTheDocument();
  });

  it('bascule vers la vue Carte Club après clic', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<TeamDesignerPage />);

    const tabBtn = screen.getByRole('button', { name: /Carte Club Pro/i });
    fireEvent.click(tabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Roster Badge/i)).toBeInTheDocument();
    });
  });

  it('bascule vers la vue Guide UI après clic', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<TeamDesignerPage />);

    const tabBtn = screen.getByRole('button', { name: /Guide UI/i });
    fireEvent.click(tabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Système de Design/i)).toBeInTheDocument();
    });
  });
});

// ─── Tests : boutons d'en-tête ────────────────────────────────────────────────

describe('TeamDesignerPage — boutons header', () => {
  it('affiche le bouton "Exporter tokens (JSON)"', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<TeamDesignerPage />);
    expect(screen.getByText(/Exporter tokens/i)).toBeInTheDocument();
  });

  it("affiche le bouton \"Sauvegarder pour l'équipe\"", async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<TeamDesignerPage />);
    expect(screen.getByText(/Sauvegarder/i)).toBeInTheDocument();
  });

  it('bouton copier JSON invoque clipboard.writeText', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    const mockWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWrite },
      writable: true,
    });

    render(<TeamDesignerPage />);
    const copyBtn = screen.getByText(/Exporter tokens/i).closest('button') as HTMLButtonElement;
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(mockWrite).toHaveBeenCalledOnce();
    });
  });
});
