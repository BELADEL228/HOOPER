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
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { clubApi, type ApiClubMember, type ClubThemeInput } from '../../services/clubApi';
import { analyzeLogoFile } from '../../services/logoPalette';
import { uploadMedia } from '../../services/uploadService';
import { apiUrl } from '../../services/api';

const CLUB_ROLES = [
  { value: 'PRESIDENT', label: 'Président du Club', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { value: 'CLUB_ADMIN', label: 'Administrateur', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  { value: 'COACH', label: 'Entraîneur Principal', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { value: 'TREASURER', label: 'Trésorier / Finances', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { value: 'PLAYER', label: 'Joueur Roster', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { value: 'MEMBER', label: 'Membre / Supporter', color: 'text-slate-400 bg-white/5 border-white/10' },
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
    arena: activeClub.arena || 'Terrain Central',
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
        setMessage({ type: 'success', text: 'Membre approuvé avec succès.' });
        await loadMembers();
      } else {
        setMessage({ type: 'error', text: "Erreur lors de l'approbation." });
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
    if (!window.confirm('Confirmer le retrait de ce membre du club ?')) return;
    try {
      const res = await fetch(apiUrl(`/clubs/${clubId}/members/${userId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Membre retiré du club.' });
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
        setMessage({ type: 'success', text: `Invitation envoyée à ${inviteForm.email} !` });
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
      setMessage({ type: 'error', text: 'Format non supporté. Utilisez PNG, JPEG ou WEBP.' });
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
        text: 'Logo analysé avec succès ! Couleurs dominantes extraites automatiquement.',
      });
    } catch {
      setMessage({ type: 'error', text: "Échec de l'analyse ou du téléversement du logo." });
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
      setMessage({ type: 'success', text: 'Identité visuelle du club enregistrée et appliquée à tout le workspace !' });
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
        setMessage({ type: 'success', text: 'Informations du club enregistrées avec succès.' });
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

  return (
    <div className="space-y-8 pb-12">
      {/* ── Header Club Administration ── */}
      <section
        className="rounded-3xl border border-white/10 p-6 sm:p-8 overflow-hidden relative"
        style={{
          background: `linear-gradient(135deg, ${activeClub.primaryColor || '#FF2A3B'}35, #090A0F 85%)`,
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/10 p-2 flex items-center justify-center shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-3xl">🏀</span>
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Centre de Commandement Club
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{activeClub.name}</h1>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#FF2A3B]" /> {activeClub.city || 'Lomé, Togo'} •{' '}
                {members.length} membre(s) affilié(s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white text-xs font-black hover:brightness-110 transition-all shadow-md cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Inviter un membre
            </button>
          </div>
        </div>
      </section>

      {/* ── Feedback Message ── */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border text-xs font-semibold ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Navigation Onglets ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'MEMBERS'
              ? 'bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white shadow-md'
              : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" /> Membres & Rôles ({members.length})
        </button>

        <button
          onClick={() => setActiveTab('BRANDING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'BRANDING'
              ? 'bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white shadow-md'
              : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          <Palette className="w-4 h-4" /> Identité Visuelle & Thème
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'SETTINGS'
              ? 'bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white shadow-md'
              : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          <Building className="w-4 h-4" /> Coordonnées & Arène
        </button>

        <button
          onClick={() => setActiveTab('PERMISSIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'PERMISSIONS'
              ? 'bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white shadow-md'
              : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          <Shield className="w-4 h-4" /> Matrice des Droits
        </button>
      </div>

      {/* ── 1. ONGLET MEMBRES ── */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-6">
          {/* Barre d'outils membres */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              {(['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setMemberFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    memberFilter === st ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'Tous' : st === 'ACTIVE' ? 'Actifs' : st === 'PENDING' ? 'En attente' : 'Suspendus'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Chercher un membre..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="glass-input pl-8 pr-3 py-1.5 text-xs rounded-xl w-52"
                />
              </div>

              <button
                onClick={loadMembers}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Actualiser la liste"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tableau des membres */}
          <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="p-4">Membre</th>
                    <th className="p-4">Rôle dans le Club</th>
                    <th className="p-4">Rôle Plateforme</th>
                    <th className="p-4">Date d'adhésion</th>
                    <th className="p-4 text-right">Actions de Gestion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#FF2A3B] mb-2" />
                        Chargement de l'effectif...
                      </td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Aucun membre trouvé pour ce filtre.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => {
                      const roleConfig = CLUB_ROLES.find((r) => r.value === member.role) || CLUB_ROLES[5];

                      return (
                        <tr key={member.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  member.user.avatarUrl ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    member.user.name
                                  )}&background=B91C1C&color=fff`
                                }
                                alt={member.user.name}
                                className="w-10 h-10 rounded-xl object-cover bg-slate-800"
                              />
                              <div>
                                <p className="font-bold text-white text-sm">{member.user.name}</p>
                                <p className="text-[11px] text-slate-400">{member.user.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(member, e.target.value)}
                              className="glass-input rounded-xl px-2.5 py-1.5 text-xs bg-slate-900 text-white font-bold cursor-pointer"
                            >
                              {CLUB_ROLES.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${roleConfig.color}`}>
                              {roleConfig.label}
                            </span>
                          </td>

                          <td className="p-4 text-slate-400 text-[11px]">
                            {new Date(member.joinedAt).toLocaleDateString('fr-FR')}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {member.status === 'PENDING' && (
                                <button
                                  onClick={() => handleApproveMember(member.userId)}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition-colors"
                                  title="Approuver le membre"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleSuspendMember(member.userId)}
                                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors"
                                title="Suspendre / Réactiver"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveMember(member.userId)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-colors"
                                title="Retirer du club"
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

      {/* ── 2. ONGLET BRANDING & COULEURS ── */}
      {activeTab === 'BRANDING' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 space-y-6">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#38BDF8]" /> Identité Visuelle Automatisée
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Importez le logo officiel. Le moteur extrait automatiquement la palette et harmonise l'espace club.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/10">
              <label className="relative w-32 h-32 rounded-2xl border-2 border-dashed border-white/20 hover:border-[#38BDF8] grid place-items-center overflow-hidden cursor-pointer bg-slate-900/50 transition-colors group shrink-0">
                {isUploadingLogo ? (
                  <Loader2 className="w-8 h-8 text-[#38BDF8] animate-spin" />
                ) : logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-center p-2">
                    <ImageUp className="w-8 h-8 text-slate-400 mx-auto group-hover:text-white transition-colors" />
                    <span className="text-[10px] text-slate-400 block mt-1">Uploader Logo</span>
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
                <p className="font-bold text-white">Recommandations pour le logo :</p>
                <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-400">
                  <li>Format PNG transparent avec détourage net</li>
                  <li>Résolution minimale de 512x512 pixels</li>
                  <li>Taille maximale autorisée : 10 Mo</li>
                </ul>
              </div>
            </div>

            {/* Sélecteurs de Couleurs */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                Palette de la franchise
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(['primary', 'secondary', 'accent'] as const).map((key) => (
                  <div key={key} className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300 capitalize">
                        {key === 'primary' ? 'Primaire' : key === 'secondary' ? 'Secondaire' : 'Accent'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{theme[key]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={theme[key]}
                        onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                        className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={theme[key]}
                        onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                        className="glass-input rounded-xl px-2.5 py-1 text-xs font-mono w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={saveBrand}
                disabled={savingBrand}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white font-black text-xs hover:brightness-110 transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-[#FF2A3B]/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {savingBrand ? 'Application en cours...' : 'Sauvegarder l’Identité'}
              </button>

              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-[#FFB800]" /> Synchronisation instantanée
              </span>
            </div>
          </div>

          {/* Aperçu en direct */}
          <div className="lg:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFB800] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Aperçu Visuel en Direct
            </h4>

            {/* Mini Carte de Présentation */}
            <div
              className="p-6 rounded-3xl border border-white/20 space-y-4 text-white shadow-2xl relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-black/40 p-1 flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span>🏀</span>
                  )}
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-black/40 text-white">
                  Ligue Pro 2026
                </span>
              </div>

              <div>
                <h5 className="text-2xl font-black">{activeClub.name}</h5>
                <p className="text-xs text-white/80">{activeClub.city || 'Lomé'}</p>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs font-bold">
                <span
                  className="px-3 py-1 rounded-lg text-black text-[11px] font-black"
                  style={{ backgroundColor: theme.accent }}
                >
                  Couleur Accent
                </span>
                <span className="text-[11px] text-white/90">Boutons & Highlights</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs text-slate-300">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#38BDF8]" /> Impact sur la plateforme
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ce thème s'appliquera automatiquement sur votre Dashboard Club, le Match Center, le Roster, ainsi que sur votre page publique de franchise.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. ONGLET COORDONNÉES & ARÈNE ── */}
      {activeTab === 'SETTINGS' && (
        <div className="max-w-3xl mx-auto glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 space-y-6">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-[#FFB800]" /> Informations & Installations Sportives
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configurez le terrain officiel à domicile, la ville d'attache et les contacts administratifs.
            </p>
          </div>

          <form onSubmit={saveClubSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Nom complet de la franchise</label>
                <input
                  required
                  value={clubSettings.name}
                  onChange={(e) => setClubSettings({ ...clubSettings, name: e.target.value })}
                  className="glass-input w-full rounded-xl p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Trigramme / Nom court</label>
                <input
                  placeholder="Ex : FST, LOM"
                  value={clubSettings.shortName}
                  onChange={(e) => setClubSettings({ ...clubSettings, shortName: e.target.value })}
                  className="glass-input w-full rounded-xl p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Ville d'ancrage</label>
                <input
                  required
                  value={clubSettings.city}
                  onChange={(e) => setClubSettings({ ...clubSettings, city: e.target.value })}
                  className="glass-input w-full rounded-xl p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Arène / Terrain à domicile</label>
                <input
                  required
                  placeholder="Ex : Terrain Omnisports Adétikopé"
                  value={clubSettings.arena}
                  onChange={(e) => setClubSettings({ ...clubSettings, arena: e.target.value })}
                  className="glass-input w-full rounded-xl p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Email officiel de contact</label>
                <input
                  type="email"
                  placeholder="contact@club.tg"
                  value={clubSettings.email}
                  onChange={(e) => setClubSettings({ ...clubSettings, email: e.target.value })}
                  className="glass-input w-full rounded-xl p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Téléphone QG</label>
                <input
                  placeholder="+228 90 00 00 00"
                  value={clubSettings.phoneNumber}
                  onChange={(e) => setClubSettings({ ...clubSettings, phoneNumber: e.target.value })}
                  className="glass-input w-full rounded-xl p-3 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Site Web ou Page Sociale</label>
                <input
                  placeholder="https://firestone.tg"
                  value={clubSettings.website}
                  onChange={(e) => setClubSettings({ ...clubSettings, website: e.target.value })}
                  className="glass-input w-full rounded-xl p-3 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Histoire & Devise de la Franchise
                </label>
                <textarea
                  rows={4}
                  placeholder="Présentez l'histoire du club, les valeurs et les ambitions sportives..."
                  value={clubSettings.description}
                  onChange={(e) => setClubSettings({ ...clubSettings, description: e.target.value })}
                  className="glass-input w-full rounded-xl p-3 text-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white font-black text-xs hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-[#FF2A3B]/20 disabled:opacity-50"
              >
                {savingSettings ? 'Enregistrement en cours...' : 'Enregistrer les coordonnées du club'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 4. ONGLET PERMISSIONS & DROITS ── */}
      {activeTab === 'PERMISSIONS' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 space-y-6">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" /> Matrice des Permissions Internes
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Contrôle d'accès basé sur les rôles (RBAC) pour protéger les données confidentielles de la franchise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CLUB_ROLES.map((role) => (
              <div key={role.value} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${role.color}`}>
                    {role.label}
                  </span>
                </div>

                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  {role.value === 'PRESIDENT' && (
                    <>
                      <li>Accès complet à la trésorerie et aux contrats</li>
                      <li>Nomination des coachs et administrateurs</li>
                      <li>Signature des accords de sponsoring</li>
                    </>
                  )}
                  {role.value === 'CLUB_ADMIN' && (
                    <>
                      <li>Gestion des membres et des invitations</li>
                      <li>Configuration de l'identité visuelle</li>
                      <li>Organisation des matchs et tournois</li>
                    </>
                  )}
                  {role.value === 'COACH' && (
                    <>
                      <li>Gestion du roster et des convocations</li>
                      <li>Attribution des badges et notations</li>
                      <li>Accès au scouting et shortlists</li>
                    </>
                  )}
                  {role.value === 'TREASURER' && (
                    <>
                      <li>Gestion des entrées et sorties de caisse</li>
                      <li>Validation des justificatifs de paiement</li>
                      <li>Téléchargement des bilans financiers</li>
                    </>
                  )}
                  {role.value === 'PLAYER' && (
                    <>
                      <li>Accès à l'agenda et justification d'absence</li>
                      <li>Messagerie d'équipe et annonces internes</li>
                      <li>Consultation des fiches tactiques</li>
                    </>
                  )}
                  {role.value === 'MEMBER' && (
                    <>
                      <li>Accès aux actualités club exclusives</li>
                      <li>Participation aux événements supporters</li>
                      <li>Boutique et billetterie club</li>
                    </>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal : Inviter un Membre ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md glass-panel rounded-3xl border border-white/15 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#FF2A3B]/10 text-[#FF2A3B]">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Inviter un Membre</h3>
                  <p className="text-xs text-slate-400">Ajoutez un dirigeant, coach ou joueur à {activeClub.name}.</p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Nom complet</label>
                <input
                  required
                  placeholder="Ex : Marc Lawson"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="glass-input w-full rounded-xl p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Adresse Email</label>
                <input
                  type="email"
                  required
                  placeholder="marc@example.tg"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="glass-input w-full rounded-xl p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Rôle attribué</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="glass-input w-full rounded-xl p-3 text-xs bg-slate-900 text-white"
                >
                  {CLUB_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white text-xs font-black hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {inviting ? 'Envoi...' : 'Envoyer l’invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
