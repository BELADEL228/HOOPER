import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Pause,
  Play,
  ShieldCheck,
  Eye,
  EllipsisVertical,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { StoryGroup, StatusReactionType } from '../../types';
import { statusApi } from '../../services/statusApi';
import { StoryOwnerView } from './StoryOwnerView';

interface StoryViewerModalProps {
  isOpen: boolean;
  storyGroups: StoryGroup[];
  activeGroupIndex: number;
  onClose: () => void;
  onGroupChange: (newIndex: number) => void;
  currentUserId?: string | null;
  onStatusViewed?: (statusId: string, groupIndex: number) => void;
  onStatusDelete?: (statusId: string) => void;
}

/** Durée par défaut pour images et textes */
const DEFAULT_STORY_DURATION_MS = 6000;

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  isOpen,
  storyGroups,
  activeGroupIndex,
  onClose,
  onGroupChange,
  currentUserId = null,
  onStatusViewed,
  onStatusDelete,
}) => {
  const currentGroup = storyGroups[activeGroupIndex];
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReactionFeedback, setShowReactionFeedback] = useState<string | null>(null);

  /* ─── Vue propriétaire ──────────────────────────────────────────── */
  const [ownerViewStatusId, setOwnerViewStatusId] = useState<string | null>(null);

  const [showChoices, setShowChoices] = useState(false);
  const [optionPanelOpen, setOptionPanelOpen] = useState(false);

  /* ─── 🔊 États SON ──────────────────────────────────────────────── */
  /** true si l'autoplay avec son a été bloqué → affiche le bouton "Activer le son" */
  const [soundBlocked, setSoundBlocked] = useState(false);
  /** true si l'utilisateur a explicitement coupé le son via le bouton */
  const [userMuted, setUserMuted] = useState(false);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedBeforePauseRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const statuses = currentGroup?.statuses || [];
  const currentStatus = statuses[currentStatusIndex];

  const currentMedia = currentStatus?.media?.[0];
  const isVideo = currentMedia?.type === 'VIDEO';

  const isOwnerOfCurrentGroup =
    Boolean(currentUserId) &&
    (currentGroup?.authorId === currentUserId ||
      currentGroup?.clubId === currentUserId);

  const effectiveIsPaused = isPaused || Boolean(ownerViewStatusId);

  /* ═══════════════════════════════════════════════════════════════════════
   *  RESET À CHAQUE CHANGEMENT
   * ═══════════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    setCurrentStatusIndex(0);
    setProgress(0);
    elapsedBeforePauseRef.current = 0;
  }, [activeGroupIndex]);

  useEffect(() => {
    setProgress(0);
    elapsedBeforePauseRef.current = 0;
    startTimeRef.current = Date.now();
    // 🔊 Reset l'état "son bloqué" à chaque nouvelle story vidéo
    if (isVideo) setSoundBlocked(false);
  }, [currentStatusIndex, isVideo]);

  useEffect(() => {
    if (!isOpen) setOwnerViewStatusId(null);
  }, [isOpen]);

  useEffect(() => {
    if (ownerViewStatusId) {
      elapsedBeforePauseRef.current = Date.now() - startTimeRef.current;
    }
  }, [ownerViewStatusId]);

  /* ═══════════════════════════════════════════════════════════════════════
   *  MARK AS VIEWED
   * ═══════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!isOpen || !currentStatus?.id || isOwnerOfCurrentGroup) return;
    void statusApi.markAsViewed(currentStatus.id);
    onStatusViewed?.(currentStatus.id, activeGroupIndex);
  }, [isOpen, currentStatus?.id, isOwnerOfCurrentGroup, activeGroupIndex, onStatusViewed]);

  /* ═══════════════════════════════════════════════════════════════════════
   *  NAVIGATION
   * ═══════════════════════════════════════════════════════════════════════ */
  const handleNext = useCallback(() => {
    if (currentStatusIndex < statuses.length - 1) {
      setCurrentStatusIndex((prev) => prev + 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
    } else if (activeGroupIndex < storyGroups.length - 1) {
      onGroupChange(activeGroupIndex + 1);
    } else {
      onClose();
    }
  }, [
    currentStatusIndex,
    statuses.length,
    activeGroupIndex,
    storyGroups.length,
    onGroupChange,
    onClose,
  ]);

  const handlePrev = useCallback(() => {
    if (currentStatusIndex > 0) {
      setCurrentStatusIndex((prev) => prev - 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
    } else if (activeGroupIndex > 0) {
      onGroupChange(activeGroupIndex - 1);
    }
  }, [currentStatusIndex, activeGroupIndex, onGroupChange]);

  /* ═══════════════════════════════════════════════════════════════════════
   *  TIMER — UNIQUEMENT IMAGES / TEXTES
   * ═══════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!isOpen || effectiveIsPaused || !currentStatus) return;
    if (isVideo) return;

    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / DEFAULT_STORY_DURATION_MS) * 100);
      setProgress(pct);

      if (elapsed >= DEFAULT_STORY_DURATION_MS) {
        clearInterval(interval);
        handleNext();
      }
    }, 50);

    timerRef.current = interval;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, effectiveIsPaused, currentStatus, isVideo, handleNext]);

  /* ═══════════════════════════════════════════════════════════════════════
   *  🔊 AUDIO — LOGIQUE SNAP/INSTA
   *
   *  1. On tente l'autoplay AVEC SON (le clic d'ouverture du modal
   *     fournit le "user gesture" requis par les navigateurs)
   *  2. Si bloqué → fallback muet + affichage du bouton "Activer le son"
   *  3. L'utilisateur clique → son réactivé pour cette story ET les suivantes
   *  4. Un bouton mute/unmute permanent est disponible en haut à droite
   * ═══════════════════════════════════════════════════════════════════════ */

  /** Tente de jouer la vidéo avec son — appelé à chaque nouvelle vidéo */
  const tryPlayWithSound = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    // Si l'utilisateur a manuellement muté, on respecte son choix
    if (userMuted) {
      video.muted = true;
      try {
        await video.play();
        setSoundBlocked(false);
      } catch {
        /* ignore */
      }
      return;
    }

    // 1️⃣ ESSAI AVEC SON
    video.muted = false;
    video.volume = 1;

    try {
      await video.play();
      // ✅ Succès : autoplay avec son autorisé
      setSoundBlocked(false);
      return;
    } catch {
      // ❌ Autoplay bloqué → fallback muet
      video.muted = true;
      try {
        await video.play();
        // Vidéo joue mais en muet → afficher le bouton "Activer le son"
        setSoundBlocked(true);
      } catch {
        // Même muet refuse de jouer — rare
        setSoundBlocked(true);
      }
    }
  }, [userMuted]);

  /** Au chargement des metadata → tente la lecture */
  const handleVideoLoadedMetadata = useCallback(() => {
    void tryPlayWithSound();
  }, [tryPlayWithSound]);

  /** Met à jour la barre de progression */
  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration || !isFinite(video.duration)) return;
    const pct = Math.min(100, (video.currentTime / video.duration) * 100);
    setProgress(pct);
  };

  /** Fin de la vidéo → story suivante */
  const handleVideoEnded = () => {
    handleNext();
  };

  /** Synchronise pause/play avec l'état global */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    if (effectiveIsPaused) {
      video.pause();
    } else {
      video.play().catch(() => {
        /* ignore */
      });
    }
  }, [effectiveIsPaused, isVideo, currentStatusIndex]);

  /** Reset la vidéo au changement de status */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;
    video.currentTime = 0;
  }, [currentStatusIndex, isVideo]);

  /** 🔊 BOUTON MUTE / UNMUTE (comme Insta/Snap en haut à droite) */
  const handleToggleSound = () => {
    const video = videoRef.current;
    if (!video) return;

    if (userMuted || video.muted) {
      // Activer le son
      video.muted = false;
      video.volume = 1;
      setUserMuted(false);
      setSoundBlocked(false);
      // Si la lecture est en pause, on relance
      if (video.paused) {
        video.play().catch(() => {
          /* ignore */
        });
      }
    } else {
      // Couper le son
      video.muted = true;
      setUserMuted(true);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════
   *  HOLD (clic long pour pauser)
   * ═══════════════════════════════════════════════════════════════════════ */
  const handleHoldStart = () => {
    if (!isVideo) {
      elapsedBeforePauseRef.current = Date.now() - startTimeRef.current;
    }
    setIsPaused(true);
  };

  const handleHoldEnd = () => {
    setIsPaused(false);
  };

  /* ═══════════════════════════════════════════════════════════════════════
   *  CLAVIER
   * ═══════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (ownerViewStatusId) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
      if (e.key === 'm' || e.key === 'M') {
        handleToggleSound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose, ownerViewStatusId]);

  /* ═══════════════════════════════════════════════════════════════════════
   *  RÉACTIONS & RÉPONSES
   * ═══════════════════════════════════════════════════════════════════════ */
  const handleSendReaction = async (reaction: StatusReactionType) => {
    if (!currentStatus) return;
    try {
      await statusApi.addReaction(currentStatus.id, reaction);
      setShowReactionFeedback(reaction);
      setTimeout(() => setShowReactionFeedback(null), 1200);
    } catch {
      /* ignore */
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentStatus) return;
    try {
      await statusApi.replyToStatus(currentStatus.id, replyText);
      setReplyText('');
      setShowReactionFeedback('SENT');
      setTimeout(() => setShowReactionFeedback(null), 1500);
    } catch {
      /* ignore */
    }
  };

  if (!isOpen || !currentGroup || !currentStatus) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Story de ${currentGroup.authorName}`}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center select-none"
    >
      <div className="relative w-full h-full sm:h-[90vh] sm:max-w-md sm:rounded-3xl overflow-hidden bg-[#090A0F] border border-white/10 flex flex-col justify-between shadow-2xl">

        {/* ═══ 1. EN-TÊTE ═══ */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">

          {/* Barres de progression */}
          <div className="flex items-center gap-1.5 mb-3">
            {statuses.map((_, idx) => {
              let fillWidth = '0%';
              if (idx < currentStatusIndex) fillWidth = '100%';
              else if (idx === currentStatusIndex) fillWidth = `${progress}%`;

              return (
                <div key={idx} className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden">
                  <div
                    className="h-full bg-white"
                    style={{
                      width: fillWidth,
                      transition: isVideo ? 'none' : 'width 75ms linear',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Profil + boutons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentGroup.authorAvatar}
                alt={currentGroup.authorName}
                className="w-9 h-9 rounded-full object-cover border border-white/20"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white truncate">
                    {currentGroup.authorName}
                  </span>
                  {currentGroup.isClub && (
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                  )}
                </div>
                <span className="text-[10px] text-slate-300">
                  {new Date(currentStatus.createdAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">

              {/* 🔊 Bouton SON — visible uniquement pour les vidéos */}
              {isVideo && (
                <button
                  type="button"
                  onClick={handleToggleSound}
                  aria-label={
                    userMuted ? 'Activer le son' : 'Couper le son'
                  }
                  title={
                    userMuted
                      ? 'Activer le son (M)'
                      : 'Couper le son (M)'
                  }
                  className={`w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer ${soundBlocked && !userMuted
                      ? 'ring-2 ring-[#FFB800] animate-pulse'
                      : 'hover:bg-black/60'
                    }`}
                >
                  {userMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Pause / Reprendre */}
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                aria-label={effectiveIsPaused ? 'Reprendre' : 'Mettre en pause'}
                className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
              >
                {effectiveIsPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>

              {/* Options propriétaire */}
              {isOwnerOfCurrentGroup && currentStatus && (
                <button
                  type="button"
                  onClick={() => {
                    setOptionPanelOpen((prev) => !prev);
                    setShowChoices(false);
                  }}
                  aria-expanded={optionPanelOpen}
                  aria-label="Options"
                  className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-[#FF2A3B] transition-colors cursor-pointer"
                >
                  <EllipsisVertical className="w-4 h-4" />
                </button>
              )}

              {/* Fermer */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-[#FF2A3B] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Panneau options */}
          {optionPanelOpen && isOwnerOfCurrentGroup && currentStatus && (
            <div className="absolute top-16 right-4 z-30 w-56 rounded-2xl bg-[#0D111A]/95 backdrop-blur-md border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setOptionPanelOpen(false);
                  setOwnerViewStatusId(currentStatus.id);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-sm text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4 text-slate-400" />
                <span>Voir les statistiques</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOptionPanelOpen(false);
                  setShowChoices(true);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer la story</span>
              </button>
            </div>
          )}

          {/* Confirmation suppression */}
          {showChoices && currentStatus && (
            <div className="absolute top-16 right-4 z-40 w-64 rounded-2xl bg-[#0D111A]/95 backdrop-blur-md border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-bold text-white">Supprimer la story ?</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Cette action est définitive. Ta story sera supprimée immédiatement.
                </p>
              </div>
              <div className="p-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowChoices(false)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChoices(false);
                    onStatusDelete?.(currentStatus.id);
                  }}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                  Supprimer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══ 2. CORPS MÉDIA ═══ */}
        <div
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldEnd}
          onMouseLeave={handleHoldEnd}
          onTouchStart={handleHoldStart}
          onTouchEnd={handleHoldEnd}
        >
          {currentMedia ? (
            currentMedia.type === 'VIDEO' ? (
              <video
                ref={videoRef}
                key={currentStatus.id}
                src={currentMedia.url}
                autoPlay
                playsInline
                preload="auto"
                onLoadedMetadata={handleVideoLoadedMetadata}
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={currentMedia.url}
                alt="Story visual"
                className="w-full h-full object-contain"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-[#FF2A3B]/40 to-[#0F121A] text-center">
              <p className="text-xl sm:text-2xl font-black text-white leading-snug">
                {currentStatus.text}
              </p>
            </div>
          )}

          {/* Légende textuelle */}
          {currentMedia && currentStatus.text && (
            <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
              <p className="text-sm sm:text-base font-semibold text-white leading-relaxed drop-shadow-md">
                {currentStatus.text}
              </p>
            </div>
          )}

          {/* 🔊 INDICATEUR "TAP POUR ACTIVER LE SON" — comme Snap/Insta */}
          {isVideo && soundBlocked && !userMuted && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSound();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-semibold hover:bg-black/90 transition-colors cursor-pointer shadow-lg animate-[pulse_2s_ease-in-out_infinite]"
              aria-label="Activer le son de la story"
            >
              <VolumeX className="w-4 h-4" />
              <span>Appuyer pour activer le son</span>
            </button>
          )}

          {/* Indicateur "lecture en pause" (comme Insta) */}
          {effectiveIsPaused && !soundBlocked && (
            <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-8 h-8 text-white/90 ml-1" fill="currentColor" />
              </div>
            </div>
          )}

          {/* Zones tactiles */}
          <button
            onClick={handlePrev}
            aria-label="Story précédente"
            className="absolute left-0 top-16 bottom-20 w-1/3 cursor-pointer z-20 opacity-0"
          />
          <button
            onClick={handleNext}
            aria-label="Story suivante"
            className="absolute right-0 top-16 bottom-20 w-1/3 cursor-pointer z-20 opacity-0"
          />

          {/* Feedback réaction */}
          {showReactionFeedback && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <span className="text-5xl sm:text-6xl animate-bounce">
                {showReactionFeedback === 'BASKET' && '🏀'}
                {showReactionFeedback === 'FIRE' && '🔥'}
                {showReactionFeedback === 'HEART' && '❤️'}
                {showReactionFeedback === 'CLAP' && '👏'}
                {showReactionFeedback === 'SENT' && '💬 Envoyé !'}
              </span>
            </div>
          )}
        </div>

        {/* ═══ 3. PIED ═══ */}
        <div className="relative z-30 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent space-y-2">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleSendReaction('FIRE')}
              aria-label="Réagir Flamme"
              className="p-1.5 rounded-full hover:scale-125 transition-transform cursor-pointer text-xl"
            >
              🔥
            </button>
            <button
              onClick={() => handleSendReaction('BASKET')}
              aria-label="Réagir Ballon"
              className="p-1.5 rounded-full hover:scale-125 transition-transform cursor-pointer text-xl"
            >
              🏀
            </button>
            <button
              onClick={() => handleSendReaction('HEART')}
              aria-label="Réagir Coeur"
              className="p-1.5 rounded-full hover:scale-125 transition-transform cursor-pointer text-xl"
            >
              ❤️
            </button>
            <button
              onClick={() => handleSendReaction('CLAP')}
              aria-label="Réagir Applaudissements"
              className="p-1.5 rounded-full hover:scale-125 transition-transform cursor-pointer text-xl"
            >
              👏
            </button>
          </div>

          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Répondre à ${currentGroup.authorName}...`}
              className="flex-1 px-4 py-2 text-xs sm:text-sm rounded-full bg-white/15 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:border-[#FF2A3B]"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              aria-label="Envoyer"
              className="w-9 h-9 rounded-full bg-[#FF2A3B] text-white flex items-center justify-center hover:bg-[#E60023] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Flèches navigation groupe */}
        {activeGroupIndex > 0 && (
          <button
            onClick={() => onGroupChange(activeGroupIndex - 1)}
            aria-label="Groupe précédent"
            className="hidden md:flex absolute -left-12 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 text-white items-center justify-center hover:bg-white/20 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {activeGroupIndex < storyGroups.length - 1 && (
          <button
            onClick={() => onGroupChange(activeGroupIndex + 1)}
            aria-label="Groupe suivant"
            className="hidden md:flex absolute -right-12 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 text-white items-center justify-center hover:bg-white/20 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Vue propriétaire */}
      <StoryOwnerView
        isOpen={Boolean(ownerViewStatusId)}
        statusId={ownerViewStatusId}
        onClose={() => setOwnerViewStatusId(null)}
        onDelete={(deletedStatusId) => {
          setOwnerViewStatusId(null);
          setTimeout(() => {
            onStatusDelete?.(deletedStatusId);
          }, 500);
        }}
        currentUserId={currentUserId}
      />
    </div>
  );
};