import React, { useEffect, useState } from 'react';
import type { Player, PlayerCategory, PlayerGender, UserRole, PlayerGameLog } from '../../types';
import { apiUrl } from '../../services/api';
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
  Loader2
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
  const isAuthorized = ['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER', 'COACH'].includes(currentRole);
  const { roster: clubRoster } = useClub();

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
          skillsRadar: { shooting: 0, passing: 0, defense: 0, athleticism: 0, iq: 0, rebounding: 0 },
          recentForm: [],
        }))
    );
  }, [clubRoster]);

  const handleRemoveBackground = async () => {
    const photoUrl = formData.photo;
    if (!photoUrl || photoUrl.startsWith('data:')) {
      setRemoveBgError('Entrez d\'abord une URL d\'image valide.');
      return;
    }
    setRemovingBg(true);
    setRemoveBgError(null);
    try {
      const response = await fetch('http://localhost:5050/remove-bg', {
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
      setRemoveBgError('Serveur de suppression de fond inaccessible. Lancez remove_bg_server.py d\'abord.');
    } finally {
      setRemovingBg(false);
    }
  };

  // Full Form Data for Player
  const [formData, setFormData] = useState({
    name: '',
    number: 7,
    position: 'Meneur' as 'Meneur' | 'Arrière' | 'Ailier' | 'Ailier Fort' | 'Pivot',
    category: 'SENIOR' as PlayerCategory,
    gender: 'MASCULIN' as PlayerGender,
    height: '1m90',
    weight: '85 kg',
    age: 22,
    photo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80',
    bio: '',
    experienceYears: 3,
    ppg: 18.5,
    rpg: 5.4,
    apg: 6.2,
    spg: 1.8,
    bpg: 0.6,
    fgPct: 49.0,
    threePtPct: 40.5,
    ftPct: 84.0,
    efficiency: 22.0,
    achievementsStr: 'MVP Tournoi, Sélection All-Star',
    shooting: 88,
    passing: 90,
    defense: 84,
    athleticism: 88,
    iq: 90,
    rebounding: 72
  });

  // Filtering Logic (Positions, Categories, Genders)
  const filteredPlayers = playersList.filter((p) => {
    if (positionFilter === 'ENTRAÎNEURS') return false;
    if (positionFilter !== 'TOUS' && p.position.toUpperCase() !== positionFilter.toUpperCase()) return false;
    if (categoryFilter !== 'TOUS' && p.category !== categoryFilter) return false;
    if (genderFilter !== 'TOUS' && p.gender !== genderFilter) return false;
    return true;
  });

  const positions = ['TOUS', 'Meneur', 'Arrière', 'Ailier', 'Ailier Fort', 'Pivot', 'ENTRAÎNEURS'];
  const categories: { id: string; label: string }[] = [
    { id: 'TOUS', label: 'Toutes Catégories' },
    { id: 'SENIOR', label: '🔴 Seniors Pro' },
    { id: 'JUNIOR', label: '🟡 Juniors (U18)' },
    { id: 'MINIME', label: '⚡ Minimes (U15)' },
  ];
  const genders: { id: string; label: string }[] = [
    { id: 'TOUS', label: 'Tous les Genres' },
    { id: 'MASCULIN', label: '🏀 Garçons (Masculin)' },
    { id: 'FÉMININ', label: '🌸 Filles (Féminin)' },
    { id: 'MIXTE', label: '🤝 Section Mixte' },
  ];

  const handleOpenAddModal = () => {
    setEditingPlayerId(null);
    setFormData({
      name: '',
      number: 10,
      position: 'Meneur',
      category: 'SENIOR',
      gender: 'MASCULIN',
      height: '1m88',
      weight: '82 kg',
      age: 21,
      photo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80',
      bio: '',
      experienceYears: 3,
      ppg: 16.5,
      rpg: 4.8,
      apg: 5.2,
      spg: 1.5,
      bpg: 0.4,
      fgPct: 48.5,
      threePtPct: 39.0,
      ftPct: 82.0,
      efficiency: 20.0,
      achievementsStr: '',
      shooting: 85,
      passing: 84,
      defense: 82,
      athleticism: 86,
      iq: 85,
      rebounding: 70
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
      skillsRadar: { shooting: formData.shooting, passing: formData.passing, defense: formData.defense, athleticism: formData.athleticism, iq: formData.iq, rebounding: formData.rebounding },
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
          setPlayersList((current) => current.map((player) => player.id === editingPlayerId ? savedPlayer : player));
        } else if (savedPlayer) {
          setPlayersList((current) => [savedPlayer, ...current]);
        }
        synced = true;
        setRosterSyncError(null);
      }
    }

    if (editingPlayerId && !synced) {
      // Edit existing
      const updatedList = playersList.map((p) => {
        if (p.id === editingPlayerId) {
          const updated: Player = {
            ...p,
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
            achievements: achievementsList,
            skillsRadar: {
              shooting: formData.shooting,
              passing: formData.passing,
              defense: formData.defense,
              athleticism: formData.athleticism,
              iq: formData.iq,
              rebounding: formData.rebounding
            }
          };
          if (selectedPlayer?.id === p.id) setSelectedPlayer(updated);
          return updated;
        }
        return p;
      });
      setPlayersList(updatedList);
    } else if (!editingPlayerId && !synced) {
      // Create new
      const newPlayer: Player = {
        id: `p_${Date.now()}`,
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
        achievements: achievementsList,
        skillsRadar: {
          shooting: formData.shooting,
          passing: formData.passing,
          defense: formData.defense,
          athleticism: formData.athleticism,
          iq: formData.iq,
          rebounding: formData.rebounding
        },
        recentForm: [16, 18, 14, 20, 15],
        matchHistory: [
          { matchId: 'm1', opponent: 'Red Dragons de Paris', date: '2026-07-28', pts: 18, reb: 5, ast: 6, stl: 2, blk: 1, min: 28 }
        ]
      };
      setPlayersList([newPlayer, ...playersList]);
    }

    setShowAdminModal(false);
  };

  const handleDeletePlayer = async (playerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Voulez-vous vraiment supprimer ce joueur de l\'effectif ?')) return;
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (session?.token) {
      const response = await fetch(apiUrl(`/players/${playerId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      }).catch(() => null);
      if (!response?.ok) setRosterSyncError('Suppression locale uniquement : la base sera resynchronisée plus tard.');
    }
    setPlayersList((current) => current.filter((p) => p.id !== playerId));
    if (selectedPlayer?.id === playerId) setSelectedPlayer(null);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header & Main Admin Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B91C1C]/20 text-[#B91C1C] text-xs font-bold uppercase tracking-wider mb-2 border border-[#B91C1C]/30">
            <Flame className="w-3.5 h-3.5 text-[#D97706]" /> Effectif Officiel & Académie 2026-2027
          </div>
          <h2 className="text-3xl font-extrabold text-white">Joueurs, Staff & Catégories</h2>
          <p className="text-slate-400 text-sm">Découvrez l'ensemble de nos équipes : Seniors, Juniors, Minimes, Garçons, Filles et Entraînements Mixtes.</p>
          {rosterSyncError && <p className="mt-2 text-xs text-amber-300">{rosterSyncError}</p>}
        </div>

        {isAuthorized && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-[#B91C1C] to-[#881337] text-white font-bold text-xs shadow-md hover:scale-105 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un Joueur / Joueuse</span>
          </button>
        )}
      </div>

      {/* FILTER BAR: CATEGORIES & GENDERS & POSITIONS */}
      <div className="glass-panel p-4 rounded-3xl border border-white/10 space-y-3 bg-[#0D0E15]">
        
        {/* Category & Gender Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-white/5">
          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Niveau :
            </span>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryFilter(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  categoryFilter === c.id
                    ? 'bg-[#B91C1C] text-white shadow-md'
                    : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider shrink-0 flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5" /> Genre :
            </span>
            {genders.map((g) => (
              <button
                key={g.id}
                onClick={() => setGenderFilter(g.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  genderFilter === g.id
                    ? 'bg-[#B91C1C] text-white shadow-md'
                    : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Position Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Poste :</span>
          {positions.map((pos) => (
            <button
              key={pos}
              onClick={() => setPositionFilter(pos)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                positionFilter === pos
                  ? 'bg-linear-to-r from-[#B91C1C] to-[#881337] text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

      </div>

      {/* COACHES SECTION (If positionFilter is 'TOUS' or 'ENTRAÎNEURS') */}
      {positionFilter === 'ENTRAÎNEURS' && <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">Le staff est géré depuis l’administration du club.</div>}

      {/* PLAYERS GRID WITH SPECTACULAR 3D POP-OUT CARDS EFFECT */}
      {positionFilter !== 'ENTRAÎNEURS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-[#B91C1C]" /> Joueurs & Joueuses ({filteredPlayers.length})
            </h3>
            <span className="text-xs text-slate-400">Cliquez sur une carte pour ouvrir la fiche 3D & l'historique des matchs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
                <div className="relative rounded-3xl bg-[#0F111A] border border-white/15 p-4 pt-0 transition-all duration-500 transform group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-red-950/60 group-hover:border-[#B91C1C]/60 overflow-visible">
                  
                  {/* Category & Gender Badges overlay */}
                  <div className="flex items-center justify-between pt-3 relative z-30">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#B91C1C]/30 text-red-300 font-extrabold text-[10px] uppercase border border-[#B91C1C]/40">
                      {player.category || 'SENIOR'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D97706]/20 text-[#D97706] font-extrabold text-[10px] uppercase border border-[#D97706]/30">
                      {player.gender === 'FÉMININ' ? '🌸 Filles' : player.gender === 'MIXTE' ? '🤝 Mixte' : '🏀 Garçons'}
                    </span>
                  </div>

                  {/* 3D CHARACTER POP-OUT IMAGE DISPLAY FRAME */}
                  <div className="relative h-60 w-full overflow-hidden flex justify-center items-end my-2 rounded-2xl">
                    {/* Background Stadium Glow ring */}
                    <div className="absolute bottom-2 inset-x-2 h-44 rounded-2xl bg-linear-to-t from-[#B91C1C]/40 via-amber-950/20 to-transparent border border-white/5 group-hover:from-[#B91C1C]/70 transition-all duration-500" />

                    {/* Big Jersey Number watermark */}
                    <div className="absolute top-4 left-4 text-6xl font-black text-white/10 group-hover:text-[#D97706]/20 transition-colors pointer-events-none font-mono">
                      #{player.number}
                    </div>

                    {/* 3D POP-OUT PLAYER CHARACTER PHOTO (STRICT MAX BOUNDS) */}
                    <img
                      src={player.photo}
                      alt={player.name}
                      className="relative z-20 max-h-[230px] max-w-[220px] w-auto h-auto object-contain transition-all duration-500 ease-out group-hover:scale-110 group-hover:-translate-y-2 filter drop-shadow-[0_12px_12px_rgba(0,0,0,0.85)] pointer-events-none rounded-xl"
                    />
                  </div>

                  {/* Card Bottom Details Box */}
                  <div className="relative z-30 pt-2 space-y-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-white text-base group-hover:text-[#D97706] transition-colors">
                          {player.name}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                          #{player.number} — <span className="text-[#D97706] font-bold">{player.position}</span>
                        </div>
                      </div>

                      {/* Admin Quick Buttons */}
                      {isAuthorized && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleOpenEditModal(player, e)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/20 text-slate-300"
                            title="Éditer le joueur"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeletePlayer(player.id, e)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Quick Stats Metrics Pill */}
                    <div className="grid grid-cols-3 gap-1 bg-black/50 p-2 rounded-xl border border-white/5 text-center text-xs">
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
                        <span className="font-black text-[#D97706]">{player.seasonStats?.apg ?? 0}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RICH PLAYER PROFILE MODAL WITH MATCH HISTORY LOGS */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6 bg-[#0D0E15]">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                <img
                  src={selectedPlayer.photo}
                  alt={selectedPlayer.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D97706] shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white">{selectedPlayer.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#B91C1C] text-white font-extrabold text-xs">
                      #{selectedPlayer.number}
                    </span>
                  </div>
                  <div className="text-xs text-[#D97706] font-bold flex items-center gap-2 mt-1">
                    <span>{selectedPlayer.position}</span> • <span>{selectedPlayer.category || 'SENIOR'}</span> • <span>{selectedPlayer.gender || 'MASCULIN'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlayer(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Physical Info, Stats & Radar */}
              <div className="lg:col-span-7 space-y-5">
                {/* Physical metrics */}
                <div className="grid grid-cols-4 gap-2 bg-white/5 p-3 rounded-2xl border border-white/10 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Taille</span>
                    <span className="font-bold text-white">{selectedPlayer.height}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Poids</span>
                    <span className="font-bold text-white">{selectedPlayer.weight}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Âge</span>
                    <span className="font-bold text-white">{selectedPlayer.age} ans</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Expérience</span>
                    <span className="font-bold text-[#D97706]">{selectedPlayer.experienceYears} ans</span>
                  </div>
                </div>

                {/* Season Stats Breakdown */}
                <div className="bg-black/50 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-[#D97706] uppercase tracking-wider flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" /> Statistiques Générales de la Saison
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
                      <div className="font-black text-[#D97706] text-base">{selectedPlayer.seasonStats?.threePtPct ?? 0}%</div>
                    </div>
                  </div>
                </div>

                {/* Skills Radar */}
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#D97706]" /> Radar de Compétences Individuelles
                  </div>
                  <div className="h-52 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                        { subject: 'Tir', A: selectedPlayer.skillsRadar?.shooting ?? 0 },
                        { subject: 'Passe', A: selectedPlayer.skillsRadar?.passing ?? 0 },
                        { subject: 'Défense', A: selectedPlayer.skillsRadar?.defense ?? 0 },
                        { subject: 'Athlétisme', A: selectedPlayer.skillsRadar?.athleticism ?? 0 },
                        { subject: 'QI', A: selectedPlayer.skillsRadar?.iq ?? 0 },
                        { subject: 'Rebond', A: selectedPlayer.skillsRadar?.rebounding ?? 0 },
                      ]}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" stroke="#CBD5E1" fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="none" />
                        <Radar name={selectedPlayer.name} dataKey="A" stroke="#D97706" fill="#D97706" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Right Column: MATCH HISTORY & GAME LOGS */}
              <div className="lg:col-span-5 space-y-5">
                <div className="space-y-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#B91C1C]" /> Historique des Matchs Joués (Game Logs)
                  </div>
                  <p className="text-xs text-slate-400">Cliquez sur un match ci-dessous pour voir la ligne de stats obtenue par ce joueur.</p>

                  {/* List of Played Matches */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedPlayer.matchHistory && selectedPlayer.matchHistory.length > 0 ? (
                      selectedPlayer.matchHistory.map((game) => {
                        const isGameSelected = selectedGameLog?.matchId === game.matchId;
                        return (
                          <div
                            key={game.matchId}
                            onClick={() => setSelectedGameLog(game)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                              isGameSelected
                                ? 'bg-[#B91C1C]/30 border-[#B91C1C] text-white shadow-md'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                            }`}
                          >
                            <div>
                              <div className="font-bold flex items-center gap-1.5">
                                <span>{game.opponent}</span>
                                {game.isMvp && <span className="px-1.5 py-0.5 rounded bg-[#D97706] text-black font-black text-[9px]">MVP</span>}
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
                      <div className="p-4 rounded-xl bg-white/5 text-center text-xs text-slate-400">
                        Aucun historique de match individuel enregistré pour le moment.
                      </div>
                    )}
                  </div>
                </div>

                {/* Detailed Game Log Box score for Selected Game */}
                {selectedGameLog && (
                  <div className="p-4 rounded-2xl bg-linear-to-br from-red-950/40 to-black border border-white/15 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-white">
                        Feuille de Match : VS {selectedGameLog.opponent}
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
                        <div className="font-black text-[#D97706] text-base">{selectedGameLog.ast}</div>
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

      {/* ADMIN ADD / EDIT PLAYER MODAL (ULTRA COMPLETE FORM) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6 bg-[#0D0E15]">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#B91C1C] flex items-center justify-center text-white font-bold text-xs">
                  {editingPlayerId ? '✏️' : '➕'}
                </div>
                <h3 className="text-lg font-extrabold text-white">
                  {editingPlayerId ? 'Éditer le Profil du Joueur / Joueuse' : 'Nouveau Joueur / Joueuse (Fiche Complète)'}
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
              
              {/* Section 1: Informations Générales */}
              <div className="space-y-3">
                <div className="font-bold text-[#D97706] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" /> 1. Informations Générales & Catégorie
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
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Numéro de Maillot :</label>
                    <input
                      type="number"
                      required
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 1 })}
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Poste sur le terrain :</label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                    >
                      <option value="Meneur">Meneur (PG)</option>
                      <option value="Arrière">Arrière (SG)</option>
                      <option value="Ailier">Ailier (SF)</option>
                      <option value="Ailier Fort">Ailier Fort (PF)</option>
                      <option value="Pivot">Pivot (C)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Niveau / Catégorie :</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as PlayerCategory })}
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                    >
                      <option value="SENIOR">🔴 Senior Pro</option>
                      <option value="JUNIOR">🟡 Junior (U18)</option>
                      <option value="MINIME">⚡ Minime (U15)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Genre & Équipe :</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as PlayerGender })}
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                    >
                      <option value="MASCULIN">🏀 Garçons (Masculin)</option>
                      <option value="FÉMININ">🌸 Filles (Féminin)</option>
                      <option value="MIXTE">🤝 Section Mixte</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Âge :</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 20 })}
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Taille (ex: 1m92) :</label>
                    <input
                      type="text"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Poids (ex: 85 kg) :</label>
                    <input
                      type="text"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Photo (URL HD) :</label>
                    <input
                      type="text"
                      required
                      value={formData.photo}
                      onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                    />

                    {/* Live Image Preview + AI Remove Background */}
                    {formData.photo && (
                      <div className="mt-2 p-3 bg-black/40 rounded-xl border border-white/10 space-y-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {/* Preview Image Clamped */}
                          <img
                            src={formData.photo}
                            alt="Preview"
                            className="h-16 w-16 max-w-[64px] object-contain rounded-lg border border-white/10 shrink-0 bg-[#111]"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-slate-400 block">
                              Aperçu (cadré automatiquement • Max 230×220px sur les cartes).
                            </span>
                            {/* Remove BG Button */}
                            <button
                              type="button"
                              onClick={handleRemoveBackground}
                              disabled={removingBg || formData.photo.startsWith('data:')}
                              className="mt-1.5 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-linear-to-r from-violet-700 to-violet-900 hover:from-violet-600 hover:to-violet-800 text-white font-bold text-[10px] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                              title="Supprimer le fond via IA rembg (requiert le serveur Python)"
                            >
                              {removingBg ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Traitement IA en cours...</>
                              ) : formData.photo.startsWith('data:') ? (
                                <><Wand2 className="w-3 h-3 text-emerald-300" /> ✅ Fond déjà supprimé (PNG transparent)</>
                              ) : (
                                <><Wand2 className="w-3 h-3" /> ✨ Supprimer le fond (IA rembg)</>
                              )}
                            </button>
                          </div>
                        </div>
                        {/* Error / info message */}
                        {removeBgError && (
                          <p className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
                            ⚠️ {removeBgError}
                          </p>
                        )}
                        {!removeBgError && formData.photo.startsWith('data:') && (
                          <p className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1.5">
                            ✅ Image détourée par IA — fond transparent PNG actif. La carte affichera l'image sans arrière-plan.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Bio / Présentation du Joueur :</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Style de jeu, qualités sur le terrain, expérience..."
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white min-h-[60px] resize-none"
                  />
                </div>
              </div>

              {/* Section 2: Statistiques Moyennes & Pourcentages */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="font-bold text-[#D97706] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> 2. Statistiques de Saison (Moyennes)
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px]">PPG</label>
                    <input type="number" step="0.1" value={formData.ppg} onChange={(e) => setFormData({ ...formData, ppg: parseFloat(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded-lg p-2 text-white font-bold text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px]">RPG</label>
                    <input type="number" step="0.1" value={formData.rpg} onChange={(e) => setFormData({ ...formData, rpg: parseFloat(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded-lg p-2 text-white font-bold text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px]">APG</label>
                    <input type="number" step="0.1" value={formData.apg} onChange={(e) => setFormData({ ...formData, apg: parseFloat(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded-lg p-2 text-white font-bold text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px]">SPG</label>
                    <input type="number" step="0.1" value={formData.spg} onChange={(e) => setFormData({ ...formData, spg: parseFloat(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded-lg p-2 text-white font-bold text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px]">BPG</label>
                    <input type="number" step="0.1" value={formData.bpg} onChange={(e) => setFormData({ ...formData, bpg: parseFloat(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded-lg p-2 text-white font-bold text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px]">FG%</label>
                    <input type="number" step="0.1" value={formData.fgPct} onChange={(e) => setFormData({ ...formData, fgPct: parseFloat(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded-lg p-2 text-white font-bold text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px]">3PT%</label>
                    <input type="number" step="0.1" value={formData.threePtPct} onChange={(e) => setFormData({ ...formData, threePtPct: parseFloat(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded-lg p-2 text-white font-bold text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px]">EFF</label>
                    <input type="number" step="0.1" value={formData.efficiency} onChange={(e) => setFormData({ ...formData, efficiency: parseFloat(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded-lg p-2 text-white font-bold text-center" />
                  </div>
                </div>
              </div>

              {/* Section 3: Radar Attribute Skills */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="font-bold text-[#D97706] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> 3. Évaluation Radar des 6 Compétences (0 à 100)
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 text-[10px]">Tir :</label>
                    <input type="number" min="0" max="100" value={formData.shooting} onChange={(e) => setFormData({ ...formData, shooting: parseInt(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded-lg p-2 text-white text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[10px]">Passe :</label>
                    <input type="number" min="0" max="100" value={formData.passing} onChange={(e) => setFormData({ ...formData, passing: parseInt(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded-lg p-2 text-white text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[10px]">Défense :</label>
                    <input type="number" min="0" max="100" value={formData.defense} onChange={(e) => setFormData({ ...formData, defense: parseInt(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded-lg p-2 text-white text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[10px]">Athlétisme :</label>
                    <input type="number" min="0" max="100" value={formData.athleticism} onChange={(e) => setFormData({ ...formData, athleticism: parseInt(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded-lg p-2 text-white text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[10px]">QI Basket :</label>
                    <input type="number" min="0" max="100" value={formData.iq} onChange={(e) => setFormData({ ...formData, iq: parseInt(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded-lg p-2 text-white text-center" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[10px]">Rebond :</label>
                    <input type="number" min="0" max="100" value={formData.rebounding} onChange={(e) => setFormData({ ...formData, rebounding: parseInt(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded-lg p-2 text-white text-center" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Palmarès & Récompenses (séparés par des virgules) :</label>
                <input
                  type="text"
                  value={formData.achievementsStr}
                  onChange={(e) => setFormData({ ...formData, achievementsStr: e.target.value })}
                  placeholder="ex: MVP Saison 2025, Sélection All-Star"
                  className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-linear-to-r from-[#B91C1C] to-[#881337] text-white font-bold shadow-md hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer la Fiche du Joueur</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
