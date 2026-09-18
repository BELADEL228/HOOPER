import React, { useState, useEffect } from 'react';
import type { UserRole, AdminUser, AdminMetrics, ModerationReport, AuditLogEntry } from '../../types';
import {
  ShieldAlert,
  Users,
  Settings,
  CheckCircle,
  Trash2,
  ShieldCheck,
  Crown,
  Activity,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  UserX,
  UserCheck,
  RotateCcw,
  Check,
  X,
  MessageSquare,
  Trophy,
  Server,
  Zap,
  Building2,
  Database,
  Radio,
  Gauge,
  UserRoundPlus,
} from 'lucide-react';
import { apiUrl } from '../../services/api';
import { clubApi, type ApiClubRequest } from '../../services/clubApi';

interface AdminPanelProps {
  currentRole: UserRole;
  authUser?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  } | null;
}

interface SupervisionSnapshot {
  generatedAt: string; database: 'ONLINE' | 'OFFLINE' | string;
  system: { uptimeSeconds: number; memoryMb: number; environment: string };
  inventory: { users: number; clubs: number; teams: number; posts: number; matches: number; tournaments: number };
  attention: { reportsPending: number; requestsPending: number };
  auditLogs: Array<{ id: string; action: string; targetType: string; details?: string | null; createdAt: string; user?: { name: string; role: string } }>;
  recentUsers: Array<{ id: string; name: string; email: string; role: string; createdAt: string; isSuspended: boolean }>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentRole, authUser: _authUser }) => {
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';
  const isAuthorized = currentRole === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SUPERVISION' | 'USERS' | 'REQUESTS' | 'REPORTS' | 'AUDIT' | 'SETTINGS'>('DASHBOARD');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Données API
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [clubRequests, setClubRequests] = useState<ApiClubRequest[]>([]);
  const [rejectingRequest, setRejectingRequest] = useState<ApiClubRequest | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [supervision, setSupervision] = useState<SupervisionSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  // Filtres utilisateurs
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filtre signalements
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('PENDING');

  // Modal de suspension
  const [suspendingUser, setSuspendingUser] = useState<AdminUser | null>(null);
  const [suspendReasonInput, setSuspendReasonInput] = useState('Non-respect des règles de la communauté');
  const [suspendDurationDays, setSuspendDurationDays] = useState<number>(7);

  // Token d'authentification
  const getAuthToken = () => {
    try {
      const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
      return session?.token || '';
    } catch {
      return '';
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  // Chargement des métriques
  const fetchMetrics = async () => {
    const token = getAuthToken();
    try {
      const res = await fetch(apiUrl('/admin/metrics'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch {
      // Fallback
    }
  };

  // Chargement des utilisateurs
  const fetchUsers = async () => {
    const token = getAuthToken();
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (roleFilter !== 'ALL') queryParams.append('role', roleFilter);
      if (statusFilter === 'SUSPENDED') queryParams.append('status', 'suspended');
      if (statusFilter === 'ACTIVE') queryParams.append('status', 'active');
      if (userSearch.trim()) queryParams.append('search', userSearch.trim());

      const res = await fetch(apiUrl(`/admin/users?${queryParams.toString()}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Chargement des signalements
  const fetchReports = async () => {
    const token = getAuthToken();
    try {
      const res = await fetch(apiUrl(`/admin/reports?status=${reportStatusFilter}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Chargement du journal d'audit
  const fetchAuditLogs = async () => {
    const token = getAuthToken();
    try {
      const res = await fetch(apiUrl('/admin/audit-logs'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClubRequests = async () => {
    try { setClubRequests(await clubApi.listClubRequests(getAuthToken())); } catch (err) { showError(err instanceof Error ? err.message : 'Impossible de charger les demandes.'); }
  };

  const fetchSupervision = async () => {
    try {
      const response = await fetch(apiUrl('/admin/supervision'), { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Supervision indisponible.');
      setSupervision(data);
    } catch (err) { showError(err instanceof Error ? err.message : 'Supervision indisponible.'); }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchMetrics();
      if (activeTab === 'USERS') fetchUsers();
      if (activeTab === 'REPORTS') fetchReports();
      if (activeTab === 'AUDIT') fetchAuditLogs();
      if (activeTab === 'REQUESTS' && isSuperAdmin) fetchClubRequests();
      if (activeTab === 'SUPERVISION' && isSuperAdmin) fetchSupervision();
    }
  }, [activeTab, isAuthorized]);

  // Déclencher le filtre utilisateurs
  useEffect(() => {
    if (activeTab === 'USERS') {
      const timeout = setTimeout(() => {
        fetchUsers();
      }, 250);
      return () => clearTimeout(timeout);
    }
  }, [roleFilter, statusFilter, userSearch]);

  // Déclencher le filtre signalements
  useEffect(() => {
    if (activeTab === 'REPORTS') {
      fetchReports();
    }
  }, [reportStatusFilter]);

  if (!isAuthorized) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-red-500/40 text-center space-y-4 max-w-xl mx-auto my-12 shadow-2xl">
        <ShieldAlert className="w-16 h-16 text-[#FF2A3B] mx-auto animate-bounce" />
        <h3 className="text-2xl font-black text-white">Accès Réservé à l'Administration</h3>
        <p className="text-slate-300 text-sm">
          Cette console de supervision de plateforme requiert le rôle **SUPER_ADMIN**.
        </p>
      </div>
    );
  }

  // Action : Changement de rôle
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const token = getAuthToken();
    try {
      const res = await fetch(apiUrl(`/admin/users/${userId}/role`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible de changer le rôle.');

      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      showSuccess(`Rôle mis à jour en "${newRole}".`);
      fetchMetrics();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur modification rôle.');
    }
  };

  // Action : Suspension d'un compte
  const handleConfirmSuspend = async () => {
    if (!suspendingUser) return;
    const token = getAuthToken();
    try {
      const res = await fetch(apiUrl(`/admin/users/${suspendingUser.id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          isSuspended: true,
          suspendReason: suspendReasonInput.trim(),
          durationDays: suspendDurationDays,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suspension.');

      setUsers(users.map((u) => (u.id === suspendingUser.id ? { ...u, isSuspended: true, suspendReason: suspendReasonInput } : u)));
      setSuspendingUser(null);
      showSuccess(`Utilisateur ${suspendingUser.name} suspendu pour ${suspendDurationDays} jours.`);
      fetchMetrics();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur suspension.');
    }
  };

  // Action : Réactivation (débannissement) d'un compte
  const handleUnsuspend = async (user: AdminUser) => {
    const token = getAuthToken();
    try {
      const res = await fetch(apiUrl(`/admin/users/${user.id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isSuspended: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la réactivation.');

      setUsers(users.map((u) => (u.id === user.id ? { ...u, isSuspended: false, suspendReason: null } : u)));
      showSuccess(`Compte de ${user.name} réactivé avec succès.`);
      fetchMetrics();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur réactivation.');
    }
  };

  // Action : Suppression d'un compte
  const handleDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`Confirmer la suppression définitive du compte de ${user.name} (${user.email}) ?`)) {
      return;
    }
    const token = getAuthToken();
    try {
      const res = await fetch(apiUrl(`/admin/users/${user.id}`), {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur suppression.');

      setUsers(users.filter((u) => u.id !== user.id));
      showSuccess(`Utilisateur ${user.name} supprimé.`);
      fetchMetrics();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur suppression.');
    }
  };

  // Action : Traitement de signalement
  const handleResolveReport = async (reportId: string, actionTaken: 'NONE' | 'DELETE_CONTENT' | 'SUSPEND_USER', status: 'RESOLVED' | 'DISMISSED') => {
    const token = getAuthToken();
    try {
      const res = await fetch(apiUrl(`/admin/reports/${reportId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status,
          actionTaken,
          resolutionNote: actionTaken === 'DELETE_CONTENT' ? 'Contenu supprimé par la modération' : actionTaken === 'SUSPEND_USER' ? 'Auteur sanctionné' : 'Traité',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur modération.');

      setReports(reports.filter((r) => r.id !== reportId));
      showSuccess(status === 'RESOLVED' ? 'Signalement résolu avec application de la mesure.' : 'Signalement classé sans suite.');
      fetchMetrics();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur traitement signalement.');
    }
  };

  const handleApproveClubRequest = async (request: ApiClubRequest) => {
    if (!window.confirm(`Approuver la création du club « ${request.clubName} » ?`)) return;
    try {
      const result = await clubApi.approveClubRequest(request.id, getAuthToken());
      setClubRequests((all) => all.map((item) => item.id === request.id ? result.request : item));
      showSuccess(`Le club ${result.club.name} a été créé et son président notifié.`);
    } catch (err) { showError(err instanceof Error ? err.message : 'Approbation impossible.'); }
  };
  const handleRejectClubRequest = async () => {
    if (!rejectingRequest) return;
    try {
      const updated = await clubApi.rejectClubRequest(rejectingRequest.id, rejectionNote, getAuthToken());
      setClubRequests((all) => all.map((item) => item.id === updated.id ? updated : item));
      setRejectingRequest(null); setRejectionNote(''); showSuccess('La demande a été refusée et le demandeur notifié.');
    } catch (err) { showError(err instanceof Error ? err.message : 'Refus impossible.'); }
  };

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider mb-2">
            {isSuperAdmin ? <Crown className="w-3.5 h-3.5 text-yellow-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-red-400" />}
            {isSuperAdmin ? 'SUPER ADMINISTRATEUR — PLATEFORME' : 'Console d’Administration'}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Panneau de Contrôle & Modération</h2>
          <p className="text-slate-400 text-sm mt-1">
            Gérez les utilisateurs, surveillez les signalements en temps réel et auditez les actions administratives.
          </p>
        </div>

        {/* Contrôles d'onglets */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/10 self-start sm:self-auto">
          {[
            { id: 'DASHBOARD', label: 'Vue d’ensemble', icon: Activity },
            ...(isSuperAdmin ? [{ id: 'SUPERVISION', label: 'Supervision', icon: Gauge }] : []),
            { id: 'USERS', label: 'Utilisateurs & RBAC', icon: Users },
            ...(isSuperAdmin ? [{ id: 'REQUESTS', label: 'Demandes de clubs', icon: Building2, count: clubRequests.filter((request) => request.status === 'PENDING').length }] : []),
            { id: 'REPORTS', label: 'Modération', icon: AlertTriangle, count: metrics?.moderation.pendingReports },
            { id: 'AUDIT', label: 'Journal d’Audit', icon: FileText },
            { id: 'SETTINGS', label: 'Système', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive ? 'bg-[#FF2A3B] text-white shadow-lg shadow-red-500/20' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-white text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications Toast */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. ONGLET VUE D'ENSEMBLE (DASHBOARD) */}
      {/* ========================================================= */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Cartes KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Membres Inscrits</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-3xl font-black text-white">{metrics?.users.total ?? users.length ?? '—'}</p>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-emerald-400 font-bold">{metrics?.users.active ?? 0} actifs</span>
                <span className="text-slate-500">•</span>
                <span className="text-red-400 font-bold">{metrics?.users.suspended ?? 0} suspendus</span>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Signalements en attente</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-3xl font-black text-amber-400">{metrics?.moderation.pendingReports ?? 0}</p>
              <p className="text-[11px] text-slate-400">
                {metrics?.moderation.resolvedReports ?? 0} résolus à ce jour
              </p>
            </div>

            <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Contenus Sociaux</span>
                <MessageSquare className="w-4 h-4 text-[#FFB800]" />
              </div>
              <p className="text-3xl font-black text-white">{metrics?.content.posts ?? 0}</p>
              <p className="text-[11px] text-slate-400">Publications publiées sur le feed</p>
            </div>

            <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Équipes & Tournois</span>
                <Trophy className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-white">
                {(metrics?.content.teams ?? 0) + (metrics?.content.tournaments ?? 0)}
              </p>
              <p className="text-[11px] text-slate-400">
                {metrics?.content.teams ?? 0} équipes • {metrics?.content.tournaments ?? 0} compétitions
              </p>
            </div>
          </div>

          {/* État des services */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" /> Santé de l'Infrastructure & Microservices
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="rounded-2xl bg-white/5 p-4 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">API REST & WebSocket</p>
                  <p className="text-slate-400 text-[11px]">Port 5000 • Express Core</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                  <Zap className="w-3 h-3" /> EN LIGNE
                </span>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Base SQLite / Prisma</p>
                  <p className="text-slate-400 text-[11px]">Persistance locale</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                  <Zap className="w-3 h-3" /> CONNECTÉ
                </span>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">IA Logo & Thèmes</p>
                  <p className="text-slate-400 text-[11px]">Port 8000 • FastAPI Python</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] flex items-center gap-1">
                  <Zap className="w-3 h-3" /> DISPONIBLE
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. ONGLET UTILISATEURS & RÔLES (RBAC) */}
      {/* ========================================================= */}
      {activeTab === 'USERS' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#FFB800]" /> Annuaire & Attribution des Rôles (RBAC)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Attribuez les privilèges administratifs, suspendez les comptes ou révoquez les accès.
              </p>
            </div>

            <button
              onClick={fetchUsers}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Actualiser
            </button>
          </div>

          {/* Filtres et Recherche */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Rechercher par nom ou email..."
                className="w-full rounded-xl border border-white/15 bg-slate-900/90 pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-slate-900/90 px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="ALL">Tous les rôles</option>
                <option value="SUPER_ADMIN">Super Administrateur</option>
                <option value="ADMIN">Administrateur</option>
                <option value="COACH">Entraîneur (Coach)</option>
                <option value="PLAYER">Joueur</option>
                <option value="TREASURER">Trésorier</option>
                <option value="SPONSOR">Sponsor</option>
                <option value="ACADEMY_CANDIDATE">Candidat Académie</option>
                <option value="VISITOR">Visiteur / Supporter</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-slate-900/90 px-3 py-2.5 text-xs text-white focus:outline-none"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIVE">Actifs uniquement</option>
              <option value="SUSPENDED">Suspendus uniquement</option>
            </select>
          </div>

          {/* Tableau des utilisateurs */}
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/10 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">Rôle actuel</th>
                  <th className="px-4 py-3">Statut compte</th>
                  <th className="px-4 py-3">Inscrit le</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      {loading ? 'Chargement des utilisateurs...' : 'Aucun utilisateur ne correspond aux filtres.'}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.name)}`}
                            alt={user.name}
                            className="w-8 h-8 rounded-full border border-white/20 bg-slate-950"
                          />
                          <div>
                            <p className="font-bold text-white flex items-center gap-1.5">
                              {user.name}
                              {user.role === 'SUPER_ADMIN' && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          disabled={user.role === 'SUPER_ADMIN' && !isSuperAdmin}
                          className="bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer disabled:opacity-50"
                        >
                          {isSuperAdmin && <option value="SUPER_ADMIN">SUPER_ADMIN</option>}
                          <option value="ADMIN">ADMIN</option>
                          <option value="COACH">COACH</option>
                          <option value="PLAYER">PLAYER</option>
                          <option value="TREASURER">TREASURER</option>
                          <option value="SPONSOR">SPONSOR</option>
                          <option value="ACADEMY_CANDIDATE">ACADEMY_CANDIDATE</option>
                          <option value="VISITOR">VISITOR</option>
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        {user.isSuspended ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 text-[10px] font-bold">
                            <UserX className="w-3 h-3" />
                            <span>Suspendu</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                            <UserCheck className="w-3 h-3" />
                            <span>Actif</span>
                          </div>
                        )}
                        {user.suspendReason && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[150px] mt-0.5" title={user.suspendReason}>
                            {user.suspendReason}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {user.isSuspended ? (
                            <button
                              onClick={() => handleUnsuspend(user)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                              title="Réactiver le compte"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setSuspendingUser(user)}
                              disabled={user.role === 'SUPER_ADMIN'}
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors disabled:opacity-30"
                              title="Suspendre le compte"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.role === 'SUPER_ADMIN' && !isSuperAdmin}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-30"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'REQUESTS' && isSuperAdmin && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between"><div><h3 className="text-lg font-black text-white flex items-center gap-2"><Building2 className="w-5 h-5 text-amber-400" /> Demandes de création de clubs</h3><p className="text-xs text-slate-400 mt-1">Validez les clubs avant leur création effective.</p></div><button onClick={fetchClubRequests} className="text-xs text-slate-300 hover:text-white">Actualiser</button></div>
          <div className="overflow-x-auto rounded-2xl border border-white/10"><table className="w-full text-left text-xs"><thead className="bg-white/10 text-slate-400 uppercase"><tr><th className="p-3">Club</th><th className="p-3">Demandeur</th><th className="p-3">Date</th><th className="p-3">Statut</th><th className="p-3">Actions</th></tr></thead><tbody className="divide-y divide-white/5">{clubRequests.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-500">Aucune demande.</td></tr> : clubRequests.map((request) => <tr key={request.id}><td className="p-3"><p className="font-bold text-white">{request.clubName}</p><p className="text-slate-500">{request.city}, {request.country}</p></td><td className="p-3 text-slate-300">{request.requester?.name || '—'}<span className="block text-slate-500">{request.requester?.email}</span></td><td className="p-3 text-slate-400">{new Date(request.createdAt).toLocaleDateString('fr-FR')}</td><td className="p-3"><span className={`px-2 py-1 rounded-full font-bold ${request.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300' : request.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>{request.status}</span>{request.adminNote && <span className="block mt-1 text-slate-500 max-w-48 truncate" title={request.adminNote}>{request.adminNote}</span>}</td><td className="p-3">{request.status === 'PENDING' && <div className="flex gap-2"><button onClick={() => handleApproveClubRequest(request)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold">Approuver</button><button onClick={() => { setRejectingRequest(request); setRejectionNote(''); }} className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold">Rejeter</button></div>}</td></tr>)}</tbody></table></div>
        </div>
      )}

      {activeTab === 'SUPERVISION' && isSuperAdmin && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-slate-950 to-violet-500/10 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><div className="inline-flex items-center gap-2 text-cyan-300 text-xs font-black uppercase tracking-widest"><Radio className="w-4 h-4 animate-pulse" /> Centre de supervision</div><h3 className="mt-2 text-2xl sm:text-3xl font-black text-white">Vision complète de la plateforme</h3><p className="mt-1 text-sm text-slate-400">État opérationnel, signalements, gouvernance des clubs et dernières actions.</p></div><button onClick={fetchSupervision} className="inline-flex items-center gap-2 self-start px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white"><RotateCcw className="w-4 h-4" /> Actualiser</button></div>
            <p className="mt-5 text-[11px] text-slate-500">Dernière synchronisation : {supervision ? new Date(supervision.generatedAt).toLocaleString('fr-FR') : 'chargement…'}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Utilisateurs', value: supervision?.inventory.users, icon: Users, color: 'text-cyan-300' },
              { label: 'Clubs approuvés', value: supervision?.inventory.clubs, icon: Building2, color: 'text-amber-300' },
              { label: 'Contenus publiés', value: supervision?.inventory.posts, icon: MessageSquare, color: 'text-violet-300' },
              { label: 'Matchs & tournois', value: (supervision?.inventory.matches ?? 0) + (supervision?.inventory.tournaments ?? 0), icon: Trophy, color: 'text-emerald-300' },
            ].map((item) => { const Icon = item.icon; return <div key={item.label} className="glass-panel rounded-2xl border border-white/10 p-5"><Icon className={`w-5 h-5 ${item.color}`} /><p className="mt-3 text-3xl font-black text-white">{supervision ? item.value : '—'}</p><p className="mt-1 text-xs text-slate-400">{item.label}</p></div>; })}
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="glass-panel rounded-3xl border border-white/10 p-6 lg:col-span-1 space-y-4"><h4 className="font-black text-white flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-amber-400" /> À traiter</h4><button onClick={() => setActiveTab('REQUESTS')} className="w-full flex justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left"><span className="text-xs font-bold text-amber-100">Demandes de clubs</span><strong className="text-2xl text-amber-300">{supervision?.attention.requestsPending ?? '—'}</strong></button><button onClick={() => setActiveTab('REPORTS')} className="w-full flex justify-between p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-left"><span className="text-xs font-bold text-red-100">Signalements ouverts</span><strong className="text-2xl text-red-300">{supervision?.attention.reportsPending ?? '—'}</strong></button></div>
            <div className="glass-panel rounded-3xl border border-white/10 p-6 lg:col-span-2 space-y-4"><h4 className="font-black text-white flex items-center gap-2"><Activity className="w-5 h-5 text-cyan-400" /> Santé des services</h4><div className="grid sm:grid-cols-3 gap-3"><ServiceStatus label="API & base de données" value={supervision?.database === 'ONLINE' ? 'OPÉRATIONNEL' : supervision ? 'INDISPONIBLE' : '…'} ok={supervision?.database === 'ONLINE'} icon={<Database className="w-4 h-4" />} /><ServiceStatus label="Mémoire serveur" value={supervision ? `${supervision.system.memoryMb} MB` : '…'} ok icon={<Server className="w-4 h-4" />} /><ServiceStatus label="Disponibilité API" value={supervision ? formatUptime(supervision.system.uptimeSeconds) : '…'} ok icon={<Zap className="w-4 h-4" />} /></div><p className="text-xs text-slate-500">Environnement : <span className="text-slate-300 font-bold">{supervision?.system.environment || '—'}</span></p></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5"><div className="glass-panel rounded-3xl border border-white/10 p-6"><h4 className="font-black text-white flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-violet-300" /> Activité administrative récente</h4><div className="space-y-3">{supervision?.auditLogs.length ? supervision.auditLogs.map((log) => <div key={log.id} className="border-l-2 border-violet-400/50 pl-3"><p className="text-xs font-bold text-white">{log.action} <span className="text-slate-500">· {log.targetType}</span></p><p className="text-[11px] text-slate-400">{log.user?.name || 'Système'} · {new Date(log.createdAt).toLocaleString('fr-FR')}</p></div>) : <p className="text-sm text-slate-500">Aucune activité administrative récente.</p>}</div></div><div className="glass-panel rounded-3xl border border-white/10 p-6"><h4 className="font-black text-white flex items-center gap-2 mb-4"><UserRoundPlus className="w-5 h-5 text-emerald-300" /> Dernières inscriptions</h4><div className="space-y-3">{supervision?.recentUsers.length ? supervision.recentUsers.map((user) => <div key={user.id} className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-white">{user.name} {user.isSuspended && <span className="text-red-300">(suspendu)</span>}</p><p className="text-[11px] text-slate-500">{user.email} · {user.role}</p></div><span className="text-[10px] text-slate-500">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</span></div>) : <p className="text-sm text-slate-500">Aucune inscription récente.</p>}</div></div></div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. ONGLET CENTRE DE MODÉRATION (SIGNALEMENTS) */}
      {/* ========================================================= */}
      {activeTab === 'REPORTS' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" /> Traitement des Signalements Communautaires
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Examinez les signalements émis par les utilisateurs et prenez les mesures disciplinaires adaptées.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {['PENDING', 'RESOLVED', 'DISMISSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setReportStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    reportStatusFilter === st
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'PENDING' ? 'En attente' : st === 'RESOLVED' ? 'Résolus' : 'Classés'}
                </button>
              ))}
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center text-slate-400 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">Aucun signalement {reportStatusFilter === 'PENDING' ? 'en attente' : ''}</p>
              <p className="text-xs">La communauté respecte la charte éthique FIRE STONE.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((rep) => (
                <div key={rep.id} className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4 shadow-lg flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-500/20 text-red-300 border border-red-500/30">
                        {rep.reason}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(rep.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="text-slate-400">
                        Signalé par : <strong className="text-white">{rep.reporter?.name || 'Utilisateur'}</strong>
                      </p>
                      {rep.reportedUser && (
                        <p className="text-slate-400">
                          Auteur ciblé : <strong className="text-red-400">{rep.reportedUser.name}</strong>
                        </p>
                      )}
                      {rep.details && (
                        <p className="text-slate-300 italic text-[11px] bg-white/5 p-2 rounded-lg border border-white/5">
                          « {rep.details} »
                        </p>
                      )}
                    </div>

                    {/* Aperçu du contenu signalé */}
                    {rep.post && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-xs space-y-1">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase block">Publication ciblée :</span>
                        <p className="text-slate-200 line-clamp-3">{rep.post.content}</p>
                      </div>
                    )}
                    {rep.comment && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-xs space-y-1">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase block">Commentaire ciblé :</span>
                        <p className="text-slate-200 line-clamp-3">{rep.comment.content}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions modérateur */}
                  {rep.status === 'PENDING' && (
                    <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleResolveReport(rep.id, 'DELETE_CONTENT', 'RESOLVED')}
                        type="button"
                        className="flex-1 px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-all shadow"
                      >
                        Supprimer contenu
                      </button>

                      <button
                        onClick={() => handleResolveReport(rep.id, 'SUSPEND_USER', 'RESOLVED')}
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow"
                      >
                        Suspendre auteur
                      </button>

                      <button
                        onClick={() => handleResolveReport(rep.id, 'NONE', 'DISMISSED')}
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition-all"
                      >
                        Classer
                      </button>
                    </div>
                  )}

                  {rep.status !== 'PENDING' && (
                    <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400">
                      Traité par <strong className="text-white">{rep.resolvedBy || 'Modérateur'}</strong> ({rep.status})
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. ONGLET JOURNAL D'AUDIT DE SÉCURITÉ */}
      {/* ========================================================= */}
      {activeTab === 'AUDIT' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" /> Traçabilité des Actions d'Administration
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Chaque action de modération, élévation de privilège ou suppression est consignée de façon immuable.
              </p>
            </div>

            <button
              onClick={fetchAuditLogs}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Actualiser
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/10 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Horodatage</th>
                  <th className="px-4 py-3">Administrateur</th>
                  <th className="px-4 py-3">Action exécutée</th>
                  <th className="px-4 py-3">Cible</th>
                  <th className="px-4 py-3">Détails de l'opération</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Aucune action enregistrée pour le moment.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(log.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 font-bold text-white">
                        {log.user?.name || log.userId}
                        <span className="block text-[10px] text-slate-400">{log.user?.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action.includes('SUSPEND')
                            ? 'bg-amber-500/20 text-amber-300'
                            : log.action.includes('DELETE')
                            ? 'bg-red-500/20 text-red-300'
                            : log.action.includes('ROLE')
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-white/10 text-slate-200'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {log.targetType} {log.targetId ? `(${log.targetId.slice(0, 8)})` : ''}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-sans text-xs max-w-xs truncate" title={log.details || ''}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. ONGLET PARAMÈTRES SYSTÈME */}
      {/* ========================================================= */}
      {activeTab === 'SETTINGS' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 max-w-2xl animate-fadeIn">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#FF2A3B]" /> Configuration de la Plateforme & Sécurité
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Nom Officiel du Club / Plateforme</label>
              <input type="text" defaultValue="FIRE STONE Basketball Club (Togo)" className="w-full px-4 py-2.5 rounded-xl glass-input" />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Ville du Siège</label>
              <input type="text" defaultValue="Lomé, Togo" className="w-full px-4 py-2.5 rounded-xl glass-input" />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Mode Maintenance</label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <input type="checkbox" id="maintenance-mode" className="w-4 h-4 cursor-pointer" />
                <label htmlFor="maintenance-mode" className="cursor-pointer text-slate-300">
                  Activer le mode maintenance (seuls les administrateurs peuvent naviguer)
                </label>
              </div>
            </div>

            <button
              onClick={() => showSuccess('Configuration et paramètres système enregistrés.')}
              type="button"
              className="px-6 py-2.5 rounded-xl bg-[#FF2A3B] hover:bg-red-600 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
            >
              <Check className="w-4 h-4" /> Enregistrer les paramètres
            </button>
          </div>
        </div>
      )}

      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-white/20 p-6 space-y-4">
            <div className="flex justify-between items-center"><h4 className="font-black text-white">Refuser « {rejectingRequest.clubName} »</h4><button onClick={() => setRejectingRequest(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <label className="block text-xs font-bold text-slate-300">Note de refus<textarea value={rejectionNote} onChange={(event) => setRejectionNote(event.target.value)} className="mt-2 w-full min-h-28 glass-input rounded-xl p-3" placeholder="Indiquez ce qui doit être corrigé…" /></label>
            <div className="flex justify-end gap-2"><button onClick={() => setRejectingRequest(null)} className="px-4 py-2 text-sm text-slate-300">Annuler</button><button disabled={!rejectionNote.trim()} onClick={handleRejectClubRequest} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-50">Confirmer le refus</button></div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE SUSPENSION D'UN COMPTE */}
      {/* ========================================================= */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-white/20 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <UserX className="w-5 h-5 text-amber-400" /> Suspendre {suspendingUser.name}
              </h4>
              <button
                onClick={() => setSuspendingUser(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              L'utilisateur ne pourra plus se connecter ni publier pendant la durée de la suspension.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Motif de la suspension</label>
                <input
                  type="text"
                  value={suspendReasonInput}
                  onChange={(e) => setSuspendReasonInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Durée de la sanction</label>
                <select
                  value={suspendDurationDays}
                  onChange={(e) => setSuspendDurationDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value={1}>1 jour (Avertissement)</option>
                  <option value={3}>3 jours</option>
                  <option value={7}>7 jours (1 semaine)</option>
                  <option value={30}>30 jours (1 mois)</option>
                  <option value={365}>1 an (Suspension prolongée)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                onClick={() => setSuspendingUser(null)}
                type="button"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmSuspend}
                type="button"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-lg shadow-amber-500/20"
              >
                Confirmer la suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ServiceStatus = ({ label, value, ok, icon }: { label: string; value: string; ok: boolean; icon: React.ReactNode }) => (
  <div className="rounded-2xl bg-white/5 border border-white/10 p-4"><div className="flex items-center justify-between text-slate-400">{icon}<span className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} /></div><p className="mt-3 text-xs font-bold text-white">{label}</p><p className={`mt-1 text-[11px] font-bold ${ok ? 'text-emerald-300' : 'text-red-300'}`}>{value}</p></div>
);

const formatUptime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours} h ${minutes} min`;
};
