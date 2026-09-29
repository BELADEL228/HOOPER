import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  Radio,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  Send,
  X,
  ChevronLeft,
  Eye,
  Clock,
  Trophy,
  Play,
  Loader2,
  AlertCircle,
  Plus,
  Shield,
  Share2,
  MessageSquare,
} from 'lucide-react';
import type { UserRole } from '../../types';
import { socketService } from '../../services/socket';
import { liveApi } from '../../services/liveApi';
import { useLiveStreamer, useLiveViewer } from '../../hooks/useLive';
import type { LiveSession, CreateLivePayload, LiveCategory, LiveVisibility } from '../../types/live';

interface LiveCenterProps {
  currentRole: UserRole;
  authUser?: { id: string; name: string; avatarUrl?: string | null } | null;
}

type View = 'list' | 'create' | 'broadcast' | 'watch';

const REACTION_EMOJIS = ['❤️', '🔥', '👏', '🏀', '😱', '💪'];

const CATEGORY_LABELS: Record<LiveCategory, string> = {
  SPORT: '⚽ Sport',
  MATCH: '🏀 Match',
  TRAINING: '🏋️ Entraînement',
  EVENT: '🎉 Événement',
  OTHER: '📡 Autre',
};

function formatDuration(startedAt?: string | null): string {
  if (!startedAt) return '00:00';
  const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Carte live ───────────────────────────────────────────────────────────
const LiveCard: React.FC<{
  session: LiveSession;
  onWatch: (s: LiveSession) => void;
  isLive?: boolean;
  isReplay?: boolean;
}> = ({ session, onWatch, isLive, isReplay }) => (
  <button
    onClick={() => onWatch(session)}
    className="group relative rounded-2xl overflow-hidden bg-[#0E1320] border border-white/10 hover:border-[#FF2A3B]/40 transition-all duration-300 text-left hover:shadow-lg hover:shadow-red-950/20"
  >
    <div className="relative aspect-video bg-gradient-to-br from-[#1A2035] to-[#0A0D15] overflow-hidden">
      {session.thumbnailUrl ? (
        <img src={session.thumbnailUrl} alt={session.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Video className="w-10 h-10 text-slate-600" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Play className="w-12 h-12 text-white drop-shadow-lg" />
      </div>
      {isLive && (
        <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF2A3B] text-white text-[10px] font-black">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </span>
      )}
      {isReplay && (
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-slate-300 text-[10px] font-bold backdrop-blur-sm">
          REPLAY
        </span>
      )}
      {isLive && (
        <span className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-sm">
          <Eye className="w-3 h-3" />
          {session.totalViews}
        </span>
      )}
    </div>
    <div className="p-3 space-y-2">
      <p className="text-xs font-bold text-white leading-snug line-clamp-2">{session.title}</p>
      <div className="flex items-center gap-2">
        <img
          src={session.hostAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.hostName)}&background=1E293B&color=fff`}
          alt={session.hostName}
          className="w-5 h-5 rounded-full border border-white/10"
        />
        <span className="text-[10px] text-slate-400 truncate">{session.clubName || session.hostName}</span>
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-500">
          {CATEGORY_LABELS[session.category] ?? session.category}
        </span>
      </div>
    </div>
  </button>
);

// ── Liste des lives ───────────────────────────────────────────────────────
const LiveList: React.FC<{
  sessions: LiveSession[];
  loading: boolean;
  canStream: boolean;
  onWatch: (s: LiveSession) => void;
  onCreate: () => void;
}> = ({ sessions, loading, canStream, onWatch, onCreate }) => {
  const live = sessions.filter((s) => s.status === 'LIVE');
  const scheduled = sessions.filter((s) => s.status === 'SCHEDULED');
  const ended = sessions.filter((s) => s.status === 'ENDED').slice(0, 6);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF2A3B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#FF2A3B] animate-pulse" />
            Live Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {live.length > 0 ? `${live.length} live${live.length > 1 ? 's' : ''} en cours` : 'Aucun live en cours'}
          </p>
        </div>
        {canStream && (
          <button
            onClick={onCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF2A3B] text-white text-xs font-bold hover:bg-[#E60023] transition-colors shadow-lg shadow-red-950/40"
          >
            <Plus className="w-4 h-4" />
            Démarrer un live
          </button>
        )}
      </div>

      {live.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-[#FF2A3B] uppercase tracking-widest flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#FF2A3B] animate-pulse" />
            En direct
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {live.map((s) => <LiveCard key={s.id} session={s} onWatch={onWatch} isLive />)}
          </div>
        </section>
      )}

      {scheduled.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Programmés
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scheduled.map((s) => <LiveCard key={s.id} session={s} onWatch={onWatch} />)}
          </div>
        </section>
      )}

      {ended.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" /> Replays
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ended.map((s) => <LiveCard key={s.id} session={s} onWatch={onWatch} isReplay />)}
          </div>
        </section>
      )}

      {sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FF2A3B]/10 border border-[#FF2A3B]/20 flex items-center justify-center">
            <Video className="w-8 h-8 text-[#FF2A3B]/60" />
          </div>
          <p className="text-slate-400 text-sm">Aucun live pour le moment.</p>
          {canStream && (
            <button onClick={onCreate} className="px-5 py-2 rounded-xl bg-[#FF2A3B] text-white text-sm font-bold hover:bg-[#E60023] transition-colors">
              Lancer le premier live
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Formulaire création ───────────────────────────────────────────────────
const CreateLiveForm: React.FC<{
  onBack: () => void;
  onCreated: (session: LiveSession) => void;
}> = ({ onBack, onCreated }) => {
  const [form, setForm] = useState<CreateLivePayload>({
    title: '', description: '', category: 'SPORT', visibility: 'PUBLIC',
    isChatEnabled: true, isRecorded: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Le titre est obligatoire.'); return; }
    setLoading(true); setError('');
    try {
      const session = await liveApi.createSession(form);
      onCreated(session);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création.');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-black text-white">Démarrer un live</h2>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Titre du live *</label>
          <input
            type="text" value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ex: Match retour vs Paris Basketball" maxLength={120}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF2A3B]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Décrivez votre live..." rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF2A3B] resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Catégorie</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_LABELS) as LiveCategory[]).map((cat) => (
              <button key={cat} type="button"
                onClick={() => setForm((f) => ({ ...f, category: cat }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${form.category === cat ? 'bg-[#FF2A3B] border-[#FF2A3B] text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Visibilité</label>
          <div className="grid grid-cols-3 gap-2">
            {([['PUBLIC', '🌍 Public'], ['CLUB_ONLY', '🛡️ Club'], ['PRIVATE', '🔒 Privé']] as [LiveVisibility, string][]).map(([v, label]) => (
              <button key={v} type="button"
                onClick={() => setForm((f) => ({ ...f, visibility: v }))}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors ${form.visibility === v ? 'bg-[#FF2A3B]/20 border-[#FF2A3B] text-[#FF2A3B]' : 'bg-white/5 border-white/10 text-slate-400'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          {([['isChatEnabled', '💬 Chat activé'], ['isRecorded', '🎬 Enregistrer']] as [keyof CreateLivePayload, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setForm((f) => ({ ...f, [key]: !f[key] }))}
                className={`w-9 h-5 rounded-full border transition-colors relative cursor-pointer ${form[key] ? 'bg-[#FF2A3B] border-[#FF2A3B]' : 'bg-white/10 border-white/20'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-slate-300">{label}</span>
            </label>
          ))}
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-[#FF2A3B] text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-[#E60023] transition-colors disabled:opacity-50 shadow-lg shadow-red-950/30"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
          {loading ? 'Création...' : 'Créer et démarrer'}
        </button>
      </form>
    </div>
  );
};

// ── Vue Broadcast (streamer) ──────────────────────────────────────────────
const BroadcastView: React.FC<{
  session: LiveSession;
  onEnd: () => void;
  socket: ReturnType<typeof socketService.getSocket>;
  authUser?: { id: string; name: string; avatarUrl?: string | null } | null;
}> = ({ session, onEnd, socket }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [duration, setDuration] = useState('00:00');
  const [chatMsg, setChatMsg] = useState('');
  const [liveStarted, setLiveStarted] = useState(false);
  const [startError, setStartError] = useState('');

  const { startStream, stopStream, isStreaming: _isStreaming, viewerCount, localStreamRef } =
    useLiveStreamer({ sessionId: session.id, socket, onError: setStartError });

  useEffect(() => {
    if (!liveStarted) return;
    const startTime = Date.now();
    const t = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setDuration(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(t);
  }, [liveStarted]);

  const handleStartLive = async () => {
    setStartError('');
    try {
      await liveApi.startSession(session.id);
      await startStream(localVideoRef.current);
      setLiveStarted(true);
      setIsCameraOn(true);
    } catch (err: any) { setStartError(err.message || 'Erreur démarrage'); }
  };

  const handleEndLive = async () => {
    stopStream();
    try { await liveApi.endSession(session.id); } catch { /* silent */ }
    onEnd();
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMicOn(track.enabled); }
  };
  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsCameraOn(track.enabled); }
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMsg.trim() || !socket) return;
    socket.emit('live:chat', { sessionId: session.id, text: chatMsg.trim() });
    setChatMsg('');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      <div className="flex-1 flex flex-col bg-black relative min-h-0">
        <div className="flex-1 relative bg-[#050709] flex items-center justify-center overflow-hidden">
          <video ref={localVideoRef} autoPlay muted playsInline
            className={`w-full h-full object-cover ${!isCameraOn ? 'opacity-0' : ''}`} />
          {!isCameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-20 h-20 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                <VideoOff className="w-9 h-9 text-slate-400" />
              </div>
              <p className="text-slate-400 text-sm">Caméra désactivée</p>
            </div>
          )}
          {liveStarted && (
            <>
              <div className="absolute top-4 left-4 flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF2A3B] text-white text-xs font-black shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> EN DIRECT
                </span>
                <span className="px-3 py-1 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur-sm">{duration}</span>
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur-sm">
                <Users className="w-3.5 h-3.5 text-[#FF2A3B]" />{viewerCount}
              </div>
            </>
          )}
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white text-sm font-bold drop-shadow-lg line-clamp-1">{session.title}</p>
          </div>
        </div>

        <div className="p-4 bg-[#0A0D15] border-t border-white/10 flex items-center gap-3">
          {!liveStarted ? (
            <>
              {startError && <p className="flex-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{startError}</p>}
              <button onClick={handleStartLive}
                className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF2A3B] text-white font-black text-sm hover:bg-[#E60023] transition-colors shadow-lg">
                <Radio className="w-4 h-4" /> Commencer le live
              </button>
            </>
          ) : (
            <>
              <button onClick={toggleMic}
                className={`p-3 rounded-xl border transition-colors ${isMicOn ? 'bg-white/10 border-white/20 text-white' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button onClick={toggleCamera}
                className={`p-3 rounded-xl border transition-colors ${isCameraOn ? 'bg-white/10 border-white/20 text-white' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <div className="flex-1" />
              <button onClick={handleEndLive}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors">
                <X className="w-4 h-4" /> Terminer
              </button>
            </>
          )}
        </div>
      </div>

      {session.isChatEnabled && (
        <div className="w-full md:w-72 flex flex-col bg-[#0C101A] border-t md:border-t-0 md:border-l border-white/10 max-h-64 md:max-h-full">
          <div className="p-3 border-b border-white/10">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#FF2A3B]" /> Chat du live
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <p className="text-xs text-slate-500 italic text-center mt-4">Les messages apparaîtront ici.</p>
          </div>
          <form onSubmit={sendChatMessage} className="p-2 border-t border-white/10 flex gap-2">
            <input type="text" value={chatMsg} onChange={(e) => setChatMsg(e.target.value)}
              placeholder="Message..." className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none" />
            <button type="submit" className="p-2 rounded-lg bg-[#FF2A3B] text-white"><Send className="w-3.5 h-3.5" /></button>
          </form>
        </div>
      )}
    </div>
  );
};

// ── Vue Viewer ───────────────────────────────────────────────────────────
const WatchView: React.FC<{
  session: LiveSession;
  onBack: () => void;
  socket: ReturnType<typeof socketService.getSocket>;
  authUser?: { id: string; name: string; avatarUrl?: string | null } | null;
}> = ({ session, onBack, socket, authUser }) => {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatInput, setChatInput] = useState('');
  const [duration, setDuration] = useState(() => formatDuration(session.startedAt));

  const { joinLive, leaveLive, sendChat, sendReaction, remoteStream, isConnected, viewerCount, chat, reactions } =
    useLiveViewer({ sessionId: session.id, socket, onError: console.warn });

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  useEffect(() => { joinLive(); return () => leaveLive(); }, [joinLive, leaveLive]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  useEffect(() => {
    if (session.status !== 'LIVE') return;
    const t = setInterval(() => setDuration(formatDuration(session.startedAt)), 1000);
    return () => clearInterval(t);
  }, [session]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChat(chatInput.trim());
    setChatInput('');
  };

  const isReplay = session.status === 'ENDED';

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
      <div className="flex-1 flex flex-col bg-black relative min-h-0">
        <button onClick={onBack}
          className="absolute top-3 left-3 z-10 p-2 rounded-xl bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 relative bg-black flex items-center justify-center">
          {isReplay && session.playbackUrl ? (
            <video src={session.playbackUrl} controls className="w-full h-full object-contain" />
          ) : (
            <>
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
              {!isConnected && !isReplay && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#050709]">
                  <Loader2 className="w-10 h-10 text-[#FF2A3B] animate-spin" />
                  <p className="text-slate-400 text-sm">Connexion au live...</p>
                </div>
              )}
            </>
          )}

          <div className="absolute top-4 left-14 flex items-center gap-2">
            {session.status === 'LIVE' && (
              <>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF2A3B] text-white text-[11px] font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-bold backdrop-blur-sm">{duration}</span>
              </>
            )}
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-bold backdrop-blur-sm">
            <Eye className="w-3 h-3 text-[#FF2A3B]" />{viewerCount || session.totalViews}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white text-sm font-bold">{session.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <img src={session.hostAvatar} alt={session.hostName} className="w-5 h-5 rounded-full border border-white/20" />
                  <span className="text-slate-300 text-xs">{session.clubName || session.hostName}</span>
                  {session.clubName && <Shield className="w-3.5 h-3.5 text-[#FFB800]" />}
                </div>
              </div>
              <button className="p-2 rounded-xl bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Réactions flottantes */}
          <div className="absolute bottom-20 right-4 flex flex-col-reverse gap-1 pointer-events-none">
            {reactions.map((r) => (
              <div key={r.id} className="text-2xl" style={{ animation: 'floatUp 3s ease-out forwards' }}>
                {r.emoji}
              </div>
            ))}
          </div>
        </div>

        {!isReplay && session.isChatEnabled && (
          <div className="md:hidden p-3 border-t border-white/10 bg-[#0A0D15] flex items-center justify-center gap-2">
            {REACTION_EMOJIS.map((emoji) => (
              <button key={emoji} onClick={() => sendReaction(emoji)}
                className="text-xl p-2 hover:scale-125 transition-transform active:scale-90">{emoji}</button>
            ))}
          </div>
        )}
      </div>

      {session.isChatEnabled && (
        <div className="w-full md:w-72 flex flex-col bg-[#0C101A] border-t md:border-t-0 md:border-l border-white/10 max-h-64 md:max-h-full">
          <div className="p-3 border-b border-white/10 space-y-2">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#FF2A3B]" /> Chat
              <span className="ml-auto text-slate-500 font-normal">{viewerCount} spectateurs</span>
            </p>
            {!isReplay && (
              <div className="flex gap-1 flex-wrap">
                {REACTION_EMOJIS.map((emoji) => (
                  <button key={emoji} onClick={() => sendReaction(emoji)}
                    className="text-base hover:scale-125 transition-transform active:scale-90">{emoji}</button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chat.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center mt-4">Soyez le premier à écrire !</p>
            ) : (
              chat.map((msg) => (
                <div key={msg.id} className="flex gap-2 items-start">
                  <img src={msg.authorAvatar} alt={msg.authorName}
                    className="w-5 h-5 rounded-full border border-white/10 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-[#FFB800]">{msg.authorName} </span>
                    <span className="text-xs text-slate-200">{msg.text}</span>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {authUser && !isReplay && (
            <form onSubmit={handleSendChat} className="p-2 border-t border-white/10 flex gap-2">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                placeholder="Commentez..." maxLength={280}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF2A3B]" />
              <button type="submit" disabled={!chatInput.trim()} className="p-2 rounded-lg bg-[#FF2A3B] text-white disabled:opacity-40">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export const LiveCenter: React.FC<LiveCenterProps> = ({ currentRole, authUser }) => {
  const [view, setView] = useState<View>('list');
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null);
  const socket = useMemo(() => socketService.getSocket(), []);

  const canStream = ['CLUB_ADMIN', 'COACH', 'SUPER_ADMIN'].includes(currentRole);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try { const data = await liveApi.listSessions(); setSessions(data); }
    catch { setSessions([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadSessions(); }, [loadSessions]);
  useEffect(() => {
    const t = setInterval(loadSessions, 30_000);
    return () => clearInterval(t);
  }, [loadSessions]);

  return (
    <div className="h-full flex flex-col bg-[#080B12] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      <style>{`@keyframes floatUp { 0% { transform:translateY(0) scale(1); opacity:1; } 100% { transform:translateY(-120px) scale(1.4); opacity:0; } }`}</style>

      {view === 'list' && (
        <LiveList sessions={sessions} loading={loading} canStream={canStream}
          onWatch={(s) => { setActiveSession(s); setView('watch'); }}
          onCreate={() => setView('create')} />
      )}
      {view === 'create' && (
        <CreateLiveForm onBack={() => setView('list')}
          onCreated={(s) => { setSessions((p) => [s, ...p]); setActiveSession(s); setView('broadcast'); }} />
      )}
      {view === 'broadcast' && activeSession && (
        <BroadcastView session={activeSession} socket={socket} authUser={authUser}
          onEnd={() => { setActiveSession(null); setView('list'); void loadSessions(); }} />
      )}
      {view === 'watch' && activeSession && (
        <WatchView session={activeSession} socket={socket} authUser={authUser}
          onBack={() => { setView('list'); setActiveSession(null); }} />
      )}
    </div>
  );
};

export default LiveCenter;
