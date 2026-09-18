// ─── Service API Frontend — Club Data Layer ──────────────────────────────────
// Ce service remplace toutes les données mockées en dur. Chaque appel lit
// la base de données réelle via le backend Express (port 5000).

import { API_BASE_URL } from './api';
import type { StarPlayerSpotlight, TeamOfTheMonth } from '../types';

export interface ApiClub {
  id: string;
  name: string;
  slug: string;
  shortName?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  city: string;
  country?: string;
  address?: string | null;
  arena?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  foundedYear?: number | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  themeType?: string | null;
  themeJson?: any;
  isVerified?: boolean;
  teamsCount?: number;
  postsCount?: number;
  membersCount?: number;
  followersCount?: number;
  teams: ApiTeam[];
  createdAt?: string;
  isFollowing?: boolean;
}

export type ClubRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export interface ClubRequestInput {
  name: string; shortName?: string; city: string; country?: string; description?: string;
  logoUrl?: string; email?: string; phoneNumber?: string; website?: string; foundedYear?: number;
  primaryColor?: string; secondaryColor?: string;
}
export interface ApiClubRequest extends Omit<ClubRequestInput, 'name'> {
  id: string; clubName: string; status: ClubRequestStatus; adminNote?: string | null;
  reviewedAt?: string | null; createdAt: string; requester?: { id: string; name: string; email: string; avatarUrl?: string | null };
}

export interface ApiTeam {
  id: string;
  clubId?: string | null;
  clubName?: string | null;
  name: string;
  slug: string;
  category: string;
  division?: string | null;
  coachName?: string | null;
  record?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
}

export interface ApiPlayer {
  id: string;
  userId: string;
  teamId: string;
  teamName: string;
  name: string;
  number: number;
  position: string;
  category?: string;
  gender?: string;
  height: string;
  weight: string;
  age: number;
  photo: string;
  bio: string;
  experienceYears?: number;
  seasonStats: {
    ppg: number;
    rpg: number;
    apg: number;
    spg?: number;
    bpg?: number;
    efficiency?: number;
    fgPct?: number;
    threePtPct?: number;
    ftPct?: number;
  };
  achievements?: string[];
}

export interface ApiMatch {
  id: string;
  teamId?: string | null;
  teamName?: string;
  opponent: string;
  opponentLogo: string;
  isHome: boolean;
  date: string;
  time: string;
  venue: string;
  address: string;
  status: 'UPCOMING' | 'FINISHED' | string;
  scoreTeam?: number | null;
  scoreOpponent?: number | null;
  summary?: string | null;
  mvpPlayerName?: string | null;
}

export interface ApiClubStats {
  wins: number;
  losses: number;
  played: number;
  avgPointsScored: number;
  avgPointsAllowed: number;
  winRate: string;
}

export interface ApiNewsPost {
  id: string;
  clubId?: string | null;
  content: string;
  authorName: string;
  authorAvatar?: string | null;
  authorRole?: string;
  createdAt: string;
}
export interface ApiClubMember {
  id: string; clubId: string; userId: string; role: string; joinedAt: string;
  user: { id: string; name: string; email: string; avatarUrl?: string | null; role: string; isSuspended: boolean };
}

export interface ClubThemeInput {
  primary: string;
  secondary: string;
  accent: string;
  themeType?: string;
  logoUrl?: string;
}

// ─── Type enrichi pour la section "Équipe du Mois" (porteur du club brut) ─────
// TeamOfTheMonth (types.ts) est "aplati" — il perd la référence au club.
// On garde donc un wrapper qui embarque le club + les stats brutes pour
// permettre au landing d'appeler openClub(club) au clic.

export interface TeamOfTheMonthBundle {
  data: TeamOfTheMonth;
  club: ApiClub;
  stats: ApiClubStats;
}

const DEFAULT_TIMEOUT = 8000;

async function apiFetch<T>(path: string, fallback: T): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn(`[clubApi] ${path} → HTTP ${res.status}`);
      return fallback;
    }
    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(timeout);
    console.warn(`[clubApi] Offline / unreachable: ${path}`, err);
    return fallback;
  }
}

async function authenticatedFetch<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'La requête a échoué.');
  return data as T;
}

// ─── Helpers d'agrégation ─────────────────────────────────────────────────────

/** Score de tri pour un joueur (efficiency, fallback sur ppg+rpg+apg). */
const playerScore = (s: ApiPlayer['seasonStats']): number =>
  s.efficiency ?? s.ppg + s.rpg + s.apg;

/** Convertit un ApiPlayer + son club en StarPlayerSpotlight (type partagé). */
function toStarPlayerSpotlight(player: ApiPlayer, club: ApiClub): StarPlayerSpotlight {
  return {
    id: player.id,
    name: player.name,
    nickname: undefined, // non stocké en DB pour l'instant
    number: player.number,
    position: player.position,
    teamId: player.teamId,
    teamName: player.teamName,
    teamLogo: club.logoUrl ?? '',
    teamColor: club.primaryColor ?? '#f97316',
    photo: player.photo,
    quote: player.bio || '',
    stats: {
      ppg: player.seasonStats.ppg,
      apg: player.seasonStats.apg,
      rpg: player.seasonStats.rpg,
      efficiency: player.seasonStats.efficiency ?? 0,
    },
    highlightsBadge: 'TOP PERF',
    accolades: player.achievements ?? [],
  };
}

/**
 * Transforme un club + stats + meilleur joueur en TeamOfTheMonth (types.ts).
 * Les champs non présents en DB (coachQuote, tacticalAnalysis, offensiveRating…)
 * sont dérivés / mis à des valeurs par défaut.
 */
function toTeamOfTheMonth(
  club: ApiClub,
  stats: ApiClubStats,
  keyPlayer: ApiPlayer | null,
): TeamOfTheMonth {
  const diff = stats.avgPointsScored - stats.avgPointsAllowed;
  const now = new Date();
  const MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];

  const coachName = club.teams.find((t) => t.coachName)?.coachName ?? '—';

  // Approximation "rating" simple : pts marqués / encaissés (baseline 100)
  const offensiveRating = Math.round((stats.avgPointsScored || 0) * 10) / 10;
  const defensiveRating = Math.round((stats.avgPointsAllowed || 0) * 10) / 10;

  return {
    teamId: club.id,
    teamName: club.name,
    month: MONTHS_FR[now.getMonth()],
    year: now.getFullYear(),
    logo: club.logoUrl ?? '🏀',
    city: club.city,
    primaryColor: club.primaryColor ?? '#f97316',
    secondaryColor: club.secondaryColor ?? '#0f172a',
    record: `${stats.wins}V - ${stats.losses}D`,
    winStreak: 0, // non stocké en DB
    offensiveRating,
    defensiveRating,
    pointsPerGame: stats.avgPointsScored,
    pointDifferential: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}`,
    coachName,
    coachQuote: '', // non stocké en DB
    keyPlayerName: keyPlayer?.name ?? '—',
    keyPlayerStats: keyPlayer
      ? `${keyPlayer.seasonStats.ppg} pts · ${keyPlayer.seasonStats.rpg} reb · ${keyPlayer.seasonStats.apg} ast`
      : 'Aucune statistique disponible.',
    tacticalAnalysis: club.description ?? `Franchise officielle basée à ${club.city}.`,
    trophyBadge: '🏆 Meilleur bilan',
  };
}

// ─── Public API Methods ───────────────────────────────────────────────────────

export const clubApi = {
  getClubMembers(clubId: string, token: string) {
    return authenticatedFetch<ApiClubMember[]>(`/clubs/${clubId}/members`, token);
  },
  updateClubMemberRole(clubId: string, userId: string, role: string, token: string) {
    return authenticatedFetch<ApiClubMember>(`/clubs/${clubId}/members/${userId}/role`, token, { method: 'PATCH', body: JSON.stringify({ role }) });
  },
  updateClubTheme(clubId: string, data: ClubThemeInput, token: string) {
    return authenticatedFetch<{ success: boolean; club: ApiClub }>(`/clubs/${clubId}/theme`, token, { method: 'PATCH', body: JSON.stringify(data) });
  },
  analyzeClubLogo(logo: string, name: string, token: string) {
    return authenticatedFetch<{ tokens: ClubThemeInput }>('/clubs/analyze-logo', token, { method: 'POST', body: JSON.stringify({ logo, name }) });
  },
  submitClubRequest(data: ClubRequestInput, token: string) {
    return authenticatedFetch<ApiClubRequest>('/club-requests', token, { method: 'POST', body: JSON.stringify(data) });
  },
  getMyClubRequests(token: string) {
    return authenticatedFetch<ApiClubRequest[]>('/club-requests/my', token);
  },
  listClubRequests(token: string) {
    return authenticatedFetch<ApiClubRequest[]>('/club-requests', token);
  },
  approveClubRequest(id: string, token: string) {
    return authenticatedFetch<{ club: ApiClub; request: ApiClubRequest }>(`/club-requests/${id}/approve`, token, { method: 'PATCH' });
  },
  rejectClubRequest(id: string, note: string, token: string) {
    return authenticatedFetch<ApiClubRequest>(`/club-requests/${id}/reject`, token, { method: 'PATCH', body: JSON.stringify({ note }) });
  },
  createClubDirectly(data: ClubRequestInput, token: string) {
    return authenticatedFetch<ApiClub>('/clubs', token, { method: 'POST', body: JSON.stringify(data) });
  },
  createClubPost(clubId: string, content: string, token: string) {
    return authenticatedFetch<ApiNewsPost>('/posts', token, {
      method: 'POST',
      body: JSON.stringify({ clubId, content }),
    });
  },

  // ─── Finances & Trésorerie ──────────────────────────────────────────────────
  async fetchClubTransactions(clubId: string, token: string) {
    return authenticatedFetch<any[]>(`/misc/clubs/${clubId}/transactions`, token);
  },
  async createClubTransaction(clubId: string, data: any, token: string) {
    return authenticatedFetch<any>(`/misc/clubs/${clubId}/transactions`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ─── Agenda & Événements ────────────────────────────────────────────────────
  async fetchClubEvents(clubId: string) {
    return apiFetch<any[]>(`/misc/clubs/${clubId}/events`, []);
  },
  async createClubEvent(clubId: string, data: any, token: string) {
    return authenticatedFetch<any>(`/misc/clubs/${clubId}/events`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ─── Signalements & Abonnements ─────────────────────────────────────────────
  async toggleFollow(userId: string, token: string) {
    return authenticatedFetch<{ following: boolean; message: string }>(`/misc/follows/${userId}`, token, {
      method: 'POST',
    });
  },
  async toggleClubFollow(clubId: string, token: string) {
    return authenticatedFetch<{ following: boolean }>(`/clubs/${clubId}/follow`, token, {
      method: 'POST',
    });
  },
  async getClubFollowStats(clubId: string, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/clubs/${clubId}/follow-stats`, { headers });
    if (!res.ok) throw new Error('Failed to fetch follow stats');
    return res.json() as Promise<{ followers: number; isFollowing: boolean }>;
  },
  async submitReport(data: { targetType: string; targetId?: string; reason: string; details?: string }, token: string) {
    return authenticatedFetch<any>('/misc/reports', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** Liste tous les clubs avec leurs équipes */
  async fetchClubs(params?: { search?: string; city?: string; country?: string }): Promise<ApiClub[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.city && params.city !== 'ALL') qs.set('city', params.city);
    if (params?.country) qs.set('country', params.country);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return apiFetch<ApiClub[]>(`/clubs${query}`, []);
  },

  /** Fiche complète d'un club (avec équipes, membres, posts) */
  async fetchClubDetails(idOrSlug: string): Promise<ApiClub | null> {
    return apiFetch<ApiClub | null>(`/clubs/${idOrSlug}`, null);
  },

  /** Alias pour fetchClubDetails */
  async fetchClubById(idOrSlug: string): Promise<ApiClub | null> {
    return this.fetchClubDetails(idOrSlug);
  },

  /** Effectif du club (tous joueurs, ou ceux d'une équipe spécifique) */
  async fetchClubRoster(idOrSlug: string, teamId?: string): Promise<ApiPlayer[]> {
    const qs = teamId ? `?teamId=${teamId}` : '';
    return apiFetch<ApiPlayer[]>(`/clubs/${idOrSlug}/roster${qs}`, []);
  },

  /** Matchs du club (tous, ou ceux d'une équipe spécifique) */
  async fetchClubMatches(idOrSlug: string, teamId?: string): Promise<ApiMatch[]> {
    const qs = teamId ? `?teamId=${teamId}` : '';
    return apiFetch<ApiMatch[]>(`/clubs/${idOrSlug}/matches${qs}`, []);
  },

  /** Actualités et annonces du club */
  async fetchClubNews(idOrSlug: string): Promise<ApiNewsPost[]> {
    return apiFetch<ApiNewsPost[]>(`/clubs/${idOrSlug}/news`, []);
  },

  /** Statistiques agrégées du club (bilan victoires/défaites, moyennes) */
  async fetchClubStats(idOrSlug: string): Promise<ApiClubStats | null> {
    return apiFetch<ApiClubStats | null>(`/clubs/${idOrSlug}/stats`, null);
  },

  // ─── Agrégats "League-wide" (pour le landing page) ──────────────────────────

  /**
   * Top joueurs de la ligue (type StarPlayerSpotlight — types.ts).
   * Agrégé depuis les rosters de tous les clubs, trié par efficiency.
   *
   * ⚠️ Fait 1 + N appels HTTP (N = nombre de clubs, plafonné à `maxClubs`).
   */
  async fetchLeagueStars(limit = 5, maxClubs = 8): Promise<StarPlayerSpotlight[]> {
    const clubs = await this.fetchClubs();
    if (!clubs.length) return [];

    const rosters = await Promise.all(
      clubs.slice(0, maxClubs).map(async (club) => {
        try {
          const roster = await this.fetchClubRoster(club.id);
          return roster.map((p) => toStarPlayerSpotlight(p, club));
        } catch {
          return [];
        }
      }),
    );

    return rosters
      .flat()
      .sort((a, b) => b.stats.efficiency - a.stats.efficiency)
      .slice(0, limit);
  },

  /**
   * Club du mois (type TeamOfTheMonth — types.ts).
   * Renvoie aussi le club brut pour permettre `openClub(club)` côté landing.
   *
   * ⚠️ Fait 1 + 2N appels HTTP.
   */
  async fetchTeamOfTheMonth(): Promise<TeamOfTheMonthBundle | null> {
    const clubs = await this.fetchClubs();
    if (!clubs.length) return null;

    const enriched = await Promise.all(
      clubs.map(async (club) => ({
        club,
        stats: await this.fetchClubStats(club.id),
      })),
    );

    const ranked = enriched
      .filter((e): e is { club: ApiClub; stats: ApiClubStats } => !!e.stats && e.stats.played > 0)
      .sort((a, b) => {
        if (b.stats.wins !== a.stats.wins) return b.stats.wins - a.stats.wins;
        return parseFloat(b.stats.winRate) - parseFloat(a.stats.winRate);
      });

    const best = ranked[0];
    if (!best) return null;

    let keyPlayer: ApiPlayer | null = null;
    try {
      const roster = await this.fetchClubRoster(best.club.id);
      keyPlayer = roster.sort(
        (a, b) => playerScore(b.seasonStats) - playerScore(a.seasonStats),
      )[0] ?? null;
    } catch {
      /* ignore */
    }

    return {
      data: toTeamOfTheMonth(best.club, best.stats, keyPlayer),
      club: best.club,
      stats: best.stats,
    };
  },
};

export default clubApi;
