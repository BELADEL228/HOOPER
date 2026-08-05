import React from 'react';
import { Bell, Flame, MessageSquare, Wallet, X, CheckCheck } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onClear }) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: '1',
      title: 'Match Imminent',
      time: 'Il y a 10 min',
      text: 'Le prochain match au terrain du Lycée d\'Adétikopé approche. Vérifiez la feuille de convocation.',
      icon: <Flame className="w-4 h-4 text-[#FF2A3B]" />,
    },
    {
      id: '2',
      title: 'Nouveau Message Équipe',
      time: 'Il y a 30 min',
      text: 'Coach David Vance a publié les consignes pour la séance tactique de mardi.',
      icon: <MessageSquare className="w-4 h-4 text-blue-400" />,
    },
    {
      id: '3',
      title: 'Rappel Cotisation 2026',
      time: 'Il y a 2h',
      text: 'Trésorerie : le reçu de paiement de votre cotisation est disponible dans votre espace.',
      icon: <Wallet className="w-4 h-4 text-emerald-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#090A0F] border-l border-white/10 h-full p-6 space-y-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right">
        
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 font-bold text-white text-base">
              <Bell className="w-5 h-5 text-[#FFB800]" /> Notifications Instantanées
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
            {notifications.map((n) => (
              <div key={n.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span className="flex items-center gap-1.5">{n.icon} {n.title}</span>
                  <span className="text-[10px] text-slate-500 font-normal">{n.time}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{n.text}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClear}
          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-2"
        >
          <CheckCheck className="w-4 h-4" /> Marquer tout comme lu
        </button>

      </div>
    </div>
  );
};
