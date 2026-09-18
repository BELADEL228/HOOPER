import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  X,
  Building2,
  Send,
  MapPin,
  ImageUp,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { clubApi, type ApiClub, type ClubRequestInput } from '../../services/clubApi';
import { analyzeLogoFile } from '../../services/logoPalette';

interface ClubCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (club: ApiClub) => void;
  isSuperAdmin?: boolean;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
}

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });

export const ClubCreateModal: React.FC<ClubCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isSuperAdmin = false,
  isAuthenticated,
  onOpenAuth,
}) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const [form, setForm] = useState<ClubRequestInput>({
    name: '',
    shortName: '',
    city: 'Lomé',
    country: 'Togo',
    description: '',
    logoUrl: '',
    email: '',
    phoneNumber: '',
    website: '',
    foundedYear: new Date().getFullYear(),
    primaryColor: '#FF2A3B',
    secondaryColor: '#FFB800',
  });

  if (!isOpen) return null;

  const update = (key: keyof ClubRequestInput, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const getToken = (): string => {
    try {
      const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
      return session?.token || '';
    } catch {
      return '';
    }
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Formats acceptés : PNG, JPEG ou WEBP.');
      return;
    }
    if (file.size > 3_500_000) {
      setError('La taille du logo doit être inférieure à 3,5 Mo.');
      return;
    }

    try {
      setError('');
      const [dataUrl, tokens] = await Promise.all([readAsDataUrl(file), analyzeLogoFile(file)]);
      setForm((prev) => ({
        ...prev,
        logoUrl: dataUrl,
        primaryColor: tokens.primary || prev.primaryColor,
        secondaryColor: tokens.secondary || prev.secondaryColor,
      }));
    } catch {
      setError('Erreur lors de l’analyse du logo.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.city.trim()) {
      setError('Le nom du club et la ville sont obligatoires.');
      return;
    }

    const token = getToken();
    if (!token) {
      setError('Vous devez être connecté pour inscrire un club.');
      return;
    }

    setLoading(true);
    try {
      if (isSuperAdmin) {
        const created = await clubApi.createClubDirectly(
          {
            ...form,
            foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
          },
          token
        );
        setSuccessMessage(`Le club "${created.name}" a été créé et activé avec succès !`);
        setTimeout(() => {
          onSuccess(created);
          onClose();
        }, 1200);
      } else {
        await clubApi.submitClubRequest(
          {
            ...form,
            foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
          },
          token
        );
        setSuccessMessage(
          `Votre demande pour "${form.name}" a été enregistrée avec succès. Elle sera examinée par la direction de la ligue.`
        );
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue lors de l’enregistrement du club.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 glass-panel rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl bg-[#090A0F]">
        {/* Bouton de fermeture */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* En-tête */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FF2A3B]/15 border border-[#FF2A3B]/30 flex items-center justify-center text-[#FF2A3B] shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isSuperAdmin ? 'Création Officielle de Club' : 'Inscrire ou Demander un Club'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {isSuperAdmin
                ? 'Création immédiate d’une franchise officielle avec vestiaire virtuel.'
                : 'Rejoignez la ligue officielle et obtenez un espace club dédié pour votre équipe.'}
            </p>
          </div>
        </div>

        {/* Alerte si non connecté */}
        {!isAuthenticated ? (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <LogIn className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Connexion requise</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Vous devez avoir un compte HOOPERS pour enregistrer ou gérer un club de basketball.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#FFB800] text-white text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-red-500/20"
            >
              <LogIn className="w-4 h-4" /> Se connecter / S'inscrire
            </button>
          </div>
        ) : successMessage ? (
          <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 animate-in fade-in zoom-in duration-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-black text-white">Opération confirmée !</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Indicateur d'étapes */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    step === 1
                      ? 'bg-[#FF2A3B] text-white'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  1. Informations Sportives
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    step === 2
                      ? 'bg-[#FF2A3B] text-white'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  2. Identité &amp; Contact
                </button>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Étape {step} sur 2</span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Étape 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Nom complet du Club <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Fire Stone Basketball Club"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#FF2A3B] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Sigle / Acronyme
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: FSBC"
                      value={form.shortName || ''}
                      onChange={(e) => update('shortName', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#FF2A3B] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Ville Métropole <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Lomé"
                        value={form.city}
                        onChange={(e) => update('city', e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#FF2A3B] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Pays</label>
                    <input
                      type="text"
                      value={form.country || 'Togo'}
                      onChange={(e) => update('country', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#FF2A3B] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Présentation &amp; Histoire du Club
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Présentez les valeurs, l'ambition et la vision du club..."
                    value={form.description || ''}
                    onChange={(e) => update('description', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#FF2A3B] transition-colors resize-none"
                  />
                </div>
              </div>
            )}

            {/* Étape 2 */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Upload et Aperçu Logo */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Logo Officiel (PNG, JPEG, WEBP)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/20 hover:border-[#FF2A3B] bg-white/5 flex items-center justify-center overflow-hidden cursor-pointer shrink-0 transition-colors">
                      {form.logoUrl ? (
                        <img
                          src={form.logoUrl}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageUp className="w-6 h-6 text-slate-400" />
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>

                    <div className="space-y-1">
                      <p className="text-xs text-white font-semibold">
                        {form.logoUrl ? 'Logo prêt à être enregistré' : 'Cliquez pour importer'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        L’intelligence artificielle extraira automatiquement les couleurs de votre maillot.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Couleurs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Couleur Primaire
                    </label>
                    <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10">
                      <input
                        type="color"
                        value={form.primaryColor || '#FF2A3B'}
                        onChange={(e) => update('primaryColor', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-slate-300 uppercase">
                        {form.primaryColor}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Couleur Secondaire
                    </label>
                    <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10">
                      <input
                        type="color"
                        value={form.secondaryColor || '#FFB800'}
                        onChange={(e) => update('secondaryColor', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-slate-300 uppercase">
                        {form.secondaryColor}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact & Année */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Email officiel</label>
                    <input
                      type="email"
                      placeholder="contact@monclub.tg"
                      value={form.email || ''}
                      onChange={(e) => update('email', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#FF2A3B] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Téléphone / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="+228 90 00 00 00"
                      value={form.phoneNumber || ''}
                      onChange={(e) => update('phoneNumber', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#FF2A3B] transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions / Navigation du formulaire */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              {step === 2 ? (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  ← Retour
                </button>
              ) : (
                <div />
              )}

              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!form.name.trim()) {
                      setError('Veuillez renseigner le nom du club.');
                      return;
                    }
                    setError('');
                    setStep(2);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#FF2A3B] hover:bg-[#E60023] text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-red-500/25"
                >
                  Suivant : Identité →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#FFB800] text-white text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-red-500/25 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Traitement...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isSuperAdmin ? 'Créer Immédiatement' : 'Envoyer la Demande'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
