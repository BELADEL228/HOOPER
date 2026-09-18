import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { Team } from '../types';
import {
  clubApi,
  type ApiPlayer,
  type ApiMatch,
  type ApiNewsPost,
  type ApiClubStats,
  type ApiClub,
} from '../services/clubApi';

// ─── Context Shape ─────────────────────────────────────────────────────────────

export interface ClubContextValue {
  activeClub: Team;
  setActiveClub: (club: Team) => void;
  roster: ApiPlayer[];
  matches: ApiMatch[];
  news: ApiNewsPost[];
  stats: ApiClubStats | null;
  loading: boolean;
  refreshClubData: () => Promise<void>;
}

// ─── Context ───────────────────────────────────────────────────────────────────

const ClubContext = createContext<ClubContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

export const ClubProvider: React.FC<{
  children: React.ReactNode;
  initialClub: Team;
}> = ({ children, initialClub }) => {
  const [activeClub, setActiveClub] = useState<Team>(initialClub);
  const [roster, setRoster] = useState<ApiPlayer[]>([]);
  const [matches, setMatches] = useState<ApiMatch[]>([]);
  const [news, setNews] = useState<ApiNewsPost[]>([]);
  const [stats, setStats] = useState<ApiClubStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Synchroniser quand la prop change (ex: navigation depuis l'annuaire)
  useEffect(() => {
    if (initialClub.id !== activeClub.id) {
      setActiveClub(initialClub);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClub]);

  // ─── Chargement des données du club ─────────────────────────────────
  const loadData = useCallback(async (team: Team) => {
    setLoading(true);
    try {
      // 1. Récupérer la liste des clubs pour matcher l'identifiant réel
      const clubsRaw = await clubApi.fetchClubs();
      const clubs: ApiClub[] = Array.isArray(clubsRaw) ? clubsRaw : [];

      // ✅ Matching SAFE — tous les accès protégés
      const matchedClub = clubs.find((c: ApiClub) => {
        // Protection : c.teams peut être undefined
        const hasMatchingTeam =
          Array.isArray(c.teams) &&
          c.teams.some((t) => t.id === team.id || t.slug === team.slug);

        // Protection : team.name ET c.shortName peuvent être undefined
        const hasMatchingShortName =
          Boolean(c.shortName && team.name) &&
          team.name.toLowerCase().includes(c.shortName!.toLowerCase());

        return (
          c.id === team.clubId ||
          c.slug === team.slug ||
          hasMatchingTeam ||
          hasMatchingShortName
        );
      });

      const clubIdentifier = matchedClub
        ? matchedClub.id
        : team.clubId || team.slug || team.id;

      // 2. Charger les données du club en parallèle
      const [fetchedRoster, fetchedMatches, fetchedNews, fetchedStats] =
        await Promise.all([
          clubApi.fetchClubRoster(clubIdentifier),
          clubApi.fetchClubMatches(clubIdentifier),
          clubApi.fetchClubNews(clubIdentifier),
          clubApi.fetchClubStats(clubIdentifier),
        ]);

      // ✅ Normalisation : garantit des tableaux même si l'API renvoie autre chose
      setRoster(Array.isArray(fetchedRoster) ? fetchedRoster : []);
      setMatches(Array.isArray(fetchedMatches) ? fetchedMatches : []);
      setNews(Array.isArray(fetchedNews) ? fetchedNews : []);
      setStats(fetchedStats ?? null);
    } catch (err) {
      console.warn('[ClubContext] Erreur lors du chargement des données club:', err);
      // ✅ En cas d'erreur, on remet des tableaux vides pour éviter
      //    que les composants enfants crashent sur `.map()`
      setRoster([]);
      setMatches([]);
      setNews([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(activeClub);
  }, [activeClub, loadData]);

  const refreshClubData = useCallback(async () => {
    await loadData(activeClub);
  }, [activeClub, loadData]);

  return (
    <ClubContext.Provider
      value={{
        activeClub,
        setActiveClub,
        roster,
        matches,
        news,
        stats,
        loading,
        refreshClubData,
      }}
    >
      {children}
    </ClubContext.Provider>
  );
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export const useClub = (): ClubContextValue => {
  const ctx = useContext(ClubContext);
  if (!ctx) {
    throw new Error('useClub must be used inside a <ClubProvider>');
  }
  return ctx;
};

export default ClubContext;