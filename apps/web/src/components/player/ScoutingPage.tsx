import { useEffect, useState, useMemo } from 'react';
import type { Player, UserRole } from '../../types';
import {
  Search,
  Star,
  Users,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRightLeft,
  FileText,
  SlidersHorizontal,
  TrendingUp,
  Filter,
  Crosshair,
  Binoculars,
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

// ── Constants ─────────────────────────────────────────────────────────────────

const POSITIONS = ['TOUS', 'Meneur', 'Arrière', 'Ailier', 'Ailier Fort', 'Pivot'] as const;

const SCOUTING_TAG_SUGGESTIONS = [
  'Shooteur clutch', 'Verrou périmètre', 'Passeur d\'élite',
  'Fort QI basket', 'Rebondisseur féroce', 'Athlète explosif',
  'Finisseur arceau', 'Leader vocal', 'Défenseur d\'élite', 'Excellente lecture de jeu',
];

const POS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  'Meneur':     { bg: 'bg-sky-500/15',    text: 'text-sky-300',    border: 'border-sky-500/30' },
  'Arrière':    { bg: 'bg-violet-500/15', text: 'text-violet-300', border: 'border-violet-500/30' },
  'Ailier':     { bg: 'bg-emerald-500/15',text: 'text-emerald-300',border: 'border-emerald-500/30' },
  'Ailier Fort':{ bg: 'bg-amber-500/15',  text: 'text-amber-300',  border: 'border-amber-500/30' },
  'Pivot':      { bg: 'bg-orange-500/15', text: 'text-orange-300', border: 'border-orange-500/30' },
};

// ── Mock players ──────────────────────────────────────────────────────────────

const MOCK_PLAYERS: Player[] = [
  { id: 'm1', name: 'Kwame Asante',  number: 7,  position: 'Meneur',      age: 24, height: '1.88m', weight: '85kg',  photo: '', bio: '', team: { name: 'Lomé Lions',     slug: 'lome', category: 'SENIOR' }, seasonStats: { ppg: 22.4, rpg: 5.1,  apg: 8.7, spg: 1.9, bpg: 0.6, fgPct: 48, threePtPct: 37, ftPct: 82, efficiency: 24 }, experienceYears: 4, achievements: ['MVP Saison 2024', 'All-Star'], skillsRadar: { shooting: 78, passing: 90, defense: 72, athleticism: 82, iq: 88, rebounding: 55 }, recentForm: [24, 28, 19, 31, 22] },
  { id: 'm2', name: 'Elikem Dogbe',  number: 11, position: 'Arrière',     age: 22, height: '1.93m', weight: '88kg',  photo: '', bio: '', team: { name: 'Lomé Lions',     slug: 'lome', category: 'SENIOR' }, seasonStats: { ppg: 18.7, rpg: 4.3,  apg: 3.2, spg: 2.1, bpg: 0.4, fgPct: 45, threePtPct: 38, ftPct: 79, efficiency: 19 }, experienceYears: 2, achievements: ['Meilleur Défenseur'], skillsRadar: { shooting: 85, passing: 65, defense: 88, athleticism: 80, iq: 74, rebounding: 60 }, recentForm: [18, 22, 15, 20, 19] },
  { id: 'm3', name: 'Sèdami Vogan',  number: 4,  position: 'Ailier',      age: 26, height: '1.98m', weight: '97kg',  photo: '', bio: '', team: { name: 'Kara Eagles',    slug: 'kara', category: 'SENIOR' }, seasonStats: { ppg: 15.2, rpg: 7.8,  apg: 2.4, spg: 0.8, bpg: 0.9, fgPct: 52, threePtPct: 34, ftPct: 74, efficiency: 17 }, experienceYears: 6, achievements: ['Champion National 2023'], skillsRadar: { shooting: 72, passing: 68, defense: 75, athleticism: 85, iq: 78, rebounding: 80 }, recentForm: [14, 17, 12, 19, 16] },
  { id: 'm4', name: 'Kokou Dzivenu', number: 32, position: 'Ailier Fort', age: 25, height: '2.03m', weight: '108kg', photo: '', bio: '', team: { name: 'Kara Eagles',    slug: 'kara', category: 'SENIOR' }, seasonStats: { ppg: 13.9, rpg: 9.2,  apg: 1.8, spg: 0.5, bpg: 1.2, fgPct: 56, threePtPct: 28, ftPct: 71, efficiency: 16 }, experienceYears: 5, achievements: ['Meilleur Rebondeur'], skillsRadar: { shooting: 60, passing: 55, defense: 82, athleticism: 78, iq: 70, rebounding: 92 }, recentForm: [13, 16, 11, 15, 14] },
  { id: 'm5', name: 'Bright Amewu',  number: 55, position: 'Pivot',       age: 27, height: '2.12m', weight: '118kg', photo: '', bio: '', team: { name: 'Atakpamé Bears', slug: 'atk',  category: 'SENIOR' }, seasonStats: { ppg: 11.3, rpg: 11.7, apg: 1.1, spg: 0.3, bpg: 2.1, fgPct: 61, threePtPct: 22, ftPct: 65, efficiency: 18 }, experienceYears: 7, achievements: ['Meilleur Contreur', 'All-Star'], skillsRadar: { shooting: 55, passing: 45, defense: 90, athleticism: 70, iq: 72, rebounding: 95 }, recentForm: [11, 14, 9,  13, 12] },
  { id: 'm6', name: 'Kossi Mensah',  number: 23, position: 'Meneur',      age: 21, height: '1.85m', weight: '80kg',  photo: '', bio: '', team: { name: 'Atakpamé Bears', slug: 'atk',  category: 'SENIOR' }, seasonStats: { ppg: 19.8, rpg: 3.9,  apg: 7.5, spg: 2.3, bpg: 0.3, fgPct: 44, threePtPct: 36, ftPct: 83, efficiency: 21 }, experienceYears: 1, achievements: ['Rookie de l\'Année'], skillsRadar: { shooting: 80, passing: 88, defense: 70, athleticism: 90, iq: 85, rebounding: 50 }, recentForm: [20, 23, 17, 25, 21] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEfficiencyTier(eff: number): { label: string; color: string; dot: string } {
  if (eff >= 22) return { label: 'Élite', color: 'text-amber-300', dot: 'bg-amber-400' };
  if (eff >= 17) return { label: 'Pro', color: 'text-emerald-300', dot: 'bg-emerald-400' };
  if (eff >= 12) return { label: 'Solide', color: 'text-sky-300', dot: 'bg-sky-400' };
  return { label: 'Prospect', color: 'text-slate-400', dot: 'bg-slate-500' };
}

function StatBar({ value, max, colorA, colorB, isA }: { value: number; max: number; colorA: string; colorB: string; isA: boolean }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className={`h-2 rounded-full bg-white/10 overflow-hidden flex ${isA ? '' : 'flex-row-reverse'}`}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: isA ? colorA : colorB }}
      />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ScoutingPage({ currentRole }: { currentRole: UserRole }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('TOUS');
  const [onlyShortlist, setOnlyShortlist] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'COMPARE'>('GRID');

  // Comparateur
  const [comparePlayerAId, setComparePlayerAId] = useState<string>('');
  const [comparePlayerBId, setComparePlayerBId] = useState<string>('');

  // Notes
  const [scoutNotes, setScoutNotes] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('firestone_scout_notes') || '{}'); } catch { return {}; }
  });
  const [notePlayer, setNotePlayer] = useState<Player | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const canScout = ['SUPER_ADMIN', 'CLUB_ADMIN', 'COACH'].includes(currentRole);

  // ── Data load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(apiUrl('/players'));
        if (res.ok) {
          const data = await res.json();
          const raw: Player[] = Array.isArray(data) ? data : data?.players ?? [];
          if (mounted) {
            const list = raw.length > 0 ? raw : MOCK_PLAYERS;
            setPlayers(list);
            if (list.length >= 2) {
              setComparePlayerAId(prev => prev || list[0].id);
              setComparePlayerBId(prev => prev || list[1].id);
            }
          }
        } else {
          if (mounted) {
            setPlayers(MOCK_PLAYERS);
            setComparePlayerAId(MOCK_PLAYERS[0].id);
            setComparePlayerBId(MOCK_PLAYERS[1].id);
          }
        }

        const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
        if (session?.token && mounted) {
          const sRes = await fetch(apiUrl('/scouting/shortlist'), {
            headers: { Authorization: `Bearer ${session.token}` },
          });
          if (sRes.ok) {
            const sData = await sRes.json();
            const entries: Array<{ playerProfileId?: string }> = Array.isArray(sData) ? sData : [];
            if (mounted) setShortlist(entries.map(e => e?.playerProfileId).filter((id): id is string => typeof id === 'string'));
          }
        }
      } catch {
        if (mounted) {
          setPlayers(MOCK_PLAYERS);
          setComparePlayerAId(MOCK_PLAYERS[0].id);
          setComparePlayerBId(MOCK_PLAYERS[1].id);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Shortlist ──────────────────────────────────────────────────────────────
  const toggleShortlist = async (playerId: string) => {
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) { setMessage({ type: 'error', text: 'Connexion requise pour gérer votre carnet.' }); return; }
    const isIn = shortlist.includes(playerId);
    try {
      const res = await fetch(apiUrl(isIn ? `/scouting/shortlist/${playerId}` : '/scouting/shortlist'), {
        method: isIn ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: isIn ? undefined : JSON.stringify({ playerProfileId: playerId }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setMessage({ type: 'error', text: d?.error || 'Impossible.' }); return; }
      setShortlist(prev => isIn ? prev.filter(id => id !== playerId) : [...prev, playerId]);
      setMessage({ type: 'success', text: isIn ? 'Prospect retiré de la shortlist.' : 'Prospect ajouté à la shortlist !' });
      setTimeout(() => setMessage(null), 3000);
    } catch { setMessage({ type: 'error', text: 'Erreur réseau.' }); }
  };

  // ── Notes ──────────────────────────────────────────────────────────────────
  const openNoteEditor = (player: Player) => { setNotePlayer(player); setNoteDraft(scoutNotes[player.id] || ''); };
  const handleSaveNote = () => {
    if (!notePlayer) return;
    const updated = { ...scoutNotes, [notePlayer.id]: noteDraft.trim() };
    setScoutNotes(updated);
    localStorage.setItem('firestone_scout_notes', JSON.stringify(updated));
    setNotePlayer(null);
    setMessage({ type: 'success', text: `Rapport consigné pour ${notePlayer.name}.` });
    setTimeout(() => setMessage(null), 3000);
  };
  const addQuickTag = (tag: string) => setNoteDraft(prev => prev ? `${prev} • ${tag}` : tag);

  // ── Filtered players ───────────────────────────────────────────────────────
  const q = query.toLowerCase().trim();
  const filteredPlayers = useMemo(() =>
    players.filter(p => {
      const matchSearch = !q || (p.name?.toLowerCase().includes(q) ?? false) || (p.position?.toLowerCase().includes(q) ?? false) || (p.team?.name?.toLowerCase().includes(q) ?? false);
      const matchPos = selectedPosition === 'TOUS' || p.position?.toLowerCase().includes(selectedPosition.toLowerCase());
      const matchSL = !onlyShortlist || shortlist.includes(p.id);
      return matchSearch && matchPos && matchSL;
    }),
    [players, q, selectedPosition, onlyShortlist, shortlist]);

  // ── Compare ────────────────────────────────────────────────────────────────
  const playerA = useMemo(() => players.find(p => p.id === comparePlayerAId), [players, comparePlayerAId]);
  const playerB = useMemo(() => players.find(p => p.id === comparePlayerBId), [players, comparePlayerBId]);

  const radarData = useMemo(() => {
    const sA = playerA?.seasonStats || { ppg: 0, rpg: 0, apg: 0, efficiency: 0, fgPct: 0 };
    const sB = playerB?.seasonStats || { ppg: 0, rpg: 0, apg: 0, efficiency: 0, fgPct: 0 };
    return [
      { subject: 'Scoring',      A: Math.min(100, (sA.ppg / 28) * 100), B: Math.min(100, (sB.ppg / 28) * 100), rawA: `${sA.ppg?.toFixed(1)} pts`,  rawB: `${sB.ppg?.toFixed(1)} pts`,  max: 28 },
      { subject: 'Rebonds',      A: Math.min(100, (sA.rpg / 14) * 100), B: Math.min(100, (sB.rpg / 14) * 100), rawA: `${sA.rpg?.toFixed(1)} reb`,  rawB: `${sB.rpg?.toFixed(1)} reb`,  max: 14 },
      { subject: 'Playmaking',   A: Math.min(100, (sA.apg / 10) * 100), B: Math.min(100, (sB.apg / 10) * 100), rawA: `${sA.apg?.toFixed(1)} ast`,  rawB: `${sB.apg?.toFixed(1)} ast`,  max: 10 },
      { subject: 'Adresse (FG)', A: Math.min(100, sA.fgPct || 0),       B: Math.min(100, sB.fgPct || 0),       rawA: `${sA.fgPct || 0}%`,          rawB: `${sB.fgPct || 0}%`,          max: 70 },
      { subject: 'PER',          A: Math.min(100, ((sA.efficiency ?? 0) / 26) * 100), B: Math.min(100, ((sB.efficiency ?? 0) / 26) * 100), rawA: `${sA.efficiency ?? 0}`, rawB: `${sB.efficiency ?? 0}`, max: 26 },
    ];
  }, [playerA, playerB]);

  // ── Stats aggregate ────────────────────────────────────────────────────────
  const stats = {
    total: players.length,
    shortlisted: shortlist.length,
    withNotes: Object.keys(scoutNotes).filter(id => scoutNotes[id]).length,
    avgPpg: players.length ? (players.reduce((a, p) => a + (p.seasonStats?.ppg ?? 0), 0) / players.length).toFixed(1) : '0',
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-16">

      {/* ── Hero Header ── */}
      <div className="rounded-2xl bg-[#0C0F1A] border border-white/10 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFB800]/12 border border-[#FFB800]/25 text-[#FFB800] text-xs font-semibold">
              <Crosshair className="w-3.5 h-3.5" />
              Cellule de détection
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-none tracking-tight">
              Scouting
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
              Analysez les prospects, gérez votre shortlist, tenez vos rapports d'observation et confrontez les profils en face-à-face.
            </p>
          </div>

          {/* KPI chips */}
          <div className="flex flex-wrap gap-3 shrink-0">
            {[
              { icon: <Users className="w-4 h-4 text-sky-400" />,    value: stats.total,       label: 'Prospects' },
              { icon: <Star  className="w-4 h-4 text-amber-400" />,  value: stats.shortlisted, label: 'Shortlistés' },
              { icon: <FileText className="w-4 h-4 text-violet-400" />, value: stats.withNotes, label: 'Rapports' },
              { icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, value: stats.avgPpg, label: 'Pts moy.' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                {s.icon}
                <div>
                  <div className="text-sm font-black text-white">{s.value}</div>
                  <div className="text-[10px] text-slate-400">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mode toggle */}
        <div className="mt-6 flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
          <button
            onClick={() => setViewMode('GRID')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'GRID' ? 'bg-white text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Vivier ({players.length})
          </button>
          <button
            onClick={() => setViewMode('COMPARE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'COMPARE' ? 'bg-[#FF2A3B] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Face-à-face
          </button>
        </div>
      </div>

      {/* ── Alert banner ── */}
      {message && (
        <div className={`flex items-center justify-between p-4 rounded-2xl border text-xs font-semibold ${
          message.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : 'border-red-500/30 bg-red-500/10 text-red-300'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            {message.text}
          </div>
          <button onClick={() => setMessage(null)} className="text-current opacity-60 hover:opacity-100 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          VIEW : GRID — VIVIER DES PROSPECTS
      ══════════════════════════════════════════════════════════════ */}
      {viewMode === 'GRID' && (
        <div className="space-y-5">
          {/* Filters bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              {POSITIONS.map(pos => (
                <button
                  key={pos}
                  onClick={() => setSelectedPosition(pos)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedPosition === pos
                      ? 'bg-[#FFB800] text-black border-[#FFB800] shadow-lg shadow-amber-900/30'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {pos === 'TOUS' ? 'Tous postes' : pos}
                </button>
              ))}

              {canScout && (
                <button
                  onClick={() => setOnlyShortlist(!onlyShortlist)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    onlyShortlist
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${onlyShortlist ? 'fill-current text-[#FFB800]' : ''}`} />
                  Ma Shortlist ({shortlist.length})
                </button>
              )}
            </div>

            <div className="relative w-full lg:w-72 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Prospect, poste, club…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D0F1A] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FFB800]/50 transition-colors"
              />
            </div>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-[#0D0F1A] p-5 space-y-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-white/10" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-white/10 rounded w-3/4" />
                      <div className="h-2 bg-white/5 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-12 bg-white/5 rounded-xl" />
                  <div className="h-8 bg-white/5 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredPlayers.length === 0 && (
            <div className="py-20 text-center rounded-2xl bg-white/5 border border-white/10">
              <Binoculars className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">Aucun prospect trouvé</p>
              <p className="text-slate-600 text-sm mt-1">Ajustez vos filtres de recherche</p>
            </div>
          )}

          {/* Player grid */}
          {!loading && filteredPlayers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPlayers.map(player => {
                const isShortlisted = shortlist.includes(player.id);
                const stats = player.seasonStats || { ppg: 0, rpg: 0, apg: 0, efficiency: 0 };
                const note = scoutNotes[player.id];
                const tier = getEfficiencyTier(stats.efficiency ?? 0);
                const posColor = POS_COLOR[player.position || ''] ?? POS_COLOR['Ailier'];
                const avatar = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name || 'Joueur')}&background=1E293B&color=fff&bold=true`;

                return (
                  <article
                    key={player.id}
                    className="group relative rounded-2xl border border-white/10 bg-[#0D0F1A] hover:border-[#FFB800]/30 hover:bg-[#10121E] flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30"
                  >
                    {/* Efficiency tier ribbon */}
                    <div className="absolute top-3 right-3 z-10">
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${tier.color} bg-black/50 border border-current/20`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${tier.dot}`} />
                        {tier.label}
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Player identity */}
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={avatar}
                            alt={player.name}
                            className="w-14 h-14 rounded-xl object-cover border border-white/10"
                          />
                          {player.number !== undefined && (
                            <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg bg-[#FFB800] text-black text-[9px] font-black flex items-center justify-center shadow-md">
                              {player.number}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pr-8">
                          <h3 className="text-base font-black text-white truncate group-hover:text-[#FFB800] transition-colors">
                            {player.name}
                          </h3>
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${posColor.bg} ${posColor.text} ${posColor.border}`}>
                              {player.position || '—'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 truncate">
                            {player.team?.name || 'Franchise Libre'}
                            {player.age ? ` · ${player.age} ans` : ''}
                            {player.height ? ` · ${player.height}` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-4 gap-1 p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                        {[
                          { key: 'PTS', val: stats.ppg?.toFixed(1), color: 'text-white' },
                          { key: 'REB', val: stats.rpg?.toFixed(1), color: 'text-white' },
                          { key: 'AST', val: stats.apg?.toFixed(1), color: 'text-white' },
                          { key: 'PER', val: stats.efficiency,       color: 'text-emerald-400' },
                        ].map(s => (
                          <div key={s.key} className="py-1">
                            <div className="text-[10px] font-semibold text-slate-400">{s.key}</div>
                            <div className={`text-sm font-black font-mono ${s.color}`}>{s.val ?? '—'}</div>
                          </div>
                        ))}
                      </div>

                      {/* Scout note preview */}
                      {note && (
                        <div className="p-2.5 rounded-xl bg-[#FFB800]/8 border border-[#FFB800]/20 text-[11px] text-slate-300 flex items-start gap-2">
                          <FileText className="w-3 h-3 text-[#FFB800] shrink-0 mt-0.5" />
                          <span className="line-clamp-2 italic">« {note} »</span>
                        </div>
                      )}
                    </div>

                    {/* Card footer */}
                    <div className="mt-auto px-5 pb-4 pt-3 border-t border-white/5 flex items-center gap-2">
                      <button
                        onClick={() => { setComparePlayerAId(player.id); setViewMode('COMPARE'); }}
                        className="flex-1 py-2 px-3 rounded-xl bg-white/8 hover:bg-white/15 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                        Confronter
                      </button>

                      {canScout && (
                        <>
                          <button
                            onClick={() => toggleShortlist(player.id)}
                            className={`p-2 rounded-xl border transition-all ${
                              isShortlisted
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                            }`}
                            title={isShortlisted ? 'Retirer' : 'Shortlister'}
                          >
                            <Star className={`w-4 h-4 ${isShortlisted ? 'fill-current text-[#FFB800]' : ''}`} />
                          </button>
                          <button
                            onClick={() => openNoteEditor(player)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 transition-colors"
                            title="Rédiger rapport"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          VIEW : COMPARE — FACE-À-FACE DIRECT
      ══════════════════════════════════════════════════════════════ */}
      {viewMode === 'COMPARE' && (
        <div className="space-y-6">
          {/* Player selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Player A */}
            <div className="rounded-2xl border border-[#FF2A3B]/25 bg-[#100A0A] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
                  <div className="w-2 h-2 rounded-full bg-[#FF2A3B]" />
                  Joueur A
                </div>
                <select
                  value={comparePlayerAId}
                  onChange={e => setComparePlayerAId(e.target.value)}
                  className="rounded-xl px-3 py-1.5 text-xs bg-[#0D0F1A] border border-red-500/30 text-white font-bold"
                >
                  {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.position || '—'})</option>)}
                </select>
              </div>
              {playerA && (
                <div className="flex items-center gap-4">
                  <img
                    src={playerA.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(playerA.name)}&background=991B1B&color=fff&bold=true`}
                    alt={playerA.name}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-[#FF2A3B]/50"
                  />
                  <div>
                    <h3 className="text-lg font-black text-white">{playerA.name}</h3>
                    <p className="text-xs text-red-300">{playerA.position || '—'}</p>
                    <p className="text-[11px] text-slate-400">
                      {[playerA.age && `${playerA.age} ans`, playerA.height, playerA.team?.name].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Player B */}
            <div className="rounded-2xl border border-cyan-500/25 bg-[#060D10] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                  <div className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                  Joueur B
                </div>
                <select
                  value={comparePlayerBId}
                  onChange={e => setComparePlayerBId(e.target.value)}
                  className="rounded-xl px-3 py-1.5 text-xs bg-[#0D0F1A] border border-cyan-500/30 text-white font-bold"
                >
                  {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.position || '—'})</option>)}
                </select>
              </div>
              {playerB && (
                <div className="flex items-center gap-4">
                  <img
                    src={playerB.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(playerB.name)}&background=0E7490&color=fff&bold=true`}
                    alt={playerB.name}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-cyan-500/50"
                  />
                  <div>
                    <h3 className="text-lg font-black text-white">{playerB.name}</h3>
                    <p className="text-xs text-cyan-300">{playerB.position || '—'}</p>
                    <p className="text-[11px] text-slate-400">
                      {[playerB.age && `${playerB.age} ans`, playerB.height, playerB.team?.name].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comparison panels */}
          {playerA && playerB && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Radar chart */}
              <div className="lg:col-span-6 rounded-2xl border border-white/10 bg-[#0D0F1A] p-6 space-y-4">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FFB800]" />
                  Polygone de Compétences
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.07)" />
                      <PolarAngleAxis dataKey="subject" stroke="#64748B" tick={{ fontSize: 10, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.06)" />
                      <Radar name={playerA.name} dataKey="A" stroke="#FF2A3B" fill="#FF2A3B" fillOpacity={0.3} />
                      <Radar name={playerB.name} dataKey="B" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.3} />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0D0F1A', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', fontSize: '11px' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Differential bars */}
              <div className="lg:col-span-6 rounded-2xl border border-white/10 bg-[#0D0F1A] p-6 space-y-4">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                  Différentiel Direct
                </h4>

                <div className="space-y-3">
                  {radarData.map(stat => {
                    const diff = stat.A - stat.B;
                    const winner = diff > 2 ? playerA.name.split(' ')[0] : diff < -2 ? playerB.name.split(' ')[0] : null;
                    return (
                      <div key={stat.subject} className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-red-300 font-mono">{stat.rawA}</span>
                          <div className="text-center">
                            <span className="font-bold text-white">{stat.subject}</span>
                            {winner && (
                              <span className={`ml-2 text-[9px] font-black px-1.5 py-0.5 rounded-full ${diff > 0 ? 'bg-red-500/20 text-red-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                                + {winner}
                              </span>
                            )}
                          </div>
                          <span className="font-black text-cyan-300 font-mono">{stat.rawB}</span>
                        </div>
                        {/* Dual bar */}
                        <div className="flex gap-1 h-2">
                          <StatBar value={stat.A} max={100} colorA="#FF2A3B" colorB="#06B6D4" isA={true} />
                          <StatBar value={stat.B} max={100} colorA="#FF2A3B" colorB="#06B6D4" isA={false} />
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

      {/* ══════════════════════════════════════════════════════════════
          MODAL — SCOUT NOTE EDITOR
      ══════════════════════════════════════════════════════════════ */}
      {notePlayer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setNotePlayer(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0D0F1A] p-6 sm:p-8 space-y-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={notePlayer.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(notePlayer.name)}&background=1E293B&color=fff&bold=true`}
                  alt={notePlayer.name}
                  className="w-12 h-12 rounded-xl object-cover border border-white/10"
                />
                <div>
                  <h3 className="text-lg font-black text-white">{notePlayer.name}</h3>
                  <p className="text-xs text-slate-400">{notePlayer.position} · {notePlayer.team?.name || 'Franchise'}</p>
                </div>
              </div>
              <button onClick={() => setNotePlayer(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick tags */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Tags rapides</label>
              <div className="flex flex-wrap gap-1.5">
                {SCOUTING_TAG_SUGGESTIONS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => addQuickTag(tag)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#FFB800]/15 hover:text-[#FFB800] text-slate-300 border border-white/10 hover:border-[#FFB800]/30 transition-all"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Rapport d'observation</label>
              <textarea
                value={noteDraft}
                onChange={e => setNoteDraft(e.target.value)}
                placeholder="Forces, faiblesses, attitude, lecture de jeu, comportement sous pression…"
                className="w-full rounded-xl p-3.5 text-xs bg-[#090A0F] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#FFB800]/50 min-h-[120px] resize-none transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setNotePlayer(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveNote}
                className="flex-1 py-3 rounded-xl bg-[#FFB800] hover:bg-[#E6A600] text-black text-xs font-black transition-all"
              >
                Consigner l'observation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}