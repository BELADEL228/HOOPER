import React, { useEffect, useRef, useState } from 'react';
import {
    Bell,
    MessageSquare,
    Zap,
    Users,
    Trophy,
    Check,
    X,
    Loader2,
    Trash,
    Heart,
    Sparkles,
} from 'lucide-react';
import { apiUrl } from '../../services/api';

export interface NotificationItem {
    id: string;
    type: string;
    title: string;
    text: string;
    read: boolean;
    createdAt: string;
}

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onUnreadCountChange?: (count: number) => void;
    onNotificationClick?: (notif: NotificationItem) => void;
    onNotificationDelete?: (id: string) => void;
    onNotificationDeleteAll?: () => void;
}

const getAuthToken = (): string => {
    try {
        const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
        return session?.token || '';
    } catch {
        return '';
    }
};

const getIcon = (type: string) => {
    switch (type) {
        case 'STATUS_REACTION':
            return <Heart className="w-4 h-4 text-rose-400 fill-rose-400/40" />;
        case 'STATUS_REPLY':
            return <Sparkles className="w-4 h-4 text-amber-400" />;
        case 'MESSAGE':
            return <MessageSquare className="w-4 h-4" />;
        case 'MATCH':
            return <Zap className="w-4 h-4" />;
        case 'CLUB':
            return <Users className="w-4 h-4" />;
        case 'TROPHY':
            return <Trophy className="w-4 h-4" />;
        default:
            return <Bell className="w-4 h-4" />;
    }
};

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

const formatTime = (iso: string): string => {
    try {
        const d = new Date(iso);
        const now = new Date();
        const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);

        if (diffMin < 1) return 'À l’instant';
        if (diffMin < 60) return `Il y a ${diffMin} min`;
        if (diffMin < 1440) return `Il y a ${Math.floor(diffMin / 60)}h`;
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
        return '';
    }
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
    isOpen,
    onClose,
    onUnreadCountChange,
    onNotificationClick,
}) => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const panelRef = useRef<HTMLDivElement>(null);

    // ─── Fetch des notifications à l'ouverture ─────────────────────────
    useEffect(() => {
        if (!isOpen) return;

        const fetchNotifications = async () => {
            const token = getAuthToken();
            if (!token) return;

            setLoading(true);
            setError('');
            try {
                const res = await fetch(apiUrl('/notifications'), {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const list = Array.isArray(data) ? data : [];
                setNotifications(list);

                const unread = list.filter((n: any) => !n.read).length;
                onUnreadCountChange?.(unread);
            } catch (err) {
                console.warn('[NotificationPanel]', err);
                setError('Impossible de charger les notifications.');
            } finally {
                setLoading(false);
            }
        };

        void fetchNotifications();
    }, [isOpen, onUnreadCountChange]);

    // ─── Fermeture au clic extérieur ───────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };
        // Petit délai pour éviter la fermeture immédiate au clic d'ouverture
        const timeout = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 50);

        return () => {
            clearTimeout(timeout);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // ─── Échap pour fermer ─────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // ─── Marquer une notification comme lue ───────────────────────────
    const handleMarkAsRead = async (notifId: string) => {
        const token = getAuthToken();
        if (!token) return;

        // Update optimiste
        setNotifications((prev) =>
            prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
        );

        try {
            await fetch(apiUrl(`/notifications/${notifId}/read`), {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });

            // Recalcule le count
            const unread = notifications.filter(
                (n) => !n.read && n.id !== notifId
            ).length;
            onUnreadCountChange?.(unread);
        } catch (err) {
            console.warn('[NotificationPanel] markAsRead', err);
        }
    };

    // ─── Marquer TOUT comme lu ─────────────────────────────────────────
    const handleMarkAllAsRead = async () => {
        const token = getAuthToken();
        if (!token) return;

        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        onUnreadCountChange?.(0);

        try {
            await fetch(apiUrl('/notifications/read-all'), {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) {
            console.warn('[NotificationPanel] markAllAsRead', err);
        }
    };

    // ─── Suppression d'une notification ────────────────────────────────
    const handleDelete = async (notifId: string) => {
        const token = getAuthToken();
        if (!token) return;

        // Update optimiste
        setNotifications((prev) => prev.filter((n) => n.id !== notifId));

        try {
            await fetch(apiUrl(`/notifications/${notifId}`), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            // Recalcule le count
            const unread = notifications.filter(
                (n) => !n.read && n.id !== notifId
            ).length;
            onUnreadCountChange?.(unread);
        } catch (err) {
            console.warn('[NotificationPanel] handleDelete', err);
        }
    };

    // ─── Suppression de TOUTES les notifications ──────────────────────
    const handleDeleteAll = async () => {
        const token = getAuthToken();
        if (!token) return;

        setNotifications([]);
        onUnreadCountChange?.(0);

        try {
            await fetch(apiUrl('/notifications'), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) {
            console.warn('[NotificationPanel] handleDeleteAll', err);
        }
    };

    // ─── Clic sur une notif ────────────────────────────────────────────
    const handleClick = (notif: NotificationItem) => {
        if (!notif.read) {
            void handleMarkAsRead(notif.id);
        }
        onNotificationClick?.(notif);
        onClose();
    };

    if (!isOpen) return null;

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <div
            ref={panelRef}
            className="absolute top-12 right-[-55px] sm:top-16 sm:right-0 z-50 w-[calc(100vw-1rem)] max-w-80 sm:w-96 max-h-[70vh] rounded-2xl bg-[#0D111A] border border-white/15 shadow-2xl shadow-black/80 overflow-hidden flex flex-col"
        >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#FF2A3B]" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Notifications
                    </h3>
                    {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#FF2A3B] text-white">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <button
                    onClick={onClose}
                    aria-label="Fermer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Liste défilable */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-8 flex flex-col items-center gap-2 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-xs">Chargement…</span>
                    </div>
                ) : error ? (
                    <div className="p-6 text-center text-xs text-amber-300">
                        {error}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-10 text-center space-y-2">
                        <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-500 italic">
                            Aucune notification pour le moment.
                        </p>
                    </div>
                ) : (
                    notifications.map((notif) => {
                        const accent = getAccent(notif.type);
                        return (
                            <div
                                key={notif.id}
                                onClick={() => handleClick(notif)}
                                className={`w-full text-left p-3 flex items-start gap-3 transition-colors cursor-pointer border-b border-white/5 last:border-b-0 ${notif.read ? 'hover:bg-white/5' : 'bg-white/[0.03] hover:bg-white/10'
                                    }`}
                            >
                                {/* Icône */}
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                    style={{
                                        backgroundColor: `${accent}20`,
                                        color: accent,
                                    }}
                                >
                                    {getIcon(notif.type)}
                                </div>

                                {/* Contenu */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <span
                                            className={`text-xs truncate block ${notif.read
                                                ? 'text-slate-400 font-medium'
                                                : 'text-white font-bold'
                                                }`}
                                        >
                                            {notif.title}
                                        </span>
                                        {!notif.read && (
                                            <span
                                                className="w-2 h-2 rounded-full shrink-0 mt-1"
                                                style={{ backgroundColor: accent }}
                                            />
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                                        {notif.text}
                                    </p>
                                    <span className="block text-[10px] text-slate-500 mt-1">
                                        {formatTime(notif.createdAt)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(notif.id)}
                                    aria-label="Supprimer"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer : marquer tout comme lu */}
            {unreadCount > 0 && (
                <div className="flex items-center border-t border-white/10">
                    <button
                        onClick={handleMarkAllAsRead}
                        className="flex-1 p-3 flex items-center justify-center gap-2 text-xs font-bold text-[#FFB800] hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <Check className="w-3.5 h-3.5" />
                        <span>Tout marquer comme lu</span>
                    </button>

                    <button
                        onClick={handleDeleteAll}
                        aria-label="Supprimer tout"
                        className="p-3 border-l border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <Trash className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};