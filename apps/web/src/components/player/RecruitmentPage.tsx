import React, { useEffect, useMemo, useState } from 'react';
import type { UserRole } from '../../types';
import {
  Search,
  Send,
  Plus,
  X,
  CheckCircle2,
  Users,
  MapPin,
  Calendar,
  Briefcase,
  Filter,
  Flame,
  Eye,
  AlertCircle,
  Video,
  Check,
  Building2,
  Phone,
  Mail,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { apiUrl } from '../../services/api';
import { useClub } from '../../context/ClubContext';

export interface ApplicantProfile {
  id: string;
  jerseyNumber?: number;
  position?: string;
  heightCm?: number;
  weightKg?: number;
  age?: number;
  bio?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    city?: string;
    phoneNumber?: string;
  };
}

export interface RecruitmentApplication {
  id: string;
  recruitmentPostId: string;
  playerProfileId: string;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  playerProfile?: ApplicantProfile;
}

export interface RecruitmentPost {
  id: string;
  teamId: string;
  title: string;
  description: string;
  position: string;
  minAge?: number | null;
  maxAge?: number | null;
  minHeightCm?: number | null;
  city: string;
  status: 'OPEN' | 'CLOSED' | string;
  createdAt: string;
  team?: {
    id: string;
    name: string;
    city?: string;
    logoUrl?: string;
    primaryColor?: string;
  };
  applications?: RecruitmentApplication[];
  _count?: { applications: number };
}

const POSITIONS = [
  'TOUS',
  'Meneur',
  'Arrière',
  'Ailier',
  'Ailier Fort',
  'Pivot',
  'Polyvalent',
];

const TOGO_CITIES = [
  'TOUTES',
  'Lomé',
  'Kara',
  'Kpalimé',
  'Sokodé',
  'Atakpamé',
  'Dapaong',
  'Tsévié',
  'Aného',
];

export function RecruitmentPage({ currentRole }: { currentRole: UserRole }) {
  const { activeClub } = useClub();
  const isManager = ['SUPER_ADMIN', 'CLUB_ADMIN', 'COACH'].includes(currentRole);

  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('TOUS');
  const [cityFilter, setCityFilter] = useState('TOUTES');
  const [activeTab, setActiveTab] = useState<'ALL' | 'MY_APPLICATIONS' | 'MY_POSTS'>('ALL');

  // Toasts de notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal de Création (Staff)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPosition, setNewPosition] = useState('Meneur');
  const [newCity, setNewCity] = useState(activeClub?.city || 'Lomé');
  const [newDescription, setNewDescription] = useState('');
  const [newMinAge, setNewMinAge] = useState('17');
  const [newMaxAge, setNewMaxAge] = useState('24');
  const [newMinHeight, setNewMinHeight] = useState('185');
  const [createLoading, setCreateLoading] = useState(false);

  // Modal de Candidature (Joueur)
  const [selectedPostForApply, setSelectedPostForApply] = useState<RecruitmentPost | null>(null);
  const [applyMotivation, setApplyMotivation] = useState('');
  const [applyPhone, setApplyPhone] = useState('');
  const [applyVideoUrl, setApplyVideoUrl] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  // Modal / Tiroir de Gestion des Candidatures (Staff)
  const [managingPost, setManagingPost] = useState<RecruitmentPost | null>(null);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  // Récupérer la session active
  const getSession = () => {
    try {
      return JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    } catch {
      return {};
    }
  };
  const session = getSession();
  const currentUserId = session?.user?.id;

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl('/recruitment'));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPosts(data);
          // Si le drawer de candidatures est ouvert, synchroniser le post
          if (managingPost) {
            const updated = data.find((p: RecruitmentPost) => p.id === managingPost.id);
            if (updated) setManagingPost(updated);
          }
        }
      }
    } catch {
      showToast('error', 'Erreur de connexion lors du chargement des opportunités.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Filtrage intelligent
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Filtre texte
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.description.toLowerCase().includes(q) ||
        post.position.toLowerCase().includes(q) ||
        (post.team?.name && post.team.name.toLowerCase().includes(q)) ||
        post.city.toLowerCase().includes(q);

      // Filtre position
      const matchPosition =
        positionFilter === 'TOUS' ||
        post.position.toLowerCase() === positionFilter.toLowerCase();

      // Filtre ville
      const matchCity =
        cityFilter === 'TOUTES' ||
        post.city.toLowerCase() === cityFilter.toLowerCase();

      // Filtre onglet
      if (activeTab === 'MY_APPLICATIONS') {
        const hasApplied = (post.applications || []).some(
          (app) => app.playerProfile?.user?.id === currentUserId
        );
        return matchSearch && matchPosition && matchCity && hasApplied;
      }

      if (activeTab === 'MY_POSTS') {
        const isClubPost =
          post.teamId === activeClub?.id ||
          post.teamId === activeClub?.clubId ||
          post.team?.name === activeClub?.name;
        return matchSearch && matchPosition && matchCity && isClubPost;
      }

      return matchSearch && matchPosition && matchCity;
    });
  }, [posts, searchQuery, positionFilter, cityFilter, activeTab, currentUserId, activeClub]);

  // Statistiques de la plateforme
  const stats = useMemo(() => {
    const totalOffers = posts.filter((p) => p.status === 'OPEN').length;
    const totalApplications = posts.reduce((acc, p) => acc + (p.applications?.length || 0), 0);
    const uniqueCities = new Set(posts.map((p) => p.city)).size;
    const guardCount = posts.filter((p) => p.position.toLowerCase().includes('meneur')).length;
    return { totalOffers, totalApplications, uniqueCities, guardCount };
  }, [posts]);

  // Candidater à une annonce
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostForApply) return;

    if (!session?.token) {
      showToast('error', 'Veuillez vous connecter avec votre profil joueur pour candidater.');
      return;
    }

    setApplyLoading(true);
    try {
      const fullMessage = [
        applyMotivation.trim() || 'Je souhaite postuler à cette opportunité sportive.',
        applyPhone ? `📞 Téléphone / WhatsApp : ${applyPhone}` : null,
        applyVideoUrl ? `🎥 Vidéo de présentation / Highlights : ${applyVideoUrl}` : null,
      ]
        .filter(Boolean)
        .join('\n\n');

      const res = await fetch(apiUrl(`/recruitment/${selectedPostForApply.id}/apply`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ message: fullMessage }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Échec du dépôt de candidature.');
      }

      showToast('success', 'Votre candidature a été transmise avec succès au staff technique !');
      setSelectedPostForApply(null);
      setApplyMotivation('');
      setApplyPhone('');
      setApplyVideoUrl('');
      fetchPosts();
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur réseau lors de la candidature.');
    } finally {
      setApplyLoading(false);
    }
  };

  // Mettre à jour le statut d'une candidature (Staff)
  const handleUpdateStatus = async (appId: string, status: 'ACCEPTED' | 'DECLINED') => {
    if (!session?.token) {
      showToast('error', 'Session expirée.');
      return;
    }

    setUpdatingAppId(appId);
    try {
      const res = await fetch(apiUrl(`/recruitment/applications/${appId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Impossible de mettre à jour le statut.');
      }

      showToast(
        'success',
        status === 'ACCEPTED'
          ? 'Candidat retenu pour la phase de détection / essai.'
          : 'Candidature classée sans suite.'
      );
      fetchPosts();
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur réseau.');
    } finally {
      setUpdatingAppId(null);
    }
  };

  // Publier une nouvelle annonce (Staff)
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.token) {
      showToast('error', 'Session expirée ou non autorisée.');
      return;
    }

    if (!newTitle.trim() || !newDescription.trim()) {
      showToast('error', 'Le titre et la description détaillée sont obligatoires.');
      return;
    }

    const teamId = activeClub?.id || activeClub?.clubId;
    if (!teamId) {
      showToast('error', 'Aucun club sélectionné pour associer cette offre.');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch(apiUrl('/recruitment'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          teamId,
          title: newTitle.trim(),
          position: newPosition,
          city: newCity.trim(),
          description: newDescription.trim(),
          minAge: parseInt(newMinAge) || null,
          maxAge: parseInt(newMaxAge) || null,
          minHeightCm: parseInt(newMinHeight) || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Erreur lors de la publication de l’annonce.');
      }

      showToast('success', 'Offre de recrutement publiée avec succès sur la plateforme !');
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      fetchPosts();
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur réseau lors de la publication.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ── Toast de feedback ── */}
      {feedback && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold backdrop-blur-md animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
              : 'bg-red-500/20 border-red-500/40 text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="ml-2 hover:opacity-80 p-0.5 text-white/70"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── En-tête de page ── */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            Portail Recrutement & Mercato Officiel
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            Opportunités & Détection
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-slate-300 font-semibold border border-white/10">
              Ligue Nationale
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            Découvrez les besoins des clubs togolais, postulez aux appels à candidatures ou organisez
            vos sessions de détection officielles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isManager && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              type="button"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] hover:from-[#E60023] hover:to-[#991B1B] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-500/25 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" /> Publier une opportunité
            </button>
          )}
        </div>
      </header>

      {/* ── Métriques Clés / KPI ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl border border-white/10 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Annonces Ouvertes</span>
            <Flame className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats.totalOffers}</p>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            En recherche active
          </p>
        </div>

        <div className="glass-panel rounded-2xl border border-white/10 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Candidatures Enregistrées</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats.totalApplications}</p>
          <p className="text-[11px] text-slate-400">Dossiers transmis au staff</p>
        </div>

        <div className="glass-panel rounded-2xl border border-white/10 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Villes Concernées</span>
            <MapPin className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats.uniqueCities}</p>
          <p className="text-[11px] text-slate-400">Pôles sportifs au Togo</p>
        </div>

        <div className="glass-panel rounded-2xl border border-white/10 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Poste le + Recherché</span>
            <TrendingUp className="w-4 h-4 text-[#FF2A3B]" />
          </div>
          <p className="text-2xl font-black text-white">Meneur / Poly</p>
          <p className="text-[11px] text-slate-400">Priorité tactique ligue</p>
        </div>
      </div>

      {/* ── Barre de Navigation / Onglets ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-white/15 text-white border border-white/20 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Toutes les Opportunités ({posts.length})
          </button>

          {session?.token && (
            <button
              onClick={() => setActiveTab('MY_APPLICATIONS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'MY_APPLICATIONS'
                  ? 'bg-[#FF2A3B] text-white shadow-lg shadow-red-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Mes Candidatures
            </button>
          )}

          {isManager && (
            <button
              onClick={() => setActiveTab('MY_POSTS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'MY_POSTS'
                  ? 'bg-amber-500 text-black font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Offres de mon Club
            </button>
          )}
        </div>

        {/* Contrôles de filtres rapides */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur de ville */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-xs bg-slate-900 text-white border border-white/10 cursor-pointer"
          >
            {TOGO_CITIES.map((c) => (
              <option key={c} value={c}>
                {c === 'TOUTES' ? 'Toutes les villes' : c}
              </option>
            ))}
          </select>

          {/* Recherche texte */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Poste, club, mot-clé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-9 pr-3 py-2 text-xs rounded-xl w-48 sm:w-60 border border-white/10"
            />
          </div>
        </div>
      </div>

      {/* ── Filtre par poste ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-1 shrink-0">
          <Filter className="w-3 h-3" /> Poste :
        </span>
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            onClick={() => setPositionFilter(pos)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              positionFilter === pos
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            {pos === 'TOUS' ? 'Tous les postes' : pos}
          </button>
        ))}
      </div>

      {/* ── Grille des Annonces ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2A3B]" />
          <p className="text-sm font-medium">Chargement des opportunités du mercato togolais...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="glass-panel rounded-3xl border border-white/10 p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-2xl">
            🏀
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Aucune opportunité trouvée</h3>
            <p className="text-xs text-slate-400 mt-1">
              Aucune annonce ne correspond aux filtres sélectionnés. Essayez de réinitialiser vos
              critères de recherche.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setPositionFilter('TOUS');
              setCityFilter('TOUTES');
              setActiveTab('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPosts.map((post) => {
            const hasApplied = (post.applications || []).some(
              (app) => app.playerProfile?.user?.id === currentUserId
            );
            const myApplication = (post.applications || []).find(
              (app) => app.playerProfile?.user?.id === currentUserId
            );

            return (
              <article
                key={post.id}
                className="glass-panel rounded-3xl border border-white/10 p-5 sm:p-6 space-y-4 hover:border-white/20 transition-all flex flex-col justify-between group shadow-xl"
              >
                <div className="space-y-3.5">
                  {/* Ligne d'en-tête de l'annonce */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF2A3B]/30 to-[#FFB800]/20 border border-white/15 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                        {post.team?.logoUrl ? (
                          <img
                            src={post.team.logoUrl}
                            alt={post.team.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-xl">🏀</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-[#FFB800]">
                            {post.team?.name || 'Club Indépendant'}
                          </span>
                          <span className="text-[10px] text-slate-500">•</span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {post.city || post.team?.city || 'Togo'}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                          {post.title}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                        post.status === 'OPEN'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}
                    >
                      {post.status === 'OPEN' ? 'Ouvert' : 'Clôturé'}
                    </span>
                  </div>

                  {/* Badges de critères */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      Poste : {post.position}
                    </span>

                    {(post.minAge || post.maxAge) && (
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-medium">
                        Âge : {post.minAge || 16}
                        {post.maxAge ? ` - ${post.maxAge} ans` : '+ ans'}
                      </span>
                    )}

                    {post.minHeightCm && (
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-medium">
                        Taille min : {post.minHeightCm} cm
                      </span>
                    )}

                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {post.applications?.length || post._count?.applications || 0} candidat(s)
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                    {post.description}
                  </p>
                </div>

                {/* Footer & Actions */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Publié le {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Bouton pour staff */}
                    {isManager && (
                      <button
                        onClick={() => setManagingPost(post)}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Consulter et traiter les dossiers"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Examiner ({post.applications?.length || 0})
                      </button>
                    )}

                    {/* Bouton de candidature pour joueur */}
                    {hasApplied ? (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                        <Check className="w-3.5 h-3.5" />
                        {myApplication?.status === 'ACCEPTED'
                          ? 'Retenu pour essai 🎉'
                          : myApplication?.status === 'DECLINED'
                          ? 'Non retenu'
                          : 'Candidature envoyée'}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedPostForApply(post)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-red-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-[1.02]"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Candidater
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1 : CANDIDATER À UNE OFFRE
          ══════════════════════════════════════════════════════════════════ */}
      {selectedPostForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-slate-900 p-6 shadow-2xl text-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-amber-400 font-black">
                  Candidature Sportive
                </div>
                <h3 className="text-lg font-black text-white">
                  Postuler : {selectedPostForApply.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedPostForApply.team?.name} • {selectedPostForApply.city}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPostForApply(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Détails du besoin
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-400">Poste ciblé :</span>{' '}
                    <strong className="text-white">{selectedPostForApply.position}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Taille requise :</span>{' '}
                    <strong className="text-white">
                      {selectedPostForApply.minHeightCm ? `${selectedPostForApply.minHeightCm} cm` : 'Non précisé'}
                    </strong>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1.5">
                  Message de motivation / Présentation *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Présentez votre parcours, vos points forts sur le terrain et pourquoi vous souhaitez rejoindre cette équipe..."
                  value={applyMotivation}
                  onChange={(e) => setApplyMotivation(e.target.value)}
                  className="glass-input w-full rounded-2xl p-3 text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    Téléphone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="+228 90 00 00 00"
                    value={applyPhone}
                    onChange={(e) => setApplyPhone(e.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-red-400" />
                    Lien Vidéo / Highlights
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtu.be/..."
                    value={applyVideoUrl}
                    onChange={(e) => setApplyVideoUrl(e.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-[11px] text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                Votre profil sportif HOOPER (taille, poids, statistiques de match) sera
                automatiquement attaché à votre dossier.
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPostForApply(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={applyLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#E60023] text-white font-bold shadow-lg shadow-red-500/25 hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {applyLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Soumettre mon dossier
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2 : TIROIR D'EXAMEN DES CANDIDATURES (STAFF)
          ══════════════════════════════════════════════════════════════════ */}
      {managingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl rounded-3xl border border-white/20 bg-slate-900 p-6 sm:p-8 shadow-2xl text-slate-100 space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-black flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Espace Recruteur • Examen des dossiers
                </div>
                <h3 className="text-xl font-black text-white mt-1">{managingPost.title}</h3>
                <p className="text-xs text-slate-400">
                  {managingPost.position} • {managingPost.city} •{' '}
                  <strong className="text-white">
                    {managingPost.applications?.length || 0} candidat(s) enregistré(s)
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagingPost(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Liste des candidatures */}
            {(!managingPost.applications || managingPost.applications.length === 0) ? (
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                <Users className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-sm font-bold text-white">Aucun dossier déposé pour le moment</p>
                <p className="text-xs text-slate-400">
                  Dès qu’un joueur postule à votre offre, son profil complet et sa motivation
                  apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {managingPost.applications.map((app) => {
                  const player = app.playerProfile;
                  const user = player?.user;

                  return (
                    <div
                      key={app.id}
                      className="glass-panel rounded-2xl border border-white/10 p-4 sm:p-5 space-y-3.5 hover:border-white/25 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 border border-white/20 overflow-hidden flex items-center justify-center font-bold text-white shrink-0">
                            {user?.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{(user?.name || 'J')[0]}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-white">
                                {user?.name || 'Athlète Candidat'}
                              </h4>
                              {player?.jerseyNumber !== undefined && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-bold">
                                  #{player.jerseyNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>{player?.position || 'Poste non renseigné'}</span>
                              <span>•</span>
                              <span>{player?.heightCm ? `${player.heightCm} cm` : 'Taille N/A'}</span>
                              <span>•</span>
                              <span>{player?.weightKg ? `${player.weightKg} kg` : 'Poids N/A'}</span>
                              <span>•</span>
                              <span>{player?.age ? `${player.age} ans` : 'Âge N/A'}</span>
                            </p>
                          </div>
                        </div>

                        {/* Statut du candidat */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              app.status === 'ACCEPTED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : app.status === 'DECLINED'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {app.status === 'ACCEPTED'
                              ? 'Retenu'
                              : app.status === 'DECLINED'
                              ? 'Refusé'
                              : 'En évaluation'}
                          </span>
                        </div>
                      </div>

                      {/* Message de motivation */}
                      {app.message && (
                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                          {app.message}
                        </div>
                      )}

                      {/* Actions rapides recruteur */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          {user?.email && (
                            <a
                              href={`mailto:${user.email}`}
                              className="hover:text-white flex items-center gap-1 transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              {user.email}
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={updatingAppId === app.id}
                            onClick={() => handleUpdateStatus(app.id, 'ACCEPTED')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white text-xs font-bold border border-emerald-500/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Retenir pour essai
                          </button>
                          <button
                            type="button"
                            disabled={updatingAppId === app.id}
                            onClick={() => handleUpdateStatus(app.id, 'DECLINED')}
                            className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white text-xs font-bold border border-red-500/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            Refuser
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 3 : PUBLIER UNE NOUVELLE OFFRE DE RECRUTEMENT (STAFF)
          ══════════════════════════════════════════════════════════════════ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-slate-900 p-6 sm:p-7 shadow-2xl text-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Publier une offre de recrutement
                </h3>
                <p className="text-xs text-slate-400">
                  Club émetteur : <strong className="text-white">{activeClub?.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Titre de l'annonce *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Recherche Meneur titulaire Senior N1"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="glass-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Poste recherché *</label>
                  <select
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-xs bg-slate-900 text-white border border-white/10"
                  >
                    {POSITIONS.filter((p) => p !== 'TOUS').map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Ville / Arène *</label>
                  <input
                    type="text"
                    required
                    placeholder="Lomé, Kara..."
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="glass-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Âge Min</label>
                  <input
                    type="number"
                    min="14"
                    max="45"
                    value={newMinAge}
                    onChange={(e) => setNewMinAge(e.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Âge Max</label>
                  <input
                    type="number"
                    min="14"
                    max="45"
                    value={newMaxAge}
                    onChange={(e) => setNewMaxAge(e.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Taille Min (cm)</label>
                  <input
                    type="number"
                    min="150"
                    max="230"
                    value={newMinHeight}
                    onChange={(e) => setNewMinHeight(e.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Description détaillée & attentes techniques *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Détaillez le profil recherché, les jours d'entraînement, le niveau de compétition, et les conditions (défraiement, équipement, hébergement)..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="glass-input w-full rounded-2xl p-3 text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold shadow-lg shadow-red-500/25 hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Publication...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Publier l'opportunité
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
