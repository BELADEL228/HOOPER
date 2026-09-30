import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Check, Sparkles, X, CheckCircle2 } from 'lucide-react';
import {
  getNotificationStatus,
  requestNotificationPermission,
  showLocalNotification,
} from '../../pwa/pushNotifications';
import { triggerHaptic } from '../../pwa/haptics';

interface PushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubName?: string;
}

export const PushNotificationModal: React.FC<PushNotificationModalProps> = ({
  isOpen,
  onClose,
  clubName = 'HOOPER Ligue',
}) => {
  const [status, setStatus] = useState(() => getNotificationStatus());
  const [tested, setTested] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStatus(getNotificationStatus());
      setTested(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequest = async () => {
    triggerHaptic('medium');
    const perm = await requestNotificationPermission();
    setStatus(getNotificationStatus());
    if (perm === 'granted') {
      triggerHaptic('success');
      void showLocalNotification(`🏀 Bienvenue sur les Alertes ${clubName}`, {
        body: 'Vous recevrez les scores en temps réel, feuilles de match et annonces officielles.',
      });
    }
  };

  const handleTest = async () => {
    triggerHaptic('light');
    const ok = await showLocalNotification(`⚡ BUZZER BEATER — ${clubName}`, {
      body: 'Fin du 4e quart-temps ! Égalité arrachée à 3 secondes de la fin.',
    });
    if (ok) {
      setTested(true);
      triggerHaptic('success');
      setTimeout(() => setTested(false), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-slate-900 p-6 shadow-2xl text-slate-100 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600/30 to-amber-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-[#FF2A3B]">
            <BellRing className="w-7 h-7 animate-bounce" />
          </div>
          <h3 className="text-xl font-black text-white">Alertes Live & Notifications</h3>
          <p className="text-xs text-slate-400">
            Ne manquez aucun fait marquant de {clubName} et du championnat togolais.
          </p>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <strong className="text-white">Scores & Évolutions en direct</strong>
              <p className="text-slate-400 text-[11px]">
                Mises à jour instantanées des matchs, quart-temps et buzzer beaters.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <strong className="text-white">Convocations & Vestiaire Club</strong>
              <p className="text-slate-400 text-[11px]">
                Horaires d'entraînement, rappels d'arbitrage et annonces des coachs.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          {status.permission !== 'granted' ? (
            <button
              onClick={handleRequest}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#E60023] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-500/25 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Activer les notifications
            </button>
          ) : (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Notifications déjà autorisées
              </div>
              <button
                onClick={handleTest}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {tested ? 'Notification test envoyée ! 🏀' : 'Tester une notification de score'}
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
};
