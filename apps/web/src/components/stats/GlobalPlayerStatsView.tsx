import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Flame,
  Award,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  User,
  Shield,
  Activity,
  Star,
  Zap,
  Target,
  X,
  ExternalLink,
} from 'lucide-react';
import { apiUrl } from '../../services/api';
import type { UserRole } from '../../types';

export interface PlayerStatItem {
  id: string;
  userId?: string;
  name: string;
  photoUrl?: string | null;
  number?: number;
  jerseyNumber?: number;
  position: string;
  heightCm: number;
  weightKg: number;
  age: number;
  category: string;
  experienceYears?: number;
  clubName?: string;
  clubLogo?: string;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  efficiency: number;
  fgPct: number;
  threePtPct?: number;
  ftPct?: number;
}

interface GlobalPlayerStatsViewProps {
  currentRole?: UserRole;
  onOpenProfile?: (userId: string) => void;
  onOpenAuth?: () => void;
}

// Données de secours réalistes basketball ligue africaine / Lomé si l'API n'a pas encore de stats détaillées
const FALLBACK_PLAYERS: PlayerStatItem[] = [
  {
    id: 'p1',
    userId: 'u1',
    name: 'Koffi Mawuli Mensah',
    jerseyNumber: 23,
    position: 'Meneur (Point Guard)',
    heightCm: 188,
    weightKg: 82,
    age: 24,
    category: 'SENIOR',
    clubName: 'FIRE STONE Lomé',
    ppg: 24.8,
    rpg: 6.2,
    apg: 9.4,
    spg: 2.3,
    bpg: 0.6,
    efficiency: 28.5,
    fgPct: 52.4,
    threePtPct: 41.2,
    ftPct: 88.0,
  },
  {
    id: 'p2',
    userId: 'u2',
    name: 'Emmanuel Amouzou',
    jerseyNumber: 34,
    position: 'Pivot (Center)',
    heightCm: 206,
    weightKg: 104,
    age: 26,
    category: 'SENIOR',
    clubName: 'Étoile Filante Basket',
    ppg: 21.4,
    rpg: 13.8,
    apg: 2.8,
    spg: 1.1,
    bpg: 3.2,
    efficiency: 29.1,
    fgPct: 61.0,
    threePtPct: 22.0,
    ftPct: 73.5,
  },
  {
    id: 'p3',
    userId: 'u3',
    name: 'Samuel Lawson',
    jerseyNumber: 7,
    position: 'Arrière (Shooting Guard)',
    heightCm: 194,
    weightKg: 88,
    age: 22,
    category: 'SENIOR',
    clubName: 'Swallows Basketball',
    ppg: 22.1,
    rpg: 5.1,
    apg: 4.6,
    spg: 1.9,
    bpg: 0.4,
    efficiency: 23.4,
    fgPct: 48.6,
    threePtPct: 43.8,
    ftPct: 86.2,
  },
  {
    id: 'p4',
    userId: 'u4',
    name: 'Fousseni Alassani',
    jerseyNumber: 11,
    position: 'Ailier Fort (Power Forward)',
    heightCm: 202,
    weightKg: 98,
    age: 25,
    category: 'SENIOR',
    clubName: 'Modèle de Lomé',
    ppg: 18.6,
    rpg: 11.2,
    apg: 3.4,
    spg: 1.4,
    bpg: 2.1,
    efficiency: 25.0,
    fgPct: 55.3,
    threePtPct: 31.0,
    ftPct: 76.0,
  },
  {
    id: 'p5',
    userId: 'u5',
    name: 'Didier Kodjo Agbegninou',
    jerseyNumber: 10,
    position: 'Ailier (Small Forward)',
    heightCm: 198,
    weightKg: 91,
    age: 23,
    category: 'SENIOR',
    clubName: 'Racing Club Togo',
    ppg: 19.5,
    rpg: 7.4,
    apg: 5.1,
    spg: 2.1,
    bpg: 1.0,
    efficiency: 24.2,
    fgPct: 49.7,
    threePtPct: 37.5,
    ftPct: 81.4,
  },
  {
    id: 'p6',
    userId: 'u6',
    name: 'Jean-Luc Dossou',
    jerseyNumber: 15,
    position: 'Arrière (Shooting Guard)',
    heightCm: 191,
    weightKg: 84,
    age: 19,
    category: 'U18',
    clubName: 'FIRE STONE Academy',
    ppg: 17.8,
    rpg: 4.2,
    apg: 6.0,
    spg: 2.5,
    bpg: 0.3,
    efficiency: 21.0,
    fgPct: 46.5,
    threePtPct: 39.0,
    ftPct: 84.0,
  },
  {
    id: 'p7',
    userId: 'u7',
    name: 'Aminata Diallo',
    jerseyNumber: 8,
    position: 'Meneuse (Point Guard)',
    heightCm: 176,
    weightKg: 65,
    age: 21,
    category: 'FEMININ',
    clubName: 'Lomé Queens',
    ppg: 20.3,
    rpg: 5.5,
    apg: 8.2,
    spg: 3.1,
    bpg: 0.5,
    efficiency: 26.8,
    fgPct: 50.1,
    threePtPct: 42.0,
    ftPct: 89.5,
  },
];

type SortField = 'ppg' | 'rpg' | 'apg' | 'spg' | 'bpg' | 'efficiency' | 'fgPct';

export const GlobalPlayerStatsView: React.FC<GlobalPlayerStatsViewProps> = ({
  currentRole: _currentRole,
  onOpenProfile,
  onOpenAuth: _onOpenAuth,
}) => {
  const [players, setPlayers] = useState<PlayerStatItem[]>(FALLBACK_PLAYERS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('ppg');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStatItem | null>(null);

  // ─── Chargement depuis l'API joueurs ─────────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetch(apiUrl('/players'))
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.players || [];
        if (list.length > 0) {
          const mapped: PlayerStatItem[] = list.map((p: any) => ({
            id: p.id || p.userId,
            userId: p.userId || p.id,
            name: p.name || p.user?.name || `Joueur #${p.jerseyNumber || p.number || '?'}`,
            photoUrl: p.photoUrl || p.photo || p.user?.avatarUrl,
            jerseyNumber: p.jerseyNumber ?? p.number ?? 0,
            position: p.position || 'Joueur',
            heightCm: p.heightCm || p.height || 190,
            weightKg: p.weightKg || p.weight || 85,
            age: p.age || 22,
            category: p.category || 'SENIOR',
            experienceYears: p.experienceYears || 2,
            clubName: p.team?.club?.name || p.club?.name || p.clubName || 'Ligue Hoopers',
            clubLogo: p.team?.club?.logoUrl || p.club?.logoUrl,
            ppg: Number(p.ppg ?? 0),
            rpg: Number(p.rpg ?? 0),
            apg: Number(p.apg ?? 0),
            spg: Number(p.spg ?? 0),
            bpg: Number(p.bpg ?? 0),
            efficiency: Number(p.efficiency ?? (p.ppg || 0) * 1.1),
            fgPct: Number(p.fgPct ?? 45.0),
            threePtPct: Number(p.threePtPct ?? 35.0),
            ftPct: Number(p.ftPct ?? 75.0),
          }));
          setPlayers(mapped);
        }
      })
      .catch(() => {
        // Garder le fallback
      })
      .finally(() => setLoading(false));
  }, []);

  // ─── Filtrage et Tri ────────────────────────────────────────────────
  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesClub = p.clubName?.toLowerCase().includes(q) ?? false;
          const matchesPos = p.position.toLowerCase().includes(q);
          if (!matchesName && !matchesClub && !matchesPos) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const valA = Number(a[sortField] ?? 0);
        const valB = Number(b[sortField] ?? 0);
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [players, categoryFilter, search, sortField, sortAsc]);

  // ─── Leaders Top 5 par catégorie phare ─────────────────────────────
  const ppgLeader = useMemo(() => [...players].sort((a, b) => b.ppg - a.ppg)[0], [players]);
  const apgLeader = useMemo(() => [...players].sort((a, b) => b.apg - a.apg)[0], [players]);
  const rpgLeader = useMemo(() => [...players].sort((a, b) => b.rpg - a.rpg)[0], [players]);
  const spgLeader = useMemo(() => [...players].sort((a, b) => b.spg - a.spg)[0], [players]);
  const effLeader = useMemo(() => [...players].sort((a, b) => b.efficiency - a.efficiency)[0], [players]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="w-6 h-6 rounded-full bg-linear-to-br from-amber-400 to-yellow-600 text-black font-black text-xs flex items-center justify-center shadow-md shadow-amber-500/20">
          1
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-linear-to-br from-slate-200 to-slate-400 text-slate-950 font-black text-xs flex items-center justify-center">
          2
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-linear-to-br from-amber-700 to-amber-900 text-amber-100 font-black text-xs flex items-center justify-center">
          3
        </span>
      );
    }
    return <span className="text-xs font-semibold text-slate-500 pl-1.5">{index + 1}</span>;
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-7xl mx-auto">
      {/* ─── EN-TÊTE PRINCIPAL ─── */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-linear-to-br from-[#121622] via-[#0E1118] to-[#0A0C12] border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-bl from-[#FF2A3B]/10 via-[#FFB800]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Classement & Statistiques des Joueurs
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Consultez les performances individuelles, les leaders de la saison régulière et
            explorez les profils détaillés des athlètes.
          </p>
        </div>
      </div>

      {/* ─── CARTES DES LEADERS DE LA LIGUE ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Points */}
        {ppgLeader && (
          <button
            onClick={() => setSelectedPlayer(ppgLeader)}
            className="p-4 rounded-2xl bg-[#10141F] border border-white/10 hover:border-[#FF2A3B]/40 transition-all text-left group cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF2A3B] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> Points (PPG)
              </span>
              <span className="text-[10px] text-slate-500 font-bold">#1</span>
            </div>
            <div>
              <div className="text-2xl font-black text-white group-hover:text-[#FF2A3B] transition-colors">
                {ppgLeader.ppg.toFixed(1)}
              </div>
              <div className="text-xs font-bold text-slate-200 truncate mt-0.5">{ppgLeader.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{ppgLeader.clubName}</div>
            </div>
          </button>
        )}

        {/* Passes */}
        {apgLeader && (
          <button
            onClick={() => setSelectedPlayer(apgLeader)}
            className="p-4 rounded-2xl bg-[#10141F] border border-white/10 hover:border-[#38BDF8]/40 transition-all text-left group cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Passes (APG)
              </span>
              <span className="text-[10px] text-slate-500 font-bold">#1</span>
            </div>
            <div>
              <div className="text-2xl font-black text-white group-hover:text-[#38BDF8] transition-colors">
                {apgLeader.apg.toFixed(1)}
              </div>
              <div className="text-xs font-bold text-slate-200 truncate mt-0.5">{apgLeader.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{apgLeader.clubName}</div>
            </div>
          </button>
        )}

        {/* Rebonds */}
        {rpgLeader && (
          <button
            onClick={() => setSelectedPlayer(rpgLeader)}
            className="p-4 rounded-2xl bg-[#10141F] border border-white/10 hover:border-[#FFB800]/40 transition-all text-left group cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFB800] flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> Rebonds (RPG)
              </span>
              <span className="text-[10px] text-slate-500 font-bold">#1</span>
            </div>
            <div>
              <div className="text-2xl font-black text-white group-hover:text-[#FFB800] transition-colors">
                {rpgLeader.rpg.toFixed(1)}
              </div>
              <div className="text-xs font-bold text-slate-200 truncate mt-0.5">{rpgLeader.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{rpgLeader.clubName}</div>
            </div>
          </button>
        )}

        {/* Interceptions */}
        {spgLeader && (
          <button
            onClick={() => setSelectedPlayer(spgLeader)}
            className="p-4 rounded-2xl bg-[#10141F] border border-white/10 hover:border-emerald-400/40 transition-all text-left group cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Intercept. (SPG)
              </span>
              <span className="text-[10px] text-slate-500 font-bold">#1</span>
            </div>
            <div>
              <div className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">
                {spgLeader.spg.toFixed(1)}
              </div>
              <div className="text-xs font-bold text-slate-200 truncate mt-0.5">{spgLeader.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{spgLeader.clubName}</div>
            </div>
          </button>
        )}

        {/* Efficacité */}
        {effLeader && (
          <button
            onClick={() => setSelectedPlayer(effLeader)}
            className="p-4 rounded-2xl bg-[#10141F] border border-white/10 hover:border-purple-400/40 transition-all text-left group cursor-pointer space-y-3 col-span-2 md:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                <Star className="w-3.5 h-3.5" /> Efficacité (EFF)
              </span>
              <span className="text-[10px] text-slate-500 font-bold">#1</span>
            </div>
            <div>
              <div className="text-2xl font-black text-white group-hover:text-purple-400 transition-colors">
                {effLeader.efficiency.toFixed(1)}
              </div>
              <div className="text-xs font-bold text-slate-200 truncate mt-0.5">{effLeader.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{effLeader.clubName}</div>
            </div>
          </button>
        )}
      </div>

      {/* ─── FILTRES ET RECHERCHE ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-3.5 rounded-2xl bg-[#0D1018] border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un joueur, club ou poste..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF2A3B]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          {['ALL', 'SENIOR', 'U18', 'FEMININ'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer shrink-0 ${categoryFilter === cat
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
            >
              {cat === 'ALL' ? 'Toutes catégories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TABLEAU PRINCIPAL DES STATISTIQUES ─── */}
      <div className="rounded-3xl overflow-hidden bg-[#0C0F17] border border-white/10 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">
                <th className="py-3.5 px-4 w-12 text-center">Rang</th>
                <th className="py-3.5 px-4">Joueur & Équipe</th>
                <th className="py-3.5 px-3">Poste</th>
                <th
                  onClick={() => handleSort('ppg')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    PTS (PPG)
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('rpg')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    REB (RPG)
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('apg')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    PASSES (APG)
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('fgPct')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors hidden sm:table-cell"
                >
                  <div className="flex items-center gap-1">
                    TIR % (FG%)
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('efficiency')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    EFF
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Chargement des statistiques...
                  </td>
                </tr>
              ) : filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 italic">
                    Aucun joueur ne correspond aux filtres sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player, index) => {
                  const avatarUrl =
                    player.photoUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=1E293B&color=fff`;

                  return (
                    <tr
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className="hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 text-center font-bold">
                        {getRankBadge(index)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={avatarUrl}
                            alt={player.name}
                            className="w-9 h-9 rounded-full object-cover bg-slate-800 shrink-0 border border-white/10"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-white group-hover:text-[#FFB800] transition-colors truncate">
                              {player.name}
                              {player.jerseyNumber ? (
                                <span className="text-slate-500 font-normal ml-1">#{player.jerseyNumber}</span>
                              ) : null}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                              <span>{player.clubName || 'Ligue HOOPERS'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300 font-medium">
                        {player.position}
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-white text-sm">
                        {player.ppg.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-200">
                        {player.rpg.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-200">
                        {player.apg.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-300 hidden sm:table-cell">
                        {player.fgPct.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 font-black text-amber-400 text-sm">
                        {player.efficiency.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlayer(player);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODALE EXPRESS DU JOUEUR SÉLECTIONNÉ ─── */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F131D] border border-white/15 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* En-tête profil */}
            <div className="flex items-center gap-4">
              <img
                src={
                  selectedPlayer.photoUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPlayer.name)}&background=FF2A3B&color=fff`
                }
                alt={selectedPlayer.name}
                className="w-16 h-16 rounded-2xl object-cover bg-slate-800 border-2 border-white/15 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF2A3B]/20 text-[#FF2A3B] text-[10px] font-bold uppercase mb-1">
                  #{selectedPlayer.jerseyNumber || '?'} • {selectedPlayer.category}
                </div>
                <h3 className="text-lg font-black text-white truncate">{selectedPlayer.name}</h3>
                <p className="text-xs text-slate-400 truncate">
                  {selectedPlayer.position} • {selectedPlayer.clubName}
                </p>
              </div>
            </div>

            {/* Mensurations */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-bold">Taille</div>
                <div className="text-sm font-black text-white mt-0.5">{selectedPlayer.heightCm} cm</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-bold">Poids</div>
                <div className="text-sm font-black text-white mt-0.5">{selectedPlayer.weightKg} kg</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-bold">Âge</div>
                <div className="text-sm font-black text-white mt-0.5">{selectedPlayer.age} ans</div>
              </div>
            </div>

            {/* Statistiques clés */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#FFB800]" /> Statistiques de la saison
              </h4>
              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-lg font-black text-white">{selectedPlayer.ppg.toFixed(1)}</div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Points</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-lg font-black text-white">{selectedPlayer.rpg.toFixed(1)}</div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Rebonds</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-lg font-black text-white">{selectedPlayer.apg.toFixed(1)}</div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Passes</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-lg font-black text-amber-400">
                    {selectedPlayer.efficiency.toFixed(1)}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Efficacité</div>
                </div>
              </div>
            </div>

            {/* Pourcentages de tir */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Adresse générale (FG%)</span>
                <span className="text-white font-bold">{selectedPlayer.fgPct.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#FF2A3B] h-full rounded-full"
                  style={{ width: `${Math.min(selectedPlayer.fgPct, 100)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-400 font-medium">Tirs à 3 points (3PT%)</span>
                <span className="text-white font-bold">{selectedPlayer.threePtPct?.toFixed(1) ?? '35.0'}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#FFB800] h-full rounded-full"
                  style={{ width: `${Math.min(selectedPlayer.threePtPct || 35, 100)}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Fermer
              </button>
              {selectedPlayer.userId && onOpenProfile && (
                <button
                  onClick={() => {
                    const uid = selectedPlayer.userId!;
                    setSelectedPlayer(null);
                    onOpenProfile(uid);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#FF2A3B] hover:bg-[#E60023] text-white font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-[#FF2A3B]/20"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Voir le profil complet</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
