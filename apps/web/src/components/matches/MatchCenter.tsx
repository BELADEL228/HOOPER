import React, { useEffect, useMemo, useState } from 'react';
import type { Match, PlayerMatchStat, UserRole } from '../../types';
import {
  Calendar,
  MapPin,
  Trophy,
  Flame,
  ChevronRight,
  Award,
  Zap,
  Activity,
  Plus,
  Edit,
  Save,
  X,
  Trash2,
  Play,
  Maximize2,
  Video,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { apiUrl } from '../../services/api';
import { useClub } from '../../context/ClubContext';
import { MatchRequestsPanel } from './MatchRequestsPanel';
import { LiveScorePanel } from './LiveScorePanel';

interface MatchCenterProps {
  currentRole?: UserRole;
}

// Presets visuels proposés à l'admin pour choisir rapidement un logo adverse.
// Il ne s'agit pas de données mockées : ce sont des options de formulaire.
const PRESET_LOGOS = [
  { name: 'Vipers Lyon (Image)', logo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&auto=format&fit=crop&q=80' },
  { name: 'Spartans Marseille (Image)', logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=150&auto=format&fit=crop&q=80' },
  { name: 'Red Dragons Paris (Image)', logo: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=150&auto=format&fit=crop&q=80' },
  { name: 'Eclairs (Emoji)', logo: '⚡' },
  { name: 'Bouclier (Emoji)', logo: '🛡️' },
  { name: 'Dragon (Emoji)', logo: '🐉' },
];

export const MatchCenter: React.FC<MatchCenterProps> = ({ currentRole = 'SUPER_ADMIN' }) => {
  const { matches: clubMatches, roster, loading: clubLoading } = useClub();

  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchSyncError, setMatchSyncError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'FINISHED'>('ALL');

  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  // Lightbox média plein écran
  const [activeMedia, setActiveMedia] = useState<{
    type: 'PHOTO' | 'VIDEO';
    url: string;
    title?: string;
  } | null>(null);

  // État du formulaire admin
  const [formData, setFormData] = useState({
    opponent: '',
    opponentLogo: '',
    isHome: true,
    date: new Date().toISOString().split('T')[0],
    time: '20:30',
    venue: '',
    address: '',
    status: 'UPCOMING' as 'UPCOMING' | 'FINISHED',
    scoreTeam: 0,
    scoreOpponent: 0,
    summary: '',
    mvpPlayerName: '',
    videoUrl: '',
    photosStr: '',
    q1Team: 0,
    q1Opp: 0,
    q2Team: 0,
    q2Opp: 0,
    q3Team: 0,
    q3Opp: 0,
    q4Team: 0,
    q4Opp: 0,
  });

  const isAuthorized = ['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER', 'COACH'].includes(currentRole);

  // ── Chargement des matchs depuis le ClubContext (roster inclus) ────────────
  useEffect(() => {
    if (clubMatches && clubMatches.length > 0) {
      const mapped: Match[] = clubMatches.map((m) => ({
        id: m.id,
        opponent: m.opponent,
        opponentLogo: m.opponentLogo,
        isHome: m.isHome,
        date: m.date,
        time: m.time,
        venue: m.venue,
        address: m.address,
        status: (m.status as any) === 'FINISHED' ? 'FINISHED' : 'UPCOMING',
        scoreTeam: m.scoreTeam ?? undefined,
        scoreOpponent: m.scoreOpponent ?? undefined,
        summary: m.summary ?? undefined,
        mvpPlayerName: m.mvpPlayerName ?? undefined,
      }));
      setMatches(mapped);
      setSelectedMatch(
        mapped.find((match) => match.status === 'FINISHED') || mapped[0] || null,
      );
      return;
    }

    // Fallback : appel direct API si le ClubContext n'a rien (mode admin global)
    fetch(apiUrl('/matches'))
      .then(async (response) => {
        if (!response.ok) throw new Error('Matchs indisponibles');
        const remoteMatches = (await response.json()) as Match[];
        if (remoteMatches.length > 0) {
          setMatches(remoteMatches);
          setSelectedMatch(
            remoteMatches.find((match) => match.status === 'FINISHED') ||
            remoteMatches[0],
          );
        }
      })
      .catch(() =>
        setMatchSyncError(
          'Mode local actif : les matchs seront synchronisés à la reconnexion.',
        ),
      );
  }, [clubMatches]);

  // ── Boxscore vierge construit à partir du roster réel (pas de mock) ────────
  const buildEmptyBoxscore = useMemo(
    () => (): PlayerMatchStat[] =>
      roster.map((p) => ({
        playerId: p.id,
        playerName: p.name,
        jerseyNumber: p.number,
        position: p.position,
        pts: 0,
        reb: 0,
        ast: 0,
        stl: 0,
        blk: 0,
        to: 0,
        fgm: 0,
        fga: 0,
        threePm: 0,
        threePa: 0,
        ftm: 0,
        fta: 0,
        min: 0,
      })),
    [roster],
  );

  const filteredMatches = matches.filter((m) => {
    if (filter === 'UPCOMING') return m.status === 'UPCOMING';
    if (filter === 'FINISHED') return m.status === 'FINISHED';
    return true;
  });

  // ── Helper rendu logo (URL image ou emoji) ────────────────────────────────
  const renderOpponentLogo = (logoStr: string, className: string = 'w-10 h-10') => {
    if (!logoStr) {
      return (
        <div className={`${className} rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-lg shadow-md`}>
          🏀
        </div>
      );
    }
    const isImage =
      logoStr.startsWith('http://') ||
      logoStr.startsWith('https://') ||
      logoStr.startsWith('/') ||
      logoStr.startsWith('data:');
    if (isImage) {
      return (
        <img
          src={logoStr}
          alt="Opponent Logo"
          className={`${className} rounded-xl object-cover border border-white/10 shadow-sm`}
        />
      );
    }
    return (
      <div className={`${className} rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-lg shadow-md`}>
        {logoStr}
      </div>
    );
  };

  const getEmbedVideoUrl = (url: string): string => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return url;
  };

  // ── Ouverture modale : Ajout ──────────────────────────────────────────────
  const handleOpenAddModal = () => {
    setEditingMatch(null);
    setFormData({
      opponent: '',
      opponentLogo: '',
      isHome: true,
      date: new Date().toISOString().split('T')[0],
      time: '20:30',
      venue: '',
      address: '',
      status: 'UPCOMING',
      scoreTeam: 0,
      scoreOpponent: 0,
      summary: '',
      mvpPlayerName: roster[0]?.name || '',
      videoUrl: '',
      photosStr: '',
      q1Team: 0,
      q1Opp: 0,
      q2Team: 0,
      q2Opp: 0,
      q3Team: 0,
      q3Opp: 0,
      q4Team: 0,
      q4Opp: 0,
    });
    setShowAdminModal(true);
  };

  // ── Ouverture modale : Édition ────────────────────────────────────────────
  const handleOpenEditModal = (matchToEdit: Match) => {
    setEditingMatch(matchToEdit);
    setFormData({
      opponent: matchToEdit.opponent,
      opponentLogo: matchToEdit.opponentLogo || '',
      isHome: matchToEdit.isHome,
      date: matchToEdit.date,
      time: matchToEdit.time,
      venue: matchToEdit.venue,
      address: matchToEdit.address,
      // ✅ FIX : normalise 'LIVE' (et tout autre statut) vers UPCOMING/FINISHED
      status: matchToEdit.status === 'FINISHED' ? 'FINISHED' : 'UPCOMING',
      scoreTeam: matchToEdit.scoreTeam || 0,
      scoreOpponent: matchToEdit.scoreOpponent || 0,
      summary: matchToEdit.summary || '',
      mvpPlayerName: matchToEdit.mvpPlayerName || roster[0]?.name || '',
      videoUrl: matchToEdit.videoUrl || '',
      photosStr: matchToEdit.photos ? matchToEdit.photos.join(', ') : '',
      q1Team: matchToEdit.quarterScoresTeam?.q1 || 0,
      q1Opp: matchToEdit.quarterScoresOpponent?.q1 || 0,
      q2Team: matchToEdit.quarterScoresTeam?.q2 || 0,
      q2Opp: matchToEdit.quarterScoresOpponent?.q2 || 0,
      q3Team: matchToEdit.quarterScoresTeam?.q3 || 0,
      q3Opp: matchToEdit.quarterScoresOpponent?.q3 || 0,
      q4Team: matchToEdit.quarterScoresTeam?.q4 || 0,
      q4Opp: matchToEdit.quarterScoresOpponent?.q4 || 0,
    });
    setShowAdminModal(true);
  };

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.opponent.trim()) return;

    const parsedPhotos = formData.photosStr
      ? formData.photosStr
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
      : undefined;

    // Boxscore vierge construit depuis le roster réel (valeurs à remplir).
    const emptyBoxscore = buildEmptyBoxscore().map((row) => ({
      ...row,
      isMvp: row.playerName === formData.mvpPlayerName,
    }));

    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    const remotePayload = {
      ...formData,
      photos: parsedPhotos,
      quarterScoresJson:
        formData.status === 'FINISHED'
          ? JSON.stringify({
            team: {
              q1: formData.q1Team,
              q2: formData.q2Team,
              q3: formData.q3Team,
              q4: formData.q4Team,
            },
            opponent: {
              q1: formData.q1Opp,
              q2: formData.q2Opp,
              q3: formData.q3Opp,
              q4: formData.q4Opp,
            },
          })
          : undefined,
    };

    if (session?.token) {
      const response = await fetch(
        apiUrl(editingMatch ? `/matches/${editingMatch.id}` : '/matches'),
        {
          method: editingMatch ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify(remotePayload),
        },
      ).catch(() => null);

      if (response?.ok) {
        const data = await response.json();
        const savedMatch = data.match as Match;
        if (editingMatch) {
          setMatches((current) =>
            current.map((match) =>
              match.id === editingMatch.id ? savedMatch : match,
            ),
          );
        } else {
          setMatches((current) => [savedMatch, ...current]);
          setSelectedMatch(savedMatch);
        }
        setMatchSyncError(null);
        setShowAdminModal(false);
        return;
      }
      setMatchSyncError(
        'Sauvegarde locale : le serveur des matchs est indisponible.',
      );
    }

    if (editingMatch) {
      const updatedList = matches.map((m) => {
        if (m.id === editingMatch.id) {
          const updated: Match = {
            ...m,
            opponent: formData.opponent,
            opponentLogo: formData.opponentLogo,
            isHome: formData.isHome,
            date: formData.date,
            time: formData.time,
            venue: formData.venue,
            address: formData.address,
            status: formData.status,
            scoreTeam: formData.status === 'FINISHED' ? formData.scoreTeam : undefined,
            scoreOpponent: formData.status === 'FINISHED' ? formData.scoreOpponent : undefined,
            summary: formData.summary,
            mvpPlayerName: formData.status === 'FINISHED' ? formData.mvpPlayerName : undefined,
            videoUrl: formData.status === 'FINISHED' ? formData.videoUrl : undefined,
            photos: formData.status === 'FINISHED' ? parsedPhotos : undefined,
            quarterScoresTeam:
              formData.status === 'FINISHED'
                ? {
                  q1: formData.q1Team,
                  q2: formData.q2Team,
                  q3: formData.q3Team,
                  q4: formData.q4Team,
                }
                : undefined,
            quarterScoresOpponent:
              formData.status === 'FINISHED'
                ? {
                  q1: formData.q1Opp,
                  q2: formData.q2Opp,
                  q3: formData.q3Opp,
                  q4: formData.q4Opp,
                }
                : undefined,
            boxscore:
              m.boxscore && m.boxscore.length > 0 ? m.boxscore : emptyBoxscore,
          };
          if (selectedMatch?.id === m.id) setSelectedMatch(updated);
          return updated;
        }
        return m;
      });
      setMatches(updatedList);
    } else {
      const newMatch: Match = {
        id: `match_${Date.now()}`,
        opponent: formData.opponent,
        opponentLogo: formData.opponentLogo,
        isHome: formData.isHome,
        date: formData.date,
        time: formData.time,
        venue: formData.venue,
        address: formData.address,
        status: formData.status,
        scoreTeam: formData.status === 'FINISHED' ? formData.scoreTeam : undefined,
        scoreOpponent: formData.status === 'FINISHED' ? formData.scoreOpponent : undefined,
        summary: formData.summary || '',
        mvpPlayerName: formData.status === 'FINISHED' ? formData.mvpPlayerName : undefined,
        videoUrl: formData.status === 'FINISHED' ? formData.videoUrl : undefined,
        photos: formData.status === 'FINISHED' ? parsedPhotos : undefined,
        quarterScoresTeam:
          formData.status === 'FINISHED'
            ? {
              q1: formData.q1Team,
              q2: formData.q2Team,
              q3: formData.q3Team,
              q4: formData.q4Team,
            }
            : undefined,
        quarterScoresOpponent:
          formData.status === 'FINISHED'
            ? {
              q1: formData.q1Opp,
              q2: formData.q2Opp,
              q3: formData.q3Opp,
              q4: formData.q4Opp,
            }
            : undefined,
        boxscore: formData.status === 'FINISHED' ? emptyBoxscore : undefined,
      };
      setMatches([newMatch, ...matches]);
      setSelectedMatch(newMatch);
    }

    setShowAdminModal(false);
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce match du calendrier ?')) return;
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (session?.token) {
      await fetch(apiUrl(`/matches/${matchId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      }).catch(() => undefined);
    }
    const newList = matches.filter((m) => m.id !== matchId);
    setMatches(newList);
    if (selectedMatch?.id === matchId) {
      setSelectedMatch(newList[0] || null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Contrôles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B91C1C]/20 text-[#B91C1C] text-xs font-bold uppercase tracking-wider mb-2 border border-[#B91C1C]/30">
            <Flame className="w-3.5 h-3.5 text-[#D97706]" /> Match Center Pro & Media Hub
          </div>
          <h2 className="text-3xl font-extrabold text-white">Matchs, Scores & Vidéos</h2>
          <p className="text-slate-400 text-sm">
            Feuilles de statistiques officielles et résumés vidéo haute définition.
          </p>
          {matchSyncError && <p className="mt-2 text-xs text-amber-300">{matchSyncError}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAuthorized && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-[#B91C1C] to-[#881337] text-white font-bold text-xs shadow-md hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" />
              <span>Programmer un Match</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/10">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'ALL' ? 'bg-[#B91C1C] text-white shadow-md' : 'text-slate-300 hover:text-white'
                }`}
            >
              Tous ({matches.length})
            </button>
            <button
              onClick={() => setFilter('UPCOMING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'UPCOMING' ? 'bg-[#B91C1C] text-white shadow-md' : 'text-slate-300 hover:text-white'
                }`}
            >
              À venir ({matches.filter((m) => m.status === 'UPCOMING').length})
            </button>
            <button
              onClick={() => setFilter('FINISHED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'FINISHED' ? 'bg-[#B91C1C] text-white shadow-md' : 'text-slate-300 hover:text-white'
                }`}
            >
              Terminés ({matches.filter((m) => m.status === 'FINISHED').length})
            </button>
          </div>
        </div>
      </div>

      <MatchRequestsPanel currentRole={currentRole} />
      <LiveScorePanel match={selectedMatch} currentRole={currentRole} />

      {/* Layout principal : Liste | Détails */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Colonne gauche : Liste des matchs */}
        <div className="lg:col-span-5 space-y-4">
          {clubLoading && matches.length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl border border-white/10 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Chargement des matchs…</span>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl border border-dashed border-white/15 text-center text-slate-400 space-y-2">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm">Aucun match à afficher pour ce filtre.</p>
              {isAuthorized && (
                <button
                  onClick={handleOpenAddModal}
                  className="mt-2 text-xs font-bold text-[#D97706] hover:underline"
                >
                  + Programmer un premier match
                </button>
              )}
            </div>
          ) : (
            filteredMatches.map((match) => {
              const isSelected = selectedMatch?.id === match.id;
              const isUpcoming = match.status === 'UPCOMING';

              return (
                <div
                  key={match.id}
                  onClick={() => setSelectedMatch(match)}
                  className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${isSelected
                    ? 'border-[#B91C1C] bg-white/10 shadow-lg shadow-red-950/20'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-linear-to-b from-[#B91C1C] to-[#D97706]" />
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#D97706]" /> {match.date} — {match.time}
                    </span>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${isUpcoming
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          }`}
                      >
                        {isUpcoming ? 'À Venir' : 'Terminé'}
                      </span>

                      {isAuthorized && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(match);
                            }}
                            className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white"
                            title="Éditer le match"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMatch(match.id);
                            }}
                            className="p-1 rounded bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#B91C1C] to-[#D97706] p-0.5">
                        <div className="w-full h-full bg-[#090A0F] rounded-[10px] flex items-center justify-center font-bold text-white text-xs">
                          FS
                        </div>
                      </div>
                      <span className="font-bold text-white text-sm">FIRE STONE</span>
                    </div>

                    <div className="text-center px-3">
                      {!isUpcoming ? (
                        <span className="text-xl font-black text-white">
                          {match.scoreTeam} - {match.scoreOpponent}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded">
                          VS
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white text-sm">{match.opponent}</span>
                      {renderOpponentLogo(match.opponentLogo, 'w-10 h-10')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5 text-xs text-slate-400">
                    <span className="flex items-center gap-1 truncate max-w-50">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {match.venue || '—'}
                    </span>
                    <span className="text-[#D97706] font-semibold flex items-center gap-0.5">
                      Consulter la feuille <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Colonne droite : Détails + Boxscore + Média */}
        <div className="lg:col-span-7">
          {selectedMatch ? (
            <div className="glass-panel rounded-3xl p-6 border border-white/15 space-y-6">
              {/* Bandeau score */}
              <div className="relative rounded-2xl bg-linear-to-r from-red-950/40 via-[#090A0F] to-slate-900/60 p-6 border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#B91C1C]" /> {selectedMatch.venue || '—'}{' '}
                    {selectedMatch.address ? `(${selectedMatch.address})` : ''}
                  </span>
                  <span className="font-medium text-slate-300">
                    {selectedMatch.date} à {selectedMatch.time}
                  </span>
                </div>

                <div className="grid grid-cols-3 items-center text-center">
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-white">FIRE STONE</div>
                    <div className="text-xs text-[#D97706] font-bold">DOMICILE</div>
                  </div>

                  <div>
                    {selectedMatch.status === 'FINISHED' ? (
                      <div>
                        <div className="text-4xl sm:text-5xl font-black text-gradient-fire">
                          {selectedMatch.scoreTeam} : {selectedMatch.scoreOpponent}
                        </div>
                        <div className="text-xs text-emerald-400 font-bold uppercase mt-1">
                          Score final
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-2xl font-black text-amber-400">VS</span>
                        <div className="text-xs text-slate-400">Coup d'envoi à venir</div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center">
                    {renderOpponentLogo(selectedMatch.opponentLogo, 'w-14 h-14 mb-1')}
                    <div className="text-xl sm:text-2xl font-black text-white">
                      {selectedMatch.opponent}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">EXTÉRIEUR</div>
                  </div>
                </div>

                {/* Scores par quart-temps */}
                {selectedMatch.quarterScoresTeam && selectedMatch.quarterScoresOpponent && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                      Score par Quart-Temps
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center text-xs bg-black/40 p-2.5 rounded-xl border border-white/5">
                      <div>
                        <div className="text-slate-400 font-medium">Q1</div>
                        <div className="font-bold text-white">
                          {selectedMatch.quarterScoresTeam.q1} - {selectedMatch.quarterScoresOpponent.q1}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">Q2</div>
                        <div className="font-bold text-white">
                          {selectedMatch.quarterScoresTeam.q2} - {selectedMatch.quarterScoresOpponent.q2}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">Q3</div>
                        <div className="font-bold text-white">
                          {selectedMatch.quarterScoresTeam.q3} - {selectedMatch.quarterScoresOpponent.q3}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">Q4</div>
                        <div className="font-bold text-white">
                          {selectedMatch.quarterScoresTeam.q4} - {selectedMatch.quarterScoresOpponent.q4}
                        </div>
                      </div>
                      <div className="border-l border-white/10 pl-2">
                        <div className="text-[#D97706] font-bold">TOTAL</div>
                        <div className="font-black text-[#D97706]">
                          {selectedMatch.scoreTeam} - {selectedMatch.scoreOpponent}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Résumé & MVP */}
              {selectedMatch.status === 'FINISHED' && (selectedMatch.summary || selectedMatch.mvpPlayerName) && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {selectedMatch.summary && (
                    <div className="md:col-span-8 bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                      <div className="text-xs font-bold text-[#D97706] uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" /> Résumé Tactique du Match
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{selectedMatch.summary}</p>
                    </div>
                  )}

                  {selectedMatch.mvpPlayerName && (
                    <div className="md:col-span-4 bg-linear-to-br from-amber-500/20 to-[#D97706]/10 p-4 rounded-2xl border border-[#D97706]/30 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#D97706] text-black font-black flex items-center justify-center shrink-0 text-xl">
                        ⭐
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-[11px] text-[#D97706] font-extrabold uppercase">
                          <Award className="w-3.5 h-3.5" /> MVP du Match
                        </div>
                        <div className="font-bold text-white text-xs">{selectedMatch.mvpPlayerName}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Galerie média */}
              {selectedMatch.status === 'FINISHED' &&
                (selectedMatch.videoUrl || (selectedMatch.photos && selectedMatch.photos.length > 0)) && (
                  <div className="space-y-4 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Video className="w-4 h-4 text-[#D97706]" /> Multimédia du Match
                      </h3>
                      <span className="text-xs text-slate-400">Cliquez pour agrandir</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedMatch.videoUrl && (
                        <div
                          onClick={() =>
                            setActiveMedia({
                              type: 'VIDEO',
                              url: selectedMatch.videoUrl!,
                              title: `Résumé Vidéo : FIRE STONE vs ${selectedMatch.opponent}`,
                            })
                          }
                          className="group relative rounded-2xl overflow-hidden border border-white/15 h-44 cursor-pointer glass-panel"
                        >
                          <img
                            src={
                              selectedMatch.photos && selectedMatch.photos[0]
                                ? selectedMatch.photos[0]
                                : 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80'
                            }
                            alt="Video thumbnail"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-between p-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#B91C1C] text-white font-bold text-[10px] uppercase w-max shadow-md">
                              <Video className="w-3 h-3" /> Résumé Match HD
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-extrabold text-white text-sm">
                                  Voir les temps forts en vidéo
                                </div>
                                <div className="text-[11px] text-slate-300">
                                  Cliquer pour lire en grand
                                </div>
                              </div>
                              <div className="w-12 h-12 rounded-full bg-[#B91C1C] text-white flex items-center justify-center shadow-lg shadow-red-950/50 group-hover:scale-110 transition-transform">
                                <Play className="w-6 h-6 fill-current ml-0.5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedMatch.photos && selectedMatch.photos.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {selectedMatch.photos.slice(0, 4).map((photoUrl, idx) => (
                            <div
                              key={idx}
                              onClick={() =>
                                setActiveMedia({
                                  type: 'PHOTO',
                                  url: photoUrl,
                                  title: `Photo ${idx + 1} — Match vs ${selectedMatch.opponent}`,
                                })
                              }
                              className="group relative h-21 rounded-xl overflow-hidden border border-white/10 cursor-pointer"
                            >
                              <img
                                src={photoUrl}
                                alt={`Match action ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Boxscore individuel */}
              {selectedMatch.boxscore && selectedMatch.boxscore.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-[#B91C1C]" /> Statistiques Individuelles (Boxscore)
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">Effectif FIRE STONE</span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-white/10 text-[#CBD5E1] uppercase font-bold text-[10px]">
                        <tr>
                          <th className="px-3 py-2.5">Joueur</th>
                          <th className="px-2 py-2.5 text-center">POS</th>
                          <th className="px-2 py-2.5 text-center">MIN</th>
                          <th className="px-2 py-2.5 text-center text-white font-extrabold">PTS</th>
                          <th className="px-2 py-2.5 text-center">REB</th>
                          <th className="px-2 py-2.5 text-center">AST</th>
                          <th className="px-2 py-2.5 text-center">STL</th>
                          <th className="px-2 py-2.5 text-center">BLK</th>
                          <th className="px-2 py-2.5 text-center">3PM/A</th>
                          <th className="px-2 py-2.5 text-center">FTM/A</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {selectedMatch.boxscore.map((stat: PlayerMatchStat) => (
                          <tr
                            key={stat.playerId}
                            className={
                              stat.isMvp ? 'bg-[#D97706]/10 font-medium' : 'hover:bg-white/5'
                            }
                          >
                            <td className="px-3 py-2.5 font-bold text-white flex items-center gap-2">
                              <span>#{stat.jerseyNumber}</span>
                              <span>{stat.playerName}</span>
                              {stat.isMvp && (
                                <span className="bg-[#D97706] text-black text-[9px] font-black px-1.5 py-0.5 rounded">
                                  MVP
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-2.5 text-center text-slate-400">{stat.position}</td>
                            <td className="px-2 py-2.5 text-center font-mono">{stat.min}</td>
                            <td className="px-2 py-2.5 text-center font-black text-white text-sm">
                              {stat.pts}
                            </td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-200">{stat.reb}</td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-200">{stat.ast}</td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-400">{stat.stl}</td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-400">{stat.blk}</td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-300">
                              {stat.threePm}/{stat.threePa}
                            </td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-300">
                              {stat.ftm}/{stat.fta}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl text-center text-slate-400 space-y-3">
              <Zap className="w-12 h-12 text-slate-600 mx-auto" />
              <p>
                Sélectionnez un match dans la liste pour afficher la feuille de match et la
                galerie vidéo/photo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox plein écran */}
      {activeMedia && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full flex flex-col items-center space-y-4">
            <div className="w-full flex items-center justify-between text-white pb-2 border-b border-white/10">
              <div className="font-bold text-sm flex items-center gap-2">
                {activeMedia.type === 'VIDEO' ? (
                  <Video className="w-4 h-4 text-[#D97706]" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-[#D97706]" />
                )}
                <span>{activeMedia.title || 'Aperçu Média Grand Format'}</span>
              </div>
              <button
                onClick={() => setActiveMedia(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="w-full rounded-2xl overflow-hidden bg-black border border-white/15 shadow-2xl flex justify-center items-center max-h-[80vh]">
              {activeMedia.type === 'VIDEO' ? (
                <div className="w-full aspect-video">
                  <iframe
                    src={getEmbedVideoUrl(activeMedia.url)}
                    title="Video Player"
                    className="w-full h-full rounded-2xl border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <img
                  src={activeMedia.url}
                  alt="Full view"
                  className="max-h-[78vh] w-auto max-w-full object-contain rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modale Admin Ajouter / Éditer */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-white/15 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 bg-[#0D0E15]">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#B91C1C] flex items-center justify-center text-white font-bold text-xs">
                  {editingMatch ? '✏️' : '➕'}
                </div>
                <h3 className="text-lg font-extrabold text-white">
                  {editingMatch
                    ? 'Éditer la Feuille de Match'
                    : 'Programmer un Nouveau Match'}
                </h3>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMatch} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Adversaire :</label>
                  <input
                    type="text"
                    required
                    value={formData.opponent}
                    onChange={(e) =>
                      setFormData({ ...formData, opponent: e.target.value })
                    }
                    placeholder="ex: Cobras de Dakar"
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Logo Équipe Adverse (URL Image ou Emoji) :
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.opponentLogo}
                      onChange={(e) =>
                        setFormData({ ...formData, opponentLogo: e.target.value })
                      }
                      placeholder="https://... ou ⚡"
                      className="flex-1 bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                    />
                    <div className="shrink-0 flex items-center">
                      {renderOpponentLogo(formData.opponentLogo, 'w-9 h-9')}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500">Préréglages :</span>
                    {PRESET_LOGOS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, opponentLogo: p.logo })
                        }
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[10px] text-slate-300"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Date du Match :</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Heure du Coup d'Envoi :
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Lieu & Salle :</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({ ...formData, venue: e.target.value })
                    }
                    placeholder="ex: Terrain du Lycée d'Adétikopé"
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Statut du Match :</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'UPCOMING' | 'FINISHED',
                      })
                    }
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                  >
                    <option value="UPCOMING">À Venir (UPCOMING)</option>
                    <option value="FINISHED">Terminé (FINISHED)</option>
                  </select>
                </div>
              </div>

              {formData.status === 'FINISHED' && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-[#D97706]" /> Enregistrement des Médias &
                    Score Final
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-bold mb-1 flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-[#D97706]" /> Lien Vidéo Résumé
                        (YouTube/MP4) :
                      </label>
                      <input
                        type="text"
                        value={formData.videoUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, videoUrl: e.target.value })
                        }
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-bold mb-1 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-[#D97706]" /> URLs Galerie Photos
                        (séparées par virgules) :
                      </label>
                      <input
                        type="text"
                        value={formData.photosStr}
                        onChange={(e) =>
                          setFormData({ ...formData, photosStr: e.target.value })
                        }
                        placeholder="https://...1, https://...2"
                        className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">
                        Score Total FIRE STONE :
                      </label>
                      <input
                        type="number"
                        value={formData.scoreTeam}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            scoreTeam: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white font-bold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">
                        Score Total Adversaire :
                      </label>
                      <input
                        type="number"
                        value={formData.scoreOpponent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            scoreOpponent: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-slate-300">
                    {([1, 2, 3, 4] as const).map((q) => (
                      <div key={q}>
                        <span className="font-bold text-[10px]">Q{q} (FS / Adv)</span>
                        <div className="flex gap-1 mt-1">
                          <input
                            type="number"
                            value={(formData as any)[`q${q}Team`]}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [`q${q}Team`]: parseInt(e.target.value) || 0,
                              } as any)
                            }
                            className="w-full bg-[#090A0F] border border-white/10 rounded p-1 text-center"
                          />
                          <input
                            type="number"
                            value={(formData as any)[`q${q}Opp`]}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [`q${q}Opp`]: parseInt(e.target.value) || 0,
                              } as any)
                            }
                            className="w-full bg-[#090A0F] border border-white/10 rounded p-1 text-center"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">
                      Désigner le MVP du Match :
                    </label>
                    <select
                      value={formData.mvpPlayerName}
                      onChange={(e) =>
                        setFormData({ ...formData, mvpPlayerName: e.target.value })
                      }
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                    >
                      <option value="">— Sélectionner —</option>
                      {roster.length === 0 ? (
                        <option value="" disabled>
                          Aucun joueur dans l'effectif
                        </option>
                      ) : (
                        roster.map((p) => (
                          <option key={p.id} value={p.name}>
                            #{p.number} {p.name} ({p.position})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">
                      Résumé Tactique / Commentaire du Match :
                    </label>
                    <textarea
                      value={formData.summary}
                      onChange={(e) =>
                        setFormData({ ...formData, summary: e.target.value })
                      }
                      placeholder="Détails du match, points forts et moments clés..."
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white min-h-17.5 resize-none"
                    />
                  </div>
                </div>
              )}

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
                  <span>Enregistrer le Match</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};