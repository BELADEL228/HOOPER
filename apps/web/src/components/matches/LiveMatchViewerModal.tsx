import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Radio,
  Volume2,
  VolumeX,
  Maximize2,
  Play,
  Pause,
  Send,
  Flame,
  Zap,
  Activity,
  Users,
  MessageSquare,
  Trophy,
  Shield,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import type { Match } from '../../types';

interface LiveMatchViewerModalProps {
  match: Match & { clubName?: string };
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string | null;
  currentUserName?: string;
}

interface PlayByPlayEvent {
  id: string;
  quarter: number;
  time: string;
  type: 'SCORE_3PT' | 'SCORE_2PT' | 'DUNK' | 'FOUL' | 'TIMEOUT' | 'STEAL';
  team: 'HOME' | 'AWAY';
  player: string;
  description: string;
  scoreHome: number;
  scoreAway: number;
}

interface LiveChatMessage {
  id: string;
  sender: string;
  avatar?: string;
  text: string;
  time: string;
  isMe?: boolean;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  left: number;
}

export const LiveMatchViewerModal: React.FC<LiveMatchViewerModalProps> = ({
  match,
  isOpen,
  onClose,
  currentUserId: _currentUserId,
  currentUserName = 'Moi',
}) => {
  // ─── Score & Chrono en direct ───────────────────────────────────────
  const [scoreHome, setScoreHome] = useState(match.scoreTeam ?? 78);
  const [scoreAway, setScoreAway] = useState(match.scoreOpponent ?? 74);
  const [quarter, setQuarter] = useState(3);
  const [secondsRemaining, setSecondsRemaining] = useState(274); // 04:34
  const [shotClock, setShotClock] = useState(14);
  const [isClockRunning, setIsClockRunning] = useState(true);

  // ─── Vidéo & Player ────────────────────────────────────────────────
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'PLAYBYPLAY' | 'BOXSCORE'>('CHAT');
  const [cameraAngle, setCameraAngle] = useState<'MAIN' | 'HOOP' | 'COURT2D'>('MAIN');
  const [spectatorsCount, setSpectatorsCount] = useState(842);

  // ─── Chat en direct ────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([
    {
      id: 'm1',
      sender: 'Koffi Basket',
      text: 'Quelle défense de FIRE STONE ce soir ! 🔥',
      time: '19:42',
    },
    {
      id: 'm2',
      sender: 'Coach Sylvain',
      text: 'Attention au repli défensif sur les transitions rapides',
      time: '19:43',
    },
    {
      id: 'm3',
      sender: 'Afiwa',
      text: 'Le 3 points était incroyable 🏀👏',
      time: '19:44',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ─── Événements Play-by-Play ───────────────────────────────────────
  const [events, setEvents] = useState<PlayByPlayEvent[]>([
    {
      id: 'e1',
      quarter: 3,
      time: '05:12',
      type: 'SCORE_3PT',
      team: 'HOME',
      player: 'Koffi Mensah',
      description: 'Tir primé à 3 points au buzzer de possession !',
      scoreHome: 78,
      scoreAway: 74,
    },
    {
      id: 'e2',
      quarter: 3,
      time: '05:38',
      type: 'DUNK',
      team: 'AWAY',
      player: 'Emmanuel Amouzou',
      description: 'Dunk surpuissant en contre-attaque',
      scoreHome: 75,
      scoreAway: 74,
    },
    {
      id: 'e3',
      quarter: 3,
      time: '06:05',
      type: 'STEAL',
      team: 'HOME',
      player: 'Jean-Luc Dossou',
      description: 'Interception décisive dans la raquette',
      scoreHome: 75,
      scoreAway: 72,
    },
  ]);

  // ─── Réactions Emojis Flottantes ───────────────────────────────────
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Simulation horloge de match (décrémentation en temps réel)
  useEffect(() => {
    if (!isOpen || !isClockRunning) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (quarter < 4) {
            setQuarter((q) => q + 1);
            return 600; // 10 minutes par quart-temps
          }
          setIsClockRunning(false);
          return 0;
        }
        return prev - 1;
      });

      setShotClock((prev) => (prev <= 1 ? 24 : prev - 1));

      // Simulation occasionnelle de fluctuations spectateurs
      if (Math.random() > 0.7) {
        setSpectatorsCount((prev) => prev + (Math.random() > 0.4 ? 1 : -1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isClockRunning, quarter]);

  // Scroll automatique chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeTab]);

  if (!isOpen) return null;

  const homeName = match.clubName || 'FIRE STONE Lomé';
  const awayName = match.opponent || 'Visiteur';

  const formatClock = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: LiveChatMessage = {
      id: `chat_${Date.now()}`,
      sender: currentUserName,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  const handleTriggerReaction = (emoji: string) => {
    const reaction: FloatingReaction = {
      id: `r_${Date.now()}_${Math.random()}`,
      emoji,
      left: Math.floor(Math.random() * 60) + 20, // 20% to 80% width
    };

    setFloatingReactions((prev) => [...prev, reaction]);

    // Retirer après animation
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reaction.id));
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-[#0A0D14] border border-white/15 rounded-3xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl relative">
        {/* ─── EN-TÊTE MODALE ─── */}
        <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between bg-[#0E121C]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              DIRECT LIVE
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2 truncate">
              <span>{homeName}</span>
              <span className="text-slate-500">VS</span>
              <span>{awayName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 hidden sm:flex">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>{spectatorsCount.toLocaleString()} en direct</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── CONTENU PRINCIPAL : ÉCRAN VIDÉO + PANNEAU LATÉRAL ─── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* ZONE VIDÉO ET SCOREBOARD (Gauhe) */}
          <div className="flex-1 flex flex-col bg-black relative min-h-[300px] lg:min-h-0">
            {/* Simulation vidéo / Stream container */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-radial from-[#1A2030] to-[#080A0E]">
              {/* Animation court ou flux vidéo réel */}
              {match.videoUrl ? (
                <video
                  src={match.videoUrl}
                  controls={false}
                  autoPlay
                  muted={isMuted}
                  loop
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center relative p-6 select-none">
                  {/* Tracé terrain de basket 2D stylisé */}
                  <div className="w-full max-w-lg h-64 border-2 border-white/15 rounded-2xl relative flex items-center justify-between p-4 bg-linear-to-r from-amber-950/20 via-slate-900/40 to-amber-950/20 shadow-inner">
                    {/* Panier gauche */}
                    <div className="w-8 h-12 border-2 border-amber-500/50 rounded-r-full flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                    </div>

                    {/* Cercle central */}
                    <div className="w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center relative">
                      <div className="w-2 h-2 rounded-full bg-[#FFB800]" />
                      {/* Ballon de basket animé */}
                      <div className="absolute w-6 h-6 rounded-full bg-amber-500 border border-amber-300 shadow-lg shadow-amber-500/50 flex items-center justify-center text-[10px] animate-bounce">
                        🏀
                      </div>
                    </div>

                    {/* Panier droit */}
                    <div className="w-8 h-12 border-2 border-amber-500/50 rounded-l-full flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                    </div>
                  </div>

                  <div className="mt-4 text-center space-y-1">
                    <span className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-[#FFB800] animate-pulse" />
                      Flux retransmission interactive HD — {cameraAngle === 'MAIN' ? 'Caméra Centrale' : cameraAngle === 'HOOP' ? 'Caméra Panier' : 'Tactique 2D'}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Score et actions synchronisés en temps réel avec la table de marque
                    </p>
                  </div>
                </div>
              )}

              {/* Réactions emojis flottantes superposées */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {floatingReactions.map((r) => (
                  <div
                    key={r.id}
                    style={{ left: `${r.left}%` }}
                    className="absolute bottom-16 text-3xl animate-float-up pointer-events-none"
                  >
                    {r.emoji}
                  </div>
                ))}
              </div>

              {/* BARRE SUPERPOSÉE DU SCORE EN DIRECT */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="glass-panel px-4 py-2.5 rounded-2xl border border-white/20 flex items-center gap-4 shadow-2xl pointer-events-auto bg-black/60 backdrop-blur-md">
                  {/* Équipe Domicile */}
                  <div className="text-right">
                    <div className="text-xs font-extrabold text-white truncate max-w-[110px] sm:max-w-none">
                      {homeName}
                    </div>
                    <div className="text-2xl font-black text-white">{scoreHome}</div>
                  </div>

                  {/* Chrono & Quart-temps */}
                  <div className="px-3 py-1 rounded-xl bg-white/10 text-center border border-white/10">
                    <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                      Q{quarter}
                    </div>
                    <div className="text-base font-black font-mono text-white tracking-wider">
                      {formatClock(secondsRemaining)}
                    </div>
                    <div className="text-[9px] font-bold text-red-400 font-mono">
                      24s: {shotClock}
                    </div>
                  </div>

                  {/* Équipe Extérieure */}
                  <div className="text-left">
                    <div className="text-xs font-extrabold text-white truncate max-w-[110px] sm:max-w-none">
                      {awayName}
                    </div>
                    <div className="text-2xl font-black text-white">{scoreAway}</div>
                  </div>
                </div>

                {/* Sélecteur d'angle caméra */}
                <div className="hidden sm:flex items-center gap-1 glass-panel p-1 rounded-xl pointer-events-auto bg-black/60 border border-white/15">
                  <button
                    onClick={() => setCameraAngle('MAIN')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      cameraAngle === 'MAIN' ? 'bg-[#FF2A3B] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Principal
                  </button>
                  <button
                    onClick={() => setCameraAngle('HOOP')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      cameraAngle === 'HOOP' ? 'bg-[#FF2A3B] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Panier
                  </button>
                  <button
                    onClick={() => setCameraAngle('COURT2D')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      cameraAngle === 'COURT2D' ? 'bg-[#FF2A3B] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2D
                  </button>
                </div>
              </div>

              {/* Contrôles lecteur vidéo (bas gauche/droite) */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded-xl bg-black/60 hover:bg-black/80 border border-white/20 transition-colors cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-xl bg-black/60 hover:bg-black/80 border border-white/20 transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Boutons d'envoi rapide de réactions */}
                <div className="flex items-center gap-1.5 glass-panel px-2.5 py-1 rounded-2xl bg-black/60 border border-white/20">
                  {['🔥', '🏀', '👏', '⚡', '😱'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleTriggerReaction(emoji)}
                      className="p-1.5 hover:scale-125 transition-transform text-lg cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* PANNEAU LATÉRAL INTERACTIF (Droite : Chat / Play-by-play / Stats) */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col bg-[#0C101A] h-[320px] lg:h-auto">
            {/* Onglets */}
            <div className="flex border-b border-white/10 bg-[#0E1320]">
              <button
                onClick={() => setActiveTab('CHAT')}
                className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'CHAT'
                    ? 'border-[#FF2A3B] text-white bg-white/5'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat Direct
              </button>
              <button
                onClick={() => setActiveTab('PLAYBYPLAY')}
                className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'PLAYBYPLAY'
                    ? 'border-[#FF2A3B] text-white bg-white/5'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Play-by-play
              </button>
              <button
                onClick={() => setActiveTab('BOXSCORE')}
                className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'BOXSCORE'
                    ? 'border-[#FF2A3B] text-white bg-white/5'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                Stats
              </button>
            </div>

            {/* CONTENU ONGLETS */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {activeTab === 'CHAT' ? (
                <div className="space-y-2.5">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded-xl text-xs space-y-0.5 ${
                        msg.isMe
                          ? 'bg-[#FF2A3B]/15 border border-[#FF2A3B]/25 ml-4'
                          : 'bg-white/5 border border-white/5 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-extrabold text-[#FFB800]">{msg.sender}</span>
                        <span className="text-slate-500">{msg.time}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{msg.text}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              ) : activeTab === 'PLAYBYPLAY' ? (
                <div className="space-y-2">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          Q{ev.quarter} • {ev.time}
                        </span>
                        <span className="text-[10px] font-black text-white px-2 py-0.5 rounded bg-white/10">
                          {ev.scoreHome} - {ev.scoreAway}
                        </span>
                      </div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {ev.type === 'SCORE_3PT' ? '🎯 Panier à 3 points' : ev.type === 'DUNK' ? '💥 SLAM DUNK' : '⚡ Action de jeu'} : {ev.player}
                      </div>
                      <p className="text-[11px] text-slate-400">{ev.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <div className="font-bold text-white flex justify-between">
                      <span>Adresse aux tirs (FG%)</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 text-[11px]">
                      <span>{homeName} : 52%</span>
                      <span>{awayName} : 47%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                      <div className="bg-[#FF2A3B] h-full" style={{ width: '52%' }} />
                      <div className="bg-amber-500 h-full" style={{ width: '48%' }} />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <div className="font-bold text-white flex justify-between">
                      <span>Tirs à 3 points (3PT%)</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 text-[11px]">
                      <span>{homeName} : 41% (9/22)</span>
                      <span>{awayName} : 33% (6/18)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                      <div className="bg-[#FF2A3B] h-full" style={{ width: '55%' }} />
                      <div className="bg-amber-500 h-full" style={{ width: '45%' }} />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <div className="font-bold text-white flex justify-between">
                      <span>Rebonds & Passes</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center pt-1">
                      <div className="p-2 rounded bg-white/5">
                        <div className="text-base font-bold text-white">38 - 32</div>
                        <div className="text-[10px] text-slate-400">Rebonds</div>
                      </div>
                      <div className="p-2 rounded bg-white/5">
                        <div className="text-base font-bold text-white">22 - 17</div>
                        <div className="text-[10px] text-slate-400">Passes</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FORMULAIRE D'ENVOI CHAT */}
            {activeTab === 'CHAT' && (
              <form
                onSubmit={handleSendChatMessage}
                className="p-2.5 border-t border-white/10 bg-[#0E1320] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Envoyer un message au live..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/10 text-white placeholder-slate-500 border border-white/10 focus:outline-none focus:border-[#FF2A3B]"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-[#FF2A3B] hover:bg-[#E60023] text-white transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
