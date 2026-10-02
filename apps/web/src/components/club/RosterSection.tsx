import React, { useEffect, useState } from 'react';
import type { Player, PlayerCategory, PlayerGender, UserRole, PlayerGameLog } from '../../types';
import { apiUrl } from '../../services/api';
import type { ApiPlayer } from '../../services/clubApi'
import { useClub } from '../../context/ClubContext';
import {
  User as UserIcon,
  Flame,
  X,
  Award,
  Activity,
  Plus,
  Trash2,
  Edit,
  Calendar,
  Filter,
  Save,
  Wand2,
  Loader2,
  Sparkles,
  Shield,
  Zap,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface RosterSectionProps {
  currentRole?: UserRole;
}

export const RosterSection: React.FC<RosterSectionProps> = ({ currentRole = 'SUPER_ADMIN' }) => {
  const isAuthorized = ['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER', 'CLUB_ADMIN', 'COACH'].includes(currentRole);
  const { roster: clubRoster, activeClub } = useClub();

  const [playersList, setPlayersList] = useState<Player[]>([]);
  const [rosterSyncError, setRosterSyncError] = useState<string | null>(null);
  const [positionFilter, setPositionFilter] = useState<string>('TOUS');
  const [categoryFilter, setCategoryFilter] = useState<string>('TOUS');
  const [genderFilter, setGenderFilter] = useState<string>('TOUS');

  // Selected Player Profile Modal
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedGameLog, setSelectedGameLog] = useState<PlayerGameLog | null>(null);

  // Admin Modal (Add or Edit Player)
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

  // Background Removal AI State
  const [removingBg, setRemovingBg] = useState(false);
  const [removeBgError, setRemoveBgError] = useState<string | null>(null);

  useEffect(() => {
    setPlayersList(
      clubRoster.map((p) => ({
        id: p.id,
        name: p.name,
        number: p.number,
        position: (p.position as any) || 'Meneur',
        category: (p.category as any) || 'SENIOR',
        gender: (p.gender as any) || 'MASCULIN',
        height: p.height,
        weight: p.weight,
        age: p.age,
        photo: p.photo,
        bio: p.bio || '',
        experienceYears: p.experienceYears ?? 0,
        seasonStats: {
          ppg: p.seasonStats?.ppg ?? 0,
          rpg: p.seasonStats?.rpg ?? 0,
          apg: p.seasonStats?.apg ?? 0,
          spg: p.seasonStats?.spg ?? 0,
          bpg: p.seasonStats?.bpg ?? 0,
          fgPct: p.seasonStats?.fgPct ?? 0,
          threePtPct: p.seasonStats?.threePtPct ?? 0,
          ftPct: p.seasonStats?.ftPct ?? 0,
          efficiency: p.seasonStats?.efficiency ?? 0,
        },
        achievements: p.achievements ?? [],
        skillsRadar: { shooting: 75, passing: 75, defense: 75, athleticism: 75, iq: 75, rebounding: 75 },
        recentForm: [],
        matchHistory: [],
      }))
    );
  }, [clubRoster]);

  const handleRemoveBackground = async () => {
    const photoUrl = formData.photo;
    if (!photoUrl || photoUrl.startsWith('data:')) {
      setRemoveBgError("Entrez d'abord une URL d'image valide.");
      return;
    }
    setRemovingBg(true);
    setRemoveBgError(null);
    try {
      const removeBgUrl = import.meta.env.VITE_REMOVE_BG_URL || 'http://localhost:5050/remove-bg';
      const response = await fetch(removeBgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: photoUrl }),
      });
      const data = await response.json();
      if (data.success && data.dataUrl) {
        setFormData((prev) => ({ ...prev, photo: data.dataUrl }));
        setRemoveBgError(null);
      } else {
        setRemoveBgError(data.error || 'Erreur inconnue lors du traitement.');
      }
    } catch {
      setRemoveBgError('Serveur de détourage IA rembg inaccessible.');
    } finally {
      setRemovingBg(false);
    }
  };

  // Full Form Data for Player
  const [formData, setFormData] = useState({
    name: '',
    number: 1,
    position: 'Meneur' as 'Meneur' | 'Arrière' | 'Ailier' | 'Ailier Fort' | 'Pivot',
    category: 'SENIOR' as PlayerCategory,
    gender: 'MASCULIN' as PlayerGender,
    height: '',
    weight: '',
    age: 20,
    photo: '',
    bio: '',
    experienceYears: 1,
    ppg: 0,
    rpg: 0,
    apg: 0,
    spg: 0,
    bpg: 0,
    fgPct: 0,
    threePtPct: 0,
    ftPct: 0,
    efficiency: 0,
    achievementsStr: '',
    shooting: 75,
    passing: 75,
    defense: 75,
    athleticism: 75,
    iq: 75,
    rebounding: 75
  });

  const positions = [
    { label: 'Tous', value: 'TOUS', code: 'ALL' },
    { label: 'Meneur', value: 'Meneur', code: 'PG' },
    { label: 'Arrière', value: 'Arrière', code: 'SG' },
    { label: 'Ailier', value: 'Ailier', code: 'SF' },
    { label: 'Ailier Fort', value: 'Ailier Fort', code: 'PF' },
    { label: 'Pivot', value: 'Pivot', code: 'C' },
  ];

  const categories = [
    { id: 'TOUS', label: 'Toutes Sélections' },
    { id: 'SENIOR', label: '🔴 Seniors Pro' },
    { id: 'JUNIOR', label: '🟡 Juniors (U18)' },
    { id: 'MINIME', label: '⚡ Minimes (U15)' },
  ];

  const genders = [
    { id: 'TOUS', label: 'Tous Genres' },
    { id: 'MASCULIN', label: '🏀 Masculin' },
    { id: 'FÉMININ', label: '🌸 Féminin' },
    { id: 'MIXTE', label: '🤝 Mixte' },
  ];

  const filteredPlayers = playersList.filter((p) => {
    if (positionFilter !== 'TOUS' && p.position.toUpperCase() !== positionFilter.toUpperCase()) return false;
    if (categoryFilter !== 'TOUS' && p.category !== categoryFilter) return false;
    if (genderFilter !== 'TOUS' && p.gender !== genderFilter) return false;
    return true;
  });

  const handleOpenAddModal = () => {
    setEditingPlayerId(null);
    setFormData({
      name: '',
      number: 1,
      position: 'Meneur',
      category: 'SENIOR',
      gender: 'MASCULIN',
      height: '1m90',
      weight: '84 kg',
      age: 21,
      photo: '',
      bio: '',
      experienceYears: 2,
      ppg: 12.5,
      rpg: 4.2,
      apg: 5.1,
      spg: 1.2,
      bpg: 0.5,
      fgPct: 46.5,
      threePtPct: 36.0,
      ftPct: 81.0,
      efficiency: 15.0,
      achievementsStr: '',
      shooting: 75,
      passing: 75,
      defense: 75,
      athleticism: 75,
      iq: 75,
      rebounding: 75
    });
    setShowAdminModal(true);
  };

  const handleOpenEditModal = (player: Player, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPlayerId(player.id);
    setFormData({
      name: player.name,
      number: player.number,
      position: player.position,
      category: player.category || 'SENIOR',
      gender: player.gender || 'MASCULIN',
      height: player.height,
      weight: player.weight,
      age: player.age,
      photo: player.photo,
      bio: player.bio,
      experienceYears: player.experienceYears,
      ppg: player.seasonStats?.ppg ?? 0,
      rpg: player.seasonStats?.rpg ?? 0,
      apg: player.seasonStats?.apg ?? 0,
      spg: player.seasonStats?.spg ?? 1.4,
      bpg: player.seasonStats?.bpg ?? 0.8,
      fgPct: player.seasonStats?.fgPct ?? 48.0,
      threePtPct: player.seasonStats?.threePtPct ?? 37.5,
      ftPct: player.seasonStats?.ftPct ?? 79.0,
      efficiency: player.seasonStats?.efficiency ?? 20.0,
      achievementsStr: (player.achievements || []).join(', '),
      shooting: player.skillsRadar?.shooting ?? 80,
      passing: player.skillsRadar?.passing ?? 80,
      defense: player.skillsRadar?.defense ?? 80,
      athleticism: player.skillsRadar?.athleticism ?? 80,
      iq: player.skillsRadar?.iq ?? 80,
      rebounding: player.skillsRadar?.rebounding ?? 80
    });
    setShowAdminModal(true);
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const achievementsList = formData.achievementsStr
      ? formData.achievementsStr.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
      : [];

    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    const playerPayload = {
      name: formData.name,
      number: formData.number,
      position: formData.position,
      category: formData.category,
      gender: formData.gender,
      height: formData.height,
      weight: formData.weight,
      age: formData.age,
      photo: formData.photo,
      bio: formData.bio,
      experienceYears: formData.experienceYears,
      ppg: formData.ppg,
      rpg: formData.rpg,
      apg: formData.apg,
      spg: formData.spg,
      bpg: formData.bpg,
      fgPct: formData.fgPct,
      threePtPct: formData.threePtPct,
      ftPct: formData.ftPct,
      efficiency: formData.efficiency,
      achievements: achievementsList,
      skillsRadar: {
        shooting: formData.shooting,
        passing: formData.passing,
        defense: formData.defense,
        athleticism: formData.athleticism,
        iq: formData.iq,
        rebounding: formData.rebounding
      },
    };

    let synced = false;
    if (session?.token) {
      const response = await fetch(apiUrl(editingPlayerId ? `/players/${editingPlayerId}` : '/players'), {
        method: editingPlayerId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(playerPayload),
      }).catch(() => null);

      if (response?.ok) {
        const data = await response.json();
        const savedPlayer = data.player as Player;
        if (editingPlayerId) {
          setPlayersList((current) => current.map((p) => p.id === editingPlayerId ? savedPlayer : p));
        } else if (savedPlayer) {
          setPlayersList((current) => [savedPlayer, ...current]);
        }
        synced = true;
        setRosterSyncError(null);
      }
    }

    if (!synced) {
      if (editingPlayerId) {
        const updatedList = playersList.map((p) => {
          if (p.id === editingPlayerId) {
            const updated: Player = {
              ...p,
              ...playerPayload,
              seasonStats: {
                ppg: formData.ppg,
                rpg: formData.rpg,
                apg: formData.apg,
                spg: formData.spg,
                bpg: formData.bpg,
                fgPct: formData.fgPct,
                threePtPct: formData.threePtPct,
                ftPct: formData.ftPct,
                efficiency: formData.efficiency
              }
            };
            if (selectedPlayer?.id === p.id) setSelectedPlayer(updated);
            return updated;
          }
          return p;
        });
        setPlayersList(updatedList);
      } else {
        const newPlayer: Player = {
          id: `p_${Date.now()}`,
          ...playerPayload,
          seasonStats: {
            ppg: formData.ppg,
            rpg: formData.rpg,
            apg: formData.apg,
            spg: formData.spg,
            bpg: formData.bpg,
            fgPct: formData.fgPct,
            threePtPct: formData.threePtPct,
            ftPct: formData.ftPct,
            efficiency: formData.efficiency
          },
          recentForm: [16, 18, 14, 20, 15],
          matchHistory: [
            { matchId: 'm1', opponent: 'Étoile Filante de Lomé', date: '2026-08-14', pts: 18, reb: 5, ast: 6, stl: 2, blk: 1, min: 28, isMvp: true }
          ]
        };
        setPlayersList([newPlayer, ...playersList]);
      }
    }

    setShowAdminModal(false);
  };

  const handleDeletePlayer = async (playerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Voulez-vous vraiment retirer cet athlète de l'effectif ?")) return;
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (session?.token) {
      const response = await fetch(apiUrl(`/players/${playerId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      }).catch(() => null);
      if (!response?.ok) setRosterSyncError('Retrait local uniquement : synchronisation serveur différée.');
    }
    setPlayersList((current) => current.filter((p) => p.id !== playerId));
    if (selectedPlayer?.id === playerId) setSelectedPlayer(null);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#121626] via-[#0C101A] to-[#07090F] p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-600/15 via-amber-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/15 border border-red-500/30 text-red-300 text-[11px] font-black uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Effectif Officiel et Académie
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px] font-semibold">
                {activeClub?.name || 'Club'} • D1 Nationale
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Tableau des Athlètes et Staff
            </h1>

            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Consultez l'ensemble des forces en présence : fiches athlètes 3D, mensurations,
              radars de compétences individuels et game logs de match.
            </p>
            {rosterSyncError && (
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl inline-block">
                ⚠️ {rosterSyncError}
              </p>
            )}
          </div>

          {isAuthorized && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[#FF2A3B] hover:bg-[#e6001f] text-white font-black text-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un Athlète</span>
            </button>
          )}
        </div>

        {/* Quick Team Roster Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Effectif Total</span>
            <span className="text-2xl font-black text-white">{playersList.length} Athlètes</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Poste Majeur</span>
            <span className="text-2xl font-black text-amber-400">Arrières et Ailiers</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Pôle Pro Senior</span>
            <span className="text-2xl font-black text-white">
              {playersList.filter((p) => p.category === 'SENIOR').length} Joueurs
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Filière Espoirs</span>
            <span className="text-2xl font-black text-emerald-400">
              {playersList.filter((p) => p.category !== 'SENIOR').length} U18/U15
            </span>
          </div>
        </div>
      </div>

      {/* FILTER BAR: CATEGORIES, GENDERS & POSITIONS */}
      <div className="rounded-3xl border border-white/10 bg-[#0F131F] p-4 sm:p-5 space-y-3.5 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-white/5">
          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Niveau :
            </span>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryFilter(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${categoryFilter === c.id
                  ? 'bg-amber-500 text-black font-black shadow-md'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5" /> Genre :
            </span>
            {genders.map((g) => (
              <button
                key={g.id}
                onClick={() => setGenderFilter(g.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${genderFilter === g.id
                  ? 'bg-red-600 text-white font-black shadow-md'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Position Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Poste :</span>
          {positions.map((pos) => (
            <button
              key={pos.value}
              onClick={() => setPositionFilter(pos.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${positionFilter === pos.value
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white font-black shadow-md'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                }`}
            >
              <span className="text-[9px] px-1 py-0.5 rounded bg-black/30 font-mono">{pos.code}</span>
              <span>{pos.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* PLAYERS GRID WITH 3D POP-OUT CARD PRESENTATION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-red-500" />
            Effectif Sélectionné ({filteredPlayers.length})
          </h3>
          <span className="text-xs text-slate-400">
            Cliquez sur un athlète pour ouvrir sa fiche technique et son historique
          </span>
        </div>

        {filteredPlayers.length === 0 ? (
          <div className="p-12 rounded-3xl border border-white/10 bg-[#0F131F] text-center space-y-3">
            <Shield className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-white">Aucun athlète dans cette sélection</p>
            <p className="text-xs text-slate-400">Modifiez les filtres de catégorie ou de poste pour afficher l'effectif.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlayers.map((player) => (
              <div
                key={player.id}
                onClick={() => {
                  setSelectedPlayer(player);
                  setSelectedGameLog(player.matchHistory && player.matchHistory[0] ? player.matchHistory[0] : null);
                }}
                className="group relative cursor-pointer select-none"
              >
                {/* 3D POP-OUT CARD OUTER CONTAINER */}
                <div className="relative rounded-3xl bg-gradient-to-b from-[#131826] to-[#0A0D14] border border-white/10 p-4 pt-3 transition-all duration-400 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-red-950/50 group-hover:border-amber-500/40 overflow-hidden">

                  {/* Category & Gender Badges overlay */}
                  <div className="flex items-center justify-between relative z-30">
                    <span className="px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-300 font-black text-[10px] uppercase border border-red-500/30">
                      {player.category || 'SENIOR'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] uppercase border border-amber-500/30">
                      {player.gender === 'FÉMININ' ? '🌸 Filles' : player.gender === 'MIXTE' ? '🤝 Mixte' : '🏀 Garçons'}
                    </span>
                  </div>

                  {/* Character Frame with Jersey Watermark */}
                  <div className="relative h-60 w-full overflow-hidden flex justify-center items-end my-2 rounded-2xl">
                    <div className="absolute bottom-2 inset-x-2 h-44 rounded-2xl bg-gradient-to-t from-red-600/30 via-amber-500/10 to-transparent border border-white/5 group-hover:from-red-600/50 transition-all duration-500" />

                    <div className="absolute top-2 left-3 text-6xl font-black text-white/[0.07] group-hover:text-amber-400/20 transition-colors pointer-events-none font-mono">
                      #{player.number}
                    </div>

                    <img
                      src={player.photo || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=80'}
                      alt={player.name}
                      className="relative z-20 max-h-[220px] max-w-[210px] w-auto h-auto object-contain transition-all duration-500 group-hover:scale-105 filter drop-shadow-[0_12px_12px_rgba(0,0,0,0.8)] pointer-events-none rounded-xl"
                    />
                  </div>

                  {/* Card Bottom Details */}
                  <div className="relative z-30 pt-2 space-y-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-black text-white text-base group-hover:text-amber-400 transition-colors line-clamp-1">
                          {player.name}
                        </div>
                        <div className="text-xs text-slate-400 font-semibold">
                          #{player.number} • <span className="text-amber-400 font-bold">{player.position}</span>
                        </div>
                      </div>

                      {/* Admin Quick Buttons */}
                      {isAuthorized && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleOpenEditModal(player, e)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/20 text-slate-300 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeletePlayer(player.id, e)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            title="Retirer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Season Metrics Strip */}
                    <div className="grid grid-cols-3 gap-1 bg-black/60 p-2 rounded-xl border border-white/5 text-center text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">PTS/M</span>
                        <span className="font-black text-white">{player.seasonStats?.ppg ?? 0}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">REB</span>
                        <span className="font-black text-white">{player.seasonStats?.rpg ?? 0}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">AST</span>
                        <span className="font-black text-amber-400">{player.seasonStats?.apg ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RICH PLAYER PROFILE MODAL WITH RADAR & GAME LOGS */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="rounded-3xl border border-white/20 max-w-4xl w-full max-h-[92vh] overflow-y-auto space-y-6 bg-[#0F131F] p-6 sm:p-8 text-slate-100 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                <img
                  src={selectedPlayer.photo || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=80'}
                  alt={selectedPlayer.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-lg shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white">{selectedPlayer.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black text-xs">
                      #{selectedPlayer.number}
                    </span>
                  </div>
                  <div className="text-xs text-amber-400 font-bold flex items-center gap-2 mt-1">
                    <span>{selectedPlayer.position}</span> • <span>{selectedPlayer.category || 'SENIOR'}</span> • <span>{selectedPlayer.gender || 'MASCULIN'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlayer(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Physical Info, Stats & Radar */}
              <div className="lg:col-span-7 space-y-5">
                {/* Physical metrics */}
                <div className="grid grid-cols-4 gap-2 bg-white/[0.03] p-3 rounded-2xl border border-white/10 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Taille</span>
                    <span className="font-bold text-white">{selectedPlayer.height || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Poids</span>
                    <span className="font-bold text-white">{selectedPlayer.weight || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Âge</span>
                    <span className="font-bold text-white">{selectedPlayer.age} ans</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Expérience</span>
                    <span className="font-bold text-amber-400">{selectedPlayer.experienceYears} ans</span>
                  </div>
                </div>

                {/* Season Stats Breakdown */}
                <div className="bg-black/50 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> Statistiques de la Saison
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center text-xs pt-1">
                    <div>
                      <div className="text-[10px] text-slate-400">PPG</div>
                      <div className="font-black text-white text-base">{selectedPlayer.seasonStats?.ppg ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">RPG</div>
                      <div className="font-black text-white text-base">{selectedPlayer.seasonStats?.rpg ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">APG</div>
                      <div className="font-black text-white text-base">{selectedPlayer.seasonStats?.apg ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">FG%</div>
                      <div className="font-black text-emerald-400 text-base">{selectedPlayer.seasonStats?.fgPct ?? 0}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">3PT%</div>
                      <div className="font-black text-amber-400 text-base">{selectedPlayer.seasonStats?.threePtPct ?? 0}%</div>
                    </div>
                  </div>
                </div>

                {/* Skills Radar */}
                <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" /> Radar de Compétences
                  </div>
                  <div className="h-52 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                        { subject: 'Tir', A: selectedPlayer.skillsRadar?.shooting ?? 70 },
                        { subject: 'Passe', A: selectedPlayer.skillsRadar?.passing ?? 70 },
                        { subject: 'Défense', A: selectedPlayer.skillsRadar?.defense ?? 70 },
                        { subject: 'Athlétisme', A: selectedPlayer.skillsRadar?.athleticism ?? 70 },
                        { subject: 'QI', A: selectedPlayer.skillsRadar?.iq ?? 70 },
                        { subject: 'Rebond', A: selectedPlayer.skillsRadar?.rebounding ?? 70 },
                      ]}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" stroke="#CBD5E1" fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="none" />
                        <Radar name={selectedPlayer.name} dataKey="A" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.35} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Right Column: MATCH HISTORY & GAME LOGS */}
              <div className="lg:col-span-5 space-y-5">
                <div className="space-y-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-red-500" /> Historique des Matchs (Game Logs)
                  </div>
                  <p className="text-xs text-slate-400">
                    Sélectionnez un match pour consulter la feuille de stats individuelle.
                  </p>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedPlayer.matchHistory && selectedPlayer.matchHistory.length > 0 ? (
                      selectedPlayer.matchHistory.map((game) => {
                        const isGameSelected = selectedGameLog?.matchId === game.matchId;
                        return (
                          <div
                            key={game.matchId}
                            onClick={() => setSelectedGameLog(game)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${isGameSelected
                              ? 'bg-red-600/25 border-red-500 text-white shadow-md'
                              : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] text-slate-300'
                              }`}
                          >
                            <div>
                              <div className="font-bold flex items-center gap-1.5">
                                <span>{game.opponent}</span>
                                {game.isMvp && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black font-black text-[9px]">
                                    MVP
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">{game.date}</div>
                            </div>

                            <div className="text-right">
                              <span className="font-black text-white text-sm">{game.pts} PTS</span>
                              <span className="text-[10px] text-slate-400 block">{game.reb} REB • {game.ast} AST</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 rounded-xl bg-white/[0.03] text-center text-xs text-slate-400 border border-white/5">
                        Aucun match archivé pour le moment.
                      </div>
                    )}
                  </div>
                </div>

                {/* Box score for Selected Game */}
                {selectedGameLog && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-red-950/40 to-black border border-white/15 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-white">
                        VS {selectedGameLog.opponent}
                      </span>
                      <span className="text-slate-400">{selectedGameLog.date}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-xs bg-black/60 p-2.5 rounded-xl border border-white/5">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase">PTS</span>
                        <div className="font-black text-white text-base">{selectedGameLog.pts}</div>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase">REB</span>
                        <div className="font-black text-white text-base">{selectedGameLog.reb}</div>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase">AST</span>
                        <div className="font-black text-amber-400 text-base">{selectedGameLog.ast}</div>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase">MIN</span>
                        <div className="font-black text-slate-300 text-base">{selectedGameLog.min}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Interceptions : <strong className="text-white">{selectedGameLog.stl}</strong></span>
                      <span>Contres : <strong className="text-white">{selectedGameLog.blk}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN ADD / EDIT PLAYER MODAL */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="rounded-3xl border border-white/20 max-w-3xl w-full max-h-[92vh] overflow-y-auto space-y-6 bg-[#0F131F] p-6 sm:p-8 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-xs">
                  {editingPlayerId ? '✏️' : '➕'}
                </div>
                <h3 className="text-lg font-black text-white">
                  {editingPlayerId ? "Modifier l'Athlète" : 'Nouveau Dossier Athlète'}
                </h3>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlayer} className="space-y-5 text-xs">
              {/* Informations Générales */}
              <div className="space-y-3">
                <div className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" /> 1. Informations Générales et Catégorie
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Nom Complet :</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="ex: Marcus Vance"
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Numéro de Maillot :</label>
                    <input
                      type="number"
                      required
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 1 })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Poste :</label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Meneur" className="bg-slate-900">Meneur (PG)</option>
                      <option value="Arrière" className="bg-slate-900">Arrière (SG)</option>
                      <option value="Ailier" className="bg-slate-900">Ailier (SF)</option>
                      <option value="Ailier Fort" className="bg-slate-900">Ailier Fort (PF)</option>
                      <option value="Pivot" className="bg-slate-900">Pivot (C)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Catégorie :</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as PlayerCategory })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="SENIOR" className="bg-slate-900">🔴 Senior Pro</option>
                      <option value="JUNIOR" className="bg-slate-900">🟡 Junior (U18)</option>
                      <option value="MINIME" className="bg-slate-900">⚡ Minime (U15)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Genre :</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as PlayerGender })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="MASCULIN" className="bg-slate-900">🏀 Masculin</option>
                      <option value="FÉMININ" className="bg-slate-900">🌸 Féminin</option>
                      <option value="MIXTE" className="bg-slate-900">🤝 Mixte</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Âge :</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 20 })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Taille (ex: 1m92) :</label>
                    <input
                      type="text"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Poids (ex: 85 kg) :</label>
                    <input
                      type="text"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Photo (URL) :</label>
                    <input
                      type="text"
                      value={formData.photo}
                      onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {formData.photo && (
                  <div className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={formData.photo}
                        alt="Preview"
                        className="h-16 w-16 max-w-[64px] object-contain rounded-lg border border-white/10 shrink-0 bg-[#111]"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-slate-400 block">
                          Aperçu du portrait.
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveBackground}
                          disabled={removingBg || formData.photo.startsWith('data:')}
                          className="mt-1.5 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {removingBg ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" /> Détourage IA en cours...
                            </>
                          ) : formData.photo.startsWith('data:') ? (
                            <>
                              <Wand2 className="w-3 h-3 text-emerald-300" /> Fond détouré (PNG transparent)
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-3 h-3" /> Détourer avec IA rembg
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    {removeBgError && (
                      <p className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
                        ⚠️ {removeBgError}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Bio / Parcours :</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Style de jeu, points forts, distinctions..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white min-h-[60px] resize-none"
                  />
                </div>
              </div>

              {/* Statistiques de Saison */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> 2. Moyennes Statistiques de Saison
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px]">PPG</label>
                    <input type="number" step="0.1" value={formData.ppg} onChange={(e) => setFormData({ ...formData, ppg: parseFloat(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white font-bold text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px]">RPG</label>
                    <input type="number" step="0.1" value={formData.rpg} onChange={(e) => setFormData({ ...formData, rpg: parseFloat(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white font-bold text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px]">APG</label>
                    <input type="number" step="0.1" value={formData.apg} onChange={(e) => setFormData({ ...formData, apg: parseFloat(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white font-bold text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px]">SPG</label>
                    <input type="number" step="0.1" value={formData.spg} onChange={(e) => setFormData({ ...formData, spg: parseFloat(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white font-bold text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px]">BPG</label>
                    <input type="number" step="0.1" value={formData.bpg} onChange={(e) => setFormData({ ...formData, bpg: parseFloat(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white font-bold text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px]">FG%</label>
                    <input type="number" step="0.1" value={formData.fgPct} onChange={(e) => setFormData({ ...formData, fgPct: parseFloat(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white font-bold text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px]">3PT%</label>
                    <input type="number" step="0.1" value={formData.threePtPct} onChange={(e) => setFormData({ ...formData, threePtPct: parseFloat(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white font-bold text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px]">EFF</label>
                    <input type="number" step="0.1" value={formData.efficiency} onChange={(e) => setFormData({ ...formData, efficiency: parseFloat(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white font-bold text-center" />
                  </div>
                </div>
              </div>

              {/* Radar Skills */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> 3. Radar de Compétences (0 à 100)
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 text-[10px]">Tir :</label>
                    <input type="number" min="0" max="100" value={formData.shooting} onChange={(e) => setFormData({ ...formData, shooting: parseInt(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[10px]">Passe :</label>
                    <input type="number" min="0" max="100" value={formData.passing} onChange={(e) => setFormData({ ...formData, passing: parseInt(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[10px]">Défense :</label>
                    <input type="number" min="0" max="100" value={formData.defense} onChange={(e) => setFormData({ ...formData, defense: parseInt(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[10px]">Athlétisme :</label>
                    <input type="number" min="0" max="100" value={formData.athleticism} onChange={(e) => setFormData({ ...formData, athleticism: parseInt(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[10px]">QI Basket :</label>
                    <input type="number" min="0" max="100" value={formData.iq} onChange={(e) => setFormData({ ...formData, iq: parseInt(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[10px]">Rebond :</label>
                    <input type="number" min="0" max="100" value={formData.rebounding} onChange={(e) => setFormData({ ...formData, rebounding: parseInt(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-center" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Palmarès & Récompenses (séparés par virgules) :</label>
                <input
                  type="text"
                  value={formData.achievementsStr}
                  onChange={(e) => setFormData({ ...formData, achievementsStr: e.target.value })}
                  placeholder="ex: MVP Saison 2025, Meilleur Passeur D1"
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-slate-300 font-bold hover:bg-white/10 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-black uppercase tracking-wider shadow-lg transition-transform flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer l'Athlète</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
