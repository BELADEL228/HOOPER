import React, { useEffect, useState, useCallback } from 'react';
import {
    X,
    Eye,
    Heart,
    MessageCircle,
    Trash2,
    Loader2,
    AlertCircle,
    Clock,
    BarChart3,
} from 'lucide-react';
import { statusApi, type StatusInsights } from '../../services/statusApi';

interface StoryOwnerViewProps {
    isOpen: boolean;
    statusId: string | null;
    onClose: () => void;
    onDelete?: (statusId: string) => void;
    currentUserId?: string | null;
}

// ─── Mapping emoji ─────────────────────────────────────────────────────
const REACTION_EMOJI: Record<string, string> = {
    FIRE: '🔥',
    BASKET: '🏀',
    HEART: '❤️',
    CLAP: '👏',
    LIKE: '👍',
};

// ─── Formater le temps ─────────────────────────────────────────────────
const formatTimeAgo = (iso: string): string => {
    try {
        const d = new Date(iso);
        const now = new Date();
        const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);

        if (diffMin < 1) return "À l'instant";
        if (diffMin < 60) return `Il y a ${diffMin} min`;
        if (diffMin < 1440) return `Il y a ${Math.floor(diffMin / 60)}h`;
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
        return '';
    }
};

// ─── Tracking localStorage ─────────────────────────────────────────────
const LAST_OPENED_KEY = (statusId: string) =>
    `owner-insights-last-opened-${statusId}`;

const getLastOpenedAt = (statusId: string): string | null => {
    try {
        return localStorage.getItem(LAST_OPENED_KEY(statusId));
    } catch {
        return null;
    }
};

const setLastOpenedAt = (statusId: string, iso: string): void => {
    try {
        localStorage.setItem(LAST_OPENED_KEY(statusId), iso);
    } catch {
        // ignore
    }
};

export const StoryOwnerView: React.FC<StoryOwnerViewProps> = ({
    isOpen,
    statusId,
    onClose,
    onDelete,
    currentUserId,
}) => {
    const [insights, setInsights] = useState<StatusInsights | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'views' | 'reactions' | 'replies'>(
        'views'
    );

    const [showChoices, setShowChoices] = useState(false);

    // ✅ Mémorise la dernière consultation AVANT d'ouvrir (pour le badge "Nouveau")
    const [lastOpenedBefore, setLastOpenedBefore] = useState<string | null>(null);

    // ─── Charger les insights ─────────────────────────────────────────
    const loadInsights = useCallback(async () => {
        if (!statusId) return;

        setLoading(true);
        setError('');
        try {
            // ✅ Récupère la dernière consultation AVANT le fetch
            const previous = getLastOpenedAt(statusId);
            setLastOpenedBefore(previous);

            const data = await statusApi.getInsights(statusId);
            if (!data) {
                setError('Impossible de charger les insights.');
                return;
            }
            setInsights(data);
        } catch (err) {
            console.warn('[StoryOwnerView]', err);
            setError('Erreur lors du chargement.');
        } finally {
            setLoading(false);
        }
    }, [statusId]);

    useEffect(() => {
        if (isOpen && statusId) {
            void loadInsights();
            setActiveTab('views');
        }
    }, [isOpen, statusId, loadInsights]);

    // ✅ À la fermeture : on enregistre que l'user a consulté les insights
    useEffect(() => {
        if (!isOpen && statusId) {
            setLastOpenedAt(statusId, new Date().toISOString());
        }
    }, [isOpen, statusId]);

    // ─── Échap pour fermer ────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // ─── Supprimer la story ───────────────────────────────────────────
    const handleDelete = async () => {
        if (!statusId) return;

        try {
            await statusApi.deleteStatus(statusId);
            onDelete?.(statusId);
            onClose();
        } catch (err) {
            console.warn('[StoryOwnerView] delete', err);
            alert('Impossible de supprimer la story.');
        }
    };

    // ✅ Détermine si une vue est "nouvelle"
    const isNewView = (viewedAt: string): boolean => {
        if (!lastOpenedBefore) {
            // Jamais ouvert auparavant → tout est "nouveau"
            return true;
        }
        return new Date(viewedAt) > new Date(lastOpenedBefore);
    };

    // ✅ Filtre : on retire le propriétaire lui-même des vues
    const filteredViews = React.useMemo(() => {
        if (!insights) return [];
        return insights.views.filter((v) => v.user.id !== currentUserId);
    }, [insights, currentUserId]);

    // ✅ Compte des nouvelles vues
    const newViewsCount = React.useMemo(() => {
        return filteredViews.filter((v) => isNewView(v.viewedAt)).length;
    }, [filteredViews, lastOpenedBefore]);

    if (!isOpen || !statusId) return null;

    const totalReactions =
        insights?.reactions.reduce((acc, r) => acc + r.count, 0) ?? 0;

    return (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full sm:max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-3xl bg-[#0D111A] border-t sm:border border-white/15 shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-[#FF2A3B]" />
                        <h3 className="text-base font-black text-white">
                            Statistiques de ma Story
                        </h3>
                    </div>

                    <div className="relative flex items-center gap-1">
                        <button
                            onClick={() => setShowChoices((prev) => !prev)}
                            aria-expanded={showChoices}
                            aria-label="Supprimer"
                            title="Supprimer ma story"
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        {showChoices && (
                            <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#0D111A] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden z-50">
                                <div className="px-4 py-3 border-b border-white/10">
                                    <p className="text-sm font-bold text-white">
                                        Supprimer la story ?
                                    </p>

                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                        Cette action est définitive. Ta story sera supprimée immédiatement.
                                    </p>
                                </div>

                                <div className="p-2 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowChoices(false)}
                                        className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    >
                                        Annuler
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowChoices(false);
                                            handleDelete();
                                        }}
                                        className="flex-1 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            aria-label="Fermer"
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Contenu */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-sm">Chargement…</span>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center space-y-3">
                            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                            <p className="text-sm text-slate-300">{error}</p>
                            <button
                                onClick={loadInsights}
                                className="text-xs text-[#FF2A3B] hover:underline font-bold"
                            >
                                Réessayer
                            </button>
                        </div>
                    ) : !insights ? (
                        <div className="p-8 text-center text-sm text-slate-500 italic">
                            Aucune donnée disponible.
                        </div>
                    ) : (
                        <>
                            {/* Métadonnées de la story */}
                            <div className="p-4 border-b border-white/10 space-y-2">
                                {insights.text && (
                                    <p className="text-sm text-white font-medium">{insights.text}</p>
                                )}
                                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatTimeAgo(insights.createdAt)}
                                    </span>
                                    <span>•</span>
                                    <span className="uppercase font-bold text-[#FFB800]">
                                        {insights.visibility}
                                    </span>
                                </div>
                            </div>

                            {/* Compteurs rapides */}
                            <div className="grid grid-cols-3 gap-2 p-4">
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center relative">
                                    {/* ✅ Badge "Nouveau" sur les vues */}
                                    {newViewsCount > 0 && (
                                        <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-[#FFB800] text-black text-[10px] font-black shadow-lg">
                                            +{newViewsCount}
                                        </span>
                                    )}
                                    <Eye className="w-5 h-5 text-sky-400 mx-auto mb-1" />
                                    <div className="text-xl font-black text-white">
                                        {filteredViews.length}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                                        Vues
                                    </div>
                                </div>
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                                    <Heart className="w-5 h-5 text-[#FF2A3B] mx-auto mb-1" />
                                    <div className="text-xl font-black text-white">
                                        {totalReactions}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                                        Réactions
                                    </div>
                                </div>
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                                    <MessageCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                                    <div className="text-xl font-black text-white">
                                        {insights.repliesCount}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                                        Réponses
                                    </div>
                                </div>
                            </div>

                            {/* Onglets */}
                            <div className="flex border-b border-white/10 px-4 gap-1">
                                {(
                                    [
                                        { id: 'views', label: `Vues (${filteredViews.length})` },
                                        {
                                            id: 'reactions',
                                            label: `Réactions (${totalReactions})`,
                                        },
                                        {
                                            id: 'replies',
                                            label: `Réponses (${insights.repliesCount})`,
                                        },
                                    ] as const
                                ).map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${activeTab === tab.id
                                            ? 'text-[#FF2A3B] border-[#FF2A3B]'
                                            : 'text-slate-400 border-transparent hover:text-white'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Contenu des onglets */}
                            <div className="p-4">
                                {activeTab === 'views' && (
                                    <div className="space-y-1">
                                        {filteredViews.length === 0 ? (
                                            <p className="text-center text-xs text-slate-500 italic py-6">
                                                Personne d'autre n'a vu cette story.
                                            </p>
                                        ) : (
                                            filteredViews.map((v) => {
                                                const isNew = isNewView(v.viewedAt);
                                                return (
                                                    <div
                                                        key={v.id}
                                                        className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${isNew
                                                            ? 'bg-[#FFB800]/10 border border-[#FFB800]/30'
                                                            : 'hover:bg-white/5 border border-transparent'
                                                            }`}
                                                    >
                                                        <div className="relative shrink-0">
                                                            <img
                                                                src={
                                                                    v.user.avatarUrl ||
                                                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                        v.user.name
                                                                    )}&background=FF2A3B&color=fff`
                                                                }
                                                                alt={v.user.name}
                                                                className={`w-9 h-9 rounded-full object-cover bg-slate-800 border ${isNew
                                                                    ? 'border-[#FFB800]'
                                                                    : 'border-white/10'
                                                                    }`}
                                                            />
                                                            {isNew && (
                                                                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#FFB800] border-2 border-[#0D111A]" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-white truncate">
                                                                    {v.user.name}
                                                                </span>
                                                                {isNew && (
                                                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#FFB800] text-black shrink-0">
                                                                        NOUVEAU
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[11px] text-slate-400">
                                                                {formatTimeAgo(v.viewedAt)}
                                                            </span>
                                                        </div>
                                                        <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}

                                {activeTab === 'reactions' && (
                                    <div className="space-y-4">
                                        {insights.reactions.length === 0 ? (
                                            <p className="text-center text-xs text-slate-500 italic py-6">
                                                Aucune réaction pour le moment.
                                            </p>
                                        ) : (
                                            insights.reactions.map((group) => (
                                                <div key={group.type} className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl">
                                                            {REACTION_EMOJI[group.type] || '👍'}
                                                        </span>
                                                        <span className="text-xs font-black text-white">
                                                            {group.count}{' '}
                                                            {group.count > 1 ? 'personnes' : 'personne'}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 pl-2">
                                                        {group.users
                                                            .filter((r) => r.user.id !== currentUserId)
                                                            .map((r) => (
                                                                <div
                                                                    key={r.id}
                                                                    className="flex items-center gap-1.5 bg-white/5 rounded-full pr-2.5 py-0.5 pl-0.5 border border-white/10"
                                                                >
                                                                    <img
                                                                        src={
                                                                            r.user.avatarUrl ||
                                                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                                r.user.name
                                                                            )}&background=FF2A3B&color=fff`
                                                                        }
                                                                        alt={r.user.name}
                                                                        className="w-6 h-6 rounded-full object-cover"
                                                                    />
                                                                    <span className="text-[11px] font-semibold text-slate-200">
                                                                        {r.user.name}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'replies' && (
                                    <div className="space-y-3">
                                        {insights.replies.length === 0 ? (
                                            <p className="text-center text-xs text-slate-500 italic py-6">
                                                Aucune réponse pour le moment.
                                            </p>
                                        ) : (
                                            insights.replies.map((r) => (
                                                <div
                                                    key={r.id}
                                                    className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <img
                                                            src={
                                                                r.user.avatarUrl ||
                                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                    r.user.name
                                                                )}&background=FF2A3B&color=fff`
                                                            }
                                                            alt={r.user.name}
                                                            className="w-7 h-7 rounded-full object-cover shrink-0"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs font-bold text-white block truncate">
                                                                {r.user.name}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">
                                                                {formatTimeAgo(r.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-200 leading-relaxed pl-9">
                                                        {r.content}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};