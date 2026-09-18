import React, { useEffect, useState, useCallback } from 'react';
import {
  MapPin,
  Settings,
  CheckCircle2,
  MessageCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  UserPlus,
  UserMinus,
  Trophy,
  Briefcase,
  Heart,
  GraduationCap,
  Building2,
  Award,
} from 'lucide-react';
import type { UserRole, SocialPost } from '../../types';
import { SocialPostCard } from '../feed/SocialPostCard';
import { apiUrl } from '../../services/api';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface UserPublicProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  bio: string | null;
  city: string | null;
  country: string | null;
  createdAt: string;
  isMe: boolean;
  isFollowing: boolean;
  player: {
    jerseyNumber: number;
    position: string;
    heightCm: number;
    weightKg: number;
    age: number;
    category: string;
    experienceYears: number;
    photoUrl: string | null;
    stats: {
      ppg: number;
      rpg: number;
      apg: number;
      spg: number;
      bpg: number;
      efficiency: number;
      fgPct: number;
      threePtPct: number;
      ftPct: number;
    };
    achievements: string[];
  } | null;
  clubs: Array<{
    role: string;
    joinedAt: string;
    club: {
      id: string;
      name: string;
      slug: string;
      logoUrl: string | null;
      city: string;
      primaryColor: string | null;
    };
  }>;
  counts: {
    posts: number;
    following: number;
    followers: number;
  };
}

interface UserBadge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  awardedAt: string;
  note?: string | null;
}

interface SocialProfileViewProps {
  userId?: string | null;
  authUser?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string | null;
  } | null;
  currentRole: UserRole;
  onNavigateToSettings?: () => void;
  onNavigateToMessages?: (userId?: string) => void;
  onNavigateToClub?: (clubId: string) => void;
  onOpenAuth?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

const getAuthToken = (): string => {
  try {
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    return session?.token || '';
  } catch {
    return '';
  }
};

const formatMemberSince = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
};

const avatarFallback = (name: string): string =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || 'User'
  )}&background=FF2A3B&color=fff`;

// ✅ Configuration par rôle : libellé, icône, couleur, description
interface RoleConfig {
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  showPlayerStats: boolean;
  showClubMemberships: boolean;
  ctaLabel: string;
}

const getRoleConfig = (role: string): RoleConfig => {
  switch (role) {
    case 'PLAYER':
      return {
        label: 'Joueur de Basketball',
        shortLabel: 'Joueur',
        icon: Trophy,
        color: '#FF2A3B',
        showPlayerStats: true,
        showClubMemberships: true,
        ctaLabel: 'Suivre ce joueur',
      };
    case 'COACH':
      return {
        label: 'Coach / Staff Technique',
        shortLabel: 'Coach',
        icon: Award,
        color: '#FFB800',
        showPlayerStats: false,
        showClubMemberships: true,
        ctaLabel: 'Suivre ce coach',
      };
    case 'CLUB_MANAGER':
      return {
        label: 'Dirigeant de Club',
        shortLabel: 'Dirigeant',
        icon: Building2,
        color: '#3B82F6',
        showPlayerStats: false,
        showClubMemberships: true,
        ctaLabel: 'Suivre ce dirigeant',
      };
    case 'TREASURER':
      return {
        label: 'Trésorier de Club',
        shortLabel: 'Trésorier',
        icon: Briefcase,
        color: '#10B981',
        showPlayerStats: false,
        showClubMemberships: true,
        ctaLabel: 'Suivre ce membre',
      };
    case 'SPONSOR':
      return {
        label: 'Partenaire / Sponsor',
        shortLabel: 'Sponsor',
        icon: Briefcase,
        color: '#8B5CF6',
        showPlayerStats: false,
        showClubMemberships: false,
        ctaLabel: 'Suivre ce partenaire',
      };
    case 'ACADEMY_CANDIDATE':
      return {
        label: 'Candidat Académie',
        shortLabel: 'Candidat',
        icon: GraduationCap,
        color: '#F59E0B',
        showPlayerStats: false,
        showClubMemberships: false,
        ctaLabel: 'Suivre ce candidat',
      };
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return {
        label: 'Administrateur Plateforme',
        shortLabel: 'Admin',
        icon: Settings,
        color: '#EF4444',
        showPlayerStats: false,
        showClubMemberships: false,
        ctaLabel: 'Suivre',
      };
    case 'VISITOR':
    default:
      return {
        label: 'Fan / Supporter',
        shortLabel: 'Fan',
        icon: Heart,
        color: '#EC4899',
        showPlayerStats: false,
        showClubMemberships: false,
        ctaLabel: 'Suivre ce fan',
      };
  }
};

// ═══════════════════════════════════════════════════════════════════════
// COMPOSANT
// ═══════════════════════════════════════════════════════════════════════

export const SocialProfileView: React.FC<SocialProfileViewProps> = ({
  userId,
  authUser,
  onNavigateToSettings,
  onNavigateToMessages,
  onNavigateToClub,
  onOpenAuth,
}) => {
  const effectiveUserId = userId || authUser?.id || null;
  const isOwnProfile = !userId || userId === authUser?.id;

  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'POSTS' | 'MEDIA' | 'BADGES'>('POSTS');

  // ─── Charger le profil ─────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    if (!effectiveUserId) {
      setLoading(false);
      setError('Aucun utilisateur');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      const res = await fetch(apiUrl(`/users/${effectiveUserId}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        if (res.status === 404) throw new Error('Utilisateur introuvable');
        throw new Error(`HTTP ${res.status}`);
      }

      const data: UserPublicProfile = await res.json();
      setProfile(data);
    } catch (err: any) {
      console.warn('[SocialProfileView]', err);
      setError(err?.message || 'Impossible de charger le profil.');
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  // ─── Charger les posts ─────────────────────────────────────────────
  const loadPosts = useCallback(async () => {
    if (!effectiveUserId) return;
    setLoadingPosts(true);
    try {
      const token = getAuthToken();
      const res = await fetch(
        apiUrl(`/posts?authorId=${effectiveUserId}&limit=20`),
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      const mapped: SocialPost[] = list.map((p: any) => ({
        id: p.id,
        authorId: p.authorId,
        authorName: p.authorName || 'Utilisateur',
        authorAvatar: p.authorAvatar || avatarFallback(p.authorName),
        authorRole: (p.authorRole || 'VISITOR') as UserRole,
        timestamp: new Date(p.timestamp || p.createdAt).toLocaleString('fr-FR', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        content: p.content,
        mediaUrl: p.mediaUrl || undefined,
        likesCount: p.likesCount ?? 0,
        hasLiked: Boolean(p.hasLiked),
        comments: (p.comments || []).map((c: any) => ({
          id: c.id,
          authorName: c.authorName || 'Membre',
          authorAvatar: c.authorAvatar || '',
          text: c.text || c.content || '',
          timestamp: new Date(c.timestamp || c.createdAt).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        })),
        reactions: [],
      }));

      setPosts(mapped);
    } catch (err) {
      console.warn('[SocialProfileView] loadPosts', err);
    } finally {
      setLoadingPosts(false);
    }
  }, [effectiveUserId]);

  // ─── Charger les badges ────────────────────────────────────────────
  const loadBadges = useCallback(async () => {
    if (!effectiveUserId) return;
    try {
      const token = getAuthToken();
      const res = await fetch(apiUrl(`/users/${effectiveUserId}/badges`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const data = await res.json();
      setBadges(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('[SocialProfileView] loadBadges', err);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    void loadProfile();
    void loadPosts();
    void loadBadges();
  }, [loadProfile, loadPosts, loadBadges]);

  // ─── Toggle follow ─────────────────────────────────────────────────
  const handleToggleFollow = async () => {
    if (!profile) return;
    if (!authUser) {
      onOpenAuth?.();
      return;
    }
    if (loadingFollow) return;
    setLoadingFollow(true);

    const wasFollowing = profile.isFollowing;
    setProfile((prev) =>
      prev
        ? {
          ...prev,
          isFollowing: !wasFollowing,
          counts: {
            ...prev.counts,
            followers: wasFollowing
              ? Math.max(0, prev.counts.followers - 1)
              : prev.counts.followers + 1,
          },
        }
        : prev
    );

    try {
      const token = getAuthToken();
      const res = await fetch(apiUrl(`/users/${profile.id}/follow`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProfile((prev) =>
        prev ? { ...prev, isFollowing: Boolean(data.following) } : prev
      );
    } catch (err) {
      console.warn('[SocialProfileView] follow', err);
      setProfile((prev) =>
        prev
          ? {
            ...prev,
            isFollowing: wasFollowing,
            counts: {
              ...prev.counts,
              followers: wasFollowing
                ? prev.counts.followers + 1
                : Math.max(0, prev.counts.followers - 1),
            },
          }
          : prev
      );
    } finally {
      setLoadingFollow(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 flex flex-col items-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm">Chargement du profil…</span>
      </div>
    );
  }

  // ─── Erreur ────────────────────────────────────────────────────────
  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto my-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
        <p className="text-sm text-slate-300">
          {error || 'Profil indisponible.'}
        </p>
        <button
          onClick={loadProfile}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF2A3B] text-white text-xs font-bold cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Réessayer
        </button>
      </div>
    );
  }

  // ─── Données dérivées ──────────────────────────────────────────────
  const displayName = profile.name || 'Utilisateur';
  const displayAvatar = profile.avatarUrl || avatarFallback(displayName);
  const player = profile.player;
  const primaryClub = profile.clubs[0]?.club || null;
  const roleConfig = getRoleConfig(profile.role);
  const RoleIcon = roleConfig.icon;

  // ✅ Le média grid ne s'affiche que s'il y a des médias
  const postsWithMedia = posts.filter((p) => p.mediaUrl);
  const hasBadges = badges.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ── Header Profil ── */}
      <div className="social-card-border rounded-3xl overflow-hidden shadow-2xl">
        {/* Couverture */}
        <div className="relative h-44 sm:h-56 w-full bg-gradient-to-r from-[#FF2A3B] via-[#0F121A] to-[#FFB800]/40 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1400&auto=format&fit=crop&q=80"
            alt="Couverture"
            className="w-full h-full object-cover opacity-35 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E121B] via-transparent to-black/30" />
        </div>

        {/* Détails */}
        <div className="px-5 sm:px-8 pb-6 -mt-16 sm:-mt-20 relative z-10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            {/* Avatar + Identité */}
            <div className="flex items-end gap-4">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-[#FF2A3B] to-[#FFB800] shadow-2xl shrink-0">
                <img
                  src={player?.photoUrl || displayAvatar}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover bg-slate-800"
                />
                <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 text-white border-2 border-[#090A0F] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>

              <div className="mb-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-white truncate">
                    {displayName}
                  </h1>

                  {/* ✅ Badge de rôle dynamique */}
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase shrink-0 flex items-center gap-1"
                    style={{
                      backgroundColor: `${roleConfig.color}25`,
                      color: roleConfig.color,
                      border: `1px solid ${roleConfig.color}50`,
                    }}
                  >
                    <RoleIcon className="w-3 h-3" />
                    {roleConfig.shortLabel}
                    {/* ✅ Maillot uniquement pour les joueurs */}
                    {player && profile.role === 'PLAYER' && (
                      <>
                        {' '}
                        • N° {player.jerseyNumber} • {player.position}
                      </>
                    )}
                  </span>
                </div>

                {/* Localisation + Club */}
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 flex-wrap">
                  {(profile.city || profile.country) && (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-[#FFB800]" />
                      <span>
                        {[profile.city, profile.country].filter(Boolean).join(', ')}
                      </span>
                      {primaryClub && <span>•</span>}
                    </>
                  )}
                  {primaryClub && roleConfig.showClubMemberships && (
                    <button
                      onClick={() => onNavigateToClub?.(primaryClub.id)}
                      className="text-slate-300 font-semibold hover:text-[#FFB800] transition-colors cursor-pointer"
                    >
                      {primaryClub.name}
                    </button>
                  )}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Membre depuis {formatMemberSince(profile.createdAt)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              {isOwnProfile ? (
                onNavigateToSettings && (
                  <button
                    onClick={onNavigateToSettings}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Modifier mon profil</span>
                  </button>
                )
              ) : (
                <>
                  <button
                    onClick={handleToggleFollow}
                    disabled={loadingFollow}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-60 ${profile.isFollowing
                      ? 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                      : 'bg-gradient-to-r from-[#FF2A3B] to-[#E60023] text-white shadow-lg shadow-[#FF2A3B]/25 hover:from-[#FF4555]'
                      }`}
                  >
                    {loadingFollow ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : profile.isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4" />
                        <span>Abonné</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>{roleConfig.ctaLabel}</span>
                      </>
                    )}
                  </button>

                  {onNavigateToMessages && (
                    <button
                      onClick={() => onNavigateToMessages(profile.id)}
                      aria-label="Envoyer un message"
                      className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/15 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-slate-200 leading-relaxed max-w-2xl">
              {profile.bio}
            </p>
          )}

          {/* Compteurs */}
          <div className="flex items-center gap-6 text-sm border-t border-b border-white/10 py-3 flex-wrap">
            <div>
              <span className="font-extrabold text-white">
                {profile.counts.followers}
              </span>{' '}
              <span className="text-slate-400 text-xs">abonnés</span>
            </div>
            <div>
              <span className="font-extrabold text-white">
                {profile.counts.following}
              </span>{' '}
              <span className="text-slate-400 text-xs">abonnements</span>
            </div>
            <div>
              <span className="font-extrabold text-white">
                {profile.counts.posts}
              </span>{' '}
              <span className="text-slate-400 text-xs">publications</span>
            </div>
            {player && (
              <div>
                <span className="font-extrabold text-[#FFB800]">
                  {Math.round(player.stats.ppg * 42)}
                </span>{' '}
                <span className="text-slate-400 text-xs">points estimés</span>
              </div>
            )}
          </div>

          {/* ✅ Stats saison — UNIQUEMENT pour les PLAYER */}
          {player && roleConfig.showPlayerStats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Points / m
                </span>
                <p className="text-xl font-black text-white mt-0.5">
                  {player.stats.ppg.toFixed(1)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Passes / m
                </span>
                <p className="text-xl font-black text-amber-400 mt-0.5">
                  {player.stats.apg.toFixed(1)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Rebonds / m
                </span>
                <p className="text-xl font-black text-white mt-0.5">
                  {player.stats.rpg.toFixed(1)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Interceptions
                </span>
                <p className="text-xl font-black text-emerald-400 mt-0.5">
                  {player.stats.spg.toFixed(1)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[#FF2A3B]/10 border border-[#FF2A3B]/20 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-[#FF2A3B] uppercase">
                  Évaluation
                </span>
                <p className="text-xl font-black text-[#FF2A3B] mt-0.5">
                  {player.stats.efficiency.toFixed(1)}
                </p>
              </div>
            </div>
          )}

          {/* ✅ Infos rôle non-joueur (coach, dirigeant, etc.) */}
          {!player && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Type de compte
                </span>
                <p
                  className="text-base font-black mt-0.5 flex items-center justify-center gap-1.5"
                  style={{ color: roleConfig.color }}
                >
                  <RoleIcon className="w-4 h-4" />
                  {roleConfig.shortLabel}
                </p>
              </div>
              {profile.clubs.length > 0 && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Rôle(s) club
                  </span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {profile.clubs
                      .map((c) => `${c.role} — ${c.club.name}`)
                      .join(' • ')}
                  </p>
                </div>
              )}
              {profile.clubs.length === 0 && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Statut
                  </span>
                  <p className="text-sm font-bold text-slate-300 mt-0.5">
                    {roleConfig.label}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Onglets ── */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
        {(
          [
            { id: 'POSTS' as const, label: 'Publications' },
            {
              id: 'MEDIA' as const,
              label: `Photos & Vidéos${postsWithMedia.length ? ` (${postsWithMedia.length})` : ''}`,
            },
            ...(hasBadges || player
              ? [{ id: 'BADGES' as const, label: `Badges (${badges.length})` }]
              : []),
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${activeTab === tab.id
              ? 'bg-[#FF2A3B] text-white shadow-md'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Onglet POSTS ── */}
      {activeTab === 'POSTS' && (
        <div className="space-y-4">
          {loadingPosts ? (
            <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">Chargement des publications…</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="social-card-border rounded-3xl p-10 text-center space-y-2">
              <p className="text-sm text-slate-400">
                Aucune publication pour le moment.
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <SocialPostCard
                key={post.id}
                post={post}
                isAuthenticated={Boolean(authUser)}
                onOpenAuth={onOpenAuth}
              />
            ))
          )}
        </div>
      )}

      {/* ── Onglet MEDIA ── */}
      {activeTab === 'MEDIA' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {postsWithMedia.length === 0 ? (
            <div className="col-span-full social-card-border rounded-3xl p-10 text-center space-y-2">
              <p className="text-sm text-slate-400">
                Aucun média publié pour le moment.
              </p>
            </div>
          ) : (
            postsWithMedia.map((p) => (
              <a
                key={p.id}
                href={p.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-colors"
              >
                <img
                  src={p.mediaUrl}
                  alt="Média"
                  className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                />
              </a>
            ))
          )}
        </div>
      )}

      {/* ── Onglet BADGES ── */}
      {activeTab === 'BADGES' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {badges.length === 0 ? (
            <div className="col-span-full social-card-border rounded-3xl p-10 text-center space-y-2">
              <p className="text-sm text-slate-400">
                Aucun badge attribué pour le moment.
              </p>
            </div>
          ) : (
            badges.map((b) => (
              <div
                key={b.id}
                className="social-card-border rounded-2xl p-4 text-center space-y-2"
              >
                <span className="text-4xl block">{b.icon || '🏆'}</span>
                <h4 className="text-sm font-bold text-white">{b.name}</h4>
                <p className="text-xs text-slate-400">{b.description}</p>
                <span className="text-[10px] text-[#FFB800] block">
                  {formatMemberSince(b.awardedAt)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};