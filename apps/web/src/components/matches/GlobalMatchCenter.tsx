import React, { useEffect, useMemo, useState } from 'react';
import type { Match, UserRole } from '../../types';
import {
    Calendar,
    MapPin,
    Activity,
    Video,
    Trophy,
    Loader2,
    Radio,
    ChevronRight,
    Award,
    X,
    PlayCircle,
} from 'lucide-react';
import { apiUrl } from '../../services/api';
import { LiveMatchViewerModal } from './LiveMatchViewerModal';

interface GlobalMatchCenterProps {
    currentRole?: UserRole;
    onNavigateToMatch?: (matchId: string) => void;
}

type StatusFilter = 'ALL' | 'LIVE' | 'UPCOMING' | 'FINISHED';

// ✅ Type enrichi pour transporter le nom du club sans cast
type GlobalMatch = Match & { clubName?: string };

// ✅ Helper safe : parse une date ISO sans jamais crash si invalide
const parseScheduled = (
    input?: string | null
): { date: string; time: string } | null => {
    if (!input) return null;
    const d = new Date(input);
    if (isNaN(d.getTime())) return null;
    return {
        date: d.toISOString().split('T')[0],
        time: d.toTimeString().slice(0, 5),
    };
};

export const GlobalMatchCenter: React.FC<GlobalMatchCenterProps> = ({
    // ⚠️ Props réservées pour usages futurs (ex: filtrage par rôle, navigation)
    currentRole: _currentRole = 'VISITOR',
    onNavigateToMatch: _onNavigateToMatch,
}) => {
    const [matches, setMatches] = useState<GlobalMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<StatusFilter>('ALL');
    const [clubFilter, setClubFilter] = useState<string>('ALL');
    const [selectedMatch, setSelectedMatch] = useState<GlobalMatch | null>(null);
    const [liveViewerMatch, setLiveViewerMatch] = useState<GlobalMatch | null>(null);

    // ── Chargement GLOBAL de tous les matchs ────────────────────────────
    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        fetch(apiUrl('/matches'))
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const data = await r.json();

                // Normalisation : accepte array OU { matches: [...] }
                const list: any[] = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.matches)
                        ? data.matches
                        : [];

                // Mapping safe → GlobalMatch
                const mapped: GlobalMatch[] = list.map((m) => {
                    const scheduled = parseScheduled(m.scheduledAt);
                    return {
                        id: m.id,
                        opponent: m.opponent ?? m.awayTeam?.name ?? '?',
                        opponentLogo: m.opponentLogo ?? m.awayTeam?.logo ?? '',
                        isHome: Boolean(m.isHome),
                        date: m.date ?? scheduled?.date ?? '',
                        time: m.time ?? scheduled?.time ?? '',
                        venue: m.venue ?? '',
                        address: m.address ?? '',
                        status:
                            m.status === 'LIVE'
                                ? 'LIVE'
                                : m.status === 'FINISHED'
                                    ? 'FINISHED'
                                    : 'UPCOMING',
                        scoreTeam: m.scoreTeam ?? m.homeScore ?? undefined,
                        scoreOpponent: m.scoreOpponent ?? m.awayScore ?? undefined,
                        summary: m.summary ?? undefined,
                        mvpPlayerName: m.mvpPlayerName ?? undefined,
                        videoUrl: m.videoUrl ?? undefined,
                        photos: Array.isArray(m.photos) ? m.photos : undefined,
                        boxscore: Array.isArray(m.boxscore) ? m.boxscore : undefined,
                        clubName: typeof m.clubName === 'string' ? m.clubName : undefined,
                    };
                });

                if (!cancelled) {
                    setMatches(mapped);
                    setError(null);
                }
            })
            .catch((err) => {
                if (cancelled) return;
                console.warn('[GlobalMatchCenter]', err);
                setError('Impossible de charger les matchs. Vérifiez la connexion.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // ── Liste unique des clubs pour le filtre ───────────────────────────
    const availableClubs = useMemo(() => {
        const set = new Set<string>();
        matches.forEach((m) => {
            if (m.clubName) set.add(m.clubName);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [matches]);

    // ── Filtrage ────────────────────────────────────────────────────────
    const filteredMatches = useMemo(() => {
        return matches.filter((m) => {
            if (filter !== 'ALL' && m.status !== filter) return false;
            if (clubFilter !== 'ALL' && m.clubName !== clubFilter) return false;
            return true;
        });
    }, [matches, filter, clubFilter]);

    // ── Stats globales pour le header ───────────────────────────────────
    const stats = useMemo(
        () => ({
            total: matches.length,
            live: matches.filter((m) => m.status === 'LIVE').length,
            upcoming: matches.filter((m) => m.status === 'UPCOMING').length,
            finished: matches.filter((m) => m.status === 'FINISHED').length,
        }),
        [matches]
    );

    // ── Render logo (URL ou emoji) ──────────────────────────────────────
    const renderLogo = (logo: string, size = 'w-10 h-10') => {
        if (!logo) {
            return (
                <div
                    className={`${size} rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-lg`}
                >
                    🏀
                </div>
            );
        }
        const isImage = /^(https?:|\/|data:)/.test(logo);
        if (isImage) {
            return (
                <img
                    src={logo}
                    alt=""
                    className={`${size} rounded-xl object-cover border border-white/10`}
                />
            );
        }
        return (
            <div
                className={`${size} rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-lg`}
            >
                {logo}
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-12 max-w-5xl mx-auto">
            {/* ─── HEADER ──────────────────────────────────────────────── */}
            <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2A3B]/20 text-[#FF2A3B] text-xs font-bold uppercase tracking-wider mb-2 border border-[#FF2A3B]/30">
                            <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Match Center — Toute la Ligue
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white">
                            Tous les Matchs en Direct
                        </h2>
                        <p className="text-slate-400 text-sm">
                            Suivez en temps réel les rencontres de toutes les équipes de la ligue.
                        </p>
                    </div>

                    {/* Stats rapides */}
                    <div className="flex items-center gap-3">
                        {stats.live > 0 && (
                            <div className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-black animate-pulse flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-white" />
                                {stats.live} LIVE
                            </div>
                        )}
                        <div className="text-xs text-slate-400">
                            <strong className="text-white">{stats.total}</strong> matchs
                        </div>
                    </div>
                </div>

                {/* Filtres statut */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {(
                        [
                            { key: 'ALL' as const, label: 'Tous', count: stats.total },
                            { key: 'LIVE' as const, label: '🔴 En Direct', count: stats.live },
                            { key: 'UPCOMING' as const, label: 'À Venir', count: stats.upcoming },
                            { key: 'FINISHED' as const, label: 'Terminés', count: stats.finished },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${filter === tab.key
                                    ? 'bg-[#FF2A3B] text-white shadow-md'
                                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>

                {/* Filtre par club (si dispo) */}
                {availableClubs.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            Club :
                        </span>
                        <select
                            value={clubFilter}
                            onChange={(e) => setClubFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF2A3B]"
                        >
                            <option value="ALL">Tous les clubs</option>
                            {availableClubs.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* ─── LISTE DES MATCHS ──────────────────────────────────────── */}
            {loading ? (
                <div className="glass-panel p-12 rounded-2xl flex flex-col items-center gap-3 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm">Chargement des matchs de la ligue…</span>
                </div>
            ) : error ? (
                <div className="glass-panel p-8 rounded-2xl border border-amber-500/30 text-center text-amber-200 text-sm">
                    {error}
                </div>
            ) : filteredMatches.length === 0 ? (
                <div className="glass-panel p-12 rounded-2xl border border-dashed border-white/15 text-center text-slate-400 space-y-2">
                    <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-sm">Aucun match ne correspond à ce filtre.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {filteredMatches.map((match) => {
                        const isLive = match.status === 'LIVE';
                        const isFinished = match.status === 'FINISHED';
                        const isUpcoming = match.status === 'UPCOMING';

                        return (
                            <div
                                key={match.id}
                                onClick={() => setSelectedMatch(match)}
                                className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer hover:border-white/20 ${isLive
                                        ? 'border-red-500/60 bg-red-950/20 shadow-lg shadow-red-950/30'
                                        : 'border-white/10 hover:bg-white/5'
                                    }`}
                            >
                                {/* Ligne 1 : statut + date */}
                                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-[#FFB800]" />
                                        {match.date} — {match.time}
                                    </span>

                                    {isLive ? (
                                        <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] uppercase animate-pulse flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                            Live
                                        </span>
                                    ) : isFinished ? (
                                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold text-[10px] uppercase">
                                            Terminé
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold text-[10px] uppercase">
                                            À venir
                                        </span>
                                    )}
                                </div>

                                {/* Ligne 2 : équipes + score */}
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="w-9 h-9 rounded-lg bg-linear-to-br from-[#FF2A3B] to-[#FFB800] p-0.5 shrink-0">
                                            <div className="w-full h-full bg-[#090A0F] rounded-[7px] flex items-center justify-center font-black text-white text-[10px]">
                                                {match.clubName?.slice(0, 2).toUpperCase() || 'FS'}
                                            </div>
                                        </div>
                                        <span className="font-bold text-white text-sm truncate">
                                            {match.clubName || 'FIRE STONE'}
                                        </span>
                                    </div>

                                    <div className="text-center px-2 shrink-0">
                                        {isUpcoming ? (
                                            <span className="text-xs font-black text-amber-400">VS</span>
                                        ) : (
                                            <span
                                                className={`text-lg font-black ${isLive ? 'text-red-400' : 'text-white'
                                                    }`}
                                            >
                                                {match.scoreTeam ?? 0} - {match.scoreOpponent ?? 0}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                        <span className="font-bold text-white text-sm truncate">
                                            {match.opponent}
                                        </span>
                                        {renderLogo(match.opponentLogo, 'w-9 h-9')}
                                    </div>
                                </div>

                                {/* Ligne 3 : lieu + actions */}
                                <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5 text-xs text-slate-400">
                                    <span className="flex items-center gap-1 truncate">
                                        <MapPin className="w-3.5 h-3.5" /> {match.venue || '—'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {isLive && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setLiveViewerMatch(match);
                                                }}
                                                className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-md shadow-red-600/30 transition-colors"
                                            >
                                                <PlayCircle className="w-3.5 h-3.5" />
                                                Live Match
                                            </button>
                                        )}
                                        <span className="text-[#FFB800] font-semibold flex items-center gap-0.5">
                                            Détails <ChevronRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── MODALE DÉTAILS (lecture seule) ─────────────────────────── */}
            {selectedMatch && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="glass-panel rounded-3xl border border-white/15 max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-[#0D0E15] p-6 space-y-5">
                        <div className="flex items-start justify-between pb-4 border-b border-white/10">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF2A3B]/20 text-[#FF2A3B] text-[10px] font-bold uppercase border border-[#FF2A3B]/30 mb-2">
                                    {selectedMatch.status === 'LIVE' ? (
                                        <>
                                            <Radio className="w-3 h-3 animate-pulse" /> En Direct
                                        </>
                                    ) : selectedMatch.status === 'FINISHED' ? (
                                        <>
                                            <Trophy className="w-3 h-3" /> Terminé
                                        </>
                                    ) : (
                                        <>
                                            <Calendar className="w-3 h-3" /> À Venir
                                        </>
                                    )}
                                </div>
                                <h3 className="text-lg font-black text-white">
                                    {selectedMatch.opponent}
                                </h3>
                                <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                                    <MapPin className="w-3 h-3" /> {selectedMatch.venue} •{' '}
                                    {selectedMatch.date} {selectedMatch.time}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedMatch(null)}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Score */}
                        {selectedMatch.status !== 'UPCOMING' && (
                            <div className="grid grid-cols-3 items-center text-center p-4 rounded-2xl bg-black/40 border border-white/10">
                                <div className="font-bold text-white text-sm">
                                    {selectedMatch.clubName || 'FIRE STONE'}
                                </div>
                                <div className="text-3xl font-black text-gradient-fire">
                                    {selectedMatch.scoreTeam} : {selectedMatch.scoreOpponent}
                                </div>
                                <div className="font-bold text-white text-sm">
                                    {selectedMatch.opponent}
                                </div>
                            </div>
                        )}

                        {/* MVP */}
                        {selectedMatch.mvpPlayerName && (
                            <div className="p-3 rounded-2xl bg-linear-to-br from-amber-500/20 to-[#FFB800]/10 border border-[#FFB800]/30 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#FFB800] text-black font-black flex items-center justify-center shrink-0">
                                    ⭐
                                </div>
                                <div>
                                    <div className="text-[11px] text-[#FFB800] font-extrabold uppercase flex items-center gap-1">
                                        <Award className="w-3.5 h-3.5" /> MVP du Match
                                    </div>
                                    <div className="font-bold text-white text-sm">
                                        {selectedMatch.mvpPlayerName}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Résumé */}
                        {selectedMatch.summary && (
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                <div className="text-xs font-bold text-[#FFB800] uppercase tracking-wider flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5" /> Résumé
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {selectedMatch.summary}
                                </p>
                            </div>
                        )}

                        {/* Bouton direct vers le live si le match est en cours */}
                        {selectedMatch.status === 'LIVE' && (
                            <button
                                onClick={() => {
                                    const m = selectedMatch;
                                    setSelectedMatch(null);
                                    setLiveViewerMatch(m);
                                }}
                                className="w-full py-3 rounded-2xl bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                            >
                                <Radio className="w-4 h-4 animate-pulse" />
                                <span>Rejoindre le Visionnage en Direct & Chat</span>
                            </button>
                        )}

                        {/* Vidéo */}
                        {selectedMatch.videoUrl && (
                            <a
                                href={selectedMatch.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-[#FF2A3B] text-white flex items-center justify-center">
                                    <Video className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-white">
                                        Résumé vidéo disponible
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        Cliquer pour regarder
                                    </div>
                                </div>
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* ─── MODALE VISIONNEUSE EN DIRECT (STREAMING & CHAT) ─── */}
            {liveViewerMatch && (
                <LiveMatchViewerModal
                    match={liveViewerMatch}
                    isOpen={Boolean(liveViewerMatch)}
                    onClose={() => setLiveViewerMatch(null)}
                />
            )}
        </div>
    );
};