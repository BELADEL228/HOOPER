import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Image, Video, Globe, Users, Send, X, Link, Loader2, Upload, Building2, ChevronDown } from 'lucide-react';
import type { SocialPost, UserRole } from '../../types';
import { socialApi } from '../../services/socialApi';
import { uploadMedia } from '../../services/uploadService';
import { clubApi } from '../../services/clubApi';

interface PostComposerProps {
  currentUserAvatar?: string;
  currentUserName?: string;
  onPostCreated: (newPost: SocialPost) => void;
  onOpenAuth?: () => void;
  isAuthenticated?: boolean;
  /** Utilisateur connecté (pour les rôles CLUB_ADMIN / COACH) */
  authUser?: { id: string; name: string; role: UserRole; avatarUrl?: string | null } | null;
}

export const PostComposer: React.FC<PostComposerProps> = ({
  currentUserAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
  currentUserName = 'Joueur',
  onPostCreated,
  onOpenAuth,
  isAuthenticated = true,
  authUser,
}) => {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaPreview, setMediaPreview] = useState(''); // URL locale pour la preview
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'CLUB_ONLY'>('PUBLIC');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingFile] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // ── Sélection du club (CLUB_ADMIN / COACH) ──────────────────────────────
  const canPostAsClub = authUser?.role === 'CLUB_ADMIN' || authUser?.role === 'COACH';
  const [postAsClub, setPostAsClub] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedClubName, setSelectedClubName] = useState<string | null>(null);
  const [selectedClubLogo, setSelectedClubLogo] = useState<string | null>(null);
  const [myClubs, setMyClubs] = useState<{ id: string; name: string; logoUrl?: string | null }[]>([]);
  const [showClubDropdown, setShowClubDropdown] = useState(false);

  useEffect(() => {
    if (!canPostAsClub) return;
    // Charge les clubs dont l'utilisateur est admin/coach
    clubApi.getMyClubs?.().then((clubs) => {
      setMyClubs(clubs ?? []);
    }).catch(() => {
      // Silencieux si l'API n'est pas disponible
    });
  }, [canPostAsClub]);

  const clearMedia = useCallback(() => {
    setSelectedFile(null);
    setMediaUrl('');
    setMediaPreview('');
    setShowUrlInput(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoFileInputRef.current) videoFileInputRef.current.value = '';
  }, []);

  const handleImageFile = useCallback((file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('Fichier trop volumineux (max 20 Mo).');
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaType('image');
  }, []);

  const handleVideoFile = useCallback((file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('Vidéo trop volumineuse (max 50 Mo).');
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaType('video');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { onOpenAuth?.(); return; }
    if (!content.trim() && !selectedFile && !mediaUrl.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      let finalMediaUrl: string | undefined = mediaUrl.trim() || undefined;

      if (selectedFile) {
        const uploadRes = await uploadMedia(selectedFile, 'firestone/posts', () => {});
        finalMediaUrl = uploadRes.url;
      }

      const created = await socialApi.createPost({
        content: content.trim(),
        mediaUrl: finalMediaUrl,
        // ── Si post au nom d'un club ───────────────────────────────
        clubId: postAsClub && selectedClubId ? selectedClubId : undefined,
      });
      setContent('');
      clearMedia();
      // Enrichir l'objet avec les infos club si post club
      if (postAsClub && selectedClubId) {
        created.clubId = selectedClubId;
        created.clubName = selectedClubName;
        created.clubLogo = selectedClubLogo;
      }
      onPostCreated(created);
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de publier');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="social-card-border rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl transition-all">
      {/* Inputs fichier cachés */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
      />
      <input
        ref={videoFileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoFile(f); }}
      />

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div className="flex gap-3 items-start">
          {/* Avatar : logo club si mode club, sinon avatar perso */}
          <div className="relative shrink-0">
            {postAsClub && selectedClubId ? (
              <div className="relative">
                <img
                  src={selectedClubLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedClubName || 'Club')}&background=1a1f2e&color=FFB800&bold=true`}
                  alt={selectedClubName || 'Club'}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border-2 border-[#FFB800] bg-slate-800"
                />
                <img
                  src={currentUserAvatar}
                  alt={currentUserName}
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full object-cover border-2 border-[#0F121A] bg-slate-800"
                />
              </div>
            ) : (
              <img
                src={currentUserAvatar}
                alt={currentUserName}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-white/10 bg-slate-800"
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Sélecteur "Poster au nom du club" (CLUB_ADMIN / COACH uniquement) */}
            {canPostAsClub && (
              <div className="mb-2 relative">
                <button
                  type="button"
                  onClick={() => {
                    if (!postAsClub) {
                      setPostAsClub(true);
                      setShowClubDropdown(myClubs.length > 1);
                      if (myClubs.length === 1) {
                        setSelectedClubId(myClubs[0].id);
                        setSelectedClubName(myClubs[0].name);
                        setSelectedClubLogo(myClubs[0].logoUrl ?? null);
                      }
                    } else {
                      setPostAsClub(false);
                      setSelectedClubId(null);
                      setSelectedClubName(null);
                      setSelectedClubLogo(null);
                      setShowClubDropdown(false);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    postAsClub
                      ? 'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/40'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{postAsClub && selectedClubName ? `Au nom de : ${selectedClubName}` : 'Poster au nom du club'}</span>
                  {postAsClub && myClubs.length > 1 && (
                    <ChevronDown className="w-3 h-3" onClick={(e) => { e.stopPropagation(); setShowClubDropdown(v => !v); }} />
                  )}
                  {postAsClub && <X className="w-3 h-3 ml-1 opacity-60" />}
                </button>

                {/* Dropdown de sélection du club */}
                {showClubDropdown && myClubs.length > 0 && (
                  <div className="absolute left-0 top-9 z-30 w-56 rounded-xl bg-[#0F121A] border border-white/15 p-1 shadow-2xl space-y-0.5">
                    {myClubs.map((club) => (
                      <button
                        key={club.id}
                        type="button"
                        onClick={() => {
                          setSelectedClubId(club.id);
                          setSelectedClubName(club.name);
                          setSelectedClubLogo(club.logoUrl ?? null);
                          setShowClubDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-left text-xs text-white cursor-pointer"
                      >
                        <img
                          src={club.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(club.name)}&background=1a1f2e&color=FFB800&bold=true`}
                          alt={club.name}
                          className="w-6 h-6 rounded-md object-cover bg-slate-800"
                        />
                        <span className="font-medium">{club.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={postAsClub && selectedClubName ? `Quoi de nouveau pour ${selectedClubName} ?` : "Quoi de neuf sur le parquet ? Partagez vos scores, dunks ou analyses..."}
              rows={2}
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
            />

            {/* Preview média */}
            {isProcessingFile && (
              <div className="mt-2 flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                <Loader2 className="w-4 h-4 animate-spin text-[#FFB800]" />
                <span className="text-xs text-slate-400">Compression en cours…</span>
              </div>
            )}

            {mediaPreview && !isProcessingFile && (
              <div className="relative mt-2 rounded-xl overflow-hidden border border-white/15 max-h-48 w-full bg-black/40">
                {mediaType === 'video' ? (
                  <video src={mediaPreview} controls className="w-full h-44 object-cover" />
                ) : (
                  <img src={mediaPreview} alt="Aperçu" className="w-full h-44 object-cover" />
                )}
                <button
                  type="button"
                  onClick={clearMedia}
                  aria-label="Supprimer le média"
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-[#FF2A3B] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Champ URL en fallback */}
            {showUrlInput && !mediaPreview && !isProcessingFile && (
              <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                <Link className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => { setMediaUrl(e.target.value); setMediaPreview(e.target.value); }}
                  placeholder="Collez l'URL de votre photo ou vidéo (https://...)"
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => { setShowUrlInput(false); clearMedia(); }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-[#FF2A3B] font-medium bg-[#FF2A3B]/10 p-2 rounded-lg border border-[#FF2A3B]/20">
            {errorMsg}
          </p>
        )}

        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Bouton Photo */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Image className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Photo</span>
            </button>

            {/* Bouton Vidéo */}
            <button
              type="button"
              onClick={() => videoFileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Video className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Vidéo</span>
            </button>

            {/* Bouton URL (fallback) */}
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              title="Coller une URL"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden md:inline">URL</span>
            </button>

            {/* Visibilité */}
            <button
              type="button"
              onClick={() => setVisibility((v) => (v === 'PUBLIC' ? 'CLUB_ONLY' : 'PUBLIC'))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              {visibility === 'PUBLIC' ? (
                <>
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden md:inline">Public</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 text-[#FFB800]" />
                  <span className="hidden md:inline">Club seul</span>
                </>
              )}
            </button>
          </div>

          {/* Bouton Publier */}
          <button
            type="submit"
            disabled={isSubmitting || isProcessingFile || (!content.trim() && !mediaUrl.trim())}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-[#FF2A3B] to-[#E60023] hover:from-[#FF4555] hover:to-[#FF2A3B] text-white text-xs sm:text-sm font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Envoi…</span></>
            ) : (
              <><span>Publier</span><Send className="w-3.5 h-3.5" /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
