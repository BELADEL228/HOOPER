import React, { useState, useRef, useCallback } from 'react';
import { X, MessageSquare, Clock, Sparkles, Send, ShieldCheck, Image, Video, Upload, Loader2 } from 'lucide-react';
import { statusApi } from '../../services/statusApi';
import { socialApi } from '../../services/socialApi';
import { uploadMedia } from '../../services/uploadService';
import type { SocialPost, StatusItem } from '../../types';

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: SocialPost) => void;
  onStoryCreated?: (status: StatusItem) => void;
  activeClubId?: string;
  isClubManager?: boolean;
}

const MAX_VIDEO_MB = 20;

export const CreateContentModal: React.FC<CreateContentModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  onStoryCreated,
  activeClubId,
  isClubManager = false,
}) => {
  const [activeMode, setActiveMode] = useState<'POST' | 'STORY'>('POST');
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [asClub, setAsClub] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setText('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    if (file.type.startsWith('image/')) {
      setMediaType('IMAGE');
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else if (file.type.startsWith('video/')) {
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > MAX_VIDEO_MB) {
        setErrorMsg(`Vidéo trop lourde (${sizeMb.toFixed(1)} Mo) — limite ${MAX_VIDEO_MB} Mo.`);
        return;
      }
      setMediaType('VIDEO');
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setErrorMsg('Format non supporté. Utilisez une image (JPG, PNG, WEBP) ou une vidéo (MP4).');
    }
  }, []);

  const removeMedia = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaType('IMAGE');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let finalMediaUrl: string | undefined;

      // Upload vers Cloudinary / CDN
      if (selectedFile) {
        const folder = activeMode === 'POST' ? 'firestone/posts' : 'firestone/stories';
        const res = await uploadMedia(selectedFile, folder, (p) => setUploadProgress(p));
        finalMediaUrl = res.url;
      }

      if (activeMode === 'POST') {
        const createdPost = await socialApi.createPost({
          content: text.trim(),
          mediaUrl: finalMediaUrl,
          clubId: asClub && activeClubId ? activeClubId : undefined,
        });
        onPostCreated?.(createdPost);
        setSuccessMsg('Publication partagée avec succès !');
      } else {
        const createdStory = await statusApi.createStatus({
          text: text.trim() || undefined,
          clubId: asClub && activeClubId ? activeClubId : undefined,
          visibility: 'PUBLIC',
          media: finalMediaUrl
            ? [{ type: mediaType, url: finalMediaUrl }]
            : undefined,
        });
        onStoryCreated?.(createdStory);
        setSuccessMsg('Story diffusée pour 24 heures !');
      }

      setTimeout(() => {
        setText('');
        setSelectedFile(null);
        setPreviewUrl(null);
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue lors du téléversement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Créer du contenu"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#0E121B] border border-white/15 p-5 sm:p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#FF2A3B]/15 text-[#FF2A3B]">
              <Sparkles className="w-5 h-5" />
            </span>
            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
              Créer sur HOOPERS
            </h3>
          </div>
          <button onClick={handleClose} aria-label="Fermer" className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sélecteur Post / Story */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveMode('POST')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeMode === 'POST' ? 'bg-[#FF2A3B] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Publication Fil</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('STORY')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeMode === 'STORY' ? 'bg-gradient-to-r from-[#FF2A3B] to-[#FFB800] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
          >
            <Clock className="w-4 h-4" />
            <span>Story (24h)</span>
          </button>
        </div>

        {/* Option publier au nom du club */}
        {isClubManager && activeClubId && (
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={asClub}
              onChange={(e) => setAsClub(e.target.checked)}
              className="accent-[#FF2A3B] rounded"
            />
            <ShieldCheck className="w-4 h-4 text-[#FFB800]" />
            <span>Publier officiellement au nom du Club</span>
          </label>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder={
              activeMode === 'POST'
                ? 'Quoi de neuf sur le parquet ? Partagez une analyse, un résultat...'
                : 'Texte ou légende de votre story...'
            }
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF2A3B] resize-none"
          />

          {/* Upload média */}
          <div className="space-y-2">
            {/* Input file caché */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              onChange={handleFileChange}
              className="hidden"
              id="media-upload-input"
            />

            {/* Bouton upload ou preview */}
            {!previewUrl && !isSubmitting && (
              <label
                htmlFor="media-upload-input"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 border-dashed text-xs text-slate-400 hover:border-[#FF2A3B] hover:text-white hover:bg-white/8 transition-all cursor-pointer group"
              >
                <Upload className="w-4 h-4 text-slate-500 group-hover:text-[#FF2A3B] transition-colors shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-slate-300 group-hover:text-white">Ajouter une photo ou vidéo (Cloudinary CDN)</span>
                  <span className="text-[10px] text-slate-500">JPG, PNG, WEBP, MP4 — max 20 Mo</span>
                </div>
                <div className="ml-auto flex gap-2">
                  <Image className="w-4 h-4 text-blue-400" />
                  <Video className="w-4 h-4 text-purple-400" />
                </div>
              </label>
            )}

            {/* Téléversement Cloudinary en cours */}
            {isSubmitting && selectedFile && (
              <div className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <Loader2 className="w-4 h-4 animate-spin text-[#FF2A3B]" />
                <span className="text-xs text-slate-300 font-semibold">
                  Téléversement Cloudinary CDN en cours... {uploadProgress > 0 ? `${uploadProgress}%` : ''}
                </span>
              </div>
            )}

            {/* Preview */}
            {previewUrl && !isSubmitting && (
              <div className="relative rounded-xl overflow-hidden border border-white/15 bg-black">
                {mediaType === 'VIDEO' ? (
                  <video src={previewUrl} controls className="w-full max-h-52 object-contain" />
                ) : (
                  <img src={previewUrl} alt="Aperçu" className="w-full max-h-52 object-cover" />
                )}
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <label
                    htmlFor="media-upload-input"
                    title="Changer le fichier"
                    className="p-1.5 rounded-full bg-black/70 text-white hover:bg-white/20 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </label>
                  <button
                    type="button"
                    onClick={removeMedia}
                    title="Supprimer"
                    className="p-1.5 rounded-full bg-black/70 text-white hover:bg-[#FF2A3B] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[10px] text-white font-bold flex items-center gap-1">
                  {mediaType === 'VIDEO' ? <Video className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                  {mediaType === 'VIDEO' ? 'Vidéo' : 'Image'}
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 text-center font-bold">
              {successMsg}
            </div>
          )}

          {/* Boutons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing || (!text.trim() && !mediaUrl.trim())}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#E60023] hover:from-[#FF4555] hover:to-[#FF2A3B] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#FF2A3B]/30 disabled:opacity-40 cursor-pointer transition-all"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{isSubmitting ? 'Envoi...' : 'Diffuser'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
