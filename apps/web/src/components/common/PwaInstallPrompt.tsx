import { useState, useEffect } from 'react';
import {
  Download,
  X,
  Share2,
  PlusSquare,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  Globe,
  Zap,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { isPwaInstalled, isIosDevice } from '../../pwa/registerServiceWorker';
import logo from '../../assets/logo.jpeg';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

/**
 * Fonction globale déclenchable de n'importe où dans l'UI (Sidebar, Navbar, MobileNavBar, Profil, etc.)
 */
export function triggerPwaInstall() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-pwa-install'));
  }
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showFloatingPill, setShowFloatingPill] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ANDROID' | 'IOS' | 'INFO'>('ANDROID');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Si l'application est déjà exécutée en mode PWA installée, masquer
    if (isPwaInstalled()) {
      return;
    }

    // Définir l'onglet par défaut selon le système
    if (isIosDevice()) {
      setActiveTab('IOS');
    } else {
      setActiveTab('ANDROID');
    }

    // Afficher le bouton flottant discret sur mobile après un court délai
    const isMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth < 1024 || /android|iphone|ipad|ipod/i.test(navigator.userAgent));

    if (isMobile) {
      const pillTimer = setTimeout(() => setShowFloatingPill(true), 2000);
      return () => clearTimeout(pillTimer);
    }
  }, []);

  useEffect(() => {
    // Écouteur pour ouverture manuelle depuis un bouton
    const handleOpenInstall = () => {
      setShowModal(true);
    };

    // Écouteur d'installation native Chrome / Android / Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowFloatingPill(true);
    };

    window.addEventListener('open-pwa-install', handleOpenInstall);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('open-pwa-install', handleOpenInstall);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setShowModal(false);
          setShowFloatingPill(false);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      } finally {
        setDeferredPrompt(null);
      }
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.origin;
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  return (
    <>
      {/* ── 1. Bouton Flottant Discret sur Mobile ── */}
      {showFloatingPill && !showModal && !isPwaInstalled() && (
        <div className="fixed bottom-20 md:bottom-6 right-3 z-40 animate-bounce">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FF2A3B] hover:bg-[#e6001f] text-white font-black text-xs border border-white/10 transition-colors cursor-pointer"
            title="Installer l'application mobile"
          >
            <Download className="w-4 h-4" />
            <span className="tracking-tight">Installer l'App</span>
          </button>
        </div>
      )}

      {/* ── 2. Modal Détaillé d'Installation PWA / APK Mobile ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0F1420] p-6 sm:p-8 space-y-6 shadow-2xl text-white overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Lueur de fond */}

            {/* Header Modal */}
            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl overflow-hidden border border-white/15 bg-black shrink-0">
                  <img src={logo} alt="HOOPER" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF2A3B]/15 text-[#FFB800] border border-[#FF2A3B]/30 text-[10px] font-black mb-1">
                    <Sparkles className="w-3 h-3" /> Application Mobile Officielle
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    Installer HOOPER sur Téléphone
                  </h3>
                  <p className="text-xs text-slate-400">
                    Accessible directement sur votre écran d'accueil avec icône HD.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bouton d'installation native 1-clic (si supporté par le navigateur) */}
            {deferredPrompt && (
              <div className="relative z-10 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#FFB800]" /> Installation Directe Détectée
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Prêt</span>
                </div>
                <button
                  onClick={handleNativeInstall}
                  className="w-full py-3.5 rounded-xl bg-[#FF2A3B] hover:bg-[#e6001f] text-white font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Installer l'App Maintenant (1 Clic)
                </button>
              </div>
            )}

            {/* Onglets selon l'OS mobile */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-bold relative z-10">
              <button
                onClick={() => setActiveTab('ANDROID')}
                className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
                  activeTab === 'ANDROID'
                    ? 'bg-[#FF2A3B] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Android (Chrome)
              </button>
              <button
                onClick={() => setActiveTab('IOS')}
                className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
                  activeTab === 'IOS'
                    ? 'bg-[#FF2A3B] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                iPhone / iPad (Safari)
              </button>
              <button
                onClick={() => setActiveTab('INFO')}
                className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
                  activeTab === 'INFO'
                    ? 'bg-[#FF2A3B] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pourquoi PWA ?
              </button>
            </div>

            {/* ── Contenu Onglet ANDROID ── */}
            {activeTab === 'ANDROID' && (
              <div className="space-y-4 relative z-10 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <p className="font-bold text-white text-[13px]">
                    Comment installer l'icône sur Android en 3 étapes :
                  </p>

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <span className="w-5 h-5 rounded-full bg-[#FF2A3B] text-white font-black flex items-center justify-center shrink-0 text-[10px]">
                        1
                      </span>
                      <p className="text-slate-300">
                        Ouvrez le menu de votre navigateur en appuyant sur les{' '}
                        <strong className="text-white">3 petits points ⋮</strong> situés tout en haut à droite de l'écran.
                      </p>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <span className="w-5 h-5 rounded-full bg-[#FF2A3B] text-white font-black flex items-center justify-center shrink-0 text-[10px]">
                        2
                      </span>
                      <p className="text-slate-300">
                        Appuyez sur <strong className="text-[#FFB800]">« Installer l'application »</strong> ou{' '}
                        <strong className="text-[#FFB800]">« Ajouter à l'écran d'accueil »</strong>.
                      </p>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <span className="w-5 h-5 rounded-full bg-[#FF2A3B] text-white font-black flex items-center justify-center shrink-0 text-[10px]">
                        3
                      </span>
                      <p className="text-slate-300">
                        Confirmez : l'application <strong className="text-white">HOOPER</strong> s'installe
                        immédiatement avec son logo officiel, son mode plein écran et son accès hors-ligne !
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-slate-300 truncate">
                    <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="font-mono text-[11px] truncate">
                      {typeof window !== 'undefined' ? window.location.origin : 'https://hooper.tg'}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] transition-colors shrink-0 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copié !' : 'Copier lien'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Contenu Onglet IOS ── */}
            {activeTab === 'IOS' && (
              <div className="space-y-4 relative z-10 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <p className="font-bold text-white text-[13px]">
                    Installation sur iPhone / iPad (Navigateur Safari) :
                  </p>

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <span className="w-5 h-5 rounded-full bg-[#FF2A3B] text-white font-black flex items-center justify-center shrink-0 text-[10px]">
                        1
                      </span>
                      <p className="text-slate-300">
                        Dans Safari, appuyez sur le bouton de <strong className="text-white">Partage</strong> (le carré
                        avec une flèche vers le haut <Share2 className="w-3.5 h-3.5 inline text-sky-400" />) dans la barre
                        en bas.
                      </p>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <span className="w-5 h-5 rounded-full bg-[#FF2A3B] text-white font-black flex items-center justify-center shrink-0 text-[10px]">
                        2
                      </span>
                      <p className="text-slate-300">
                        Faites défiler la liste vers le bas et sélectionnez{' '}
                        <strong className="text-[#FFB800]">
                          <PlusSquare className="w-3.5 h-3.5 inline text-amber-400 mr-1" />« Sur l'écran d'accueil »
                        </strong>
                        .
                      </p>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <span className="w-5 h-5 rounded-full bg-[#FF2A3B] text-white font-black flex items-center justify-center shrink-0 text-[10px]">
                        3
                      </span>
                      <p className="text-slate-300">
                        Appuyez sur <strong className="text-white">« Ajouter »</strong> en haut à droite. L'icône HOOPER
                        apparaît à côté de vos applications habituelles !
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Contenu Onglet INFO / POURQUOI PWA ── */}
            {activeTab === 'INFO' && (
              <div className="space-y-3 relative z-10 text-xs">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Avantages de l'App HOOPER
                  </h4>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#FF2A3B] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">Zéro téléchargement lourd :</strong> Pas besoin de télécharger
                        un fichier APK de 100 Mo ni de passer par le Play Store.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#FF2A3B] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">Mode Plein Écran Natif :</strong> Suppression de la barre
                        d'adresse du navigateur pour une immersion totale.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#FF2A3B] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">Consultation Hors-Ligne :</strong> Les effectifs, fiches de club
                        et scores récents restent lisibles sans connexion internet.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#FF2A3B] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">Mises à jour automatiques :</strong> Dès qu'une nouveauté est
                        déployée, votre application se met à jour en toute transparence.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-3 relative z-10">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
