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
} from 'lucide-react';
import { apiUrl } from '../../services/api';

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
    location: 'Palais des Sports de Lomé',
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
          location: 'Palais des Sports de Lomé',
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

  // Filtrage
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

  // Tournoi sélectionné pour l'arbre des phases finales
  const bracketTournament = selectedTournament || filteredTournaments[0] || tournaments[0];

  return (
    <div className="space-y-8 pb-12">
      {/* ── En-tête Principal ── */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFB800]/30 bg-[#FFB800]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FFB800]">
            <Trophy className="w-3.5 h-3.5" /> Compétitions & Championnats
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight">
            Tournois & Phases Finales
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            Suivez le calendrier des grands tournois, les tableaux éliminatoires et les classements officiels des franchises.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] px-5 py-3 text-xs font-black text-white hover:brightness-110 transition-all shadow-lg shadow-[#FF2A3B]/20 shrink-0"
          >
            <Plus className="w-4 h-4" /> Organiser un Tournoi
          </button>
        )}
      </header>

      {/* ── Métriques Rapides ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{tournaments.length}</div>
            <div className="text-[11px] text-slate-400">Éditions officielles</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">
              {tournaments.reduce((acc, t) => acc + (t.teams?.length || 0), 0)}
            </div>
            <div className="text-[11px] text-slate-400">Équipes inscrites</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 flex items-center justify-center text-[#38BDF8]">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">Ligue Togo</div>
            <div className="text-[11px] text-slate-400">Zone Lomé & Maritime</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">Playoffs 2026</div>
            <div className="text-[11px] text-slate-400">Trophée National</div>
          </div>
        </div>
      </div>

      {/* ── Messages Alert ── */}
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

      {/* ── Onglets & Filtres ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        {/* Navigation Onglets */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('CARDS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'CARDS'
                ? 'bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" /> Tournois ({tournaments.length})
          </button>

          <button
            onClick={() => setActiveTab('BRACKET')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'BRACKET'
                ? 'bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <GitBranch className="w-4 h-4" /> Tableau Éliminatoire
          </button>

          <button
            onClick={() => setActiveTab('STANDINGS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'STANDINGS'
                ? 'bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Standings Généraux
          </button>
        </div>

        {/* Status Filter & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            {(['ALL', 'ACTIVE', 'UPCOMING', 'FINISHED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
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
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-8 pr-3 py-1.5 text-xs rounded-xl w-44"
            />
          </div>
        </div>
      </div>

      {/* ── CONTENU DES ONGLETS ── */}

      {/* 1. VUE CARTES */}
      {activeTab === 'CARDS' && (
        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="glass-panel p-6 rounded-3xl border border-white/10 animate-pulse space-y-4"
                >
                  <div className="h-6 bg-white/10 rounded w-1/3" />
                  <div className="h-4 bg-white/10 rounded w-2/3" />
                  <div className="h-20 bg-white/5 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="glass-panel rounded-3xl border border-white/10 p-12 text-center space-y-3">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Aucun tournoi correspondant</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Modifiez vos filtres ou organisez une nouvelle compétition.
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
                    className="glass-panel rounded-3xl border border-white/10 p-6 space-y-5 flex flex-col justify-between hover:border-white/20 transition-all group"
                  >
                    <div className="space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFB800]/20 to-[#FF2A3B]/20 border border-[#FFB800]/30 flex items-center justify-center text-2xl shadow-md">
                            🏆
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white group-hover:text-[#FFB800] transition-colors">
                              {tournament.name}
                            </h3>
                            <span className="text-[11px] font-bold text-[#FFB800] uppercase tracking-wider">
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
                          'Tournoi de basketball officiel FIRE STONE réunissant les meilleures équipes de la région.'}
                      </p>

                      {/* Info Chips */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-300">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-[#FFB800] shrink-0" />
                          <div className="truncate text-[11px]">
                            {new Date(tournament.startDate).toLocaleDateString('fr-FR')} -{' '}
                            {new Date(tournament.endDate).toLocaleDateString('fr-FR')}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#FF2A3B] shrink-0" />
                          <div className="truncate text-[11px]">{tournament.location}</div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2 col-span-2 sm:col-span-1">
                          <Users className="w-4 h-4 text-[#38BDF8] shrink-0" />
                          <div className="truncate text-[11px]">
                            {teamsCount} / {tournament.maxTeams} Équipes ({fillPercent}%)
                          </div>
                        </div>
                      </div>

                      {/* Mini Standings Preview */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                          <span className="uppercase tracking-wider">Top Équipes</span>
                          <span className="text-[10px] text-slate-500">V - D</span>
                        </div>

                        {tournament.standings && tournament.standings.length > 0 ? (
                          <div className="space-y-1.5">
                            {tournament.standings.slice(0, 3).map((std, idx) => (
                              <div
                                key={std.team.name}
                                className="flex items-center justify-between p-2 rounded-xl bg-white/5 text-xs"
                              >
                                <span className="flex items-center gap-2 font-bold text-white">
                                  <span className="w-5 text-center text-slate-500 text-[10px]">
                                    #{idx + 1}
                                  </span>
                                  {std.team.name}
                                </span>
                                <span className="font-bold text-emerald-400">
                                  {std.wins}V - {std.losses}D
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-white/5 text-center text-xs text-slate-500">
                            Tableau de compétition en attente du coup d'envoi.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                      <button
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setActiveTab('BRACKET');
                        }}
                        className="text-xs font-bold text-[#FFB800] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Voir le Bracket <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setSelectedTournament(tournament)}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Détails complets
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. VUE BRACKET (PHASES FINALES) */}
      {activeTab === 'BRACKET' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFB800] flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" /> Arbre Éliminatoire
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  {bracketTournament?.name || 'Grand Tournoi des Champions'}
                </h3>
                <p className="text-xs text-slate-400">
                  {bracketTournament?.location || 'Lomé'} • Format : {bracketTournament?.format || 'Élimination Directe'}
                </p>
              </div>

              {/* Sélecteur de tournoi pour le bracket */}
              {tournaments.length > 1 && (
                <select
                  value={bracketTournament?.id || ''}
                  onChange={(e) => {
                    const match = tournaments.find((t) => t.id === e.target.value);
                    if (match) setSelectedTournament(match);
                  }}
                  className="glass-input rounded-xl p-2.5 text-xs bg-slate-900 text-white"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Visualisation Bracket */}
            <div className="overflow-x-auto py-4">
              <div className="min-w-[760px] grid grid-cols-3 gap-8 items-center">
                {/* Quarts / Demis */}
                <div className="space-y-6">
                  <div className="text-center font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">
                    Demi-Finales
                  </div>

                  {/* Match 1 */}
                  <div className="glass-panel p-4 rounded-2xl border border-white/15 space-y-2 relative">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-2">
                        <span>🔥</span> FIRE STONE Lomé
                      </span>
                      <span className="font-black text-emerald-400">88</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-white/10 pt-2">
                      <span className="font-bold text-slate-400 flex items-center gap-2">
                        <span>⚡</span> Black Stars Cotonou
                      </span>
                      <span className="font-black text-slate-400">76</span>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-bold text-right pt-1">
                      FIRE STONE qualifié ✓
                    </div>
                  </div>

                  {/* Match 2 */}
                  <div className="glass-panel p-4 rounded-2xl border border-white/15 space-y-2 relative">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-2">
                        <span>🛡️</span> Titans Accra
                      </span>
                      <span className="font-black text-emerald-400">82</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-white/10 pt-2">
                      <span className="font-bold text-slate-400 flex items-center gap-2">
                        <span>⭐</span> Cobras Dakar
                      </span>
                      <span className="font-black text-slate-400">80</span>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-bold text-right pt-1">
                      Titans qualifiés ✓
                    </div>
                  </div>
                </div>

                {/* Grande Finale */}
                <div className="space-y-6">
                  <div className="text-center font-bold text-xs text-[#FFB800] uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Grande Finale
                  </div>

                  <div className="glass-panel p-5 rounded-3xl border-2 border-[#FFB800]/50 space-y-3 shadow-xl shadow-[#FFB800]/10 relative bg-gradient-to-br from-[#FFB800]/10 to-transparent">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-white flex items-center gap-2 text-sm">
                        <span>🔥</span> FIRE STONE Lomé
                      </span>
                      <span className="font-black text-xl text-[#FFB800]">94</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-white/10 pt-3">
                      <span className="font-black text-slate-300 flex items-center gap-2 text-sm">
                        <span>🛡️</span> Titans Accra
                      </span>
                      <span className="font-black text-xl text-slate-300">91</span>
                    </div>
                    <div className="text-center text-xs font-black text-[#FFB800] pt-2 flex items-center justify-center gap-1.5">
                      <Award className="w-4 h-4" /> CHAMPION : FIRE STONE !
                    </div>
                  </div>
                </div>

                {/* Podium & Vainqueur */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFB800] to-[#E60023] mx-auto flex items-center justify-center text-3xl shadow-lg">
                    🥇
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFB800]">
                      Vainqueur 2026
                    </span>
                    <h4 className="text-xl font-black text-white mt-1">FIRE STONE Basketball</h4>
                    <p className="text-xs text-slate-400 mt-1">Trophée d'or & Qualification Africaine</p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex justify-around text-xs">
                    <div>
                      <div className="text-slate-400 text-[10px]">2ème Place</div>
                      <div className="font-bold text-white">Titans Accra</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">3ème Place</div>
                      <div className="font-bold text-white">Cobras Dakar</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. VUE STANDINGS (CLASSEMENTS COMPLETS) */}
      {activeTab === 'STANDINGS' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl border border-white/10 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white">Classements Généraux des Équipes</h3>
                <p className="text-xs text-slate-400">
                  Scores, victoires, différentiels et critères de qualification pour les playoffs.
                </p>
              </div>

              {tournaments.length > 0 && (
                <select
                  value={bracketTournament?.id || ''}
                  onChange={(e) => {
                    const match = tournaments.find((t) => t.id === e.target.value);
                    if (match) setSelectedTournament(match);
                  }}
                  className="glass-input rounded-xl p-2 text-xs bg-slate-900 text-white"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="p-3">Pos</th>
                    <th className="p-3">Franchise</th>
                    <th className="p-3 text-center">J</th>
                    <th className="p-3 text-center">V</th>
                    <th className="p-3 text-center">D</th>
                    <th className="p-3 text-right">Points +</th>
                    <th className="p-3 text-right">Points -</th>
                    <th className="p-3 text-right">Diff</th>
                    <th className="p-3 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bracketTournament?.standings && bracketTournament.standings.length > 0 ? (
                    bracketTournament.standings.map((st, i) => {
                      const diff = st.pointsFor - st.pointsAgainst;
                      return (
                        <tr key={st.team.name} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 font-bold text-slate-500">#{i + 1}</td>
                          <td className="p-3 font-black text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs">
                              🏀
                            </span>
                            {st.team.name}
                          </td>
                          <td className="p-3 text-center text-slate-300">{st.played}</td>
                          <td className="p-3 text-center font-bold text-emerald-400">{st.wins}</td>
                          <td className="p-3 text-center font-bold text-red-400">{st.losses}</td>
                          <td className="p-3 text-right text-slate-300">{st.pointsFor}</td>
                          <td className="p-3 text-right text-slate-300">{st.pointsAgainst}</td>
                          <td
                            className={`p-3 text-right font-black ${
                              diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-400'
                            }`}
                          >
                            {diff > 0 ? `+${diff}` : diff}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                i < 2
                                  ? 'bg-emerald-500/20 text-emerald-300'
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
                        Aucun match joué enregistré pour ce tournoi pour l'instant.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : Création de Tournoi ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl glass-panel rounded-3xl border border-white/15 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#FF2A3B]/10 text-[#FF2A3B]">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Nouveau Tournoi</h3>
                  <p className="text-xs text-slate-400">Configurez la compétition et ouvrez les inscriptions.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Nom du tournoi</label>
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
                    className="glass-input w-full rounded-xl p-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Identifiant (Slug URL)</label>
                  <input
                    required
                    placeholder="coupe-independance"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="glass-input w-full rounded-xl p-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Date de coup d'envoi</label>
                  <input
                    required
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="glass-input w-full rounded-xl p-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Date de clôture / Finale</label>
                  <input
                    required
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="glass-input w-full rounded-xl p-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Lieu / Arène</label>
                  <input
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="glass-input w-full rounded-xl p-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Format de compétition</label>
                  <select
                    value={form.format}
                    onChange={(e) => setForm({ ...form, format: e.target.value })}
                    className="glass-input w-full rounded-xl p-3 text-xs bg-slate-900 text-white"
                  >
                    <option value="Élimination Directe">Élimination Directe</option>
                    <option value="Poules + Élimination">Poules + Élimination</option>
                    <option value="Championnat Aller/Retour">Championnat Aller/Retour</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Quota maximal d'équipes ({form.maxTeams})
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="32"
                    step="2"
                    value={form.maxTeams}
                    onChange={(e) => setForm({ ...form, maxTeams: Number(e.target.value) })}
                    className="w-full accent-[#FF2A3B] cursor-pointer"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Description & Règlements
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Précisez les dotations, conditions d'âge, règles FIBA..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="glass-input w-full rounded-xl p-3 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white text-xs font-black hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Création en cours...' : 'Créer et publier le tournoi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal : Détails d'un tournoi ── */}
      {selectedTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl glass-panel rounded-3xl border border-white/15 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FFB800] bg-[#FFB800]/10 px-2.5 py-1 rounded-full border border-[#FFB800]/30">
                  {selectedTournament.format}
                </span>
                <h3 className="text-2xl font-black text-white mt-2">{selectedTournament.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedTournament.description}</p>
              </div>
              <button
                onClick={() => setSelectedTournament(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-slate-500 text-[10px] block">Lieu</span>
                <strong className="text-white">{selectedTournament.location}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-slate-500 text-[10px] block">Dates</span>
                <strong className="text-white">
                  {new Date(selectedTournament.startDate).toLocaleDateString('fr-FR')} -{' '}
                  {new Date(selectedTournament.endDate).toLocaleDateString('fr-FR')}
                </strong>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 col-span-2 sm:col-span-1">
                <span className="text-slate-500 text-[10px] block">Inscriptions</span>
                <strong className="text-emerald-400">
                  {selectedTournament.teams?.length || 0} / {selectedTournament.maxTeams} Équipes
                </strong>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#38BDF8]" /> Franchises participantes
              </h4>
              {selectedTournament.teams && selectedTournament.teams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedTournament.teams.map((t, i) => (
                    <div
                      key={t.team.id || i}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3"
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
                <div className="p-4 rounded-2xl bg-white/5 text-center text-xs text-slate-400">
                  Inscriptions ouvertes aux clubs affiliés.
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
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white text-xs font-black hover:brightness-110 transition-all"
              >
                Explorer l'arbre des matchs
              </button>
              <button
                type="button"
                onClick={() => setSelectedTournament(null)}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
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
