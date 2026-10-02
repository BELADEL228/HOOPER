import React, { useEffect, useState, useMemo } from 'react';
import type { UserRole } from '../../types';
import {
  Trophy,
  CalendarDays,
  Plus,
  Search,
  Users,
  MapPin,
  Sparkles,
  ChevronRight,
  Flame,
  CheckCircle2,
  AlertCircle,
  X,
  Award,
  Layers,
  BarChart3,
  GitBranch,
  Shield,
  Medal,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { apiUrl } from '../../services/api';
import { useClub } from '../../context/ClubContext';

interface TournamentTeam {
  team: { id: string; name: string; city?: string; logoUrl?: string | null };
}

interface Standing {
  team: { id?: string; name: string };
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

interface Tournament {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  location: string;
  format: string;
  maxTeams: number;
  status: string;
  teams: TournamentTeam[];
  standings: Standing[];
}

export function TournamentsPage({ currentRole }: { currentRole: UserRole }) {
  const { activeClub } = useClub();
  const clubName = activeClub?.name || 'HOOPER Franchise';

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'FINISHED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'CARDS' | 'BRACKET' | 'STANDINGS'>('CARDS');

  // Modal Création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    startDate: '',
    endDate: '',
    location: activeClub?.arena || 'Palais des Sports de Lomé',
    format: 'Élimination Directe',
    maxTeams: 8,
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Modal Détails d'un tournoi
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  // Message alert
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canManage = ['SUPER_ADMIN', 'CLUB_ADMIN', 'COACH'].includes(currentRole);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl('/tournaments'));
      if (response.ok) {
        const data = await response.json();
        setTournaments(Array.isArray(data) ? data : []);
      }
    } catch {
      setMessage({ type: 'error', text: 'Impossible de charger la liste des tournois.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTournaments();
  }, []);

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) {
      setMessage({ type: 'error', text: 'Veuillez vous connecter avec un compte administrateur.' });
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(apiUrl('/tournaments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage({ type: 'error', text: data?.error || 'Échec de la création du tournoi.' });
      } else {
        setMessage({ type: 'success', text: `Tournoi « ${form.name} » créé avec succès !` });
        setShowCreateModal(false);
        setForm({
          name: '',
          slug: '',
          startDate: '',
          endDate: '',
          location: activeClub?.arena || 'Palais des Sports de Lomé',
          format: 'Élimination Directe',
          maxTeams: 8,
          description: '',
        });
        await loadTournaments();
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau lors de la création du tournoi.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      const matchesSearch =
        searchQuery === '' ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location.toLowerCase().includes(searchQuery.toLowerCase());

      const now = new Date().toISOString().split('T')[0];
      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchesStatus = t.status === 'ACTIVE' || (t.startDate <= now && t.endDate >= now);
      } else if (statusFilter === 'UPCOMING') {
        matchesStatus = t.startDate > now;
      } else if (statusFilter === 'FINISHED') {
        matchesStatus = t.endDate < now || t.status === 'FINISHED';
      }
      return matchesSearch && matchesStatus;
    });
  }, [tournaments, searchQuery, statusFilter]);

  const bracketTournament = selectedTournament || filteredTournaments[0] || tournaments[0];

  return (
    <div className="space-y-8 pb-20">
      {/* Messages Alert */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border text-xs font-bold backdrop-blur-xl animate-fade-in ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-200'
              : 'border-red-500/30 bg-red-950/90 text-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto text-slate-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner - Championship Hub */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#121626] via-[#0D101C] to-[#07090F] p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/15 via-red-600/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Compétitions & Championnats
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px] font-semibold">
                Saison Officielle 2026-2027
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Tournois, Brackets & Phases Finales
            </h1>

            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Arbres éliminatoires officiels, confrontations directes, classements de saison régulière
              et homologation des trophées régionaux et nationaux.
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#FF2A3B] hover:bg-[#e6001f] px-5 py-3.5 text-xs font-black text-white transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Organiser un Tournoi
            </button>
          )}
        </div>

        {/* Tactical Metric Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Éditions Officielles</span>
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white">{tournaments.length}</p>
            <p className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
              Homologués LNB
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Clubs Participants</span>
              <Users className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <p className="text-2xl font-black text-white">
              {tournaments.reduce((acc, t) => acc + (t.teams?.length || 0), 0)}
            </p>
            <p className="text-[11px] text-slate-400">Franchises en lice</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Arènes & Villes</span>
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white">Lomé & Kara</p>
            <p className="text-[11px] text-slate-400">Pôles sportifs 2026</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Titre Suprême</span>
              <Award className="w-3.5 h-3.5 text-[#FF2A3B]" />
            </div>
            <p className="text-2xl font-black text-white">Coupe du Togo</p>
            <p className="text-[11px] text-slate-400">Finales en direct</p>
          </div>
        </div>
      </div>

      {/* Navigation Command Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-2 rounded-2xl bg-[#0F131F] border border-white/10">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5">
          <button
            onClick={() => setActiveTab('CARDS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'CARDS'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Tournois ({tournaments.length})
          </button>

          <button
            onClick={() => setActiveTab('BRACKET')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'BRACKET'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" /> Arbre Éliminatoire
          </button>

          <button
            onClick={() => setActiveTab('STANDINGS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'STANDINGS'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Standings Généraux
          </button>
        </div>

        {/* Status Filter & Search */}
        <div className="flex flex-wrap items-center gap-2.5 px-2">
          <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10 text-xs">
            {(['ALL', 'ACTIVE', 'UPCOMING', 'FINISHED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === st ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'ALL'
                  ? 'Tous'
                  : st === 'ACTIVE'
                  ? 'En cours'
                  : st === 'UPCOMING'
                  ? 'À venir'
                  : 'Terminés'}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher tournoi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl w-44 bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* ── TAB 1 : VUE CARTES DE TOURNOIS ── */}
      {activeTab === 'CARDS' && (
        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-white/10 bg-[#0F131F] p-6 animate-pulse space-y-4"
                >
                  <div className="h-6 bg-white/10 rounded w-1/3" />
                  <div className="h-4 bg-white/10 rounded w-2/3" />
                  <div className="h-20 bg-white/5 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#0F131F] p-12 text-center space-y-3">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Aucun tournoi correspondant</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Modifiez vos critères de recherche ou planifiez une nouvelle compétition.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredTournaments.map((tournament) => {
                const teamsCount = tournament.teams?.length || 0;
                const fillPercent = Math.min(100, Math.round((teamsCount / tournament.maxTeams) * 100));

                return (
                  <article
                    key={tournament.id}
                    className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#131826] to-[#0A0D14] p-6 space-y-5 flex flex-col justify-between hover:border-amber-500/30 transition-all group shadow-xl"
                  >
                    <div className="space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                            🏆
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">
                              {tournament.name}
                            </h3>
                            <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
                              {tournament.format || 'Élimination Directe'}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                            tournament.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : tournament.status === 'FINISHED'
                              ? 'bg-slate-500/20 text-slate-300'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {tournament.status === 'ACTIVE'
                            ? 'En cours'
                            : tournament.status === 'FINISHED'
                            ? 'Terminé'
                            : 'À venir'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {tournament.description ||
                          'Tournoi de basketball officiel réunissant les meilleures franchises de la région pour le titre suprême.'}
                      </p>

                      {/* Info Chips */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-300">
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-amber-400 shrink-0" />
                          <div className="truncate text-[11px]">
                            {new Date(tournament.startDate).toLocaleDateString('fr-FR')} -{' '}
                            {new Date(tournament.endDate).toLocaleDateString('fr-FR')}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                          <div className="truncate text-[11px]">{tournament.location}</div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2 col-span-2 sm:col-span-1">
                          <Users className="w-4 h-4 text-sky-400 shrink-0" />
                          <div className="truncate text-[11px]">
                            {teamsCount} / {tournament.maxTeams} Franchises ({fillPercent}%)
                          </div>
                        </div>
                      </div>

                      {/* Mini Standings Preview */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                          <span className="uppercase tracking-wider">Top Franchises</span>
                          <span className="text-[10px] text-slate-500">V - D</span>
                        </div>

                        {tournament.standings && tournament.standings.length > 0 ? (
                          <div className="space-y-1.5">
                            {tournament.standings.slice(0, 3).map((std, idx) => (
                              <div
                                key={std.team.name}
                                className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 text-xs"
                              >
                                <span className="flex items-center gap-2 font-bold text-white">
                                  <span className="w-5 text-center text-slate-500 text-[10px]">
                                    #{idx + 1}
                                  </span>
                                  {std.team.name}
                                </span>
                                <span className="font-bold text-emerald-400 font-mono">
                                  {std.wins}V - {std.losses}D
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-black/30 text-center text-xs text-slate-500 border border-white/5">
                            Tableau de compétition en cours de configuration.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                      <button
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setActiveTab('BRACKET');
                        }}
                        className="text-xs font-black text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                      >
                        Consulter l'arbre <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setSelectedTournament(tournament)}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Fiche complète
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2 : VUE BRACKET (ARBRE DES PHASES FINALES) ── */}
      {activeTab === 'BRACKET' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#0F131F] p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" /> Arbre Éliminatoire & Playoffs
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  {bracketTournament?.name || 'Grand Tournoi des Champions'}
                </h3>
                <p className="text-xs text-slate-400">
                  {bracketTournament?.location || 'Lomé'} • Format : {bracketTournament?.format || 'Élimination Directe'}
                </p>
              </div>

              {tournaments.length > 1 && (
                <select
                  value={bracketTournament?.id || ''}
                  onChange={(e) => {
                    const match = tournaments.find((t) => t.id === e.target.value);
                    if (match) setSelectedTournament(match);
                  }}
                  className="rounded-xl p-2.5 text-xs bg-black/60 text-white border border-white/10 focus:outline-none focus:border-amber-400"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id} className="bg-slate-900">
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Visualisation Bracket */}
            <div className="overflow-x-auto py-4">
              <div className="min-w-[800px] grid grid-cols-3 gap-8 items-center">
                {/* Demi-Finales */}
                <div className="space-y-6">
                  <div className="text-center font-black text-xs text-slate-400 uppercase tracking-widest mb-2">
                    Demi-Finales
                  </div>

                  {/* Match 1 */}
                  <div className="p-4 rounded-2xl border border-white/10 bg-gradient-to-b from-[#141926] to-[#0A0D14] space-y-2.5 relative shadow-lg">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-white flex items-center gap-2">
                        <span>🏀</span> {clubName}
                      </span>
                      <span className="font-black text-emerald-400 font-mono text-sm">88</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-white/10 pt-2">
                      <span className="font-bold text-slate-400 flex items-center gap-2">
                        <span>⚡</span> Black Stars Cotonou
                      </span>
                      <span className="font-mono text-slate-400 text-sm">76</span>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-black uppercase text-right pt-1">
                      {clubName} qualifié ✓
                    </div>
                  </div>

                  {/* Match 2 */}
                  <div className="p-4 rounded-2xl border border-white/10 bg-gradient-to-b from-[#141926] to-[#0A0D14] space-y-2.5 relative shadow-lg">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-white flex items-center gap-2">
                        <span>🛡️</span> Titans Accra
                      </span>
                      <span className="font-black text-emerald-400 font-mono text-sm">82</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-white/10 pt-2">
                      <span className="font-bold text-slate-400 flex items-center gap-2">
                        <span>⭐</span> Cobras Dakar
                      </span>
                      <span className="font-mono text-slate-400 text-sm">80</span>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-black uppercase text-right pt-1">
                      Titans qualifiés ✓
                    </div>
                  </div>
                </div>

                {/* Grande Finale */}
                <div className="space-y-6">
                  <div className="text-center font-black text-xs text-amber-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" /> Grande Finale
                  </div>

                  <div className="p-6 rounded-3xl border-2 border-amber-500/50 space-y-4 shadow-2xl shadow-amber-500/10 relative bg-gradient-to-b from-amber-500/10 via-[#0F131F] to-[#07090F]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-white flex items-center gap-2 text-sm">
                        <span>🏀</span> {clubName}
                      </span>
                      <span className="font-black text-2xl text-amber-400 font-mono">94</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-white/10 pt-3">
                      <span className="font-black text-slate-300 flex items-center gap-2 text-sm">
                        <span>🛡️</span> Titans Accra
                      </span>
                      <span className="font-black text-xl text-slate-400 font-mono">91</span>
                    </div>
                    <div className="text-center text-xs font-black text-amber-400 pt-2 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                      <Award className="w-4 h-4" /> CHAMPION : {clubName} !
                    </div>
                  </div>
                </div>

                {/* Podium & Vainqueur */}
                <div className="p-6 rounded-3xl border border-white/10 bg-gradient-to-b from-[#141926] to-[#0A0D14] text-center space-y-4 shadow-xl">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-red-600 mx-auto flex items-center justify-center text-3xl shadow-xl shadow-amber-500/20">
                    🥇
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      Vainqueur Officiel 2026
                    </span>
                    <h4 className="text-xl font-black text-white mt-1">{clubName}</h4>
                    <p className="text-xs text-slate-400 mt-1">Trophée d'or & Qualification Africaine</p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex justify-around text-xs">
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">2ème Place</div>
                      <div className="font-bold text-white">Titans Accra</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">3ème Place</div>
                      <div className="font-bold text-white">Cobras Dakar</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3 : STANDINGS COMPLETS ── */}
      {activeTab === 'STANDINGS' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#0F131F] p-6 sm:p-7 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white">Classements Généraux des Équipes</h3>
                <p className="text-xs text-slate-400">
                  Scores, victoires, différentiels et critères d'accession aux playoffs.
                </p>
              </div>

              {tournaments.length > 0 && (
                <select
                  value={bracketTournament?.id || ''}
                  onChange={(e) => {
                    const match = tournaments.find((t) => t.id === e.target.value);
                    if (match) setSelectedTournament(match);
                  }}
                  className="rounded-xl p-2.5 text-xs bg-black/60 text-white border border-white/10 focus:outline-none focus:border-amber-400"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id} className="bg-slate-900">
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141926] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10 font-black">
                  <tr>
                    <th className="p-3.5">Pos</th>
                    <th className="p-3.5">Franchise</th>
                    <th className="p-3.5 text-center">J</th>
                    <th className="p-3.5 text-center">V</th>
                    <th className="p-3.5 text-center">D</th>
                    <th className="p-3.5 text-right">Points +</th>
                    <th className="p-3.5 text-right">Points -</th>
                    <th className="p-3.5 text-right">Diff</th>
                    <th className="p-3.5 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#0C101A]">
                  {bracketTournament?.standings && bracketTournament.standings.length > 0 ? (
                    bracketTournament.standings.map((st, i) => {
                      const diff = st.pointsFor - st.pointsAgainst;
                      return (
                        <tr key={st.team.name} className="hover:bg-white/[0.03] transition-colors">
                          <td className="p-3.5 font-mono font-bold text-amber-400">#{i + 1}</td>
                          <td className="p-3.5 font-black text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs">
                              🏀
                            </span>
                            {st.team.name}
                          </td>
                          <td className="p-3.5 text-center text-slate-300 font-mono">{st.played}</td>
                          <td className="p-3.5 text-center font-black text-emerald-400 font-mono">{st.wins}</td>
                          <td className="p-3.5 text-center font-black text-red-400 font-mono">{st.losses}</td>
                          <td className="p-3.5 text-right text-slate-300 font-mono">{st.pointsFor}</td>
                          <td className="p-3.5 text-right text-slate-300 font-mono">{st.pointsAgainst}</td>
                          <td
                            className={`p-3.5 text-right font-black font-mono ${
                              diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-400'
                            }`}
                          >
                            {diff > 0 ? `+${diff}` : diff}
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                i < 2
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-500/20 text-slate-400'
                              }`}
                            >
                              {i < 2 ? 'Qualifié' : 'En ballotage'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        Aucun match archivé pour ce tournoi pour l'instant.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : CRÉER UN TOURNOI */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl rounded-3xl border border-white/20 p-6 sm:p-8 space-y-6 bg-[#0F131F] text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-red-600/20 text-red-400">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Nouveau Tournoi</h3>
                  <p className="text-xs text-slate-400">Organisez une compétition et gérez les inscriptions.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Nom du tournoi *</label>
                  <input
                    required
                    placeholder="Ex : Coupe de l'Indépendance"
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)+/g, '');
                      setForm({ ...form, name, slug });
                    }}
                    className="w-full rounded-xl p-2.5 text-xs bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Identifiant (Slug) *</label>
                  <input
                    required
                    placeholder="coupe-independance"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full rounded-xl p-2.5 text-xs bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Date d'ouverture *</label>
                  <input
                    required
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full rounded-xl p-2.5 text-xs bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Date de clôture *</label>
                  <input
                    required
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full rounded-xl p-2.5 text-xs bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Lieu / Arène *</label>
                  <input
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full rounded-xl p-2.5 text-xs bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Format *</label>
                  <select
                    value={form.format}
                    onChange={(e) => setForm({ ...form, format: e.target.value })}
                    className="w-full rounded-xl p-2.5 text-xs bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Élimination Directe" className="bg-slate-900">Élimination Directe</option>
                    <option value="Poules + Élimination" className="bg-slate-900">Poules + Élimination</option>
                    <option value="Championnat Aller/Retour" className="bg-slate-900">Championnat Aller/Retour</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 mb-1">
                    Quota maximal de clubs ({form.maxTeams})
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="32"
                    step="2"
                    value={form.maxTeams}
                    onChange={(e) => setForm({ ...form, maxTeams: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 mb-1">
                    Règlements & Récompenses
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Précisez les dotations (trophée, primes), règles FIBA..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full rounded-xl p-2.5 text-xs bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/15 text-slate-300 text-xs font-bold hover:bg-white/10 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white text-xs font-black uppercase tracking-wider shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Création en cours...' : 'Publier le tournoi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : DÉTAILS D'UN TOURNOI */}
      {selectedTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/20 p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto bg-[#0F131F] text-slate-100 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                  {selectedTournament.format}
                </span>
                <h3 className="text-2xl font-black text-white mt-2">{selectedTournament.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedTournament.description}</p>
              </div>
              <button
                onClick={() => setSelectedTournament(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Arène</span>
                <strong className="text-white">{selectedTournament.location}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Calendrier</span>
                <strong className="text-white">
                  {new Date(selectedTournament.startDate).toLocaleDateString('fr-FR')} -{' '}
                  {new Date(selectedTournament.endDate).toLocaleDateString('fr-FR')}
                </strong>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 col-span-2 sm:col-span-1">
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Inscriptions</span>
                <strong className="text-emerald-400">
                  {selectedTournament.teams?.length || 0} / {selectedTournament.maxTeams} Équipes
                </strong>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-sky-400" /> Franchises engagées
              </h4>
              {selectedTournament.teams && selectedTournament.teams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedTournament.teams.map((t, i) => (
                    <div
                      key={t.team.id || i}
                      className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3"
                    >
                      <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-sm">
                        🏀
                      </span>
                      <div>
                        <div className="text-xs font-black text-white">{t.team.name}</div>
                        <div className="text-[10px] text-slate-400">{t.team.city || 'Togo'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-black/30 border border-white/5 text-center text-xs text-slate-400">
                  Inscriptions ouvertes aux clubs affiliés de la ligue.
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('BRACKET');
                  setSelectedTournament(null);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white text-xs font-black uppercase tracking-wider hover:opacity-95 transition-all cursor-pointer"
              >
                Explorer l'arbre des matchs
              </button>
              <button
                type="button"
                onClick={() => setSelectedTournament(null)}
                className="px-6 py-3 rounded-xl border border-white/15 text-white text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
