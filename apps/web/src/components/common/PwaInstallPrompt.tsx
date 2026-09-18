import { useState, useEffect } from 'react';
import { Download, X, Share2, PlusSquare, Sparkles } from 'lucide-react';
import { isPwaInstalled, isIosDevice } from '../../pwa/registerServiceWorker';
import logo from '../../assets/logo.jpeg';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  useEffect(() => {
    // Si l'application est déjà installée en PWA standalone, ne rien afficher
    if (isPwaInstalled()) {
      return;
    }

    // Vérifier si l'utilisateur a reporté l'installation récemment (cooldown 2 jours)
    const dismissedAt = localStorage.getItem('firestone_pwa_dismissed');
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 2) {
        return;
      }
    }

    // Écouter l'événement standard Chrome / Edge / Android
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Détection spécifique iOS Safari
    if (isIosDevice() && !isPwaInstalled()) {
      // Afficher la bannière après un court délai pour une meilleure UX
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Déclencher le prompt d'installation natif
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIosDevice()) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    localStorage.setItem('firestone_pwa_dismissed', String(Date.now()));
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <>
      {/* Bannière flottante d'installation PWA */}
      <div
        className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-[420px] z-50 animate-fadeIn"
        role="region"
        aria-label="Installation de l'application mobile"
      >
        <div className="relative rounded-3xl p-5 border border-[#FF2A3B]/40 bg-[#0F121E]/95 backdrop-blur-xl shadow-2xl shadow-red-950/40 text-white overflow-hidden">
          {/* Lueur d'ambiance */}
          <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-[#FF2A3B]/20 blur-2xl pointer-events-none" />

          <button
            onClick={handleDismiss}
            type="button"
            className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fermer l'invitation d'installation"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-red-500/30 shrink-0 border border-white/10 bg-black">
              <img src={logo} alt="HOOPER" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-1 pr-6">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FF2A3B]/20 text-[#FFB800] text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Application Mobile
              </div>
              <h4 className="text-sm font-black tracking-tight text-white">
                Installer FIRE STONE Club
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Accédez aux scores en direct, tournois et effectifs en plein écran et sans connexion internet.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              onClick={handleDismiss}
              type="button"
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 px-3 py-2 transition-colors cursor-pointer"
            >
              Plus tard
            </button>
            <button
              onClick={handleInstallClick}
              type="button"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#FFB800] hover:from-red-500 hover:to-amber-400 px-5 py-2.5 text-xs font-black text-slate-950 uppercase tracking-wider shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Installer l'App
            </button>
          </div>
        </div>
      </div>

      {/* Guide modal interactif pour iPhone / iPad Safari */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-slate-900 p-6 shadow-2xl text-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Installer sur iOS (Safari)</h3>
                  <p className="text-xs text-slate-400">Ajouter FIRE STONE à l'écran d'accueil</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                type="button"
                className="p-1.5 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ol className="space-y-4 text-xs">
              <li className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FF2A3B] text-white font-black shrink-0 text-[11px]">
                  1
                </span>
                <p className="leading-relaxed">
                  Appuyez sur le bouton de <strong className="text-white">Partage</strong>{' '}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono">
                    <Share2 className="w-3 h-3 inline mr-1" /> Partager
                  </span>{' '}
                  situé dans la barre en bas de Safari.
                </p>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FF2A3B] text-white font-black shrink-0 text-[11px]">
                  2
                </span>
                <p className="leading-relaxed">
                  Faites défiler le menu et sélectionnez{' '}
                  <strong className="text-white">« Sur l'écran d'accueil »</strong>{' '}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 text-amber-300 font-mono">
                    <PlusSquare className="w-3 h-3 inline mr-1" /> Écran d'accueil
                  </span>.
                </p>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FF2A3B] text-white font-black shrink-0 text-[11px]">
                  3
                </span>
                <p className="leading-relaxed">
                  Validez en appuyant sur <strong className="text-white">« Ajouter »</strong> en haut à droite. L'icône officielle apparaîtra sur votre écran d'accueil !
                </p>
              </li>
            </ol>

            <button
              onClick={() => setShowIosGuide(false)}
              type="button"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 text-xs font-black uppercase tracking-wider text-white shadow-lg cursor-pointer"
            >
              Compris !
            </button>
          </div>
        </div>
      )}
    </>
  );
}
