import React, { useState, useRef, useCallback } from 'react';
import { Image, Video, Globe, Users, Send, X, Link, Loader2, Upload } from 'lucide-react';
import type { SocialPost } from '../../types';
import { socialApi } from '../../services/socialApi';

interface PostComposerProps {
  currentUserAvatar?: string;
  currentUserName?: string;
  onPostCreated: (newPost: SocialPost) => void;
  onOpenAuth?: () => void;
  isAuthenticated?: boolean;
}

/** Redimensionne et compresse une image en JPEG base64 (max 1200px, qualité 0.85) */
async function resizeImageToBase64(file: File, maxPx = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { width, height } = img;
      const scale = Math.min(1, maxPx / Math.max(width, height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas indisponible')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

export const PostComposer: React.FC<PostComposerProps> = ({
  currentUserAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
  currentUserName = 'Joueur',
  onPostCreated,
  onOpenAuth,
  isAuthenticated = true,
}) => {
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaPreview, setMediaPreview] = useState(''); // URL locale pour la preview
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'CLUB_ONLY'>('PUBLIC');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const clearMedia = useCallback(() => {
    setMediaUrl('');
    setMediaPreview('');
    setShowUrlInput(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoFileInputRef.current) videoFileInputRef.current.value = '';
  }, []);

  const handleImageFile = useCallback(async (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Fichier trop volumineux (max 15 Mo avant compression).');
      return;
    }
    setIsProcessingFile(true);
    setErrorMsg(null);
    try {
      const base64 = await resizeImageToBase64(file);
      setMediaUrl(base64);
      setMediaPreview(base64);
      setMediaType('image');
    } catch {
      setErrorMsg('Impossible de lire le fichier image.');
    } finally {
      setIsProcessingFile(false);
    }
  }, []);

  const handleVideoFile = useCallback((file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('Vidéo trop volumineuse (max 50 Mo).');
      return;
    }
    setErrorMsg(null);
    const objectUrl = URL.createObjectURL(file);
    setMediaPreview(objectUrl);
    // Pour les vidéos on lit en base64 directement (FileReader)
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setMediaUrl(result);
      setMediaType('video');
    };
    reader.onerror = () => setErrorMsg('Impossible de lire le fichier vidéo.');
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { onOpenAuth?.(); return; }
    if (!content.trim() && !mediaUrl.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await socialApi.createPost({
        content: content.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
      });
      setContent('');
      clearMedia();
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
          <img
            src={currentUserAvatar}
            alt={currentUserName}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-white/10 shrink-0 bg-slate-800"
          />
          <div className="flex-1 min-w-0">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Quoi de neuf sur le parquet ? Partagez vos scores, dunks ou analyses..."
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-[#FF2A3B] to-[#E60023] hover:from-[#FF4555] hover:to-[#FF2A3B] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#FF2A3B]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
