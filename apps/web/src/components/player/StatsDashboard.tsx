import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,   // ⚠️ alias pour éviter le conflit avec lucide
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { apiUrl } from '../../services/api';
// ✅ Import du VRAI type (adapte le chemin selon ton arborescence)
import type { ApiPlayer } from '../../services/clubApi';
import {
  Flame, Trophy, Award, Target, Activity, Zap, TrendingUp, Users,
  X, CheckCircle2, Star,
  BarChart3 as BarChartIcon,      // ✅ icône lucide (n'existe pas de "BarChart" simple)
} from 'lucide-react';

export const StatsDashboard: React.FC = () => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<ApiPlayer[]>([]);

  useEffect(() => {
    fetch(apiUrl('/players'))
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        setPlayers(Array.isArray(data) ? data : (data.players ?? []));
      })
      .catch(() => undefined);
  }, []);

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId) || null;

  // ─── Helpers alignés sur la vraie ApiPlayer ─────────────────────────────
  const playerName = (p: ApiPlayer) =>
    p.name || `Joueur #${p.number ?? '?'}`;

  const playerAvatar = (p: ApiPlayer) =>
    p.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName(p))}&background=B91C1C&color=fff`;

  // ─── Données charts (baseline équipe, non persistées) ───────────────────
  const recentGamesData = [
    { game: 'Match 1', points: 94, opponentPoints: 86 },
    { game: 'Match 2', points: 89, opponentPoints: 78 },
    { game: 'Match 3', points: 92, opponentPoints: 75 },
    { game: 'Match 4', points: 85, opponentPoints: 72 },
    { game: 'Match 5', points: 82, opponentPoints: 60 },
  ];

  const shotSelectionData = [
    { name: 'Tirs à 2 Pts', value: 48, color: '#B91C1C' },
    { name: 'Tirs à 3 Pts', value: 32, color: '#D97706' },
    { name: 'Lancers Francs', value: 20, color: '#3B82F6' },
  ];

  const radarData = [
    { subject: 'Tir & Adresse', A: 92, fullMark: 100 },
    { subject: 'Passe & Vision', A: 95, fullMark: 100 },
    { subject: 'Défense', A: 94, fullMark: 100 },
    { subject: 'Athlétisme', A: 90, fullMark: 100 },
    { subject: 'QI Basket', A: 96, fullMark: 100 },
    { subject: 'Rebond', A: 88, fullMark: 100 },
  ];

  return (
    <div className="space-y-8 pb-12">

      {/* ─── HEADER ───────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D97706]/20 text-[#D97706] text-xs font-bold uppercase tracking-wider mb-2 border border-[#D97706]/30">
            <Trophy className="w-3.5 h-3.5 text-[#B91C1C]" /> Analytics Pro & Performance
          </div>
          <h2 className="text-3xl font-extrabold text-white">Tableau des Statistiques Avancées</h2>
          <p className="text-slate-400 text-sm">
            {selectedPlayer
              ? `Profil joueur : ${playerName(selectedPlayer)} (#${selectedPlayer.number ?? '?'}).`
              : 'Analyse globale des métriques collectives de FIRE STONE. Cliquez sur un joueur pour voir son profil.'}
          </p>
        </div>

        {selectedPlayer && (
          <button
            onClick={() => setSelectedPlayerId(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition-all self-start md:self-auto"
          >
            <X className="w-4 h-4 text-[#B91C1C]" />
            <span>Réinitialiser (Vue Équipe Globale)</span>
          </button>
        )}
      </div>

      {/* ─── PLAYER SELECTOR BAR ──────────────────────────────────────── */}
      <div className="glass-panel p-4 rounded-3xl border border-white/10 space-y-3 bg-[#0A0C13]">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider px-1">
          <span className="flex items-center gap-1.5 text-[#D97706]">
            <Users className="w-4 h-4 text-[#B91C1C]" /> Filtrer par Joueur :
          </span>
          <span>{selectedPlayer ? `Joueur : ${playerName(selectedPlayer)}` : 'Mode : Équipe Globale (Tous)'}</span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-1">
          <button
            onClick={() => setSelectedPlayerId(null)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all shrink-0 ${
              selectedPlayerId === null
                ? 'bg-linear-to-r from-[#B91C1C] to-[#881337] text-white border-red-700/50 shadow-md shadow-red-950/40'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-[#D97706]" />
            <span>🏀 Équipe Globale</span>
          </button>

          {players.length === 0 ? (
            <span className="text-xs text-slate-500 italic">Chargement des joueurs...</span>
          ) : (
            players.map((player) => {
              const isSelected = selectedPlayerId === player.id;
              return (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayerId(isSelected ? null : player.id)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-linear-to-r from-[#B91C1C] to-[#881337] text-white border-red-700/60 shadow-lg shadow-red-950/40'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <img
                    src={playerAvatar(player)}
                    alt={playerName(player)}
                    className={`w-7 h-7 rounded-xl object-cover border ${isSelected ? 'border-[#D97706]' : 'border-white/20'}`}
                  />
                  <span>#{player.number ?? '?'} {playerName(player).split(' ')[0]}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#D97706]" />}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── SELECTED PLAYER BANNER ───────────────────────────────────── */}
      {selectedPlayer && (
        <div className="bg-linear-to-r from-[#B91C1C]/30 via-amber-950/30 to-[#0A0C13] border border-[#B91C1C]/40 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={playerAvatar(selectedPlayer)}
              alt={playerName(selectedPlayer)}
              className="w-12 h-12 rounded-xl object-cover border-2 border-[#D97706] shadow-md"
            />
            <div>
              <div className="font-extrabold text-white text-base flex items-center gap-2">
                <span>{playerName(selectedPlayer)}</span>
                <span className="px-2 py-0.5 rounded-full bg-[#D97706] text-black text-[10px] font-black">
                  #{selectedPlayer.number ?? '?'} — {selectedPlayer.position || 'Joueur'}
                </span>
              </div>
              {selectedPlayer.bio && (
                <p className="text-xs text-slate-300 line-clamp-1">{selectedPlayer.bio}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => setSelectedPlayerId(null)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors shrink-0"
            title="Revenir aux stats globales"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ─── TOP STAT CARDS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{selectedPlayer ? 'Expérience & Âge' : 'Joueurs inscrits'}</span>
            <Flame className="w-4 h-4 text-[#B91C1C]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {selectedPlayer
              ? `${selectedPlayer.experienceYears ?? '?'} Ans Exp.`
              : `${players.length} Joueurs`}
          </div>
          <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {selectedPlayer ? `${selectedPlayer.age ?? '?'} ans` : 'Profils actifs'}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Moyenne de Points</span>
            <Target className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gradient-fire">
            {selectedPlayer ? (selectedPlayer.seasonStats?.ppg ?? '—') : '88.5'}
          </div>
          <div className="text-xs text-slate-400">PTS marqués / match</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Réussite aux Tirs (FG)</span>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gradient-gold">
            {selectedPlayer
              ? (selectedPlayer.seasonStats?.fgPct != null
                  ? `${selectedPlayer.seasonStats.fgPct}%`
                  : '—')
              : '48.6%'}
          </div>
          <div className="text-xs text-slate-400">
            {selectedPlayer
              ? (selectedPlayer.seasonStats?.threePtPct != null
                  ? `${selectedPlayer.seasonStats.threePtPct}% à 3 points`
                  : 'Stats non disponibles')
              : '38.2% à 3 points'}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Passes & Rebonds</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {selectedPlayer
              ? `${selectedPlayer.seasonStats?.apg ?? '—'} / ${selectedPlayer.seasonStats?.rpg ?? '—'}`
              : '24.3 / 42.1'}
          </div>
          <div className="text-xs text-slate-400">AST / REB par rencontre</div>
        </div>
      </div>

      {/* ─── MAIN CHARTS GRID ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Bar chart : team vs player form */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChartIcon className="w-4 h-4 text-[#B91C1C]" />
                {selectedPlayer
                  ? `Forme Recente : ${playerName(selectedPlayer)}`
                  : 'Points Marqués vs Adverses (Équipe)'}
              </h3>
              <p className="text-xs text-slate-400">
                {selectedPlayer
                  ? 'Points marqués sur ses 5 derniers matchs'
                  : 'Progression offensive lors des 5 derniers matchs'}
              </p>
            </div>
            <span className="text-xs text-[#D97706] font-bold bg-[#D97706]/10 px-2.5 py-1 rounded-full border border-[#D97706]/20">
              {selectedPlayer
                ? `PER: ${selectedPlayer.seasonStats?.efficiency ?? '—'}`
                : 'Saison Régulière'}
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={recentGamesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="game" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090A0F', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#FFF' }}
                />
                <Bar
                  dataKey="points"
                  name={selectedPlayer ? playerName(selectedPlayer) : 'FIRE STONE'}
                  fill="#B91C1C"
                  radius={[6, 6, 0, 0]}
                />
                {!selectedPlayer && (
                  <Bar dataKey="opponentPoints" name="Adversaire" fill="#475569" radius={[6, 6, 0, 0]} />
                )}
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar chart */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D97706]" />
              {selectedPlayer
                ? `Radar de Compétences (${playerName(selectedPlayer)})`
                : "Radar d'Équipe Global"}
            </h3>
            <p className="text-xs text-slate-400">
              {selectedPlayer
                ? 'Évaluation individuelle des 6 piliers du jeu'
                : 'Profil de jeu global du collectif'}
            </p>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" stroke="#CBD5E1" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="none" />
                <Radar
                  name={selectedPlayer ? playerName(selectedPlayer) : 'FIRE STONE'}
                  dataKey="A"
                  stroke="#D97706"
                  fill="#D97706"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── SECOND ROW : PIE + LEADERBOARD/ACHIEVEMENTS ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Shot selection donut */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white">
            {selectedPlayer
              ? `Sélection de Tirs (${playerName(selectedPlayer)})`
              : 'Répartition de la Sélection de Tirs'}
          </h3>
          <p className="text-xs text-slate-400">
            {selectedPlayer
              ? "Estimation de la répartition d'adresse aux tirs"
              : "Pourcentage des points inscrits par l'équipe selon le type de tir"}
          </p>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={shotSelectionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {shotSelectionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#090A0F', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-around text-xs pt-2 border-t border-white/10">
            {shotSelectionData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard / Achievements */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center justify-between">
            <span>
              {selectedPlayer
                ? `Palmarès & Récompenses (${playerName(selectedPlayer)})`
                : 'Classement des Meilleurs Marqueurs'}
            </span>
            <span className="text-xs text-slate-400 font-normal">PER Rating</span>
          </h3>

          {selectedPlayer ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                <img
                  src={playerAvatar(selectedPlayer)}
                  alt={playerName(selectedPlayer)}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D97706]"
                />
                <div className="space-y-1">
                  <div className="font-extrabold text-white text-base">{playerName(selectedPlayer)}</div>
                  <div className="text-xs text-[#D97706] font-bold">
                    #{selectedPlayer.number ?? '?'} — {selectedPlayer.position || 'Joueur'}
                  </div>
                  <div className="text-xs text-slate-300">
                    Taille : <strong>{selectedPlayer.height || '—'}</strong> • Poids :{' '}
                    <strong>{selectedPlayer.weight || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* ⚠️ `achievements` = string[] dans la vraie ApiPlayer */}
              {selectedPlayer.achievements && selectedPlayer.achievements.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#D97706] uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5" /> Badges & Récompenses
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedPlayer.achievements.map((achievement, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-200 flex items-center gap-2"
                      >
                        <Award className="w-4 h-4 text-[#D97706] shrink-0" />
                        <span>{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic text-center py-4">
                  Aucun badge décerné pour le moment.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {players.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">Chargement des joueurs...</p>
              ) : (
                players.map((player, idx) => (
                  <div
                    key={player.id}
                    onClick={() => setSelectedPlayerId(player.id)}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                          idx === 0
                            ? 'bg-[#D97706] text-black'
                            : idx === 1
                            ? 'bg-slate-300 text-black'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <img
                        src={playerAvatar(player)}
                        alt={playerName(player)}
                        className="w-8 h-8 rounded-lg object-cover border border-white/10"
                      />
                      <div>
                        <span className="font-bold text-white text-sm block">{playerName(player)}</span>
                        <span className="text-[10px] text-[#D97706] font-semibold">
                          #{player.number ?? '?'} • {player.position || 'Joueur'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs">
                      <div className="text-right border-l border-white/10 pl-4">
                        <span className="font-black text-[#D97706] text-sm">
                          {player.experienceYears ?? '?'}
                        </span>
                        <span className="text-slate-400 block text-[10px]">Ans Exp.</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};