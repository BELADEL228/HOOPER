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
  Clock,
  Sparkles,
  Radio
} from 'lucide-react';
import { apiUrl } from '../../services/api';
import { uploadMedia } from '../../services/uploadService';
import { useClub } from '../../context/ClubContext';
import { MatchRequestsPanel } from './MatchRequestsPanel';
import { LiveScorePanel } from './LiveScorePanel';

interface MatchCenterProps {
  currentRole?: UserRole;
}

const PRESET_LOGOS = [
  { name: 'Black Stars Cotonou', logo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&auto=format&fit=crop&q=80' },
  { name: 'Cobras Dakar', logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=150&auto=format&fit=crop&q=80' },
  { name: 'Titans Accra', logo: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=150&auto=format&fit=crop&q=80' },
  { name: 'Étoile Filante Lomé', logo: '⭐' },
  { name: 'Défenseurs Kara', logo: '🛡️' },
  { name: 'Éclair Sokodé', logo: '⚡' },
  { name: 'Flamme Kpalimé', logo: '🔥' },
];

export const MatchCenter: React.FC<MatchCenterProps> = ({ currentRole = 'SUPER_ADMIN' }) => {
  const { matches: clubMatches, roster, loading: clubLoading, activeClub } = useClub();
  const clubName = activeClub?.name || 'HOOPER Club';

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

  // Formulaire admin
  const [formData, setFormData] = useState({
    opponent: '',
    opponentLogo: '',
    isHome: true,
    date: new Date().toISOString().split('T')[0],
    time: '20:30',
    venue: activeClub?.arena || 'Palais des Sports de Lomé',
    address: activeClub?.city || 'Lomé, Togo',
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

  const [uploadingMatchPhoto, setUploadingMatchPhoto] = useState(false);

  const handleUploadMatchPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingMatchPhoto(true);
      const res = await uploadMedia(file, 'firestone/matches');
      const finalUrl = res.secure_url || res.url;
      setFormData((prev) => {
        const existing = prev.photosStr.trim();
        const updated = existing ? `${existing}, ${finalUrl}` : finalUrl;
        return { ...prev, photosStr: updated };
      });
    } catch (err: any) {
      alert(err?.message || 'Erreur lors du téléversement de la photo sur Cloudinary.');
    } finally {
      setUploadingMatchPhoto(false);
    }
  };

  const isAuthorized = ['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER', 'CLUB_ADMIN', 'COACH'].includes(currentRole);

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
        setMatchSyncError('Mode local actif : synchronisation serveur différée.')
      );
  }, [clubMatches]);

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

  const renderOpponentLogo = (logoStr: string, className: string = 'w-10 h-10') => {
    if (!logoStr) {
      return (
        <div className={`${className} rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center text-lg shadow-md shrink-0`}>
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
          className={`${className} rounded-2xl object-cover border border-white/10 shadow-sm shrink-0`}
        />
      );
    }
    return (
      <div className={`${className} rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center text-lg shadow-md shrink-0`}>
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

  const handleOpenAddModal = () => {
    setEditingMatch(null);
    setFormData({
      opponent: '',
      opponentLogo: '',
      isHome: true,
      date: new Date().toISOString().split('T')[0],
      time: '20:30',
      venue: activeClub?.arena || 'Palais des Sports de Lomé',
      address: activeClub?.city || 'Lomé, Togo',
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

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.opponent.trim()) return;

    const parsedPhotos = formData.photosStr
      ? formData.photosStr
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
      : undefined;

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
      setMatchSyncError('Sauvegarde locale : serveur indisponible.');
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
        summary: formData.summary,
        mvpPlayerName: formData.status === 'FINISHED' ? formData.mvpPlayerName : undefined,
        videoUrl: formData.status === 'FINISHED' ? formData.videoUrl : undefined,
        photos: formData.status === 'FINISHED' ? parsedPhotos : undefined,
        boxscore: formData.status === 'FINISHED' ? buildEmptyBoxscore() : undefined,
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
      };
      setMatches([newMatch, ...matches]);
      setSelectedMatch(newMatch);
    }

    setShowAdminModal(false);
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Supprimer définitivement ce match ?')) return;
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (session?.token) {
      await fetch(apiUrl(`/matches/${matchId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      }).catch(() => null);
    }
    const filtered = matches.filter((m) => m.id !== matchId);
    setMatches(filtered);
    if (selectedMatch?.id === matchId) setSelectedMatch(filtered[0] || null);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Hero */}
      <div className="rounded-2xl border border-white/10 bg-[#0C0F1A] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/15 border border-red-500/25 text-red-300 text-[11px] font-semibold">
                <Radio className="w-3 h-3 text-red-400" />
                Centre de matchs
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px]">
                {clubName} · D1 Nationale FIBA
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
              Calendrier
            </h1>

            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Scores officiels, quart-temps, statistiques individuelles, résumés tactiques et vidéos.
            </p>
            {matchSyncError && (
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl inline-block">
                {matchSyncError}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAuthorized && (
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF2A3B] hover:bg-[#E0202F] text-white font-bold text-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Programmer un match</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/30 border border-white/5">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-white/15 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tous ({matches.length})
            </button>
            <button
              onClick={() => setFilter('UPCOMING')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'UPCOMING'
                  ? 'bg-amber-500 text-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              À venir ({matches.filter((m) => m.status === 'UPCOMING').length})
            </button>
            <button
              onClick={() => setFilter('FINISHED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'FINISHED'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Terminés ({matches.filter((m) => m.status === 'FINISHED').length})
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Feuilles homologuées LNB</span>
          </div>
        </div>
      </div>

      <MatchRequestsPanel currentRole={currentRole} />
      <LiveScorePanel match={selectedMatch} currentRole={currentRole} />

      {/* Main Layout : Matches List (Left) & Match Sheet (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Colonne gauche : Liste des matchs */}
        <div className="lg:col-span-5 space-y-4">
          {clubLoading && matches.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0F131F] p-10 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <span className="text-xs text-slate-400">Chargement des rencontres...</span>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-[#0F131F]/50 p-10 text-center text-slate-400 space-y-2">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">Aucun match pour ce filtre</p>
              <p className="text-xs text-slate-400">Sélectionnez un autre filtre ou programmez une nouvelle confrontation.</p>
              {isAuthorized && (
                <button
                  onClick={handleOpenAddModal}
                  className="mt-2 text-xs font-bold text-amber-400 hover:underline cursor-pointer"
                >
                  + Programmer un match
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
                  className={`rounded-3xl border transition-all cursor-pointer relative overflow-hidden p-5 ${
                    isSelected
                      ? 'border-amber-500/80 bg-gradient-to-r from-red-950/40 to-[#0F131F] shadow-2xl shadow-red-950/40'
                      : 'border-white/10 hover:border-white/20 bg-[#0F131F]'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-[#FF2A3B] to-amber-500" />
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" /> {match.date} • {match.time}
                    </span>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[10px] ${
                          isUpcoming
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
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
                            className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMatch(match.id);
                            }}
                            className="p-1 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 p-0.5 shadow-md">
                        <div className="w-full h-full bg-[#090A0F] rounded-[14px] flex items-center justify-center font-black text-white text-xs">
                          {clubName.slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <span className="font-black text-white text-sm">{clubName}</span>
                    </div>

                    <div className="text-center px-3">
                      {!isUpcoming ? (
                        <span className="text-xl font-black text-white font-mono">
                          {match.scoreTeam} - {match.scoreOpponent}
                        </span>
                      ) : (
                        <span className="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                          VS
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-white text-sm text-right">{match.opponent}</span>
                      {renderOpponentLogo(match.opponentLogo, 'w-10 h-10')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5 text-xs text-slate-400">
                    <span className="flex items-center gap-1 truncate max-w-44 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {match.venue || 'Arène non précisée'}
                    </span>
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      Feuille de match <ChevronRight className="w-4 h-4" />
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
            <div className="rounded-3xl border border-white/10 bg-[#0F131F] p-6 sm:p-7 space-y-6 shadow-2xl">
              {/* Grand Bandeau Scoreboard */}
              <div className="relative rounded-3xl bg-gradient-to-r from-red-950/40 via-[#0A0D15] to-[#0D101C] p-6 border border-white/10 space-y-4 overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <MapPin className="w-4 h-4 text-red-500" /> {selectedMatch.venue || 'Arène officielle'}{' '}
                    {selectedMatch.address ? `• ${selectedMatch.address}` : ''}
                  </span>
                  <span className="font-bold text-slate-300">
                    {selectedMatch.date} à {selectedMatch.time}
                  </span>
                </div>

                <div className="grid grid-cols-3 items-center text-center py-2">
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-white">{clubName}</div>
                    <div className="text-[11px] text-amber-400 font-black uppercase tracking-wider mt-0.5">
                      DOMICILE
                    </div>
                  </div>

                  <div>
                    {selectedMatch.status === 'FINISHED' ? (
                      <div>
                        <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-amber-300 font-mono tracking-tight">
                          {selectedMatch.scoreTeam} : {selectedMatch.scoreOpponent}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-black uppercase mt-1">
                          Score final
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-2xl sm:text-3xl font-black text-amber-400">VS</span>
                        <div className="text-xs text-slate-400">Coup d'envoi programmé</div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center">
                    {renderOpponentLogo(selectedMatch.opponentLogo, 'w-12 h-12 mb-1')}
                    <div className="text-xl sm:text-2xl font-black text-white">
                      {selectedMatch.opponent}
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                      EXTÉRIEUR
                    </div>
                  </div>
                </div>

                {/* Scores par quart-temps */}
                {selectedMatch.quarterScoresTeam && selectedMatch.quarterScoresOpponent && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">
                      Évolution par Quart-Temps
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center text-xs bg-black/50 p-3 rounded-2xl border border-white/5">
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
                        <div className="text-amber-400 font-black">TOTAL</div>
                        <div className="font-black text-amber-400 font-mono">
                          {selectedMatch.scoreTeam} - {selectedMatch.scoreOpponent}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Résumé Tactique & MVP */}
              {selectedMatch.status === 'FINISHED' && (selectedMatch.summary || selectedMatch.mvpPlayerName) && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {selectedMatch.summary && (
                    <div className="md:col-span-8 bg-white/[0.03] p-4 rounded-2xl border border-white/10 space-y-2">
                      <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" /> Analyse Tactique du Match
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{selectedMatch.summary}</p>
                    </div>
                  )}

                  {selectedMatch.mvpPlayerName && (
                    <div className="md:col-span-4 bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-4 rounded-2xl border border-amber-500/30 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500 text-black font-black flex items-center justify-center shrink-0 text-xl shadow-md">
                        ⭐
                      </div>
                      <div>
                        <div className="text-[10px] text-amber-300 font-black uppercase tracking-wider">
                          MVP de la Rencontre
                        </div>
                        <div className="font-black text-white text-sm">{selectedMatch.mvpPlayerName}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Galerie multimédia */}
              {selectedMatch.status === 'FINISHED' &&
                (selectedMatch.videoUrl || (selectedMatch.photos && selectedMatch.photos.length > 0)) && (
                  <div className="space-y-4 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <Video className="w-4 h-4 text-amber-400" /> Galerie Multimédia du Match
                      </h3>
                      <span className="text-xs text-slate-400">Cliquez pour afficher en grand</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedMatch.videoUrl && (
                        <div
                          onClick={() =>
                            setActiveMedia({
                              type: 'VIDEO',
                              url: selectedMatch.videoUrl!,
                              title: `Temps Forts Vidéo : ${clubName} vs ${selectedMatch.opponent}`,
                            })
                          }
                          className="group relative rounded-2xl overflow-hidden border border-white/15 h-44 cursor-pointer bg-black/60"
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
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-between p-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white font-bold text-[10px] uppercase w-max shadow-md">
                              <Video className="w-3 h-3" /> Résumé Vidéo HD
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-black text-white text-sm">
                                  Visionner les temps forts
                                </div>
                                <div className="text-[11px] text-slate-300">
                                  Plein écran avec audio
                                </div>
                              </div>
                              <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-950/60 group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 fill-current ml-0.5" />
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
                                  title: `Cliché ${idx + 1} — vs ${selectedMatch.opponent}`,
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
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" /> Feuille de Stats Individuelles (Boxscore)
                    </h3>
                    <span className="text-xs text-slate-400 font-semibold">{clubName}</span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-[#141926] text-slate-400 uppercase font-black text-[10px] tracking-wider">
                        <tr>
                          <th className="px-3 py-3">Athlète</th>
                          <th className="px-2 py-3 text-center">POS</th>
                          <th className="px-2 py-3 text-center">MIN</th>
                          <th className="px-2 py-3 text-center text-white font-extrabold">PTS</th>
                          <th className="px-2 py-3 text-center">REB</th>
                          <th className="px-2 py-3 text-center">AST</th>
                          <th className="px-2 py-3 text-center">STL</th>
                          <th className="px-2 py-3 text-center">BLK</th>
                          <th className="px-2 py-3 text-center">3PM/A</th>
                          <th className="px-2 py-3 text-center">FTM/A</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-[#0C101A]">
                        {selectedMatch.boxscore.map((stat: PlayerMatchStat) => (
                          <tr
                            key={stat.playerId}
                            className={
                              stat.isMvp ? 'bg-amber-500/10 font-bold' : 'hover:bg-white/[0.03]'
                            }
                          >
                            <td className="px-3 py-2.5 font-bold text-white flex items-center gap-2">
                              <span className="font-mono text-amber-400">#{stat.jerseyNumber}</span>
                              <span>{stat.playerName}</span>
                              {stat.isMvp && (
                                <span className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded">
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
                            <td className="px-2 py-2.5 text-center font-mono text-amber-400 font-bold">{stat.ast}</td>
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
            <div className="rounded-3xl border border-white/10 bg-[#0F131F] p-12 text-center text-slate-400 space-y-3">
              <Zap className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">Sélectionnez une rencontre</p>
              <p className="text-xs text-slate-400">
                Cliquez sur un match dans la colonne de gauche pour afficher le tableau des quart-temps,
                les statistiques et les vidéos associées.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox plein écran */}
      {activeMedia && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-5xl w-full flex flex-col items-center space-y-4">
            <div className="w-full flex items-center justify-between text-white pb-2 border-b border-white/10">
              <div className="font-black text-sm flex items-center gap-2">
                {activeMedia.type === 'VIDEO' ? (
                  <Video className="w-4 h-4 text-amber-400" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                )}
                <span>{activeMedia.title || 'Média HD'}</span>
              </div>
              <button
                onClick={() => setActiveMedia(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="w-full rounded-3xl overflow-hidden bg-black border border-white/15 shadow-2xl flex justify-center items-center max-h-[80vh]">
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
                  className="max-h-[78vh] w-auto max-w-full object-contain rounded-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modale Admin Ajouter / Éditer */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="rounded-3xl border border-white/20 max-w-2xl w-full max-h-[92vh] overflow-y-auto space-y-6 bg-[#0F131F] p-6 sm:p-8 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-xs">
                  {editingMatch ? '✏️' : '➕'}
                </div>
                <h3 className="text-lg font-black text-white">
                  {editingMatch ? 'Éditer la Feuille de Match' : 'Programmer un Nouveau Match'}
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
                    onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                    placeholder="ex: Cobras de Dakar"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Logo / Emblème Adversaire :
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.opponentLogo}
                      onChange={(e) => setFormData({ ...formData, opponentLogo: e.target.value })}
                      placeholder="URL image ou emoji ⚡"
                      className="flex-1 bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                    <div className="shrink-0 flex items-center">
                      {renderOpponentLogo(formData.opponentLogo, 'w-9 h-9')}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-bold">Suggestions :</span>
                    {PRESET_LOGOS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, opponentLogo: p.logo })}
                        className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] text-slate-300 cursor-pointer"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Date de la rencontre :</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Heure du Coup d'Envoi :</label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Arène / Terrain :</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="Palais des Sports de Lomé"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Statut du Match :</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'UPCOMING' | 'FINISHED' })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="UPCOMING" className="bg-slate-900">À Venir (UPCOMING)</option>
                    <option value="FINISHED" className="bg-slate-900">Terminé (FINISHED)</option>
                  </select>
                </div>
              </div>

              {formData.status === 'FINISHED' && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="font-black text-white text-xs flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" /> Score Final & Données Multimédia
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-bold mb-1 flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-amber-400" /> Lien Vidéo Résumé (YouTube) :
                      </label>
                      <input
                        type="text"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-400 font-bold flex items-center gap-1 text-xs">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-400" /> Photos (Cloudinary CDN) :
                        </label>
                        <label className="text-[11px] text-amber-300 hover:text-amber-200 cursor-pointer flex items-center gap-1 font-semibold">
                          {uploadingMatchPhoto ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Téléversement...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Ajouter photo</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingMatchPhoto}
                            onChange={handleUploadMatchPhoto}
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={formData.photosStr}
                        onChange={(e) => setFormData({ ...formData, photosStr: e.target.value })}
                        placeholder="https://...1, https://...2"
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">
                        Score Total {clubName} :
                      </label>
                      <input
                        type="number"
                        value={formData.scoreTeam}
                        onChange={(e) => setFormData({ ...formData, scoreTeam: parseInt(e.target.value) || 0 })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white font-bold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">
                        Score Total Adversaire :
                      </label>
                      <input
                        type="number"
                        value={formData.scoreOpponent}
                        onChange={(e) => setFormData({ ...formData, scoreOpponent: parseInt(e.target.value) || 0 })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-slate-300">
                    {([1, 2, 3, 4] as const).map((q) => (
                      <div key={q}>
                        <span className="font-bold text-[10px]">Q{q} ({clubName.slice(0, 3)} / Adv)</span>
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
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-1 text-center text-white"
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
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-1 text-center text-white"
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
                      onChange={(e) => setFormData({ ...formData, mvpPlayerName: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="">— Sélectionner —</option>
                      {roster.map((p) => (
                        <option key={p.id} value={p.name} className="bg-slate-900 text-white">
                          #{p.number} {p.name} ({p.position})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">
                      Résumé Tactique du Match :
                    </label>
                    <textarea
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      placeholder="Faits marquants, ajustements défensifs et moments clés..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white min-h-[70px] resize-none"
                    />
                  </div>
                </div>
              )}

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