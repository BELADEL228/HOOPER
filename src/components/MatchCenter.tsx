import React, { useState } from 'react';
import type { Match, PlayerMatchStat, UserRole } from '../types';
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
  Image as ImageIcon
} from 'lucide-react';
import { mockMatches, mockPlayers } from '../data/mockData';

interface MatchCenterProps {
  currentRole?: UserRole;
}

// Preset Opponent Logos for fast admin selection
const PRESET_LOGOS = [
  { name: 'Vipers Lyon (Image)', logo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&auto=format&fit=crop&q=80' },
  { name: 'Spartans Marseille (Image)', logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=150&auto=format&fit=crop&q=80' },
  { name: 'Red Dragons Paris (Image)', logo: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=150&auto=format&fit=crop&q=80' },
  { name: 'Eclairs (Emoji)', logo: '⚡' },
  { name: 'Bouclier (Emoji)', logo: '🛡️' },
  { name: 'Dragon (Emoji)', logo: '🐉' },
];

export const MatchCenter: React.FC<MatchCenterProps> = ({ currentRole = 'SUPER_ADMIN' }) => {
  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'FINISHED'>('ALL');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(
    mockMatches.find((m) => m.status === 'FINISHED') || mockMatches[0] || null
  );

  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  // Lightbox Modal for Fullscreen Media
  const [activeMedia, setActiveMedia] = useState<{
    type: 'PHOTO' | 'VIDEO';
    url: string;
    title?: string;
  } | null>(null);

  // Form State for Adding / Editing Match
  const [formData, setFormData] = useState({
    opponent: '',
    opponentLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&auto=format&fit=crop&q=80',
    isHome: true,
    date: new Date().toISOString().split('T')[0],
    time: '20:30',
    venue: 'Terrain du Lycée d\'Adétikopé',
    address: 'Quartier Adétikopé, Lomé — Togo',
    status: 'UPCOMING' as 'UPCOMING' | 'FINISHED',
    scoreTeam: 0,
    scoreOpponent: 0,
    summary: '',
    mvpPlayerName: 'Marcus "Apex" Vance',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    photosStr: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80, https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80, https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=1200&auto=format&fit=crop&q=80',
    q1Team: 0,
    q1Opp: 0,
    q2Team: 0,
    q2Opp: 0,
    q3Team: 0,
    q3Opp: 0,
    q4Team: 0,
    q4Opp: 0,
  });

  const isAuthorized = ['SUPER_ADMIN', 'ADMIN', 'COACH'].includes(currentRole);

  const filteredMatches = matches.filter((m) => {
    if (filter === 'UPCOMING') return m.status === 'UPCOMING';
    if (filter === 'FINISHED') return m.status === 'FINISHED';
    return true;
  });

  // Helper to render Opponent Logo (Image or Emoji)
  const renderOpponentLogo = (logoStr: string, className: string = 'w-10 h-10') => {
    const isImage = logoStr.startsWith('http://') || logoStr.startsWith('https://') || logoStr.startsWith('/') || logoStr.startsWith('data:');
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
      opponentLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&auto=format&fit=crop&q=80',
      isHome: true,
      date: new Date().toISOString().split('T')[0],
      time: '20:30',
      venue: 'Terrain du Lycée d\'Adétikopé',
      address: 'Quartier Adétikopé, Lomé — Togo',
      status: 'UPCOMING',
      scoreTeam: 0,
      scoreOpponent: 0,
      summary: '',
      mvpPlayerName: mockPlayers[0]?.name || '',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      photosStr: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80, https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
      q1Team: 20,
      q1Opp: 18,
      q2Team: 22,
      q2Opp: 20,
      q3Team: 24,
      q3Opp: 22,
      q4Team: 22,
      q4Opp: 20,
    });
    setShowAdminModal(true);
  };

  const handleOpenEditModal = (matchToEdit: Match) => {
    setEditingMatch(matchToEdit);
    setFormData({
      opponent: matchToEdit.opponent,
      opponentLogo: matchToEdit.opponentLogo || '⚡',
      isHome: matchToEdit.isHome,
      date: matchToEdit.date,
      time: matchToEdit.time,
      venue: matchToEdit.venue,
      address: matchToEdit.address,
      status: matchToEdit.status,
      scoreTeam: matchToEdit.scoreTeam || 0,
      scoreOpponent: matchToEdit.scoreOpponent || 0,
      summary: matchToEdit.summary || '',
      mvpPlayerName: matchToEdit.mvpPlayerName || mockPlayers[0]?.name || '',
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

  const handleSaveMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.opponent.trim()) return;

    const parsedPhotos = formData.photosStr
      ? formData.photosStr.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
      : undefined;

    const defaultBoxscore: PlayerMatchStat[] = mockPlayers.map((p, idx) => ({
      playerId: p.id,
      playerName: p.name,
      jerseyNumber: p.number,
      position: p.position,
      pts: idx === 0 ? 24 : 14 - idx * 2,
      reb: idx === 1 ? 12 : 4,
      ast: idx === 0 ? 8 : 2,
      stl: 2,
      blk: idx === 1 ? 3 : 0,
      to: 1,
      fgm: 8,
      fga: 14,
      threePm: 3,
      threePa: 6,
      ftm: 4,
      fta: 4,
      min: 28,
      isMvp: p.name === formData.mvpPlayerName
    }));

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
            quarterScoresTeam: formData.status === 'FINISHED' ? {
              q1: formData.q1Team,
              q2: formData.q2Team,
              q3: formData.q3Team,
              q4: formData.q4Team
            } : undefined,
            quarterScoresOpponent: formData.status === 'FINISHED' ? {
              q1: formData.q1Opp,
              q2: formData.q2Opp,
              q3: formData.q3Opp,
              q4: formData.q4Opp
            } : undefined,
            boxscore: m.boxscore && m.boxscore.length > 0 ? m.boxscore : defaultBoxscore
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
        summary: formData.summary || 'Match officiel programmé au calendrier de FIRE STONE.',
        mvpPlayerName: formData.status === 'FINISHED' ? formData.mvpPlayerName : undefined,
        videoUrl: formData.status === 'FINISHED' ? formData.videoUrl : undefined,
        photos: formData.status === 'FINISHED' ? parsedPhotos : undefined,
        quarterScoresTeam: formData.status === 'FINISHED' ? {
          q1: formData.q1Team,
          q2: formData.q2Team,
          q3: formData.q3Team,
          q4: formData.q4Team
        } : undefined,
        quarterScoresOpponent: formData.status === 'FINISHED' ? {
          q1: formData.q1Opp,
          q2: formData.q2Opp,
          q3: formData.q3Opp,
          q4: formData.q4Opp
        } : undefined,
        boxscore: formData.status === 'FINISHED' ? defaultBoxscore : undefined
      };
      setMatches([newMatch, ...matches]);
      setSelectedMatch(newMatch);
    }

    setShowAdminModal(false);
  };

  const handleDeleteMatch = (matchId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce match du calendrier ?')) return;
    const newList = matches.filter((m) => m.id !== matchId);
    setMatches(newList);
    if (selectedMatch?.id === matchId) {
      setSelectedMatch(newList[0] || null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B91C1C]/20 text-[#B91C1C] text-xs font-bold uppercase tracking-wider mb-2 border border-[#B91C1C]/30">
            <Flame className="w-3.5 h-3.5 text-[#D97706]" /> Match Center Pro & Media Hub
          </div>
          <h2 className="text-3xl font-extrabold text-white">Matchs, Scores & Vidéos</h2>
          <p className="text-slate-400 text-sm">Feuilles de statistiques officielles et résumés vidéo haute définition.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAuthorized && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B91C1C] to-[#881337] text-white font-bold text-xs shadow-md hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" />
              <span>Programmer un Match</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/10">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'ALL' ? 'bg-[#B91C1C] text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              Tous ({matches.length})
            </button>
            <button
              onClick={() => setFilter('UPCOMING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'UPCOMING' ? 'bg-[#B91C1C] text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              À venir ({matches.filter((m) => m.status === 'UPCOMING').length})
            </button>
            <button
              onClick={() => setFilter('FINISHED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'FINISHED' ? 'bg-[#B91C1C] text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              Terminés ({matches.filter((m) => m.status === 'FINISHED').length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Match Cards | Right Boxscore & Media Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Match Cards List */}
        <div className="lg:col-span-5 space-y-4">
          {filteredMatches.map((match) => {
            const isSelected = selectedMatch?.id === match.id;
            const isUpcoming = match.status === 'UPCOMING';

            return (
              <div
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'border-[#B91C1C] bg-white/10 shadow-lg shadow-red-950/20'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-[#B91C1C] to-[#D97706]" />
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#D97706]" /> {match.date} — {match.time}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      isUpcoming ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B91C1C] to-[#D97706] p-0.5">
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
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded">VS</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-sm">{match.opponent}</span>
                    {/* Render Image or Emoji Logo */}
                    {renderOpponentLogo(match.opponentLogo, 'w-10 h-10')}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5 text-xs text-slate-400">
                  <span className="flex items-center gap-1 truncate max-w-[200px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {match.venue}
                  </span>
                  <span className="text-[#D97706] font-semibold flex items-center gap-0.5">
                    Consulter la feuille <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Detailed Match Boxscore & Media Gallery */}
        <div className="lg:col-span-7">
          {selectedMatch ? (
            <div className="glass-panel rounded-3xl p-6 border border-white/15 space-y-6">
              
              {/* Top Banner Scoreboard */}
              <div className="relative rounded-2xl bg-gradient-to-r from-red-950/40 via-[#090A0F] to-slate-900/60 p-6 border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#B91C1C]" /> {selectedMatch.venue} ({selectedMatch.address})
                  </span>
                  <span className="font-medium text-slate-300">{selectedMatch.date} à {selectedMatch.time}</span>
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
                        <div className="text-xs text-emerald-400 font-bold uppercase mt-1">Victoire FIRE STONE</div>
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
                    <div className="text-xl sm:text-2xl font-black text-white">{selectedMatch.opponent}</div>
                    <div className="text-xs text-slate-400 font-medium">EXTÉRIEUR</div>
                  </div>
                </div>

                {/* Quarter Scores */}
                {selectedMatch.quarterScoresTeam && selectedMatch.quarterScoresOpponent && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                      Score par Quart-Temps
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center text-xs bg-black/40 p-2.5 rounded-xl border border-white/5">
                      <div>
                        <div className="text-slate-400 font-medium">Q1</div>
                        <div className="font-bold text-white">{selectedMatch.quarterScoresTeam.q1} - {selectedMatch.quarterScoresOpponent.q1}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">Q2</div>
                        <div className="font-bold text-white">{selectedMatch.quarterScoresTeam.q2} - {selectedMatch.quarterScoresOpponent.q2}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">Q3</div>
                        <div className="font-bold text-white">{selectedMatch.quarterScoresTeam.q3} - {selectedMatch.quarterScoresOpponent.q3}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">Q4</div>
                        <div className="font-bold text-white">{selectedMatch.quarterScoresTeam.q4} - {selectedMatch.quarterScoresOpponent.q4}</div>
                      </div>
                      <div className="border-l border-white/10 pl-2">
                        <div className="text-[#D97706] font-bold">TOTAL</div>
                        <div className="font-black text-[#D97706]">{selectedMatch.scoreTeam} - {selectedMatch.scoreOpponent}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary & MVP */}
              {selectedMatch.status === 'FINISHED' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8 bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                    <div className="text-xs font-bold text-[#D97706] uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> Résumé Tactique du Match
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedMatch.summary}</p>
                  </div>

                  {selectedMatch.mvpPlayerName && (
                    <div className="md:col-span-4 bg-gradient-to-br from-amber-500/20 to-[#D97706]/10 p-4 rounded-2xl border border-[#D97706]/30 flex items-center gap-3">
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

              {/* Media Gallery Section: Videos & Photos with Fullscreen Lightbox Trigger */}
              {selectedMatch.status === 'FINISHED' && (selectedMatch.videoUrl || (selectedMatch.photos && selectedMatch.photos.length > 0)) && (
                <div className="space-y-4 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Video className="w-4 h-4 text-[#D97706]" /> Multimédia du Match (Résumés Vidéos & Galerie Photos)
                    </h3>
                    <span className="text-xs text-slate-400">Cliquez pour agrandir</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Video Preview Card */}
                    {selectedMatch.videoUrl && (
                      <div
                        onClick={() => setActiveMedia({ type: 'VIDEO', url: selectedMatch.videoUrl!, title: `Résumé Vidéo : FIRE STONE vs ${selectedMatch.opponent}` })}
                        className="group relative rounded-2xl overflow-hidden border border-white/15 h-44 cursor-pointer glass-panel"
                      >
                        <img
                          src={selectedMatch.photos && selectedMatch.photos[0] ? selectedMatch.photos[0] : 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80'}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-between p-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#B91C1C] text-white font-bold text-[10px] uppercase w-max shadow-md">
                            <Video className="w-3 h-3" /> Résumé Match HD
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-extrabold text-white text-sm">Voir les temps forts en vidéo</div>
                              <div className="text-[11px] text-slate-300">Cliquer pour lire en grand</div>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#B91C1C] text-white flex items-center justify-center shadow-lg shadow-red-950/50 group-hover:scale-110 transition-transform">
                              <Play className="w-6 h-6 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Photos Preview Grid */}
                    {selectedMatch.photos && selectedMatch.photos.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedMatch.photos.slice(0, 4).map((photoUrl, idx) => (
                          <div
                            key={idx}
                            onClick={() => setActiveMedia({ type: 'PHOTO', url: photoUrl, title: `Photo ${idx + 1} — Match vs ${selectedMatch.opponent}` })}
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

              {/* Detailed Individual Boxscore Table */}
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
                          <tr key={stat.playerId} className={stat.isMvp ? 'bg-[#D97706]/10 font-medium' : 'hover:bg-white/5'}>
                            <td className="px-3 py-2.5 font-bold text-white flex items-center gap-2">
                              <span>#{stat.jerseyNumber}</span>
                              <span>{stat.playerName}</span>
                              {stat.isMvp && (
                                <span className="bg-[#D97706] text-black text-[9px] font-black px-1.5 py-0.5 rounded">MVP</span>
                              )}
                            </td>
                            <td className="px-2 py-2.5 text-center text-slate-400">{stat.position}</td>
                            <td className="px-2 py-2.5 text-center font-mono">{stat.min}</td>
                            <td className="px-2 py-2.5 text-center font-black text-white text-sm">{stat.pts}</td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-200">{stat.reb}</td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-200">{stat.ast}</td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-400">{stat.stl}</td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-400">{stat.blk}</td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-300">{stat.threePm}/{stat.threePa}</td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-300">{stat.ftm}/{stat.fta}</td>
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
              <p>Sélectionnez un match dans la liste pour afficher la feuille de match et la galerie vidéo/photo.</p>
            </div>
          )}
        </div>

      </div>

      {/* FULLSCREEN LIGHTBOX MODAL FOR PHOTOS & VIDEOS */}
      {activeMedia && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full flex flex-col items-center space-y-4">
            
            {/* Top Lightbox Header */}
            <div className="w-full flex items-center justify-between text-white pb-2 border-b border-white/10">
              <div className="font-bold text-sm flex items-center gap-2">
                {activeMedia.type === 'VIDEO' ? <Video className="w-4 h-4 text-[#D97706]" /> : <ImageIcon className="w-4 h-4 text-[#D97706]" />}
                <span>{activeMedia.title || 'Aperçu Média Grand Format'}</span>
              </div>
              <button
                onClick={() => setActiveMedia(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Media Content Player / Image View */}
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

      {/* ADMIN ADD / EDIT MATCH MODAL WITH OPPONENT LOGO URL AND MEDIA INPUTS */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-white/15 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 bg-[#0D0E15]">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#B91C1C] flex items-center justify-center text-white font-bold text-xs">
                  {editingMatch ? '✏️' : '➕'}
                </div>
                <h3 className="text-lg font-extrabold text-white">
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
              
              {/* Opponent & Logo Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Adversaire :</label>
                  <input
                    type="text"
                    required
                    value={formData.opponent}
                    onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                    placeholder="ex: Cobras de Dakar"
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Logo Équipe Adverse (URL Image ou Emoji) :</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.opponentLogo}
                      onChange={(e) => setFormData({ ...formData, opponentLogo: e.target.value })}
                      placeholder="https://... (URL de l'image de l'équipe)"
                      className="flex-1 bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                    />
                    <div className="shrink-0 flex items-center">
                      {renderOpponentLogo(formData.opponentLogo, 'w-9 h-9')}
                    </div>
                  </div>

                  {/* Preset Logos Select */}
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500">Préréglages :</span>
                    {PRESET_LOGOS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, opponentLogo: p.logo })}
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
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Heure du Coup d'Envoi :</label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Lieu & Salle :</label>
                  <input
                    type="text"
                    required
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="ex: Terrain du Lycée d'Adétikopé"
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Statut du Match :</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'UPCOMING' | 'FINISHED' })}
                    className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                  >
                    <option value="UPCOMING">À Venir (UPCOMING)</option>
                    <option value="FINISHED">Terminé (FINISHED)</option>
                  </select>
                </div>
              </div>

              {/* If Finished Match: Scores, Video & Photos Inputs */}
              {formData.status === 'FINISHED' && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-[#D97706]" /> Enregistrement des Médias & Score Final
                  </div>

                  {/* Video and Photos Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1 flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-[#D97706]" /> Lien Vidéo Résumé (YouTube/MP4) :
                      </label>
                      <input
                        type="text"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-[#D97706]" /> URLs Galerie Photos (séparées par virgules) :
                      </label>
                      <input
                        type="text"
                        value={formData.photosStr}
                        onChange={(e) => setFormData({ ...formData, photosStr: e.target.value })}
                        placeholder="https://...1, https://...2"
                        className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Score Total FIRE STONE :</label>
                      <input
                        type="number"
                        value={formData.scoreTeam}
                        onChange={(e) => setFormData({ ...formData, scoreTeam: parseInt(e.target.value) || 0 })}
                        className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white font-bold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Score Total Adversaire :</label>
                      <input
                        type="number"
                        value={formData.scoreOpponent}
                        onChange={(e) => setFormData({ ...formData, scoreOpponent: parseInt(e.target.value) || 0 })}
                        className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white font-bold text-sm"
                      />
                    </div>
                  </div>

                  {/* Quarters breakdown */}
                  <div className="grid grid-cols-4 gap-2 text-center text-slate-300">
                    <div>
                      <span className="font-bold text-[10px]">Q1 (FS / Adv)</span>
                      <div className="flex gap-1 mt-1">
                        <input type="number" value={formData.q1Team} onChange={(e) => setFormData({ ...formData, q1Team: parseInt(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded p-1 text-center" />
                        <input type="number" value={formData.q1Opp} onChange={(e) => setFormData({ ...formData, q1Opp: parseInt(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded p-1 text-center" />
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-[10px]">Q2 (FS / Adv)</span>
                      <div className="flex gap-1 mt-1">
                        <input type="number" value={formData.q2Team} onChange={(e) => setFormData({ ...formData, q2Team: parseInt(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded p-1 text-center" />
                        <input type="number" value={formData.q2Opp} onChange={(e) => setFormData({ ...formData, q2Opp: parseInt(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded p-1 text-center" />
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-[10px]">Q3 (FS / Adv)</span>
                      <div className="flex gap-1 mt-1">
                        <input type="number" value={formData.q3Team} onChange={(e) => setFormData({ ...formData, q3Team: parseInt(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded p-1 text-center" />
                        <input type="number" value={formData.q3Opp} onChange={(e) => setFormData({ ...formData, q3Opp: parseInt(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded p-1 text-center" />
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-[10px]">Q4 (FS / Adv)</span>
                      <div className="flex gap-1 mt-1">
                        <input type="number" value={formData.q4Team} onChange={(e) => setFormData({ ...formData, q4Team: parseInt(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded p-1 text-center" />
                        <input type="number" value={formData.q4Opp} onChange={(e) => setFormData({ ...formData, q4Opp: parseInt(e.target.value) || 0 })} className="w-full bg-[#090A0F] border border-white/10 rounded p-1 text-center" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Désigner le MVP du Match :</label>
                    <select
                      value={formData.mvpPlayerName}
                      onChange={(e) => setFormData({ ...formData, mvpPlayerName: e.target.value })}
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
                    >
                      {mockPlayers.map((p) => (
                        <option key={p.id} value={p.name}>
                          #{p.number} {p.name} ({p.position})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Résumé Tactique / Commentaire du Match :</label>
                    <textarea
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      placeholder="Détails du match, points forts et moments clés..."
                      className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white min-h-[70px] resize-none"
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
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B91C1C] to-[#881337] text-white font-bold shadow-md hover:scale-105 transition-transform flex items-center gap-2"
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
