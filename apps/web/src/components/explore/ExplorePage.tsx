import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Shield, Flame, Sparkles, MapPin, ArrowRight, LogIn,
  User, FileText, Loader2, CheckCircle2,
} from 'lucide-react';
import { clubApi, type ApiClub } from '../../services/clubApi';
import { apiUrl } from '../../services/api';
import type { UserRole } from '../../types';

// ─── Auth helper ────────────────────────────────────────────────────────────
const getAuthToken = (): string => {
  try {
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    return session?.token || '';
  } catch { return ''; }
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface ExplorePageProps {
  onSelectClubProfile?: (clubId: string) => void;
  onNavigateToMatches?: () => void;
  onOpenAuth?: () => void;
  isAuthenticated?: boolean;
  currentRole?: UserRole;
}

interface ApiPlayer {
  id: string;
  name?: string | null;
  position?: string;
  avatarUrl?: string | null;
  club?: { name?: string | null } | null;
  seasonStats?: { ppg?: number } | null;
}

interface ApiMatch {
  id: string;
  homeTeam?: { name?: string | null } | null;
  awayTeam?: { name?: string | null } | null;
  scheduledAt?: string | null;
  venue?: string | null;
  status?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
}

interface TrendingTopic {
  tag: string;
  postsCount: string;
  category: string;
}

// Résultats de la recherche globale
interface GlobalSearchResults {
  users: Array<{ id: string; name: string; avatarUrl?: string | null; role: string; city?: string | null }>;
  clubs: Array<{ id: string; name: string; slug: string; shortName?: string | null; logoUrl?: string | null; city: string; primaryColor?: string | null; membersCount?: number; followersCount?: number }>;
  posts: Array<{ id: string; content: string; mediaUrl?: string | null; authorName: string; authorAvatar?: string | null; createdAt: string }>;
  players: Array<{ id: string; userId: string; name: string; avatarUrl?: string | null; position?: string | null; jerseyNumber?: number | null; teamName?: string | null; stats?: { ppg?: number } }>;
}

// ─── FollowClubButton — composant interne ────────────────────────────────────
const FollowClubButton: React.FC<{
  clubId: string;
  isFollowing: boolean;
  isAuthenticated: boolean;
  onOpenAuth?: () => void;
  onToggle: (clubId: string, following: boolean) => void;
}> = ({ clubId, isFollowing, isAuthenticated, onOpenAuth, onToggle }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { onOpenAuth?.(); return; }
    const token = getAuthToken();
    if (!token) { onOpenAuth?.(); return; }

    setLoading(true);
    setError(false);
    try {
      const res = await fetch(apiUrl(`/clubs/${clubId}/follow`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      onToggle(clubId, data.following);
    } catch {
      setError(true);
      setTimeout(() => setError(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <button disabled className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 text-slate-400 shrink-0 flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
      </button>
    );
  }

  if (error) {
    return (
      <button disabled className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-900/40 text-red-400 shrink-0">
        Erreur
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      title={isAuthenticated ? 'Suivre ce club' : 'Connectez-vous pour suivre ce club'}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
        isFollowing
          ? 'bg-[#FF2A3B] text-white'
          : 'bg-white/10 hover:bg-[#FF2A3B] hover:text-white text-slate-200'
      }`}
    >
      {isFollowing && <CheckCircle2 className="w-3 h-3" />}
      {isFollowing ? 'Suivi' : isAuthenticated ? 'Suivre' : '🔒 Suivre'}
    </button>
  );
};

// ─── Composant principal ─────────────────────────────────────────────────────
export const ExplorePage: React.FC<ExplorePageProps> = ({
  onSelectClubProfile,
  onNavigateToMatches,
  onOpenAuth,
  isAuthenticated = false,
  currentRole: _currentRole = 'VISITOR',
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PLAYERS' | 'CLUBS' | 'MATCHES' | 'USERS' | 'POSTS'>('ALL');

  // État "Découverte" (vue sans recherche)
  const [clubs, setClubs] = useState<(ApiClub & { isFollowing?: boolean })[]>([]);
  const [matches, setMatches] = useState<ApiMatch[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);

  // État recherche globale
  const [searchResults, setSearchResults] = useState<GlobalSearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Chargement initial (découverte) ─────────────────────────────────────
  useEffect(() => {
    // Clubs avec état de suivi
    clubApi.fetchClubs()
      .then(async (data) => {
        const clubsArray = Array.isArray(data) ? data : [];
        const token = getAuthToken();
        if (token) {
          const withFollow = await Promise.all(
            clubsArray.map(async (club) => {
              try {
                const stats = await clubApi.getClubFollowStats(club.id, token);
                return { ...club, isFollowing: stats.isFollowing };
              } catch { return { ...club, isFollowing: false }; }
            })
          );
          setClubs(withFollow);
        } else {
          setClubs(clubsArray.map((c) => ({ ...c, isFollowing: false })));
        }
      })
      .catch(() => setClubs([]));

    // Matchs
    fetch(apiUrl('/matches'))
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        setMatches(Array.isArray(data) ? data : Array.isArray(data?.matches) ? data.matches : []);
      })
      .catch(() => setMatches([]));

    // Trending topics via posts
    fetch(apiUrl('/posts'))
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        const posts: Array<{ content?: string | null }> = Array.isArray(data) ? data : Array.isArray(data?.posts) ? data.posts : [];
        const tagCounts: Record<string, number> = {};
        posts.forEach((p) => {
          const matches = (typeof p?.content === 'string' ? p.content : '').match(/#\w+/g) || [];
          matches.forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
        });
        setTrendingTopics(
          Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([tag, count]) => ({ tag, postsCount: `${count} post${count > 1 ? 's' : ''}`, category: 'Basketball' }))
        );
      })
      .catch(() => setTrendingTopics([]));
  }, []);

  // ── Recherche globale (debounce 300ms) ──────────────────────────────────
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    const q = query.trim();

    if (q.length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(apiUrl(`/search?q=${encodeURIComponent(q)}&limit=5`));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: GlobalSearchResults = await res.json();
        setSearchResults(data);
      } catch {
        setSearchResults({ users: [], clubs: [], posts: [], players: [] });
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [query]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleFollowToggle = useCallback((clubId: string, following: boolean) => {
    setClubs((prev) => prev.map((c) => c.id === clubId ? { ...c, isFollowing: following } : c));
  }, []);

  const handleSelectClub = useCallback((clubId: string) => {
    onSelectClubProfile?.(clubId);
  }, [onSelectClubProfile]);

  const hasSearch = query.trim().length >= 2;

  const totalResults = searchResults
    ? searchResults.users.length + searchResults.clubs.length + searchResults.posts.length + searchResults.players.length
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* ── Bandeau CTA invité ── */}
      {!isAuthenticated && (
        <div className="social-card-border rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl bg-gradient-to-r from-[#FF2A3B]/10 via-[#0D1018] to-[#FFB800]/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#FF2A3B]/20 border border-[#FF2A3B]/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#FFB800]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-black text-white">Rejoignez la communauté HOOPERS</h4>
              <p className="text-xs text-slate-400">Connectez-vous pour suivre vos clubs favoris et interagir avec la ligue.</p>
            </div>
          </div>
          <button
            onClick={() => onOpenAuth?.()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#E60023] text-white text-xs font-bold shadow-lg shadow-red-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Se connecter</span>
          </button>
        </div>
      )}

      {/* ── Barre de Recherche ── */}
      <div className="social-card-border rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#FFB800]" />
          <h2 className="text-xl font-black text-white uppercase tracking-tight">
            Explorer le Basketball HOOPERS
          </h2>
        </div>

        <div className="relative">
          {isSearching
            ? <Loader2 className="w-5 h-5 text-[#FFB800] absolute left-4 top-1/2 -translate-y-1/2 animate-spin" />
            : <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          }
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Joueurs, clubs, posts, hashtags…"
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/10 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:border-[#FF2A3B] text-sm transition-colors"
          />
        </div>

        {/* Filtres */}
        {hasSearch && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            {(['ALL', 'USERS', 'PLAYERS', 'CLUBS', 'POSTS'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filter === tab
                    ? 'bg-[#FF2A3B] text-white shadow-md'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab === 'ALL' && 'Tout'}
                {tab === 'USERS' && 'Profils'}
                {tab === 'PLAYERS' && 'Joueurs'}
                {tab === 'CLUBS' && 'Clubs'}
                {tab === 'POSTS' && 'Posts'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Résultats de Recherche ── */}
      {hasSearch ? (
        <div className="space-y-6">
          {isSearching && !searchResults && (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-[#FF2A3B]" />
              <span className="text-sm">Recherche en cours…</span>
            </div>
          )}

          {searchResults && (
            <>
              <p className="text-xs text-slate-400">
                {totalResults} résultat{totalResults > 1 ? 's' : ''} pour « {query.trim()} »
              </p>

              {totalResults === 0 && (
                <div className="social-card-border rounded-3xl p-10 text-center space-y-3">
                  <Search className="w-8 h-8 text-slate-500 mx-auto" />
                  <h3 className="text-base font-bold text-white">Aucun résultat trouvé</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Essayez d'autres mots-clés, comme « Fire Stone », « Meneur » ou un nom de ville.
                  </p>
                </div>
              )}

              {/* Profils utilisateurs */}
              {(filter === 'ALL' || filter === 'USERS') && searchResults.users.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Profils
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {searchResults.users.map((u) => (
                      <div key={u.id} className="social-card-border rounded-2xl p-3.5 flex items-center gap-3">
                        <img
                          src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=FF2A3B&color=fff`}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover bg-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-white block truncate">{u.name}</span>
                          <span className="text-xs text-slate-400">{u.role}{u.city ? ` • ${u.city}` : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Joueurs */}
              {(filter === 'ALL' || filter === 'PLAYERS') && searchResults.players.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Joueurs
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {searchResults.players.map((p) => (
                      <div key={p.id} className="social-card-border rounded-2xl p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=FF2A3B&color=fff`}
                            alt={p.name}
                            className="w-10 h-10 rounded-full object-cover bg-slate-800"
                          />
                          <div>
                            <span className="text-sm font-bold text-white block">{p.name}</span>
                            <span className="text-xs text-slate-400">
                              {p.position || 'Joueur'}{p.teamName ? ` • ${p.teamName}` : ''}
                            </span>
                          </div>
                        </div>
                        {p.stats?.ppg != null && (
                          <span className="text-xs font-black text-[#FFB800]">{p.stats.ppg} PPG</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clubs */}
              {(filter === 'ALL' || filter === 'CLUBS') && searchResults.clubs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-[#FFB800]" /> Clubs
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {searchResults.clubs.map((c) => {
                      const localClub = clubs.find((lc) => lc.id === c.id);
                      const isFollowing = localClub?.isFollowing ?? false;
                      return (
                        <div
                          key={c.id}
                          className="social-card-border rounded-2xl p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors group"
                        >
                          <div
                            onClick={() => handleSelectClub(c.id)}
                            className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                          >
                            <img
                              src={c.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=FF2A3B&color=fff`}
                              alt={c.name}
                              className="w-10 h-10 rounded-xl object-cover bg-slate-800 p-1"
                            />
                            <div className="min-w-0">
                              <span className="text-sm font-bold text-white group-hover:text-[#FFB800] transition-colors block truncate">{c.name}</span>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#FFB800]" /> {c.city || '—'}
                              </span>
                            </div>
                          </div>
                          <FollowClubButton
                            clubId={c.id}
                            isFollowing={isFollowing}
                            isAuthenticated={isAuthenticated}
                            onOpenAuth={onOpenAuth}
                            onToggle={handleFollowToggle}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Posts */}
              {(filter === 'ALL' || filter === 'POSTS') && searchResults.posts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Publications
                  </h3>
                  <div className="space-y-3">
                    {searchResults.posts.map((p) => (
                      <div key={p.id} className="social-card-border rounded-2xl p-3.5 space-y-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={p.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.authorName)}&background=FF2A3B&color=fff`}
                            alt={p.authorName}
                            className="w-7 h-7 rounded-full object-cover bg-slate-800"
                          />
                          <span className="text-xs font-bold text-white">{p.authorName}</span>
                          <span className="text-xs text-slate-500 ml-auto">
                            {new Date(p.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{p.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA invité */}
              {!isAuthenticated && (
                <div className="social-card-border rounded-3xl p-5 text-center space-y-3 bg-gradient-to-br from-[#0D1018] to-[#121621]">
                  <h4 className="text-sm font-black text-white">Vous voulez aller plus loin ?</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Créez votre compte gratuitement pour suivre vos clubs, recevoir les alertes de match et interagir avec la communauté.
                  </p>
                  <button
                    onClick={() => onOpenAuth?.()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#E60023] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Créer un compte</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* ── Vue d'accueil Explore (Tendances & Découvertes) ── */
        <div className="space-y-6">
          {/* Tendances */}
          <div className="social-card-border rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#FF2A3B]" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Tendances de la Ligue</h3>
            </div>
            {trendingTopics.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Aucune tendance disponible pour le moment.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trendingTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(topic.tag)}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-left flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <span className="text-xs font-extrabold text-[#FFB800] group-hover:underline block">{topic.tag}</span>
                      <span className="text-[11px] text-slate-400">{topic.category}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{topic.postsCount}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clubs à Découvrir */}
          <div className="social-card-border rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#FFB800]" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Clubs à Découvrir</h3>
              </div>
              <button
                onClick={() => setQuery(' ')}
                className="text-xs text-[#FF2A3B] hover:underline font-bold flex items-center gap-1"
              >
                Voir tout <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {clubs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Chargement des clubs…</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {clubs.slice(0, 4).map((club) => (
                  <div
                    key={club.id}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between group"
                  >
                    <div
                      onClick={() => handleSelectClub(club.id)}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    >
                      <img
                        src={club.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(club.name)}&background=FF2A3B&color=fff`}
                        alt={club.name}
                        className="w-10 h-10 rounded-xl object-cover bg-slate-800"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white group-hover:text-[#FFB800] transition-colors block truncate">{club.name}</span>
                        <span className="text-[11px] text-slate-400">{club.city || '—'}</span>
                      </div>
                    </div>
                    <FollowClubButton
                      clubId={club.id}
                      isFollowing={club.isFollowing ?? false}
                      isAuthenticated={isAuthenticated}
                      onOpenAuth={onOpenAuth}
                      onToggle={handleFollowToggle}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Matchs récents */}
          {matches.length > 0 && (
            <div className="social-card-border rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#FFB800]" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Matchs Récents</h3>
              </div>
              <div className="space-y-2">
                {matches.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onNavigateToMatches?.()}
                    className="social-card-border rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">
                        {m.homeTeam?.name || '?'} vs {m.awayTeam?.name || '?'}
                      </div>
                      <span className="text-xs text-slate-400">
                        {m.scheduledAt
                          ? new Date(m.scheduledAt).toLocaleDateString('fr-FR', {
                              weekday: 'short', day: 'numeric', month: 'short',
                              hour: '2-digit', minute: '2-digit',
                            })
                          : ''}
                        {m.venue ? ` • ${m.venue}` : ''}
                      </span>
                    </div>
                    {m.status === 'LIVE' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black hoopers-badge-live text-white animate-pulse">
                        LIVE {m.homeScore ?? 0} - {m.awayScore ?? 0}
                      </span>
                    ) : m.status === 'FINISHED' ? (
                      <span className="text-xs font-black text-slate-300">{m.homeScore ?? 0} - {m.awayScore ?? 0}</span>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold">À venir</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA invité */}
          {!isAuthenticated && (
            <div className="social-card-border rounded-3xl p-6 text-center space-y-3 shadow-xl">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FF2A3B]/20 border border-[#FF2A3B]/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#FFB800]" />
              </div>
              <h4 className="text-base font-black text-white">Ne ratez plus rien de la ligue</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Inscrivez-vous pour personnaliser vos alertes, suivre vos joueurs favoris et accéder aux statistiques avancées.
              </p>
              <button
                onClick={() => onOpenAuth?.()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#E60023] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Créer un compte gratuit</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};