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
  Flame,
  Eye,
  AlertCircle,
  Video,
  Check,
  Building2,
  Phone,
  Mail,
  Loader2,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  Clock
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
  { label: 'Tous les postes', value: 'TOUS', code: 'ALL' },
  { label: 'Meneur', value: 'Meneur', code: 'PG' },
  { label: 'Arrière', value: 'Arrière', code: 'SG' },
  { label: 'Ailier', value: 'Ailier', code: 'SF' },
  { label: 'Ailier Fort', value: 'Ailier Fort', code: 'PF' },
  { label: 'Pivot', value: 'Pivot', code: 'C' },
  { label: 'Polyvalent', value: 'Polyvalent', code: 'FLEX' },
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

  // Toasts
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal Création (Staff)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPosition, setNewPosition] = useState('Meneur');
  const [newCity, setNewCity] = useState(activeClub?.city || 'Lomé');
  const [newDescription, setNewDescription] = useState('');
  const [newMinAge, setNewMinAge] = useState('17');
  const [newMaxAge, setNewMaxAge] = useState('25');
  const [newMinHeight, setNewMinHeight] = useState('188');
  const [createLoading, setCreateLoading] = useState(false);

  // Modal Candidature (Joueur)
  const [selectedPostForApply, setSelectedPostForApply] = useState<RecruitmentPost | null>(null);
  const [applyMotivation, setApplyMotivation] = useState('');
  const [applyPhone, setApplyPhone] = useState('');
  const [applyVideoUrl, setApplyVideoUrl] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  // Modal Traitement Candidatures (Staff)
  const [managingPost, setManagingPost] = useState<RecruitmentPost | null>(null);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  // Session
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

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.description.toLowerCase().includes(q) ||
        post.position.toLowerCase().includes(q) ||
        (post.team?.name && post.team.name.toLowerCase().includes(q)) ||
        post.city.toLowerCase().includes(q);

      const matchPosition =
        positionFilter === 'TOUS' ||
        post.position.toLowerCase() === positionFilter.toLowerCase();

      const matchCity =
        cityFilter === 'TOUTES' ||
        post.city.toLowerCase() === cityFilter.toLowerCase();

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

  const stats = useMemo(() => {
    const totalOffers = posts.filter((p) => p.status === 'OPEN').length;
    const totalApplications = posts.reduce((acc, p) => acc + (p.applications?.length || 0), 0);
    const uniqueCities = new Set(posts.map((p) => p.city)).size;
    const guardCount = posts.filter((p) => p.position.toLowerCase().includes('meneur')).length;
    return { totalOffers, totalApplications, uniqueCities, guardCount };
  }, [posts]);

  // Candidater
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

  // Traiter statut
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

  // Publier offre
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

      showToast('success', 'Offre de recrutement publiée avec succès sur le portail !');
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
    <div className="space-y-8 pb-20">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-20 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold backdrop-blur-xl animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/90 border-red-500/40 text-red-200'
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

      {/* Hero */}
      <div className="rounded-2xl border border-white/10 bg-[#0C0F1A] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-semibold">
                <Flame className="w-3 h-3 text-amber-400" />
                Mercato national togolais
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px]">
                Saison 2026-2027
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
              Recrutement
            </h1>

            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Besoins officiels des franchises, appels à candidatures pour les divisions nationales et sessions d'essai sur le parquet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isManager && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                type="button"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF2A3B] hover:bg-[#E0202F] text-white text-sm font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Publier une opportunité
              </button>
            )}
          </div>
        </div>

        {/* Tactical Metric Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Appels Ouverts</span>
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats.totalOffers}</p>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Recrutement en cours
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Dossiers Transmis</span>
              <Users className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats.totalApplications}</p>
            <p className="text-[11px] text-slate-400">Joueurs ayant postulé</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Pôles Territoriaux</span>
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats.uniqueCities}</p>
            <p className="text-[11px] text-slate-400">Villes togolaises actives</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Cible Prioritaire</span>
              <Sparkles className="w-3.5 h-3.5 text-[#FF2A3B]" />
            </div>
            <p className="text-2xl font-black text-white">Meneur & Ailier</p>
            <p className="text-[11px] text-slate-400">Tendance tactique ligue</p>
          </div>
        </div>
      </div>

      {/* Navigation Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-2 rounded-2xl bg-[#0F131F] border border-white/10">
          {/* Main Segmented Toggle */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-white/15 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Toutes les Offres ({posts.length})
            </button>

            {session?.token && (
              <button
                onClick={() => setActiveTab('MY_APPLICATIONS')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'MY_APPLICATIONS'
                    ? 'bg-[#FF2A3B] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Send className="w-3 h-3" /> Mes Candidatures
              </button>
            )}

            {isManager && (
              <button
                onClick={() => setActiveTab('MY_POSTS')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'MY_POSTS'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3 h-3" /> Offres de mon Club
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2.5 px-2">
            {/* City Dropdown */}
            <div className="relative">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-black/60 text-slate-200 border border-white/10 cursor-pointer focus:outline-none focus:border-amber-400"
              >
                {TOGO_CITIES.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c === 'TOUTES' ? 'Toutes les villes' : c}
                  </option>
                ))}
              </select>
            </div>

            {/* Keyword Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Club, poste, profil..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl text-xs bg-black/60 text-white border border-white/10 w-44 sm:w-56 focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Position Badges Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {POSITIONS.map((pos) => {
            const isSelected = positionFilter === pos.value;
            return (
              <button
                key={pos.value}
                onClick={() => setPositionFilter(pos.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                    : 'bg-[#121624] text-slate-300 border border-white/5 hover:border-white/20'
                }`}
              >
                <span
                  className={`text-[9px] px-1 py-0.5 rounded font-black tracking-tight ${
                    isSelected ? 'bg-black/20 text-slate-950' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {pos.code}
                </span>
                <span>{pos.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Recruitment Offers */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2A3B]" />
          <p className="text-xs uppercase tracking-widest font-black text-slate-400">
            Chargement des opportunités du mercato...
          </p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#0F131F]/80 p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-2xl">
            🏀
          </div>
          <div>
            <h3 className="text-base font-black text-white">Aucune opportunité trouvée</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Aucun appel à candidatures ne correspond à vos filtres actuels. Modifiez les critères
              ou réinitialisez vos options.
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
                className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#131826] to-[#0A0D14] p-5 sm:p-6 space-y-4 hover:border-amber-500/30 transition-all flex flex-col justify-between group shadow-xl"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        {post.team?.logoUrl ? (
                          <img
                            src={post.team.logoUrl}
                            alt={post.team.name}
                            className="w-full h-full object-contain p-1.5"
                          />
                        ) : (
                          <span className="text-xl">🏀</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-amber-400">
                            {post.team?.name || 'Franchise Indépendante'}
                          </span>
                          <span className="text-slate-600 text-xs">•</span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {post.city || post.team?.city || 'Togo'}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                          {post.title}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
                        post.status === 'OPEN'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}
                    >
                      {post.status === 'OPEN' ? 'Ouvert' : 'Clôturé'}
                    </span>
                  </div>

                  {/* Physical & Tactical Requirements Chips */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-black flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3" />
                      Poste : {post.position}
                    </span>

                    {(post.minAge || post.maxAge) && (
                      <span className="px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 font-semibold flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Âge : {post.minAge || 16}
                        {post.maxAge ? ` - ${post.maxAge} ans` : '+ ans'}
                      </span>
                    )}

                    {post.minHeightCm && (
                      <span className="px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 font-semibold">
                        Taille min : <strong className="text-white">{post.minHeightCm} cm</strong>
                      </span>
                    )}

                    <span className="px-2.5 py-1 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 font-semibold flex items-center gap-1.5">
                      <Users className="w-3 h-3" />
                      {post.applications?.length || post._count?.applications || 0} candidat(s)
                    </span>
                  </div>

                  {/* Description snippet */}
                  <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed line-clamp-3">
                    {post.description}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Publié le {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Action Staff */}
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

                    {/* Action Joueur */}
                    {hasApplied ? (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black">
                        <Check className="w-3.5 h-3.5" />
                        {myApplication?.status === 'ACCEPTED'
                          ? 'Retenu pour essai 🏀'
                          : myApplication?.status === 'DECLINED'
                          ? 'Dossier archivé'
                          : 'Candidature transmise'}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedPostForApply(post)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF2A3B] hover:bg-[#e6001f] text-white text-xs font-black transition-colors cursor-pointer"
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

      {/* MODAL 1 : CANDIDATURE ATHLÈTE */}
      {selectedPostForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-[#0F131F] p-6 sm:p-7 shadow-2xl text-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-black">
                  Dossier de Candidature
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {selectedPostForApply.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedPostForApply.team?.name} • {selectedPostForApply.city}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPostForApply(null)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <span className="text-[11px] font-bold text-slate-300">
                  Cahier des charges du club
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-400">Poste attendu :</span>{' '}
                    <strong className="text-white">{selectedPostForApply.position}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Taille min :</span>{' '}
                    <strong className="text-white">
                      {selectedPostForApply.minHeightCm ? `${selectedPostForApply.minHeightCm} cm` : 'Libre'}
                    </strong>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1.5">
                  Motivation & Expérience sportive *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Présentez vos points forts sur le terrain, vos anciens clubs ou académies, et vos disponibilités pour les essais..."
                  value={applyMotivation}
                  onChange={(e) => setApplyMotivation(e.target.value)}
                  className="w-full rounded-2xl p-3 text-xs leading-relaxed bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
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
                    className="w-full rounded-xl px-3 py-2.5 text-xs bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-red-400" />
                    Lien Vidéo Highlights
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtu.be/..."
                    value={applyVideoUrl}
                    onChange={(e) => setApplyVideoUrl(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-xs bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-[11px] text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                Votre profil sportif HOOPER (taille, envergure, stats et badges) sera
                automatiquement certifié et attaché à votre candidature.
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPostForApply(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-white font-bold hover:bg-white/10 transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={applyLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#FF2A3B] text-white font-black shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {applyLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Envoi...
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

      {/* MODAL 2 : EXAMEN DES CANDIDATURES (STAFF) */}
      {managingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl rounded-3xl border border-white/20 bg-[#0F131F] p-6 sm:p-8 shadow-2xl text-slate-100 space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-black flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Espace Staff Technique • Examen des Candidatures
                </span>
                <h3 className="text-xl font-black text-white mt-1">{managingPost.title}</h3>
                <p className="text-xs text-slate-400">
                  {managingPost.position} • {managingPost.city} •{' '}
                  <strong className="text-amber-400">
                    {managingPost.applications?.length || 0} candidat(s) enregistré(s)
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagingPost(null)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Application List */}
            {(!managingPost.applications || managingPost.applications.length === 0) ? (
              <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-2">
                <Users className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-white">Aucun dossier déposé pour l'instant</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Dès qu’un joueur postule à cet appel, sa fiche technique et ses coordonnées
                  s'afficheront ici en direct.
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
                      className="rounded-2xl border border-white/10 bg-[#141926] p-4 sm:p-5 space-y-3.5 hover:border-white/20 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 border border-white/20 overflow-hidden flex items-center justify-center font-bold text-white shrink-0 shadow-md">
                            {user?.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-base font-black">{(user?.name || 'A')[0]}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-white">
                                {user?.name || 'Athlète Candidat'}
                              </h4>
                              {player?.jerseyNumber !== undefined && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-amber-300 font-black">
                                  #{player.jerseyNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="text-amber-300 font-bold">{player?.position || 'Poste libre'}</span>
                              <span>•</span>
                              <span>{player?.heightCm ? `${player.heightCm} cm` : 'Taille N/A'}</span>
                              <span>•</span>
                              <span>{player?.weightKg ? `${player.weightKg} kg` : 'Poids N/A'}</span>
                              <span>•</span>
                              <span>{player?.age ? `${player.age} ans` : 'Âge N/A'}</span>
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black self-start sm:self-auto ${
                            app.status === 'ACCEPTED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : app.status === 'DECLINED'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {app.status === 'ACCEPTED'
                            ? 'Retenu pour essai'
                            : app.status === 'DECLINED'
                            ? 'Classé sans suite'
                            : 'En évaluation'}
                        </span>
                      </div>

                      {/* Motivation Text */}
                      {app.message && (
                        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                          {app.message}
                        </div>
                      )}

                      {/* Staff Decision Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-white/5">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          {user?.email && (
                            <a
                              href={`mailto:${user.email}`}
                              className="hover:text-amber-400 flex items-center gap-1 transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {user.email}
                            </a>
                          )}
                          {user?.phoneNumber && (
                            <a
                              href={`https://wa.me/${user.phoneNumber.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              WhatsApp
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={updatingAppId === app.id}
                            onClick={() => handleUpdateStatus(app.id, 'ACCEPTED')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white text-xs font-black border border-emerald-500/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Retenir pour essai
                          </button>
                          <button
                            type="button"
                            disabled={updatingAppId === app.id}
                            onClick={() => handleUpdateStatus(app.id, 'DECLINED')}
                            className="px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white text-xs font-black border border-red-500/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            Classer
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

      {/* MODAL 3 : CRÉATION D'UNE OFFRE DE RECRUTEMENT (STAFF) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-[#0F131F] p-6 sm:p-7 shadow-2xl text-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-black">
                  Appel à Candidatures
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                  Publier une offre de recrutement
                </h3>
                <p className="text-xs text-slate-400">
                  Franchise émettrice : <strong className="text-white">{activeClub?.name}</strong>
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
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Poste recherché *</label>
                  <select
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-xs bg-black/50 text-white border border-white/10 focus:outline-none focus:border-amber-400"
                  >
                    {POSITIONS.filter((p) => p.value !== 'TOUS').map((p) => (
                      <option key={p.value} value={p.value} className="bg-slate-900 text-white">
                        {p.label}
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
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
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
                    className="w-full rounded-xl px-3 py-2 text-xs bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
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
                    className="w-full rounded-xl px-3 py-2 text-xs bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
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
                    className="w-full rounded-xl px-3 py-2 text-xs bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Exigences techniques & conditions d'accueil *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Détaillez le profil recherché, les jours d'entraînement, le niveau de compétition, et les conditions (défraiement, équipement, hébergement)..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-2xl p-3 text-xs leading-relaxed bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-white font-bold hover:bg-white/10 transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-black shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Publication...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Mettre en ligne
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
