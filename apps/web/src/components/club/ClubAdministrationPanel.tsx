import React, { useEffect, useState, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import {
  ShieldCheck,
  Palette,
  Users,
  ImageUp,
  Loader2,
  Save,
  RotateCcw,
  Wand2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  UserPlus,
  Shield,
  MapPin,
  Building,
  Sparkles,
  Lock,
  UserCheck,
  UserX,
  Trash2,
  Info,
  Trophy,
  Flame,
  Award,
  Calendar,
  Phone,
  Mail,
  Globe,
  Check,
  AlertTriangle,
  Sliders,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { clubApi, type ApiClubMember, type ClubThemeInput } from '../../services/clubApi';
import { analyzeLogoFile } from '../../services/logoPalette';
import { uploadMedia } from '../../services/uploadService';
import { apiUrl } from '../../services/api';

const CLUB_ROLES = [
  {
    value: 'PRESIDENT',
    label: 'Président du Club',
    badge: 'Présidence',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    desc: 'Pouvoir exécutif complet, signature financière, représentation fédérale.',
  },
  {
    value: 'CLUB_ADMIN',
    label: 'Administrateur QG',
    badge: 'Administration',
    color: 'text-red-400 bg-red-500/10 border-red-500/30',
    desc: 'Gestion des adhésions, configuration visuelle, logistique des matchs.',
  },
  {
    value: 'COACH',
    label: 'Entraîneur Principal',
    badge: 'Staff Technique',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    desc: 'Sélection des rosters, convocations, attribution des badges tactiques.',
  },
  {
    value: 'TREASURER',
    label: 'Trésorier / Finances',
    badge: 'Trésorerie',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    desc: 'Comptabilité FCFA, enregistrement des flux, validation des reçus.',
  },
  {
    value: 'PLAYER',
    label: 'Joueur Roster',
    badge: 'Roster Pro',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    desc: 'Accès feuille de match, messagerie vestiaire, pointages présences.',
  },
  {
    value: 'MEMBER',
    label: 'Membre / Supporter',
    badge: 'Affilié',
    color: 'text-slate-400 bg-white/5 border-white/10',
    desc: 'Accès aux actualités internes, boutique et événements supporters.',
  },
];

const PRESET_PALETTES = [
  {
    name: 'Lomé Hawks (Flamme et Or)',
    primary: '#FF2A3B',
    secondary: '#FFB800',
    accent: '#38BDF8',
  },
  {
    name: 'Étoile Noire (Émeraude et Cuivre)',
    primary: '#059669',
    secondary: '#F59E0B',
    accent: '#10B981',
  },
  {
    name: 'Atlantic Surge (Bleu Royal et Cyan)',
    primary: '#1D4ED8',
    secondary: '#06B6D4',
    accent: '#38BDF8',
  },
  {
    name: 'Panthères de Kara (Obsidienne et Pourpre)',
    primary: '#7C3AED',
    secondary: '#EC4899',
    accent: '#F43F5E',
  },
];

export function ClubAdministrationPanel() {
  const { activeClub, setActiveClub } = useClub();
  const clubId = activeClub.clubId || activeClub.id;

  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'BRANDING' | 'SETTINGS' | 'PERMISSIONS'>('MEMBERS');
  const [members, setMembers] = useState<ApiClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberFilter, setMemberFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'>('ALL');
  const [memberSearch, setMemberSearch] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // État Branding & Thème
  const [logoUrl, setLogoUrl] = useState(activeClub.logoUrl || '');
  const [theme, setTheme] = useState<ClubThemeInput>({
    primary: activeClub.primaryColor || '#FF2A3B',
    secondary: activeClub.secondaryColor || '#FFB800',
    accent: activeClub.accentColor || '#38BDF8',
    themeType: 'dark',
    logoUrl: activeClub.logoUrl || undefined,
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);

  // État Paramètres Club (Arène, Contacts)
  const [clubSettings, setClubSettings] = useState({
    name: activeClub.name || '',
    shortName: activeClub.shortName || '',
    city: activeClub.city || 'Lomé',
    arena: activeClub.arena || 'Terrain Central Omnisports',
    description: activeClub.description || '',
    email: activeClub.email || '',
    phoneNumber: activeClub.phoneNumber || '',
    website: activeClub.website || '',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Modal Invitation Membre
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'PLAYER',
  });
  const [inviting, setInviting] = useState(false);

  const token = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('firestone-auth') || '{}').token || '';
    } catch {
      return '';
    }
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await clubApi.getClubMembers(clubId, token);
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Erreur chargement membres:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMembers();
  }, [clubId]);

  // Actions Membre
  const handleUpdateRole = async (member: ApiClubMember, newRole: string) => {
    try {
      const updated = await clubApi.updateClubMemberRole(clubId, member.userId, newRole, token);
      setMembers((prev) =>
        prev.map((item) => (item.id === member.id ? { ...item, role: updated.role || newRole } : item))
      );
      setMessage({ type: 'success', text: `Rôle de ${member.user.name} mis à jour en ${newRole}.` });
    } catch {
      setMessage({ type: 'error', text: 'Impossible de mettre à jour le rôle.' });
    }
  };

  const handleApproveMember = async (userId: string) => {
    try {
      const res = await fetch(apiUrl(`/clubs/${clubId}/members/${userId}/approve`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Membre approuvé et intégré avec succès à la franchise.' });
        await loadMembers();
      } else {
        setMessage({ type: 'error', text: "Erreur lors de l'approbation du membre." });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau.' });
    }
  };

  const handleSuspendMember = async (userId: string) => {
    try {
      const res = await fetch(apiUrl(`/clubs/${clubId}/members/${userId}/suspend`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Statut du membre modifié.' });
        await loadMembers();
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la suspension.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau.' });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Confirmer la radiation de ce membre du club ?')) return;
    try {
      const res = await fetch(apiUrl(`/clubs/${clubId}/members/${userId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Membre retiré du registre de la franchise.' });
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
      } else {
        setMessage({ type: 'error', text: 'Impossible de retirer le membre.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau.' });
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch(apiUrl(`/clubs/${clubId}/members/invite`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Invitation envoyée avec succès à ${inviteForm.email} !` });
        setShowInviteModal(false);
        setInviteForm({ email: '', name: '', role: 'PLAYER' });
        await loadMembers();
      } else {
        setMessage({ type: 'error', text: data?.error || "Erreur lors de l'envoi de l'invitation." });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau lors de l’invitation.' });
    } finally {
      setInviting(false);
    }
  };

  // Upload Logo
  const onLogoSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Format non supporté. Utilisez PNG transparent, JPEG ou WEBP.' });
      return;
    }
    try {
      setIsUploadingLogo(true);
      setMessage(null);
      const [uploadRes, analysis] = await Promise.all([
        uploadMedia(file, 'firestone/clubs/logos'),
        analyzeLogoFile(file),
      ]);
      const finalLogoUrl = uploadRes.secure_url || uploadRes.url;
      setLogoUrl(finalLogoUrl);
      setTheme((curr) => ({ ...curr, ...analysis, logoUrl: finalLogoUrl }));
      setMessage({
        type: 'success',
        text: 'Logo officiel analysé ! Palette chromatique de franchise extraite avec succès.',
      });
    } catch {
      setMessage({ type: 'error', text: "Échec du téléversement ou de l'analyse IA du logo." });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Sauvegarde Thème
  const saveBrand = async () => {
    setSavingBrand(true);
    try {
      const saved = await clubApi.updateClubTheme(clubId, { ...theme, logoUrl }, token);
      setActiveClub({
        ...activeClub,
        logoUrl: saved.club.logoUrl || logoUrl,
        primaryColor: saved.club.primaryColor || theme.primary,
        secondaryColor: saved.club.secondaryColor || theme.secondary,
        accentColor: saved.club.accentColor || theme.accent,
        themeType: saved.club.themeType || theme.themeType,
        themeJson: typeof saved.club.themeJson === 'string' ? saved.club.themeJson : JSON.stringify(theme),
      });
      setMessage({ type: 'success', text: 'Identité visuelle appliquée à l’ensemble du Workspace Franchise !' });
    } catch {
      setMessage({ type: 'error', text: "Erreur lors de l'enregistrement de l'identité visuelle." });
    } finally {
      setSavingBrand(false);
    }
  };

  // Sauvegarde Paramètres
  const saveClubSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch(apiUrl(`/clubs/${clubId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(clubSettings),
      });
      if (res.ok) {
        setActiveClub({ ...activeClub, ...clubSettings });
        setMessage({ type: 'success', text: 'Coordonnées officielles et données d’arène mises à jour.' });
      } else {
        setMessage({ type: 'error', text: 'Échec de la mise à jour des paramètres.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau.' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Filtrage des membres
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        memberSearch === '' ||
        m.user.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.user.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.role.toLowerCase().includes(memberSearch.toLowerCase());

      const status = (m as any).status || 'ACTIVE';
      const matchesStatus = memberFilter === 'ALL' || status === memberFilter;

      return matchesSearch && matchesStatus;
    });
  }, [members, memberSearch, memberFilter]);

  // Statistiques d'effectif
  const stats = useMemo(() => {
    const active = members.filter((m) => ((m as any).status || 'ACTIVE') === 'ACTIVE').length;
    const pending = members.filter((m) => (m as any).status === 'PENDING').length;
    const staff = members.filter((m) => ['PRESIDENT', 'CLUB_ADMIN', 'COACH', 'TREASURER'].includes(m.role)).length;
    const players = members.filter((m) => m.role === 'PLAYER').length;
    return { active, pending, staff, players, total: members.length };
  }, [members]);

  return (
    <div className="space-y-8 pb-16">
      {/* ── Franchise Command Center Hero Header ── */}
      <section className="rounded-2xl border border-white/10 bg-[#0C0F1A] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group shrink-0">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black/60 border border-white/15 p-2.5 flex items-center justify-center shadow-xl backdrop-blur-md overflow-hidden"
              >
                {logoUrl ? (
                  <img src={logoUrl} alt={activeClub.name} className="w-full h-full object-contain drop-shadow" />
                ) : (
                  <span className="text-4xl">🏀</span>
                )}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-black p-1 rounded-full border-2 border-[#0B0E17]">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-400">
                  <ShieldCheck className="w-3 h-3" /> QG & Gouvernance Franchise
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-xs font-semibold text-amber-400">
                  <Flame className="w-3 h-3" /> FNB-TOGO Officiel
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-none tracking-tight">
                {activeClub.name}
              </h1>
              <p className="text-xs text-slate-300 flex flex-wrap items-center gap-3 mt-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FF2A3B]" /> {activeClub.city || 'Lomé, Togo'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-400" /> {activeClub.arena || 'Terrain Central'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Trigramme : <strong className="text-white">{activeClub.shortName || 'FST'}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF2A3B] hover:bg-[#E0202F] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Inviter un collaborateur
            </button>
            <button
              onClick={loadMembers}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Actualiser les données"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400">Effectif total</p>
              <p className="text-lg font-black text-white">{stats.total} affiliés</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400">Roster actif</p>
              <p className="text-lg font-black text-purple-300">{stats.players} joueurs</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400">Corps technique</p>
              <p className="text-lg font-black text-amber-300">{stats.staff} encadrants</p>
            </div>
          </div>

          <div
            className={`p-3 rounded-2xl border flex items-center gap-3 transition-colors ${stats.pending > 0
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-white/5 border-white/5'
              }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stats.pending > 0
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
            >
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400">À valider</p>
              <p
                className={`text-lg font-black ${stats.pending > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
              >
                {stats.pending} en attente
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feedback Message Toast ── */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border text-xs font-semibold backdrop-blur-md shadow-lg transition-all animate-fadeIn ${message.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200'
            : 'border-red-500/30 bg-red-500/15 text-red-200'
            }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          )}
          <span className="flex-1">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Navigation Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10">
        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${activeTab === 'MEMBERS'
            ? 'bg-[#FF2A3B] text-white'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <Users className="w-4 h-4" /> Effectif & Hiérarchie
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/30 border border-white/10 font-mono">
            {members.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('BRANDING')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${activeTab === 'BRANDING'
            ? 'bg-[#FF2A3B] text-white'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <Palette className="w-4 h-4" /> Identité Visuelle et Couleurs
          <div className="flex items-center gap-1 ml-1">
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/20"
              style={{ backgroundColor: theme.primary }}
            />
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/20"
              style={{ backgroundColor: theme.secondary }}
            />
          </div>
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${activeTab === 'SETTINGS'
            ? 'bg-[#FF2A3B] text-white'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <Building className="w-4 h-4" /> Arène & Coordonnées
        </button>

        <button
          onClick={() => setActiveTab('PERMISSIONS')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${activeTab === 'PERMISSIONS'
            ? 'bg-[#FF2A3B] text-white'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <Shield className="w-4 h-4" /> Matrice RBAC & Sécurité
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── 1. ONGLET MEMBRES & HIÉRARCHIE ── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0F1420] border border-white/10">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setMemberFilter(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wide transition-all shrink-0 cursor-pointer ${memberFilter === st
                    ? 'bg-white text-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {st === 'ALL'
                    ? `Tous (${members.length})`
                    : st === 'ACTIVE'
                      ? `Actifs (${stats.active})`
                      : st === 'PENDING'
                        ? `En Attente (${stats.pending})`
                        : `Suspendus (${members.length - stats.active - stats.pending})`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0F1420]/80 backdrop-blur-md shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-white/10 bg-white/[0.02]">
                  <tr>
                    <th className="p-4 pl-6">Membre / Identité</th>
                    <th className="p-4">Rôle dans la Franchise</th>
                    <th className="p-4">Statut Licencié</th>
                    <th className="p-4">Date d'affiliation</th>
                    <th className="p-4 pr-6 text-right">Actions Directes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF2A3B] mb-3" />
                        <p className="font-bold text-white">Interrogation du registre officiel...</p>
                        <p className="text-[11px] text-slate-500 mt-1">Veuillez patienter.</p>
                      </td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400">
                        <Users className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                        <p className="font-bold text-white text-sm">Aucun membre ne correspond aux critères.</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Modifiez vos filtres ou envoyez une invitation pour enrichir le roster.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => {
                      const roleConfig = CLUB_ROLES.find((r) => r.value === member.role) || CLUB_ROLES[5];
                      const memberStatus = (member as any).status || 'ACTIVE';

                      return (
                        <tr key={member.id} className="hover:bg-white/[0.03] transition-colors group">
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3.5">
                              <div className="relative shrink-0">
                                <img
                                  src={
                                    member.user.avatarUrl ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      member.user.name
                                    )}&background=B91C1C&color=fff&bold=true`
                                  }
                                  alt={member.user.name}
                                  className="w-11 h-11 rounded-2xl object-cover border border-white/10 shadow-md bg-slate-800"
                                />
                                <span
                                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0F1420] ${memberStatus === 'ACTIVE'
                                    ? 'bg-emerald-500'
                                    : memberStatus === 'PENDING'
                                      ? 'bg-amber-500 animate-pulse'
                                      : 'bg-red-500'
                                    }`}
                                />
                              </div>
                              <div>
                                <p className="font-black text-white text-sm tracking-tight flex items-center gap-2">
                                  {member.user.name}
                                  {member.role === 'PRESIDENT' && (
                                    <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{member.user.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={member.role}
                                onChange={(e) => handleUpdateRole(member, e.target.value)}
                                className="rounded-xl px-3 py-1.5 text-xs bg-black/40 border border-white/10 text-white font-black cursor-pointer hover:border-white/30 focus:outline-none focus:border-red-500 transition-colors"
                              >
                                {CLUB_ROLES.map((r) => (
                                  <option key={r.value} value={r.value} className="bg-slate-900 text-white">
                                    {r.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${memberStatus === 'ACTIVE'
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                : memberStatus === 'PENDING'
                                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                                  : 'border-red-500/30 bg-red-500/10 text-red-400'
                                }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${memberStatus === 'ACTIVE'
                                  ? 'bg-emerald-400'
                                  : memberStatus === 'PENDING'
                                    ? 'bg-amber-400'
                                    : 'bg-red-400'
                                  }`}
                              />
                              {memberStatus === 'ACTIVE'
                                ? 'Licence Active'
                                : memberStatus === 'PENDING'
                                  ? 'En Attente'
                                  : 'Suspendu'}
                            </span>
                          </td>

                          <td className="p-4 text-slate-400 text-xs font-mono">
                            {new Date(member.joinedAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {memberStatus === 'PENDING' && (
                                <button
                                  onClick={() => handleApproveMember(member.userId)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-all cursor-pointer"
                                  title="Valider l'adhésion"
                                >
                                  <UserCheck className="w-3.5 h-3.5" /> Valider
                                </button>
                              )}
                              <button
                                onClick={() => handleSuspendMember(member.userId)}
                                className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer"
                                title="Suspendre / Réactiver le membre"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveMember(member.userId)}
                                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/5 hover:border-red-500/30 transition-all cursor-pointer"
                                title="Radier de la franchise"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── 2. ONGLET BRANDING & IDENTITÉ VISUELLE ── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'BRANDING' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Form (7 Cols) */}
          <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#0F1420] p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-0.5 text-[10px] font-black text-sky-400 mb-2">
                <Wand2 className="w-3 h-3" /> Direction Artistique Automatisée
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Identité Visuelle & Couleurs de Franchise
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Téléversez l'écusson officiel de {activeClub.name}. L'algorithme extrait automatiquement les dominantes
                chromatiques et harmonise tous les modules du club (Roster, Match Center, Finances).
              </p>
            </div>

            {/* Logo Dropzone */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center gap-6">
              <label className="relative w-36 h-36 rounded-2xl border-2 border-dashed border-white/20 hover:border-sky-400 grid place-items-center overflow-hidden cursor-pointer bg-black/40 transition-all group shrink-0 shadow-inner">
                {isUploadingLogo ? (
                  <div className="text-center p-3">
                    <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-2" />
                    <span className="text-[10px] font-black text-sky-300">Analyse IA...</span>
                  </div>
                ) : logoUrl ? (
                  <>
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-3 drop-shadow" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                      <ImageUp className="w-6 h-6 mb-1 text-sky-400" />
                      <span className="text-[10px] font-bold">Remplacer</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3">
                    <ImageUp className="w-8 h-8 text-slate-400 mx-auto group-hover:text-white transition-colors mb-1.5" />
                    <span className="text-[11px] font-black text-slate-300 block">Uploader Blason</span>
                    <span className="text-[9px] text-slate-500 block">PNG sans fond</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={isUploadingLogo}
                  className="hidden"
                  onChange={onLogoSelect}
                />
              </label>

              <div className="space-y-2 text-xs text-slate-300">
                <p className="font-black text-white text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Recommandations graphiques
                </p>
                <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                  <li>Format <strong className="text-white">PNG avec fond transparent</strong> recommandé</li>
                  <li>Résolution optimale de 512 × 512 px minimum</li>
                  <li>Les couleurs dominantes sont calibrées automatiquement</li>
                </ul>
              </div>
            </div>

            {/* Presets rapides */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-400">
                Palettes Prédéfinies Basketball Togolais
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESET_PALETTES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      setTheme((prev) => ({
                        ...prev,
                        primary: preset.primary,
                        secondary: preset.secondary,
                        accent: preset.accent,
                      }))
                    }
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                      {preset.name}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.primary }} />
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.secondary }} />
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.accent }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Pickers */}
            <div className="space-y-3 pt-2">
              <label className="block text-[11px] font-black text-slate-400">
                Nuancier Personnalisé
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(['primary', 'secondary', 'accent'] as const).map((key) => (
                  <div key={key} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-white capitalize">
                        {key === 'primary' ? 'Primaire' : key === 'secondary' ? 'Secondaire' : 'Accent'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase bg-black/40 px-2 py-0.5 rounded-md">
                        {theme[key]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={theme[key]}
                        onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                        className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={theme[key]}
                        onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-white/10">
              <button
                type="button"
                onClick={saveBrand}
                disabled={savingBrand}
                className="px-6 py-3.5 rounded-2xl bg-[#FF2A3B] text-white font-black text-xs hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-lg disabled:opacity-50 active:scale-95"
              >
                <Save className="w-4 h-4" />
                {savingBrand ? 'Application en direct...' : 'Enregistrer la Charte Graphique'}
              </button>

              <span className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-center sm:justify-start">
                <Check className="w-4 h-4 text-emerald-400" /> Effet immédiat sur tout le workspace
              </span>
            </div>
          </div>

          {/* Live Court & Merch Preview Arena (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#0F1420] p-6 sm:p-8 space-y-6 shadow-xl">
              <h4 className="text-xs font-black text-amber-400 flex items-center gap-2">
                <Eye className="w-4 h-4" /> Prévisualisation Scénique en Direct
              </h4>

              {/* Franchise ID Pass */}
              <div
                className="relative overflow-hidden rounded-3xl p-6 border border-white/20 text-white shadow-2xl space-y-5"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}E6 0%, #0B0E17 100%)`,
                }}
              >
                {/* Basketball court watermark lines */}
                <div className="absolute right-0 top-0 w-48 h-48 rounded-full border-4 border-white/10 -mr-16 -mt-16 pointer-events-none" />
                <div className="absolute right-8 bottom-0 w-24 h-24 rounded-full border-2 border-white/10 pointer-events-none" />

                <div className="flex items-center justify-between relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-black/60 p-2 flex items-center justify-center border border-white/20 shadow-inner">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-2xl">🏀</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-[9px] font-black bg-black/50 border border-white/20 text-white">
                      Carte Officielle Club
                    </span>
                    <p className="text-[10px] font-mono text-white/70 mt-1">SAISON 2026</p>
                  </div>
                </div>

                <div className="relative z-10 pt-2">
                  <p className="text-[10px] font-bold text-white/70">Franchise Nationale</p>
                  <h5 className="text-2xl font-black tracking-tight uppercase">{activeClub.name}</h5>
                  <p className="text-xs text-white/80 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-300" /> {activeClub.city || 'Lomé'} •{' '}
                    {activeClub.arena || 'Terrain Central'}
                  </p>
                </div>

                <div className="relative z-10 pt-2 flex items-center justify-between border-t border-white/20">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-3 py-1 rounded-xl text-black font-black text-[10px] shadow"
                      style={{ backgroundColor: theme.secondary }}
                    >
                      Secondaire
                    </span>
                    <span
                      className="px-3 py-1 rounded-xl text-black font-black text-[10px] shadow"
                      style={{ backgroundColor: theme.accent }}
                    >
                      Accent
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-white/70 font-bold uppercase">
                    TAG #{activeClub.shortName || 'FST'}
                  </span>
                </div>
              </div>

              {/* Court Floor Mockup */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-white">Floor Design Home Court</p>
                  <span className="text-[10px] font-mono text-slate-400">Simulation Arène</span>
                </div>
                <div
                  className="h-28 rounded-2xl relative overflow-hidden border border-white/15 flex items-center justify-center"
                  style={{
                    backgroundColor: '#1E293B',
                  }}
                >
                  {/* Center circle */}
                  <div
                    className="w-16 h-16 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: theme.primary }}
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="text-xs">🏀</span>
                    )}
                  </div>
                  {/* Half court line */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/20 -translate-x-1/2" />
                  {/* Three point arcs */}
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-20 rounded-r-full border-2 border-l-0"
                    style={{ borderColor: theme.secondary }}
                  />
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-20 rounded-l-full border-2 border-r-0"
                    style={{ borderColor: theme.secondary }}
                  />
                </div>
              </div>

              {/* Informational Notes */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2 text-xs text-slate-400 leading-relaxed">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-sky-400" /> Déploiement multi-écrans
                </p>
                <p className="text-[11px]">
                  Ces couleurs habilleront instantanément les feuilles de statistiques, le live ticker de match, la
                  présentation des transferts ainsi que l'interface mobile des joueurs.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── 3. ONGLET COORDONNÉES & ARÈNE ── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'SETTINGS' && (
        <div className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-[#0F1420] p-6 sm:p-10 space-y-8 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-[10px] font-black text-amber-400 mb-2">
              <Building className="w-3 h-3" /> Fiche Signalétique Officielle
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Infrastructures et Coordonnées du Club
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Mettez à jour les informations administratives, l'adresse de votre terrain officiel à domicile et les canaux
              de contact fédéraux.
            </p>
          </div>

          <form onSubmit={saveClubSettings} className="space-y-6">
            {/* Section 1: Identité Officielle */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#FF2A3B]" /> 1. Identité Officielle de la Franchise
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nom Officiel de la Franchise <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    value={clubSettings.name}
                    onChange={(e) => setClubSettings({ ...clubSettings, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Trigramme Court / Sigle (3-4 lettres)
                  </label>
                  <input
                    placeholder="Ex : FST, LOM, MOD"
                    value={clubSettings.shortName}
                    onChange={(e) => setClubSettings({ ...clubSettings, shortName: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono uppercase focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Arène & Domicile */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" /> 2. Arène et Quartier Général Sportif
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Ville d'Attache <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    placeholder="Ex : Lomé, Kara, Kpalimé, Sokodé"
                    value={clubSettings.city}
                    onChange={(e) => setClubSettings({ ...clubSettings, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Gymnase / Terrain à Domicile <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    placeholder="Ex : Terrain Omnisports de Lomé, Centre Swallows"
                    value={clubSettings.arena}
                    onChange={(e) => setClubSettings({ ...clubSettings, arena: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Contacts & Canaux */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" /> 3. Secrétariat & Communications
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Officiel</label>
                  <input
                    type="email"
                    placeholder="secretariat@club.tg"
                    value={clubSettings.email}
                    onChange={(e) => setClubSettings({ ...clubSettings, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Ligne Directe QG</label>
                  <input
                    placeholder="+228 90 00 00 00"
                    value={clubSettings.phoneNumber}
                    onChange={(e) => setClubSettings({ ...clubSettings, phoneNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Site Web ou Page Sociale</label>
                  <input
                    placeholder="https://firestone.tg"
                    value={clubSettings.website}
                    onChange={(e) => setClubSettings({ ...clubSettings, website: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Manifeste */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <label className="block text-xs font-black text-white">
                4. Manifeste & Histoire de la Franchise
              </label>
              <textarea
                rows={4}
                placeholder="Rédigez la devise, les valeurs de formation, l'héritage sportif et les ambitions de la franchise..."
                value={clubSettings.description}
                onChange={(e) => setClubSettings({ ...clubSettings, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-red-500 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-4 rounded-2xl bg-[#FF2A3B] text-white font-black text-xs hover:brightness-110 transition-all cursor-pointer shadow-lg disabled:opacity-50 active:scale-[0.99]"
              >
                {savingSettings ? 'Enregistrement en cours...' : 'Enregistrer les Modifications Signalétiques'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── 4. ONGLET PERMISSIONS RBAC ── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'PERMISSIONS' && (
        <div className="rounded-3xl border border-white/10 bg-[#0F1420] p-6 sm:p-8 space-y-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[10px] font-black text-emerald-400 mb-2">
              <Lock className="w-3 h-3" /> Contrôle d'Accès Basé sur les Rôles (RBAC)
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Matrice de Sécurité et Droits Opérationnels
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Délimitation stricte des privilèges d'administration afin de garantir l'intégrité des finances, des
              contrats et de la feuille de match.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CLUB_ROLES.map((role) => (
              <div
                key={role.value}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-xl text-xs font-black border ${role.color}`}>
                    {role.label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{role.badge}</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed italic">{role.desc}</p>

                <div className="pt-2 border-t border-white/10 space-y-2">
                  <p className="text-[10px] font-black text-slate-300">
                    Habilitations Système :
                  </p>
                  <ul className="text-xs text-slate-300 space-y-2">
                    {role.value === 'PRESIDENT' && (
                      <>
                        <li className="flex items-center gap-2 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          Validation des budgets et bilans annuels
                        </li>
                        <li className="flex items-center gap-2 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          Nomination et révocation des membres du staff
                        </li>
                        <li className="flex items-center gap-2 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          Signature des conventions de sponsoring
                        </li>
                      </>
                    )}
                    {role.value === 'CLUB_ADMIN' && (
                      <>
                        <li className="flex items-center gap-2 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          Gestion des effectifs et approbation des membres
                        </li>
                        <li className="flex items-center gap-2 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          Configuration de la charte visuelle
                        </li>
                        <li className="flex items-center gap-2 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          Planification logistique des matchs et tournois
                        </li>
                      </>
                    )}
                    {role.value === 'COACH' && (
                      <>
                        <li className="flex items-center gap-2 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          Convocations et composition des 5 de départ
                        </li>
                        <li className="flex items-center gap-2 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          Attribution des badges de mérite et notes tactiques
                        </li>
                        <li className="flex items-center gap-2 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          Accès direct aux rapports de scouting
                        </li>
                      </>
                    )}
                    {role.value === 'TREASURER' && (
                      <>
                        <li className="flex items-center gap-2 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          Enregistrement des recettes et dépenses FCFA
                        </li>
                        <li className="flex items-center gap-2 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          Validation des justificatifs de caisse
                        </li>
                        <li className="flex items-center gap-2 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          Exportation des grands livres comptables
                        </li>
                      </>
                    )}
                    {role.value === 'PLAYER' && (
                      <>
                        <li className="flex items-center gap-2 text-slate-300">
                          <Check className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                          Consultation de la feuille de match et de l'agenda
                        </li>
                        <li className="flex items-center gap-2 text-slate-300">
                          <Check className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                          Accès au vestiaire virtuel et annonces internes
                        </li>
                        <li className="flex items-center gap-2 text-slate-300">
                          <Check className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                          Signalement d'indisponibilité ou de blessure
                        </li>
                      </>
                    )}
                    {role.value === 'MEMBER' && (
                      <>
                        <li className="flex items-center gap-2 text-slate-300">
                          <Check className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          Accès aux newsletters et diffusions réservées
                        </li>
                        <li className="flex items-center gap-2 text-slate-300">
                          <Check className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          Tarifs préférentiels billetterie et boutique
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal : Inviter un Collaborateur ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0F1420] p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FF2A3B]/10 border border-[#FF2A3B]/20 text-[#FF2A3B] flex items-center justify-center">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Inviter un Collaborateur</h3>
                  <p className="text-xs text-slate-400">Intégrez un membre au sein de {activeClub.name}.</p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nom et Prénom <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  placeholder="Ex : Marc Lawson, Koffi Mensah"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Adresse Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="collaborateur@domaine.tg"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Rôle et Niveau d'Accès Attribué <span className="text-red-400">*</span>
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-black cursor-pointer focus:outline-none focus:border-red-500 transition-colors"
                >
                  {CLUB_ROLES.map((r) => (
                    <option key={r.value} value={r.value} className="bg-slate-900 text-white font-medium">
                      {r.label} ({r.badge})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 py-3 rounded-xl bg-[#FF2A3B] text-white text-xs font-black hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer shadow-lg"
                >
                  {inviting ? 'Envoi en cours...' : 'Envoyer l’Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
