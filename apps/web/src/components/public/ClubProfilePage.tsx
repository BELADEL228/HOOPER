import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Club, Team, UserRole } from '../../types';
import {
  clubApi,
  type ApiPlayer,
  type ApiMatch,
  type ApiClubStats,
  type ApiNewsPost,
  type ApiClubMember,
  type ApiClub,
} from '../../services/clubApi';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Trophy,
  Shield,
  Calendar,
  Users,
  Sparkles,
  Phone,
  Mail,
  CheckCircle2,
  Building2,
  Share2,
  Heart,
  Send,
  Loader2,
  RotateCcw,
  Sliders,
  FileText,
  Activity,
  Award,
} from 'lucide-react';
import { ClubLogo } from '../common/ClubLogo';

interface ClubProfilePageProps {
  club: Club | Team;
  focusedTeam?: Team;
  onBack: () => void;
  onEnterWorkspace: (team: Team) => void;
  onOpenAuth: () => void;
  authUser?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string | null;
  } | null;
  currentRole?: UserRole;
}

// ─── Helper : formater une date sans jamais crasher ───────────────────
const formatDateSafe = (
  input?: string | null,
  opts?: Intl.DateTimeFormatOptions
): string => {
  if (!input) return '—';
  const d = new Date(input);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(
    'fr-FR',
    opts ?? {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
};

// ─── Helper : normaliser un Club|Team en Club ─────────────────────────
function normalizeToClub(raw: Club | Team): Club {
  if ('teams' in raw && Array.isArray((raw as any).teams)) {
    return raw as Club;
  }
  const team = raw as Team;
  return {
    id: team.clubId || `club-${team.id}`,
    name: team.clubName || team.name,
    slug: team.slug,
    city: team.city,
    logoUrl: team.logoUrl,
    primaryColor: team.primaryColor,
    secondaryColor: team.secondaryColor,
    description: team.description,
    teams: [team],
  };
}

export const ClubProfilePage: React.FC<ClubProfilePageProps> = ({
  club: rawClub,
  focusedTeam: initialFocusedTeam,
  onBack,
  onEnterWorkspace,
  onOpenAuth,
  authUser,
  currentRole = 'VISITOR',
}) => {
  // ✅ normalizeToClub + useMemo (plus de faux "hook")
  const fullClub: Club = useMemo(() => normalizeToClub(rawClub), [rawClub]);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'roster' | 'staff' | 'matches' | 'stats' | 'admin'
  >('overview');

  // ✅ selectedTeam peut être null → currentTeam garantit une Team valide
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(
    initialFocusedTeam || fullClub.teams[0] || (rawClub as Team) || null
  );

  // ✅ Fallback : si jamais selectedTeam est null, on utilise un objet minimal
  const currentTeam: Team = useMemo(() => {
    if (selectedTeam) return selectedTeam;
    return {
      id: 'unknown',
      name: fullClub.name,
      slug: fullClub.slug,
      city: fullClub.city,
      category: 'SENIOR',
      clubId: fullClub.id,
      clubName: fullClub.name,
    };
  }, [selectedTeam, fullClub]);

  const primary = fullClub.primaryColor || '#FF2A3B';
  const secondary = fullClub.secondaryColor || '#FFB800';

  // Données réelles du club
  const [detailedClub, setDetailedClub] = useState<ApiClub | null>(null);
  const [roster, setRoster] = useState<ApiPlayer[]>([]);
  const [matches, setMatches] = useState<ApiMatch[]>([]);
  const [news, setNews] = useState<ApiNewsPost[]>([]);
  const [stats, setStats] = useState<ApiClubStats | null>(null);
  const [members, setMembers] = useState<ApiClubMember[]>([]);

  // États de chargement et d'erreur
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  // Édition de publication officielle
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [submittingPost, setSubmittingPost] = useState<boolean>(false);
  const [postError, setPostError] = useState<string>('');

  // ✅ isClubManager : RESTREINT aux vrais membres du club
  const isClubManager = useMemo(() => {
    // Super admin : accès total
    if (currentRole === 'SUPER_ADMIN' || authUser?.role === 'SUPER_ADMIN') {
      return true;
    }

    // Pas connecté : aucun droit
    if (!authUser) return false;

    // ⚠️ On exige une appartenance RÉELLE à CE club
    const member = members.find((m) => m.userId === authUser.id);
    if (!member) return false;

    // Rôles autorisés à publier au nom du club
    return ['PRESIDENT', 'CLUB_ADMIN', 'COACH'].includes(member.role);
  }, [authUser, currentRole, members]);

  const getToken = (): string => {
    try {
      const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
      return session?.token || '';
    } catch {
      return '';
    }
  };

  const loadClubData = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = getToken();

    try {
      const [
        fetchedDetails,
        fetchedRoster,
        fetchedMatches,
        fetchedNews,
        fetchedStats,
      ] = await Promise.all([
        clubApi.fetchClubDetails(fullClub.id).catch(() => null),
        clubApi.fetchClubRoster(fullClub.id, currentTeam.id).catch(() => []),
        clubApi.fetchClubMatches(fullClub.id, currentTeam.id).catch(() => []),
        clubApi.fetchClubNews(fullClub.id).catch(() => []),
        clubApi.fetchClubStats(fullClub.id).catch(() => null),
      ]);

      setDetailedClub(fetchedDetails);
      setRoster(Array.isArray(fetchedRoster) ? fetchedRoster : []);
      setMatches(Array.isArray(fetchedMatches) ? fetchedMatches : []);
      setNews(Array.isArray(fetchedNews) ? fetchedNews : []);
      setStats(fetchedStats ?? null);

      // Charger les membres détaillés si connecté
      if (token) {
        clubApi
          .getClubMembers(fullClub.id, token)
          .then((data) => setMembers(Array.isArray(data) ? data : []))
          .catch(() => {
            // Fallback sur members publics renvoyés par fetchClubDetails
            if (fetchedDetails && (fetchedDetails as any).members) {
              const fallback = (fetchedDetails as any).members;
              setMembers(Array.isArray(fallback) ? fallback : []);
            }
          });
      } else if (fetchedDetails && (fetchedDetails as any).members) {
        const fallback = (fetchedDetails as any).members;
        setMembers(Array.isArray(fallback) ? fallback : []);
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement des données du club.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullClub.id, currentTeam.id]);

  useEffect(() => {
    void loadClubData();
  }, [loadClubData]);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      });
    }
  };

  // ✅ "Suivre" : ouvre la modale si non connecté
  const handleToggleFollow = async () => {
    if (!authUser) {
      onOpenAuth();
      return;
    }
    const token = getToken();
    setIsFollowing((prev) => !prev);
    if (token) {
      clubApi.toggleFollow(fullClub.id, token).catch(() => undefined);
    }
  };

  const handlePublishNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    const token = getToken();
    if (!token) {
      onOpenAuth();
      return;
    }

    setSubmittingPost(true);
    setPostError('');
    try {
      const created = await clubApi.createClubPost(
        fullClub.id,
        newPostContent.trim(),
        token
      );
      setNews((prev) => [created, ...prev]);
      setNewPostContent('');
    } catch (err: any) {
      setPostError(err?.message || 'Impossible de publier l’actualité.');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleUpdateMemberRole = async (
    member: ApiClubMember,
    newRole: string
  ) => {
    const token = getToken();
    if (!token) return;
    try {
      const updated = await clubApi.updateClubMemberRole(
        fullClub.id,
        member.userId,
        newRole,
        token
      );
      setMembers((prev) =>
        prev.map((m) =>
          m.userId === member.userId ? { ...m, role: updated.role } : m
        )
      );
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la modification du rôle.');
    }
  };

  const bannerBackground =
    detailedClub?.bannerUrl || fullClub.bannerUrl
      ? `url(${detailedClub?.bannerUrl || fullClub.bannerUrl})`
      : `linear-gradient(135deg, ${primary}60 0%, ${secondary}40 50%, #090A0F 85%)`;

  return (
    <div className="space-y-8 pb-24">
      {/* ─── BARRE DE NAVIGATION RETOUR & VESTIAIRE ─────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs sm:text-sm font-semibold cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Annuaire des clubs</span>
        </button>

        {/* ✅ "Espace Vestiaire" : accessible à tous — restrictions dans le workspace */}
        <button
          onClick={() => onEnterWorkspace(currentTeam)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all hover:scale-105 cursor-pointer bg-white/15 hover:bg-white/25 border border-white/20 min-h-[44px]"
          title="Entrer dans le vestiaire du club"
        >
          <span>Espace Vestiaire ({currentTeam.name})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ─── BANNIÈRE HERO SOCIAL DU CLUB ─────────────────────────────── */}
      <section className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0B0D13]">
        <div
          className="h-48 sm:h-64 md:h-72 w-full relative bg-cover bg-center"
          style={{ backgroundImage: bannerBackground, backgroundColor: '#090A0F' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D13] via-black/40 to-transparent" />

          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-black/60 backdrop-blur-md hover:bg-black/80 text-white border border-white/10 transition-all cursor-pointer"
              title="Partager le profil du club"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {shareCopied && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-bold shadow-lg animate-in fade-in">
                Lien copié !
              </span>
            )}
          </div>

          <div className="absolute bottom-4 right-6 hidden md:flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-slate-300 border border-white/10">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Arène officielle :{' '}
              {fullClub.arena || `Stadium Municipal de ${fullClub.city}`}
            </span>
          </div>
        </div>

        <div className="relative px-6 sm:px-10 pb-8 -mt-16 sm:-mt-20">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
              <div
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl p-1.5 shadow-2xl flex items-center justify-center text-5xl border-2 shrink-0 bg-black"
                style={{ borderColor: `${primary}80` }}
              >
                <div className="w-full h-full bg-[#0B0D13] rounded-[22px] flex items-center justify-center overflow-hidden">
                  <ClubLogo
                    logoUrl={fullClub.logoUrl}
                    alt={`Logo ${fullClub.name}`}
                    className="w-full h-full object-cover"
                    fallback="🏀"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FF2A3B]/20 text-[#FFB800] border border-[#FF2A3B]/30">
                    Club Officiel
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/5 text-slate-300 flex items-center gap-1.5 border border-white/10">
                    <MapPin className="w-3.5 h-3.5 text-[#FF2A3B]" />
                    {fullClub.city}, {fullClub.country || 'Togo'}
                  </span>
                  {fullClub.foundedYear && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
                      Fondé en {fullClub.foundedYear}
                    </span>
                  )}
                  {fullClub.isVerified && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Vérifié
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                  {fullClub.name}
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                  {fullClub.description ||
                    `Franchise sportive officielle de basketball basée à ${fullClub.city}.`}
                </p>
              </div>
            </div>

            {/* Actions Rapides */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 pt-4 lg:pt-0">
              <button
                onClick={handleToggleFollow}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg min-h-[40px] ${isFollowing
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                  }`}
              >
                <Heart
                  className={`w-4 h-4 ${isFollowing ? 'fill-emerald-400 text-emerald-400' : ''
                    }`}
                />
                <span>{isFollowing ? 'Abonné' : 'Suivre le Club'}</span>
              </button>

              {isClubManager && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer shadow-lg shadow-cyan-500/20 min-h-[40px]"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Gestion du Club</span>
                </button>
              )}
            </div>
          </div>

          {/* SÉLECTEUR D'ÉQUIPES */}
          {Array.isArray(fullClub.teams) && fullClub.teams.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" /> Équipe active consultée :
              </div>
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {fullClub.teams.map((team) => {
                  const isSelected = currentTeam.id === team.id;
                  return (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeam(team)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border min-h-[40px] ${isSelected
                          ? 'bg-white/20 text-white border-white/30 shadow-md'
                          : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border-white/5'
                        }`}
                    >
                      <span className="w-5 h-5 rounded-md overflow-hidden bg-black shrink-0">
                        <ClubLogo
                          logoUrl={team.logoUrl}
                          alt={team.name}
                          className="w-full h-full object-cover"
                          fallback="🏀"
                        />
                      </span>
                      <span>{team.name}</span>
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                        {team.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* BARRE DES ONGLETS */}
          <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-white/10 scrollbar-none">
            {[
              { id: 'overview', label: 'Actualités & Fil', icon: FileText },
              {
                id: 'roster',
                label: `Effectif (${currentTeam.name})`,
                icon: Users,
              },
              { id: 'staff', label: 'Staff & Membres', icon: Shield },
              { id: 'matches', label: 'Matchs & Calendrier', icon: Calendar },
              { id: 'stats', label: 'Statistiques', icon: Activity },
              ...(isClubManager
                ? [{ id: 'admin', label: 'Administration', icon: Sliders }]
                : []),
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 border min-h-[42px] ${isActive
                      ? 'bg-white/15 text-white border-white/30 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* État d'Erreur Général */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-between text-xs text-red-200">
          <span>{error}</span>
          <button
            onClick={loadClubData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Réessayer
          </button>
        </div>
      )}

      {/* ─── ONGLET 1 : ACTUALITÉS ──────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* ✅ Formulaire publication réservé aux vrais managers */}
            {isClubManager && (
              <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-3 bg-[#10141D]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#FFB800] uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Publication Officielle du Club
                </div>
                <form onSubmit={handlePublishNews} className="space-y-3">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Publiez une annonce officielle, un résultat de match ou une actualité pour les supporters..."
                    rows={3}
                    className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#FF2A3B] transition-colors resize-none"
                  />
                  {postError && (
                    <p className="text-xs text-red-300">{postError}</p>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingPost || !newPostContent.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#FF2A3B] hover:bg-[#E60023] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-red-500/20"
                    >
                      {submittingPost ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Publication...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Publier au nom du Club</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#FF2A3B]" /> Annonces &amp; Fil
                  d'Actualité
                </h3>
                <span className="text-xs text-slate-400">
                  {news.length} publication{news.length > 1 ? 's' : ''}
                </span>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3 animate-pulse"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10" />
                        <div className="space-y-1 flex-1">
                          <div className="h-3.5 bg-white/10 rounded w-1/3" />
                          <div className="h-2.5 bg-white/5 rounded w-1/4" />
                        </div>
                      </div>
                      <div className="h-3 bg-white/5 rounded w-full" />
                      <div className="h-3 bg-white/5 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : news.length === 0 ? (
                <div className="text-center py-12 glass-panel rounded-3xl border border-white/10 p-6 space-y-3">
                  <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                  <h4 className="text-sm font-bold text-white">
                    Aucune publication pour le moment
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Le club n'a pas encore publié d'actualité officielle. Revenez
                    bientôt pour suivre ses résultats.
                  </p>
                </div>
              ) : (
                news.map((item) => (
                  <div
                    key={item.id}
                    className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-[#10141D] hover:border-white/20 transition-colors shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            item.authorAvatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              item.authorName || 'Club'
                            )}&background=B91C1C&color=fff`
                          }
                          alt={item.authorName || 'Club'}
                          className="w-10 h-10 rounded-full object-cover border border-white/15 bg-slate-800 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-white">
                              {item.authorName || 'Club'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF2A3B]/15 text-[#FFB800] border border-[#FF2A3B]/30">
                              {item.authorRole || 'Club'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {formatDateSafe(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                      {item.content || ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Colonne Droite : Infos */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-[#10141D]">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>QG &amp; Coordonnées</span>
              </h3>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#FF2A3B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Adresse</span>
                    <span>
                      {fullClub.address ||
                        `Complexe Omnisports, ${fullClub.city}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-[#FFB800] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">
                      Arène officielle
                    </span>
                    <span>{fullClub.arena || 'Non renseignée'}</span>
                  </div>
                </div>

                {fullClub.email && (
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">
                        Courriel officiel
                      </span>
                      <a
                        href={`mailto:${fullClub.email}`}
                        className="text-sky-300 hover:underline"
                      >
                        {fullClub.email}
                      </a>
                    </div>
                  </div>
                )}

                {fullClub.phoneNumber && (
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">
                        Téléphone / Contact
                      </span>
                      <span>{fullClub.phoneNumber}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {stats && (
              <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-[#10141D]">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Bilan Saison</span>
                </h3>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-2xl bg-white/5">
                    <div className="text-xl font-black text-white">
                      {stats.wins ?? 0}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-bold uppercase">
                      Victoires
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5">
                    <div className="text-xl font-black text-white">
                      {stats.losses ?? 0}
                    </div>
                    <div className="text-[10px] text-red-400 font-bold uppercase">
                      Défaites
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5">
                    <div className="text-xl font-black text-white">
                      {stats.winRate || '—'}
                    </div>
                    <div className="text-[10px] text-[#FFB800] font-bold uppercase">
                      Taux Succès
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── ONGLET 2 : EFFECTIF ─────────────────────────────────────── */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Effectif {currentTeam.name}
              </h2>
              <p className="text-xs text-slate-400">
                Joueurs officiels enregistrés sous licence auprès du club.
              </p>
            </div>

            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 text-slate-200 shrink-0 self-start sm:self-auto">
              {roster.length} joueur{roster.length > 1 ? 's' : ''} sous contrat
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4 animate-pulse"
                >
                  <div className="h-44 bg-white/10 rounded-2xl" />
                  <div className="h-4 bg-white/10 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : roster.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-3xl border border-white/10 p-8 space-y-3">
              <Users className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">
                Aucun joueur enregistré pour cette équipe
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                L'effectif officiel de l'équipe {currentTeam.name} est en cours de
                validation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {roster.map((player) => {
                const s = player.seasonStats;
                return (
                  <div
                    key={player.id}
                    className="glass-panel rounded-3xl border border-white/10 p-5 space-y-4 bg-[#10141D] hover:border-white/20 transition-all flex flex-col justify-between shadow-xl"
                  >
                    <div>
                      <div className="relative h-56 rounded-2xl overflow-hidden bg-slate-900 mb-4 border border-white/10">
                        {/* ✅ Fallback photo */}
                        <img
                          src={
                            player.photo ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              player.name || 'Joueur'
                            )}&background=B91C1C&color=fff`
                          }
                          alt={player.name || 'Joueur'}
                          className="w-full h-full object-cover bg-slate-800"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white font-mono font-black text-sm border border-white/10">
                          #{player.number ?? '—'}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#FFB800] block">
                            {player.position || 'Joueur'}
                          </span>
                          <h4 className="text-lg font-black text-white leading-tight truncate">
                            {player.name || 'Joueur inconnu'}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 py-2 border-b border-white/5">
                        <span>
                          Taille :{' '}
                          <strong className="text-white">
                            {player.height || '—'}
                          </strong>
                        </span>
                        <span>
                          Poids :{' '}
                          <strong className="text-white">
                            {player.weight || '—'}
                          </strong>
                        </span>
                        <span>
                          Âge :{' '}
                          <strong className="text-white">
                            {player.age ?? '—'} ans
                          </strong>
                        </span>
                      </div>

                      {player.bio && (
                        <p className="text-slate-300 text-xs mt-3 line-clamp-2 italic">
                          "{player.bio}"
                        </p>
                      )}

                      {Array.isArray(player.achievements) &&
                        player.achievements.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {player.achievements.map((a, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                              >
                                <Award className="w-3 h-3" /> {a}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-center">
                      <div className="p-2 rounded-xl bg-white/5">
                        <div className="text-[10px] text-slate-400 font-semibold">
                          PPG
                        </div>
                        <div className="text-sm font-black text-white">
                          {s?.ppg ?? 0}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-white/5">
                        <div className="text-[10px] text-slate-400 font-semibold">
                          APG
                        </div>
                        <div className="text-sm font-black text-white">
                          {s?.apg ?? 0}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-white/5">
                        <div className="text-[10px] text-slate-400 font-semibold">
                          RPG
                        </div>
                        <div className="text-sm font-black text-white">
                          {s?.rpg ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── ONGLET 3 : STAFF ─────────────────────────────────────── */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Organigramme &amp; Staff Officiel
            </h2>
            <p className="text-xs text-slate-400">
              Dirigeants, membres du staff technique et membres accrédités du club.
            </p>
          </div>

          {members.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-3xl border border-white/10 p-8 space-y-3">
              <Shield className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">
                Aucun membre officiel renseigné
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Les membres du bureau et le staff technique seront publiés dès
                validation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="glass-panel p-5 rounded-3xl border border-white/10 bg-[#10141D] flex items-center gap-4 shadow-xl"
                >
                  <img
                    src={
                      member.user.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        member.user.name || 'Membre'
                      )}&background=B91C1C&color=fff`
                    }
                    alt={member.user.name || 'Membre'}
                    className="w-14 h-14 rounded-2xl object-cover border border-white/15 bg-slate-800 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black text-white truncate">
                        {member.user.name || 'Membre'}
                      </h4>
                    </div>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF2A3B]/15 text-[#FFB800] border border-[#FF2A3B]/30 mt-1">
                      {member.role === 'PRESIDENT'
                        ? 'Président du Club'
                        : member.role === 'COACH'
                          ? 'Coach / Staff Technique'
                          : member.role === 'CLUB_ADMIN'
                            ? 'Administrateur Club'
                            : member.role === 'TREASURER'
                              ? 'Trésorier'
                              : member.role === 'PLAYER'
                                ? 'Joueur Équipe'
                                : 'Membre Officiel'}
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-1">
                      Depuis{' '}
                      {formatDateSafe(member.joinedAt, {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── ONGLET 4 : MATCHS ─────────────────────────────────────── */}
      {activeTab === 'matches' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Rencontres &amp; Calendrier Officiel
              </h2>
              <p className="text-xs text-slate-400">
                Scores en direct, résultats passés et programmation des matchs du
                club.
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-slate-300">
              {matches.length} match{matches.length > 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="glass-panel p-5 rounded-2xl border border-white/10 h-20 animate-pulse bg-white/5"
                />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-3xl border border-white/10 p-8 space-y-3">
              <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">
                Aucun match programmé pour le moment
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Le calendrier des prochaines journées sera publié par la commission
                des compétitions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#10141D] hover:border-white/20 transition-all shadow-md"
                >
                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center font-bold text-lg shrink-0">
                      {m.opponentLogo ? (
                        <img
                          src={m.opponentLogo}
                          alt={m.opponent}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        '🏀'
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span>{m.date || '—'}</span>
                        <span>•</span>
                        <span>{m.venue || m.address || 'Arène Principale'}</span>
                      </div>
                      <div className="text-sm sm:text-base font-black text-white mt-0.5">
                        {currentTeam.name}{' '}
                        <span className="text-[#FF2A3B]">VS</span>{' '}
                        {m.opponent || '?'}
                      </div>
                      {m.summary && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          {m.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                    {m.status === 'FINISHED' ? (
                      <div className="text-right">
                        <div className="text-lg sm:text-xl font-black text-white">
                          {m.scoreTeam ?? '—'} - {m.scoreOpponent ?? '—'}
                        </div>
                        <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          Terminé
                          {m.mvpPlayerName && ` • MVP : ${m.mvpPlayerName}`}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-[#FFB800] px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                        À venir ({m.time || '20:00'})
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── ONGLET 5 : STATS ─────────────────────────────────────── */}
      {activeTab === 'stats' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 bg-[#10141D]">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-black text-white">
              Performances Officielles de la Franchise
            </h2>
          </div>

          {!stats ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-sm text-slate-400 text-center">
              Statistiques en cours de calcul par la ligue.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <div className="text-xs text-slate-400 font-semibold uppercase">
                    Matchs Joués
                  </div>
                  <div className="text-2xl font-black text-white mt-1">
                    {stats.played ?? 0}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="text-xs text-emerald-300 font-semibold uppercase">
                    Victoires
                  </div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {stats.wins ?? 0}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                  <div className="text-xs text-red-300 font-semibold uppercase">
                    Défaites
                  </div>
                  <div className="text-2xl font-black text-red-400 mt-1">
                    {stats.losses ?? 0}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <div className="text-xs text-amber-300 font-semibold uppercase">
                    Taux de Succès
                  </div>
                  <div className="text-2xl font-black text-[#FFB800] mt-1">
                    {stats.winRate || '—'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">
                    Moyenne Points Marqués
                  </span>
                  <span className="text-lg font-black text-white">
                    {stats.avgPointsScored ?? 0} pts/m
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">
                    Moyenne Points Encaissés
                  </span>
                  <span className="text-lg font-black text-white">
                    {stats.avgPointsAllowed ?? 0} pts/m
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── ONGLET 6 : ADMIN ─────────────────────────────────────── */}
      {activeTab === 'admin' && isClubManager && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-slate-950 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sliders className="w-6 h-6 text-cyan-400" />
              <div>
                <h3 className="text-lg font-black text-white">
                  Espace Gestion de {fullClub.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Gérez l’organigramme, attribuez les rôles aux membres et modifiez
                  l’identité visuelle.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-[#10141D]">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Attribution des Rôles dans le Club</span>
            </h4>

            {members.length === 0 ? (
              <p className="text-xs text-slate-400">Aucun membre enregistré.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-white/10 uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Membre</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Rôle dans le Club</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          <img
                            src={
                              m.user.avatarUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                m.user.name || 'M'
                              )}&background=B91C1C&color=fff`
                            }
                            alt={m.user.name || 'Membre'}
                            className="w-7 h-7 rounded-full object-cover bg-slate-800"
                          />
                          <span>{m.user.name || 'Membre'}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {m.user.email || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={m.role}
                            onChange={(e) =>
                              handleUpdateMemberRole(m, e.target.value)
                            }
                            className="px-2.5 py-1 rounded-lg bg-black border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                          >
                            <option value="PRESIDENT">PRESIDENT</option>
                            <option value="CLUB_ADMIN">CLUB_ADMIN</option>
                            <option value="COACH">COACH</option>
                            <option value="TREASURER">TREASURER</option>
                            <option value="PLAYER">PLAYER</option>
                            <option value="MEMBER">MEMBER</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};