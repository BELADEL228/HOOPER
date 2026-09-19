import React, { useEffect } from 'react';
import { MessageSquare, Bell, X, Trophy, Users, Zap, Heart, Sparkles } from 'lucide-react';

export interface ToastNotification {
    id: string;
    type: string;
    title: string;
    text: string;
    onOpen?: () => void;
}

interface NotificationToastProps {
    notifications: ToastNotification[];
    onDismiss: (id: string) => void;
}

// ✅ Icône selon le type
const getIcon = (type: string) => {
    switch (type) {
        case 'STATUS_REACTION':
            return <Heart className="w-5 h-5 text-rose-400 fill-rose-400/40" />;
        case 'STATUS_REPLY':
            return <Sparkles className="w-5 h-5 text-amber-400" />;
        case 'MESSAGE':
            return <MessageSquare className="w-5 h-5" />;
        case 'MATCH':
            return <Zap className="w-5 h-5" />;
        case 'CLUB':
            return <Users className="w-5 h-5" />;
        case 'TROPHY':
            return <Trophy className="w-5 h-5" />;
        default:
            return <Bell className="w-5 h-5" />;
    }
};

// ✅ Couleur selon le type
const getAccent = (type: string): string => {
    switch (type) {
        case 'STATUS_REACTION':
            return '#F43F5E';
        case 'STATUS_REPLY':
            return '#F59E0B';
        case 'MESSAGE':
            return '#FF2A3B';
        case 'MATCH':
            return '#FFB800';
        case 'CLUB':
            return '#3B82F6';
        case 'TROPHY':
            return '#22C55E';
        default:
            return '#94A3B8';
    }
};

const Toast: React.FC<{
    notif: ToastNotification;
    onDismiss: (id: string) => void;
}> = ({ notif, onDismiss }) => {
    const accent = getAccent(notif.type);

    // Auto-dismiss après 6 secondes
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(notif.id), 6000);
        return () => clearTimeout(timer);
    }, [notif.id, onDismiss]);

    return (
        <div
            className="w-80 rounded-2xl border shadow-2xl p-3 flex items-start gap-3 cursor-pointer bg-[#0D111A]/95 backdrop-blur-xl animate-slideInRight"
            style={{ borderColor: `${accent}50` }}
            onClick={() => {
                notif.onOpen?.();
                onDismiss(notif.id);
            }}
        >
            <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${accent}20`, color: accent }}
            >
                {getIcon(notif.type)}
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-white truncate">
                    {notif.title}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                    {notif.text}
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(notif.id);
                }}
                className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
};

export const NotificationToastContainer: React.FC<NotificationToastProps> = ({
    notifications,
    onDismiss,
}) => {
    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-[100] space-y-2 pointer-events-auto">
            {notifications.map((n) => (
                <Toast key={n.id} notif={n} onDismiss={onDismiss} />
            ))}
        </div>
    );
};