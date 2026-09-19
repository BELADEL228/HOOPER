import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Flag,
  Send,
  Check,
  Copy,
  Trash,
} from 'lucide-react';
import type { SocialPost, SocialComment } from '../../types';
import { socialApi } from '../../services/socialApi';

interface SocialPostCardProps {
  post: SocialPost;
  onOpenAuth?: () => void;
  isAuthenticated?: boolean;
  /** ✅ Callback pour ouvrir le profil de l'auteur au clic */
  onOpenProfile?: (userId: string) => void;
  onDeletePost?: (postId: string) => void;
}

const getAuthenticatedUserId = (): string | null => {
  try {
    const session = JSON.parse(
      localStorage.getItem('firestone-auth') || '{}'
    );

    return session?.user?.id || session?.userId || null;
  } catch {
    return null;
  }
};

export const SocialPostCard: React.FC<SocialPostCardProps> = ({
  post,
  onOpenAuth,
  isAuthenticated = true,
  onOpenProfile,
  onDeletePost,
}) => {



  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [hasLiked, setHasLiked] = useState(Boolean(post.hasLiked));
  const [isLiking, setIsLiking] = useState(false);

  const [comments, setComments] = useState<SocialComment[]>(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const authenticatedUserId = getAuthenticatedUserId();
  // Modal de signalement
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('SPAM');
  const [reportSent, setReportSent] = useState(false);

  // ✅ Fallback avatar basé sur le nom réel
  const authorAvatar =
    post.authorAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      post.authorName || 'User'
    )}&background=FF2A3B&color=fff`;


  const handleDeletePost = async () => {
    try {
      await socialApi.deletePost(post.id);

      // Le backend a confirmé la suppression
      onDeletePost?.(post.id);

      setShowMenu(false);
    } catch (error) {
      console.error('Erreur lors de la suppression du post:', error);
    }
  };

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      onOpenAuth?.();
      return;
    }

    if (isLiking) return;

    setIsLiking(true);

    try {
      const result = await socialApi.toggleLike(post.id);

      // Le backend est la source de vérité
      setHasLiked(result.liked);
      setLikesCount(result.likesCount);
    } catch (error) {
      console.error('Erreur lors du like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onOpenAuth?.();
      return;
    }
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const added = await socialApi.addComment(post.id, commentText.trim());
      setComments((prev) => [...prev, added]);
      setCommentText('');
    } catch {
      // Local fallback comment
      const fallback: SocialComment = {
        id: `c_${Date.now()}`,
        authorName: 'Moi',
        authorAvatar:
          'https://ui-avatars.com/api/?name=Moi&background=FF2A3B&color=fff',
        text: commentText.trim(),
        timestamp: 'À l’instant',
      };
      setComments((prev) => [...prev, fallback]);
      setCommentText('');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => {
        setCopiedLink(false);
        setShowMenu(false);
      }, 1500);
    }
  };

  const handleSendReport = async () => {
    try {
      await socialApi.reportContent(post.id, reportReason);
      setReportSent(true);
      setTimeout(() => {
        setReportSent(false);
        setShowReportModal(false);
        setShowMenu(false);
      }, 1500);
    } catch {
      setShowReportModal(false);
    }
  };

  // ✅ Clic sur l'avatar/nom → ouvre le profil
  const handleOpenAuthorProfile = () => {
    if (!post.authorId) return;
    onOpenProfile?.(post.authorId);
  };

  // Met en valeur les hashtags (#Basket #Hoopers)
  const renderFormattedContent = (text: string) => {
    const parts = text.split(/(#[a-zA-Z0-9_À-ÿ]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('#')) {
        return (
          <span
            key={idx}
            className="font-semibold text-[#FFB800] hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <article className="social-card-border rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl transition-all space-y-4">
      {/* ── 1. En-tête de la publication : Auteur, Rôle, Date & Menu ── */}
      <div className="flex items-center justify-between gap-3">
        {/* ✅ Bouton cliquable pour ouvrir le profil */}
        <button
          type="button"
          onClick={handleOpenAuthorProfile}
          disabled={!post.authorId || !onOpenProfile}
          className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-90 transition-opacity text-left disabled:cursor-default disabled:hover:opacity-100"
        >
          <img
            src={authorAvatar}
            alt={post.authorName}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-white/10 shrink-0 bg-slate-800"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-white truncate">
                {post.authorName || 'Utilisateur'}
              </span>
              {post.authorRole && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-white/10 text-slate-300 border border-white/10">
                  {post.authorRole === 'CLUB_MANAGER'
                    ? 'Manager Club'
                    : post.authorRole}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">{post.timestamp}</p>
          </div>
        </button>

        {/* Menu d'actions déroulant */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            aria-label="Options du post"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 z-30 w-44 rounded-2xl bg-[#0F121A] border border-white/15 p-1.5 shadow-2xl space-y-1 text-xs text-slate-300">
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-left cursor-pointer"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copiedLink ? 'Lien copié !' : 'Copier le lien'}</span>
              </button>
              <button
                onClick={() => {
                  setShowReportModal(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/15 text-red-400 text-left cursor-pointer"
              >
                <Flag className="w-4 h-4" />
                <span>Signaler</span>
              </button>

              {authenticatedUserId === post.authorId && (
                <button
                  onClick={handleDeletePost}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/15 text-red-400 text-left cursor-pointer"
                >
                  <Trash className="w-4 h-4" />
                  <span>Supprimer</span>
                </button>
              )}

            </div>
          )}
        </div>
      </div>

      {/* ── 2. Corps textuel ── */}
      <div className="text-sm sm:text-base text-slate-100 whitespace-pre-line leading-relaxed font-normal">
        {renderFormattedContent(post.content)}
      </div>

      {/* ── 3. Médias (Photo ou Vidéo) ── */}
      {post.mediaUrl && (
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 max-h-[500px] flex items-center justify-center">
          {post.mediaUrl.endsWith('.mp4') ||
            post.mediaUrl.includes('video') ? (
            <video
              src={post.mediaUrl}
              controls
              playsInline
              className="w-full max-h-[480px] object-cover"
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt="Média de publication"
              loading="lazy"
              className="w-full max-h-[480px] object-cover hover:scale-[1.01] transition-transform duration-300"
            />
          )}
        </div>
      )}

      {/* ── 4. Barre d'actions sociales ── */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-slate-400 text-xs sm:text-sm">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Like */}
          <button
            onClick={handleToggleLike}
            aria-label={hasLiked ? 'Ne plus aimer' : 'Aimer'}
            className="flex items-center gap-1.5 group cursor-pointer hover:text-white transition-colors"
          >
            <Heart
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${hasLiked ? 'like-heart-active' : 'text-slate-400'
                }`}
            />
            <span
              className={`font-semibold ${hasLiked ? 'text-[#FF2A3B]' : ''
                }`}
            >
              {likesCount}
            </span>
          </button>

          {/* Commentaires */}
          <button
            onClick={() => setShowComments((prev) => !prev)}
            aria-label="Afficher les commentaires"
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold">{comments.length}</span>
          </button>

          {/* Partage */}
          <button
            onClick={handleCopyLink}
            aria-label="Partager la publication"
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Sauvegarder */}
        <button
          onClick={() => setIsSaved((s) => !s)}
          aria-label={isSaved ? 'Retirer des favoris' : 'Enregistrer'}
          className="hover:text-[#FFB800] transition-colors cursor-pointer"
        >
          <Bookmark
            className={`w-5 h-5 ${isSaved ? 'text-[#FFB800] fill-[#FFB800]' : ''
              }`}
          />
        </button>
      </div>

      {/* ── 5. Fil de commentaires ── */}
      {showComments && (
        <div className="pt-3 border-t border-white/10 space-y-3 animate-in fade-in duration-200">
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Soyez le premier à commenter ce post !
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-2.5 items-start text-xs">
                  <img
                    src={
                      c.authorAvatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        c.authorName || 'Membre'
                      )}&background=FF2A3B&color=fff`
                    }
                    alt={c.authorName}
                    className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 bg-slate-800"
                  />
                  <div className="flex-1 bg-white/5 rounded-2xl px-3 py-2 border border-white/5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-white">
                        {c.authorName}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {c.timestamp}
                      </span>
                    </div>
                    <p className="text-slate-200 leading-snug">{c.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Saisie d'un nouveau commentaire */}
          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Écrire un commentaire sportif..."
              className="flex-1 px-3.5 py-2 text-xs rounded-full bg-white/10 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:border-[#FF2A3B]"
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !commentText.trim()}
              aria-label="Envoyer le commentaire"
              className="w-8 h-8 rounded-full bg-[#FF2A3B] text-white flex items-center justify-center hover:bg-[#E60023] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* ── Modal de signalement ── */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#0F121A] border border-white/15 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-base font-bold text-white">
              <Flag className="w-5 h-5 text-red-400" /> Signaler ce contenu
            </div>
            {reportSent ? (
              <div className="p-4 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs font-semibold text-center">
                Merci. Votre signalement a été transmis à la modération
                HOOPERS.
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-300">
                  Pourquoi souhaitez-vous signaler cette publication ?
                </p>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-xs text-white focus:outline-none"
                >
                  <option value="SPAM">Contenu indésirable / Spam</option>
                  <option value="HARASSMENT">
                    Harcèlement ou propos injurieux
                  </option>
                  <option value="INAPPROPRIATE">
                    Contenu inapproprié ou violent
                  </option>
                  <option value="MISINFORMATION">
                    Fausse information sportive
                  </option>
                </select>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSendReport}
                    className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs text-white font-bold cursor-pointer"
                  >
                    Confirmer le signalement
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
};