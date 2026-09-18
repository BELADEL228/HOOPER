import React, { useEffect, useState, useCallback } from 'react';
import { Search, X, Loader2, User as UserIcon, MapPin } from 'lucide-react';
import type { UserRole } from '../../types';
import { apiUrl } from '../../services/api';

export interface ApiUserResult {
    id: string;
    name: string;
    avatarUrl?: string | null;
    role: UserRole;
    city?: string | null;
    country?: string | null;
}

interface UserSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectUser: (user: ApiUserResult) => void;
    title?: string;
    placeholder?: string;
}

const getAuthToken = (): string => {
    try {
        const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
        return session?.token || '';
    } catch {
        return '';
    }
};

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
    isOpen,
    onClose,
    onSelectUser,
    title = 'Rechercher un utilisateur',
    placeholder = 'Nom, ville...',
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ApiUserResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const search = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setResults([]);
            setError('');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const token = getAuthToken();
            const res = await fetch(
                apiUrl(`/users/search?q=${encodeURIComponent(q)}&limit=15`),
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setResults(Array.isArray(data) ? data : []);
        } catch (err) {
            console.warn('[UserSearchModal]', err);
            setError('Erreur lors de la recherche');
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounce : cherche 400ms après la dernière frappe
    useEffect(() => {
        const t = setTimeout(() => void search(query), 400);
        return () => clearTimeout(t);
    }, [query, search]);

    // Reset à la fermeture
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            setError('');
        }
    }, [isOpen]);

    // Échap pour fermer
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-panel rounded-3xl border border-white/15 max-w-lg w-full max-h-[80vh] flex flex-col bg-[#0D0E15]">
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-lg font-black text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Barre de recherche */}
                <div className="p-4 border-b border-white/10">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            autoFocus
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={placeholder}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#FF2A3B]"
                        />
                    </div>
                </div>

                {/* Résultats */}
                <div className="flex-1 overflow-y-auto p-3">
                    {loading ? (
                        <div className="p-8 flex flex-col items-center gap-2 text-slate-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-xs">Recherche…</span>
                        </div>
                    ) : error ? (
                        <p className="p-6 text-center text-xs text-amber-300">{error}</p>
                    ) : query.trim().length < 2 ? (
                        <p className="p-8 text-center text-xs text-slate-500 italic">
                            Tapez au moins 2 caractères pour rechercher.
                        </p>
                    ) : results.length === 0 ? (
                        <p className="p-8 text-center text-xs text-slate-500 italic">
                            Aucun utilisateur trouvé.
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {results.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => {
                                        onSelectUser(user);
                                        onClose();
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left transition-colors cursor-pointer"
                                >
                                    <img
                                        src={
                                            user.avatarUrl ||
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                user.name || 'User'
                                            )}&background=FF2A3B&color=fff`
                                        }
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full object-cover bg-slate-800"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white text-sm truncate">
                                                {user.name}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF2A3B]/15 text-[#FFB800] border border-[#FF2A3B]/30 shrink-0">
                                                {user.role}
                                            </span>
                                        </div>
                                        {(user.city || user.country) && (
                                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                                <MapPin className="w-3 h-3" />
                                                {[user.city, user.country].filter(Boolean).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                    <UserIcon className="w-4 h-4 text-slate-500 shrink-0" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};