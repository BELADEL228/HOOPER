import { useEffect, useState, useMemo } from 'react';
import type { Player, UserRole } from '../../types';
import {
  Search,
  Star,
  Scale,
  Users,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRightLeft,
  FileText,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts';
import { apiUrl } from '../../services/api';

const POSITIONS = ['TOUS', 'Meneur', 'Arrière', 'Ailier', 'Ailier Fort', 'Pivot'];

export function ScoutingPage({ currentRole }: { currentRole: UserRole }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('TOUS');
  const [onlyShortlist, setOnlyShortlist] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'COMPARE'>('GRID');

  // Comparateur Face-à-Face
  const [comparePlayerAId, setComparePlayerAId] = useState<string>('');
  const [comparePlayerBId, setComparePlayerBId] = useState<string>('');
  const [scoutNotes, setScoutNotes] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('firestone_scout_notes') || '{}');
    } catch {
      return {};
    }
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const canScout = ['SUPER_ADMIN', 'ADMIN', 'COACH'].includes(currentRole);

  // ── Chargement des données ──────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const playersResponse = await fetch(apiUrl('/players'));
      if (playersResponse.ok) {
        const data = await playersResponse.json();
        const rawPlayers: Player[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.players)
          ? data.players
          : [];
        setPlayers(rawPlayers);
        if (rawPlayers.length >= 2) {
          if (!comparePlayerAId) setComparePlayerAId(rawPlayers[0].id);
          if (!comparePlayerBId) setComparePlayerBId(rawPlayers[1].id);
        }
      }

      const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
      if (session?.token) {
        const shortlistResponse = await fetch(apiUrl('/scouting/shortlist'), {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        if (shortlistResponse.ok) {
          const data = await shortlistResponse.json();
          const entries: Array<{ playerProfileId?: string }> = Array.isArray(data) ? data : [];
          setShortlist(
            entries
              .map((entry) => entry?.playerProfileId)
              .filter((id): id is string => typeof id === 'string')
          );
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Impossible de charger les données de scouting.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // ── Toggle shortlist ────────────────────────────────────────────────
  const toggleShortlist = async (playerId: string) => {
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) {
      setMessage({ type: 'error', text: 'Connectez-vous avec un rôle coach ou administrateur.' });
      return;
    }

    const selected = shortlist.includes(playerId);
    try {
      const response = await fetch(
        apiUrl(selected ? `/scouting/shortlist/${playerId}` : '/scouting/shortlist'),
        {
          method: selected ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: selected ? undefined : JSON.stringify({ playerProfileId: playerId }),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ type: 'error', text: data?.error || 'Action impossible.' });
        return;
      }

      setShortlist(selected ? shortlist.filter((id) => id !== playerId) : [...shortlist, playerId]);
      setMessage({
        type: 'success',
        text: selected ? 'Retiré de la shortlist.' : 'Ajouté à votre shortlist de détection !',
      });
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau.' });
    }
  };

  const handleSaveNote = (playerId: string, noteText: string) => {
    const updated = { ...scoutNotes, [playerId]: noteText };
    setScoutNotes(updated);
    localStorage.setItem('firestone_scout_notes', JSON.stringify(updated));
  };

  // ── Filtre Joueurs ──────────────────────────────────────────────────
  const q = query.toLowerCase().trim();
  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const matchesSearch =
        !q ||
        (player.name?.toLowerCase().includes(q) ?? false) ||
        (player.position?.toLowerCase().includes(q) ?? false) ||
        (player.team?.name?.toLowerCase().includes(q) ?? false);

      const matchesPos =
        selectedPosition === 'TOUS' ||
        player.position?.toLowerCase().includes(selectedPosition.toLowerCase());

      const matchesShortlist = !onlyShortlist || shortlist.includes(player.id);

      return matchesSearch && matchesPos && matchesShortlist;
    });
  }, [players, q, selectedPosition, onlyShortlist, shortlist]);

  // Joueurs du comparateur
  const playerA = useMemo(() => players.find((p) => p.id === comparePlayerAId), [players, comparePlayerAId]);
  const playerB = useMemo(() => players.find((p) => p.id === comparePlayerBId), [players, comparePlayerBId]);

  // Données radar comparaison
  const radarComparisonData = useMemo(() => {
    if (!playerA && !playerB) return [];

    const statsA = playerA?.seasonStats || { ppg: 0, rpg: 0, apg: 0, efficiency: 0, fgPct: 0 };
    const statsB = playerB?.seasonStats || { ppg: 0, rpg: 0, apg: 0, efficiency: 0, fgPct: 0 };

    return [
      {
        subject: 'Scoring (PTS)',
        A: Math.min(100, (statsA.ppg / 30) * 100),
        B: Math.min(100, (statsB.ppg / 30) * 100),
        rawA: statsA.ppg,
        rawB: statsB.ppg,
      },
      {
        subject: 'Rebonds (REB)',
        A: Math.min(100, (statsA.rpg / 15) * 100),
        B: Math.min(100, (statsB.rpg / 15) * 100),
        rawA: statsA.rpg,
        rawB: statsB.rpg,
      },
      {
        subject: 'Passes (AST)',
        A: Math.min(100, (statsA.apg / 12) * 100),
        B: Math.min(100, (statsB.apg / 12) * 100),
        rawA: statsA.apg,
        rawB: statsB.apg,
      },
      {
        subject: 'Adresse (FG%)',
        A: Math.min(100, statsA.fgPct || 45),
        B: Math.min(100, statsB.fgPct || 45),
        rawA: `${statsA.fgPct || 0}%`,
        rawB: `${statsB.fgPct || 0}%`,
      },
      {
        subject: 'Efficacité (EFF)',
        A: Math.min(100, ((statsA.efficiency ?? 10) / 25) * 100),
        B: Math.min(100, ((statsB.efficiency ?? 10) / 25) * 100),
        rawA: statsA.efficiency ?? 0,
        rawB: statsB.efficiency ?? 0,
      },
    ];
  }, [playerA, playerB]);

  return (
    <div className="space-y-8 pb-12">
      {/* ── En-tête Principal ── */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFB800]/30 bg-[#FFB800]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FFB800]">
            <Scale className="w-3.5 h-3.5" /> Cellule de Recrutement & Analyse
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight">
            Scouting & Comparateur de Talents
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            Analysez les profils émergents, évaluez les statistiques avancées et construisez votre sélection de prospects pour la saison.
          </p>
        </div>

        {/* Boutons de Vue (Grille vs Comparateur) */}
        <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0">
          <button
            onClick={() => setViewMode('GRID')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewMode === 'GRID'
                ? 'bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Vivier ({players.length})
          </button>
          <button
            onClick={() => setViewMode('COMPARE')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewMode === 'COMPARE'
                ? 'bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" /> Comparateur Face-à-Face
          </button>
        </div>
      </header>

      {/* ── Métriques Rapides ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{players.length}</div>
            <div className="text-[11px] text-slate-400">Joueurs observés</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Star className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{shortlist.length}</div>
            <div className="text-[11px] text-slate-400">Dans ma shortlist</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 flex items-center justify-center text-[#38BDF8]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">
              {players.length > 0
                ? (
                    players.reduce((sum, p) => sum + (p.seasonStats?.ppg || 0), 0) / players.length
                  ).toFixed(1)
                : '—'}
            </div>
            <div className="text-[11px] text-slate-400">Moyenne PTS ligue</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">Ligue Élite</div>
            <div className="text-[11px] text-slate-400">Radar FIBA actif</div>
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

      {/* ═══════════════════════════════════════════════════════════════
          VUE 1 : GRILLE DES TALENTS & SHORTLIST
      ═══════════════════════════════════════════════════════════════ */}
      {viewMode === 'GRID' && (
        <div className="space-y-6">
          {/* Barre de filtres */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setSelectedPosition(pos)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedPosition === pos
                      ? 'bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {pos === 'TOUS' ? 'Tous les postes' : pos}
                </button>
              ))}

              {canScout && (
                <button
                  onClick={() => setOnlyShortlist(!onlyShortlist)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    onlyShortlist
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${onlyShortlist ? 'fill-current' : ''}`} />
                  Shortlist ({shortlist.length})
                </button>
              )}
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par nom, poste ou club..."
                className="glass-input w-full pl-9 pr-3 py-2 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Grille Joueurs */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="glass-panel p-6 rounded-3xl border border-white/10 animate-pulse space-y-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/10" />
                  <div className="h-4 bg-white/10 rounded w-2/3" />
                  <div className="h-16 bg-white/5 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="glass-panel rounded-3xl border border-white/10 p-12 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Aucun profil ne correspond à vos filtres</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Modifiez vos critères de recherche ou réinitialisez le filtre de poste.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlayers.map((player) => {
                const isShortlisted = shortlist.includes(player.id);
                const stats = player.seasonStats || { ppg: 0, rpg: 0, apg: 0, efficiency: 0 };

                return (
                  <article
                    key={player.id}
                    className="glass-panel rounded-3xl border border-white/10 p-6 flex flex-col justify-between space-y-5 hover:border-white/20 transition-all group"
                  >
                    <div className="space-y-4">
                      {/* Entête Joueur */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              player.photo ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                player.name || 'Joueur'
                              )}&background=B91C1C&color=fff`
                            }
                            alt={player.name || 'Joueur'}
                            className="w-14 h-14 rounded-2xl object-cover bg-slate-800 shrink-0"
                          />
                          <div>
                            <h3 className="text-base font-black text-white group-hover:text-[#FFB800] transition-colors">
                              {player.name}
                            </h3>
                            <p className="text-xs text-[#FFB800] font-bold">
                              {player.position || 'Poste non défini'} • #{player.number || '—'}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {player.team?.name || 'Franchise Libre'} • {player.age ? `${player.age} ans` : ''}{' '}
                              {player.height ? `• ${player.height}` : ''}
                            </p>
                          </div>
                        </div>

                        {canScout && (
                          <button
                            type="button"
                            onClick={() => toggleShortlist(player.id)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              isShortlisted
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
                            }`}
                            title={isShortlisted ? 'Retirer de la shortlist' : 'Ajouter à la shortlist'}
                          >
                            <Star className={`w-4 h-4 ${isShortlisted ? 'fill-current' : ''}`} />
                          </button>
                        )}
                      </div>

                      {/* Boîte des 4 Statistiques Clés */}
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="rounded-xl bg-white/5 p-2">
                          <strong className="block text-white font-black text-sm">{stats.ppg ?? '—'}</strong>
                          <span className="text-[10px] text-slate-400">PTS</span>
                        </div>
                        <div className="rounded-xl bg-white/5 p-2">
                          <strong className="block text-white font-black text-sm">{stats.rpg ?? '—'}</strong>
                          <span className="text-[10px] text-slate-400">REB</span>
                        </div>
                        <div className="rounded-xl bg-white/5 p-2">
                          <strong className="block text-white font-black text-sm">{stats.apg ?? '—'}</strong>
                          <span className="text-[10px] text-slate-400">AST</span>
                        </div>
                        <div className="rounded-xl bg-white/5 p-2">
                          <strong className="block text-emerald-400 font-black text-sm">
                            {stats.efficiency ?? '—'}
                          </strong>
                          <span className="text-[10px] text-slate-400">EFF</span>
                        </div>
                      </div>

                      {/* Note de scouting rapide */}
                      {scoutNotes[player.id] && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300 italic flex items-start gap-2">
                          <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{scoutNotes[player.id]}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions de bas de carte */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setComparePlayerAId(player.id);
                          setViewMode('COMPARE');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Comparer
                      </button>

                      {canScout && (
                        <button
                          onClick={() => {
                            const note = prompt(
                              `Note de scouting pour ${player.name} :`,
                              scoutNotes[player.id] || ''
                            );
                            if (note !== null) handleSaveNote(player.id, note);
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Ajouter une note de scouting"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          VUE 2 : COMPARATEUR DIRECT FACE-À-FACE (HEAD-TO-HEAD)
      ═══════════════════════════════════════════════════════════════ */}
      {viewMode === 'COMPARE' && (
        <div className="space-y-6">
          {/* Sélecteurs des 2 Joueurs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slot A */}
            <div className="glass-panel p-5 rounded-3xl border border-red-500/30 space-y-4 bg-gradient-to-br from-red-500/10 to-transparent">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF2A3B]" /> Joueur A
                </span>
                <select
                  value={comparePlayerAId}
                  onChange={(e) => setComparePlayerAId(e.target.value)}
                  className="glass-input rounded-xl p-2 text-xs bg-slate-900 text-white font-bold"
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.position || '—'})
                    </option>
                  ))}
                </select>
              </div>

              {playerA ? (
                <div className="flex items-center gap-4">
                  <img
                    src={
                      playerA.photo ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        playerA.name
                      )}&background=B91C1C&color=fff`
                    }
                    alt={playerA.name}
                    className="w-16 h-16 rounded-2xl object-cover bg-slate-800"
                  />
                  <div>
                    <h3 className="text-lg font-black text-white">{playerA.name}</h3>
                    <p className="text-xs text-red-300 font-bold">{playerA.position || 'Poste inconnu'}</p>
                    <p className="text-[11px] text-slate-400">
                      {playerA.age ? `${playerA.age} ans` : ''} • {playerA.height || 'Taille N/D'} •{' '}
                      {playerA.team?.name || 'Club'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Sélectionnez le premier joueur.</p>
              )}
            </div>

            {/* Slot B */}
            <div className="glass-panel p-5 rounded-3xl border border-amber-500/30 space-y-4 bg-gradient-to-br from-amber-500/10 to-transparent">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFB800]" /> Joueur B
                </span>
                <select
                  value={comparePlayerBId}
                  onChange={(e) => setComparePlayerBId(e.target.value)}
                  className="glass-input rounded-xl p-2 text-xs bg-slate-900 text-white font-bold"
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.position || '—'})
                    </option>
                  ))}
                </select>
              </div>

              {playerB ? (
                <div className="flex items-center gap-4">
                  <img
                    src={
                      playerB.photo ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        playerB.name
                      )}&background=D97706&color=fff`
                    }
                    alt={playerB.name}
                    className="w-16 h-16 rounded-2xl object-cover bg-slate-800"
                  />
                  <div>
                    <h3 className="text-lg font-black text-white">{playerB.name}</h3>
                    <p className="text-xs text-amber-300 font-bold">{playerB.position || 'Poste inconnu'}</p>
                    <p className="text-[11px] text-slate-400">
                      {playerB.age ? `${playerB.age} ans` : ''} • {playerB.height || 'Taille N/D'} •{' '}
                      {playerB.team?.name || 'Club'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Sélectionnez le deuxième joueur.</p>
              )}
            </div>
          </div>

          {/* Comparaison Radar & Métriques Face-à-Face */}
          {playerA && playerB && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Radar Chart */}
              <div className="lg:col-span-6 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FFB800]" /> Polygone de Compétences Croisées
                </h4>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarComparisonData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        stroke="#94A3B8"
                        tick={{ fontSize: 11, fontWeight: 700 }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.1)" />
                      <Radar
                        name={playerA.name}
                        dataKey="A"
                        stroke="#FF2A3B"
                        fill="#FF2A3B"
                        fillOpacity={0.4}
                      />
                      <Radar
                        name={playerB.name}
                        dataKey="B"
                        stroke="#FFB800"
                        fill="#FFB800"
                        fillOpacity={0.4}
                      />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tableau Différentiel */}
              <div className="lg:col-span-6 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" /> Différentiel Statistique Direct
                </h4>

                <div className="space-y-2.5 text-xs">
                  {radarComparisonData.map((stat) => {
                    const valA = typeof stat.rawA === 'number' ? stat.rawA : parseFloat(stat.rawA) || 0;
                    const valB = typeof stat.rawB === 'number' ? stat.rawB : parseFloat(stat.rawB) || 0;
                    const diff = Number((valA - valB).toFixed(1));

                    return (
                      <div
                        key={stat.subject}
                        className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between"
                      >
                        <div className="w-24 text-left font-black text-red-300">
                          {stat.rawA}
                        </div>

                        <div className="text-center flex-1">
                          <span className="font-bold text-white block">{stat.subject}</span>
                          <span
                            className={`text-[10px] font-bold ${
                              diff > 0
                                ? 'text-emerald-400'
                                : diff < 0
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {diff > 0 ? `+${diff} pour ${playerA.name.split(' ')[0]}` : diff < 0 ? `+${Math.abs(diff)} pour ${playerB.name.split(' ')[0]}` : 'Égalité parfaite'}
                          </span>
                        </div>

                        <div className="w-24 text-right font-black text-amber-300">
                          {stat.rawB}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}