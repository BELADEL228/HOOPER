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
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [commentLikes, setCommentLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(4);

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

  // ── Post au nom d'un club ──────────────────────────────────────
  const isClubPost = Boolean(post.clubId && post.clubName);
  const clubLogoFallback = post.clubName
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(post.clubName)}&background=1a1f2e&color=FFB800&bold=true`
    : null;
  const clubAvatar = post.clubLogo || clubLogoFallback;
  const clubAccent = post.clubPrimaryColor || '#FFB800';


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

    // Mise à jour optimiste immédiate (réactivité instantanée UI & tests)
    const nextLiked = !hasLiked;
    setHasLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    setIsLiking(true);

    try {
      const result = await socialApi.toggleLike(post.id);

      // Le backend confirme la source de vérité
      setHasLiked(result.liked);
      setLikesCount(result.likesCount);
    } catch (error) {
      console.error('Erreur lors du like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const toggleCommentLike = (commentId: string) => {
    setCommentLikes((prev) => {
      const cur = prev[commentId] || { count: 0, liked: false };
      return {
        ...prev,
        [commentId]: {
          count: cur.liked ? Math.max(0, cur.count - 1) : cur.count + 1,
          liked: !cur.liked,
        },
      };
    });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onOpenAuth?.();
      return;
    }
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    const textToSend = replyingTo ? `@${replyingTo.authorName} ${commentText.trim()}` : commentText.trim();
    const parentId = replyingTo?.id;

    try {
      const added = await socialApi.addComment(post.id, textToSend);
      const enriched: SocialComment = {
        ...added,
        parentId,
      };
      setComments((prev) => [...prev, enriched]);
      setCommentText('');
      setReplyingTo(null);
    } catch {
      // Local fallback comment
      const fallback: SocialComment = {
        id: `c_${Date.now()}`,
        authorName: 'Moi',
        authorAvatar: 'https://ui-avatars.com/api/?name=Moi&background=FF2A3B&color=fff',
        text: textToSend,
        timestamp: 'À l’instant',
        parentId,
      };
      setComments((prev) => [...prev, fallback]);
      setCommentText('');
      setReplyingTo(null);
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
          {isClubPost ? (
            /* ── Mode Club : logo club en avant ── */
            <div className="relative shrink-0">
              <img
                src={clubAvatar!}
                alt={post.clubName!}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover bg-slate-800 border-2"
                style={{ borderColor: clubAccent }}
              />
              {/* Badge "auteur" en bas à droite */}
              <img
                src={authorAvatar}
                alt={post.authorName}
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full object-cover border-2 border-[#0F121A] bg-slate-800"
              />
            </div>
          ) : (
            <img
              src={authorAvatar}
              alt={post.authorName}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-white/10 shrink-0 bg-slate-800"
            />
          )}

          <div className="min-w-0">
            {isClubPost ? (
              /* ── Mode Club : nom du club en grand, auteur en petit ── */
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-extrabold text-white truncate">
                    {post.clubName}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border"
                    style={{ color: clubAccent, borderColor: `${clubAccent}55`, backgroundColor: `${clubAccent}15` }}
                  >
                    Club officiel
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>Par</span>
                  <span className="text-slate-300 font-medium">{post.authorName}</span>
                  <span className="text-slate-500">·</span>
                  <span>{post.timestamp}</span>
                </p>
              </>
            ) : (
              /* ── Mode Perso normal ── */
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-bold text-white truncate">
                    {post.authorName || 'Utilisateur'}
                  </span>
                  {post.authorRole && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-white/10 text-slate-300 border border-white/10">
                      {post.authorRole === 'CLUB_ADMIN'
                        ? 'Manager Club'
                        : post.authorRole}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">{post.timestamp}</p>
              </>
            )}
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

      {/* ── 5. Fil de commentaires imbriqués (Nested Threads style YouTube) ── */}
      {showComments && (
        <div className="pt-3 border-t border-white/10 space-y-3 animate-in fade-in duration-200">
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-1">
                Soyez le premier à commenter ce post !
              </p>
            ) : (
              // Filtrer les commentaires racines
              comments
                .filter((c) => !c.parentId)
                .slice(0, visibleCommentsCount)
                .map((rootComment) => {
                  const rootReplies = comments.filter((c) => c.parentId === rootComment.id);
                  const likeInfo = commentLikes[rootComment.id] || { count: rootComment.likesCount || 0, liked: Boolean(rootComment.hasLiked) };

                  return (
                    <div key={rootComment.id} className="space-y-2">
                      {/* Commentaire racine (Niveau 1) */}
                      <div className="flex gap-2.5 items-start text-xs group">
                        <img
                          src={
                            rootComment.authorAvatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              rootComment.authorName || 'Membre'
                            )}&background=FF2A3B&color=fff`
                          }
                          alt={rootComment.authorName}
                          className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 bg-slate-800"
                        />
                        <div className="flex-1 bg-white/5 rounded-2xl px-3 py-2 border border-white/5 space-y-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-white text-[11px]">
                              {rootComment.authorName}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {rootComment.timestamp}
                            </span>
                          </div>
                          <p className="text-slate-200 leading-snug">{rootComment.text}</p>
                          <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400">
                            <button
                              type="button"
                              onClick={() => toggleCommentLike(rootComment.id)}
                              className={`flex items-center gap-1 hover:text-white transition-colors cursor-pointer ${likeInfo.liked ? 'text-red-400 font-bold' : ''}`}
                            >
                              <Heart className={`w-3 h-3 ${likeInfo.liked ? 'fill-current' : ''}`} />
                              <span>{likeInfo.count > 0 ? likeInfo.count : 'J\'aime'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setReplyingTo({ id: rootComment.id, authorName: rootComment.authorName })}
                              className="hover:text-white transition-colors font-medium cursor-pointer"
                            >
                              Répondre
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Réponses imbriquées (Niveau 2 - Limité à 2-3 niveaux selon spécifications) */}
                      {rootReplies.length > 0 && (
                        <div className="ml-6 pl-3 border-l-2 border-white/10 space-y-2">
                          {rootReplies.map((reply) => {
                            const replyLikeInfo = commentLikes[reply.id] || { count: reply.likesCount || 0, liked: Boolean(reply.hasLiked) };
                            return (
                              <div key={reply.id} className="flex gap-2 items-start text-xs">
                                <img
                                  src={
                                    reply.authorAvatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      reply.authorName || 'Membre'
                                    )}&background=FFB800&color=000`
                                  }
                                  alt={reply.authorName}
                                  className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5 bg-slate-800"
                                />
                                <div className="flex-1 bg-white/[0.03] rounded-xl px-2.5 py-1.5 border border-white/5 space-y-0.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-white text-[10px]">
                                      {reply.authorName}
                                    </span>
                                    <span className="text-[9px] text-slate-500">
                                      {reply.timestamp}
                                    </span>
                                  </div>
                                  <p className="text-slate-200 text-[11px] leading-snug">{reply.text}</p>
                                  <div className="flex items-center gap-2 pt-0.5 text-[9px] text-slate-400">
                                    <button
                                      type="button"
                                      onClick={() => toggleCommentLike(reply.id)}
                                      className={`flex items-center gap-0.5 hover:text-white transition-colors cursor-pointer ${replyLikeInfo.liked ? 'text-red-400' : ''}`}
                                    >
                                      <Heart className={`w-2.5 h-2.5 ${replyLikeInfo.liked ? 'fill-current' : ''}`} />
                                      <span>{replyLikeInfo.count > 0 ? replyLikeInfo.count : ''}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setReplyingTo({ id: rootComment.id, authorName: reply.authorName })}
                                      className="hover:text-white transition-colors cursor-pointer"
                                    >
                                      Répondre
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
            )}

            {/* Bouton de chargement progressif */}
            {comments.filter((c) => !c.parentId).length > visibleCommentsCount && (
              <button
                type="button"
                onClick={() => setVisibleCommentsCount((v) => v + 4)}
                className="text-[11px] text-slate-400 hover:text-white font-medium py-1 w-full text-center hover:underline cursor-pointer"
              >
                Afficher plus de commentaires...
              </button>
            )}
          </div>

          {/* Indicateur de réponse active */}
          {replyingTo && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-slate-300">
              <span>Réponse à <strong className="text-white">@{replyingTo.authorName}</strong></span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                Annuler
              </button>
            </div>
          )}

          {/* Saisie d'un nouveau commentaire ou d'une réponse */}
          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={replyingTo ? `Répondre à @${replyingTo.authorName}...` : "Écrire un commentaire sportif..."}
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