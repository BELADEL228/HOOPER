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
  Trash,
  Trash2,
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
  onStatusDelete?: (statusId: string) => void;
}

const STORY_DURATION_MS = 6000;

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  isOpen,
  storyGroups,
  activeGroupIndex,
  onClose,
  onGroupChange,
  currentUserId = null,
  onStatusDelete,
}) => {
  const currentGroup = storyGroups[activeGroupIndex];
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReactionFeedback, setShowReactionFeedback] = useState<string | null>(null);

  // ✅ État pour la vue propriétaire
  const [ownerViewStatusId, setOwnerViewStatusId] = useState<string | null>(null);

  const [showChoices, setShowChoices] = useState(false);
  const [optionPanelOpen, setOptionPanelOpen] = useState(false);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedBeforePauseRef = useRef<number>(0);

  const statuses = currentGroup?.statuses || [];
  const currentStatus = statuses[currentStatusIndex];

  // ✅ Détecte si l'utilisateur courant est propriétaire du groupe affiché
  const isOwnerOfCurrentGroup =
    Boolean(currentUserId) &&
    (currentGroup?.authorId === currentUserId ||
      currentGroup?.clubId === currentUserId);

  // ✅ Pause effective : soit manuelle, soit parce que l'owner view est ouvert
  const effectiveIsPaused = isPaused || Boolean(ownerViewStatusId);

  // Reset status index when group changes
  useEffect(() => {
    setCurrentStatusIndex(0);
    setProgress(0);
    elapsedBeforePauseRef.current = 0;
  }, [activeGroupIndex]);

  // ✅ Reset la vue propriétaire à la fermeture du modal
  useEffect(() => {
    if (!isOpen) {
      setOwnerViewStatusId(null);
    }
  }, [isOpen]);

  // ✅ Sauvegarde le temps écoulé avant d'ouvrir l'owner view
  useEffect(() => {
    if (ownerViewStatusId) {
      elapsedBeforePauseRef.current = Date.now() - startTimeRef.current;
    }
  }, [ownerViewStatusId]);

  // Mark status as viewed (mais PAS si on est le propriétaire)
  useEffect(() => {
    if (
      isOpen &&
      currentStatus?.id &&
      !isOwnerOfCurrentGroup  // ✅ Évite que l'owner se marque lui-même comme vu
    ) {
      void statusApi.markAsViewed(currentStatus.id);
    }
  }, [isOpen, currentStatus?.id, isOwnerOfCurrentGroup]);

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

  // Animation de la barre de progression
  // ✅ Utilise `effectiveIsPaused` pour se mettre en pause quand l'owner view est ouvert
  useEffect(() => {
    if (!isOpen || effectiveIsPaused || !currentStatus) return;

    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / STORY_DURATION_MS) * 100);
      setProgress(pct);

      if (elapsed >= STORY_DURATION_MS) {
        clearInterval(interval);
        handleNext();
      }
    }, 50);

    timerRef.current = interval;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, effectiveIsPaused, currentStatus, handleNext]);

  // Pause au toucher / clic long
  const handleHoldStart = () => {
    elapsedBeforePauseRef.current = Date.now() - startTimeRef.current;
    setIsPaused(true);
  };

  const handleHoldEnd = () => {
    setIsPaused(false);
  };

  // Gestion du clavier
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // ✅ Ignore les raccourcis clavier quand l'owner view est ouvert
      if (ownerViewStatusId) return;

      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') setIsPaused((p) => !p);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose, ownerViewStatusId]);

  // Réaction rapide
  const handleSendReaction = async (reaction: StatusReactionType) => {
    if (!currentStatus) return;
    try {
      await statusApi.addReaction(currentStatus.id, reaction);
      setShowReactionFeedback(reaction);
      setTimeout(() => setShowReactionFeedback(null), 1200);
    } catch {
      // ignore
    }
  };

  // Réponse textuelle
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentStatus) return;
    try {
      await statusApi.replyToStatus(currentStatus.id, replyText);
      setReplyText('');
      setShowReactionFeedback('SENT');
      setTimeout(() => setShowReactionFeedback(null), 1500);
    } catch {
      // ignore
    }
  };

  if (!isOpen || !currentGroup || !currentStatus) return null;

  const currentMedia = currentStatus.media?.[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Story de ${currentGroup.authorName}`}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center select-none"
    >
      {/* Conteneur Format Téléphone Vertical */}
      <div className="relative w-full h-full sm:h-[90vh] sm:max-w-md sm:rounded-3xl overflow-hidden bg-[#090A0F] border border-white/10 flex flex-col justify-between shadow-2xl">

        {/* ── 1. En-tête : Barres de progression segments + Profil auteur ── */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {/* Segments de progression */}
          <div className="flex items-center gap-1.5 mb-3">
            {statuses.map((_, idx) => {
              let fillWidth = '0%';
              if (idx < currentStatusIndex) fillWidth = '100%';
              else if (idx === currentStatusIndex) fillWidth = `${progress}%`;

              return (
                <div key={idx} className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-75 ease-linear"
                    style={{ width: fillWidth }}
                  />
                </div>
              );
            })}
          </div>

          {/* Profil Auteur & Boutons Contrôle */}
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

              {/* Pause / Reprendre */}
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                aria-label={effectiveIsPaused ? 'Reprendre' : 'Mettre en pause'}
                className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
              >
                {effectiveIsPaused ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
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
                  title="Options"
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
                title="Fermer"
                className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-[#FF2A3B] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

            </div>
          </div>

          {/* ── Panneau options flottant ── */}
          {optionPanelOpen && isOwnerOfCurrentGroup && currentStatus && (
            <div className="absolute top-16 right-4 z-30 w-56 rounded-2xl bg-[#0D111A]/95 backdrop-blur-md border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">

              {/* Voir les statistiques */}
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

              {/* Supprimer */}
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

          {/* ── Confirmation de suppression ── */}
          {showChoices && currentStatus && (
            <div className="absolute top-16 right-4 z-40 w-64 rounded-2xl bg-[#0D111A]/95 backdrop-blur-md border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">

              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-bold text-white">
                  Supprimer la story ?
                </p>

                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Cette action est définitive. Ta story sera supprimée immédiatement.
                </p>
              </div>

              <div className="p-2 flex items-center gap-2">

                {/* Annuler */}
                <button
                  type="button"
                  onClick={() => setShowChoices(false)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Annuler
                </button>

                {/* Confirmer */}
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

        {/* ── 2. Corps du média (Image ou Vidéo ou Texte seul) ── */}
        <div
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldEnd}
          onTouchStart={handleHoldStart}
          onTouchEnd={handleHoldEnd}
        >
          {currentMedia ? (
            currentMedia.type === 'VIDEO' ? (
              <video
                src={currentMedia.url}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={currentMedia.url}
                alt="Story visual"
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-[#FF2A3B]/40 to-[#0F121A] text-center">
              <p className="text-xl sm:text-2xl font-black text-white leading-snug">
                {currentStatus.text}
              </p>
            </div>
          )}

          {/* Légende textuelle si image présente */}
          {currentMedia && currentStatus.text && (
            <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              <p className="text-sm sm:text-base font-semibold text-white leading-relaxed drop-shadow-md">
                {currentStatus.text}
              </p>
            </div>
          )}

          {/* Zones tactiles Précédent (gauche) & Suivant (droite) */}
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

          {/* Feedback animation réaction */}
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

        {/* ── 3. Pied : Réactions rapides & Entrée de message ── */}
        <div className="relative z-30 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent space-y-2">
          {/* Boutons d'emojis rapides */}
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
              aria-label="Réagir Ballon de Basket"
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

          {/* Formulaire de réponse textuelle */}
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
              aria-label="Envoyer la réponse"
              className="w-9 h-9 rounded-full bg-[#FF2A3B] text-white flex items-center justify-center hover:bg-[#E60023] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Flèches externes de navigation group (Desktop) */}
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

      {/* ✅ Vue propriétaire (overlay) */}
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