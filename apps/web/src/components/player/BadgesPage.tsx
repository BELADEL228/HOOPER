import React, { useEffect, useState, useMemo } from 'react';
import type { UserRole } from '../../types';
import {
  Award,
  Search,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  Flame,
  Shield,
  Target,
  Zap,
  Crown,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { apiUrl } from '../../services/api';

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category?: string;
  _count?: { holders: number };
}

export interface PlayerBadgeDetail {
  id: string;
  awardedAt: string;
  note?: string | null;
  player: {
    id: string;
    name: string;
    photo?: string | null;
    position?: string;
    number?: number;
    team?: { name: string; city?: string };
  };
}

interface RawPlayerProfile {
  id: string;
  jerseyNumber?: number;
  position?: string;
  photoUrl?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  badges?: Array<{
    id: string;
    badgeId?: string;
    awardedAt?: string;
    note?: string | null;
    badge?: Badge;
  }>;
}

// ─── Helpers visuels : Insignes tactiques de basketball ──────────────────────
function getBadgeIcon(category?: string) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('tir') || cat.includes('adresse') || cat.includes('3pt')) {
    return <Target className="w-5 h-5 text-amber-400" />;
  }
  if (cat.includes('défens') || cat.includes('verrou') || cat.includes('block')) {
    return <Shield className="w-5 h-5 text-sky-400" />;
  }
  if (cat.includes('playmaking') || cat.includes('vision') || cat.includes('leadership')) {
    return <Zap className="w-5 h-5 text-emerald-400" />;
  }
  if (cat.includes('impact') || cat.includes('dunk') || cat.includes('athlét')) {
    return <Flame className="w-5 h-5 text-rose-500" />;
  }
  if (cat.includes('prestige') || cat.includes('mvp') || cat.includes('champion')) {
    return <Crown className="w-5 h-5 text-[#FFB800]" />;
  }
  return <Award className="w-5 h-5 text-amber-300" />;
}

function getCategoryTone(category?: string) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('tir') || cat.includes('adresse')) {
    return {
      border: 'border-amber-500/30',
      badgeBg: 'bg-amber-500/10 text-amber-300',
      accent: '#F59E0B',
      glow: 'rgba(245, 158, 11, 0.15)',
    };
  }
  if (cat.includes('défens') || cat.includes('verrou')) {
    return {
      border: 'border-sky-500/30',
      badgeBg: 'bg-sky-500/10 text-sky-300',
      accent: '#0EA5E9',
      glow: 'rgba(14, 165, 233, 0.15)',
    };
  }
  if (cat.includes('playmaking') || cat.includes('leadership')) {
    return {
      border: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-500/10 text-emerald-300',
      accent: '#10B981',
      glow: 'rgba(16, 185, 129, 0.15)',
    };
  }
  if (cat.includes('impact') || cat.includes('athlét')) {
    return {
      border: 'border-rose-500/30',
      badgeBg: 'bg-rose-500/10 text-rose-300',
      accent: '#FF2A3B',
      glow: 'rgba(255, 42, 59, 0.15)',
    };
  }
  return {
    border: 'border-[#FFB800]/30',
    badgeBg: 'bg-[#FFB800]/10 text-amber-200',
    accent: '#FFB800',
    glow: 'rgba(255, 184, 0, 0.15)',
  };
}

export function BadgesPage({ currentRole }: { currentRole: UserRole }) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [rawPlayers, setRawPlayers] = useState<RawPlayerProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Écusson inspecté dans le volet d'honneur latéral
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Modale d'attribution
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  const [awardNote, setAwardNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAward = ['SUPER_ADMIN', 'CLUB_ADMIN', 'COACH'].includes(currentRole);

  const loadData = async () => {
    setLoading(true);
    try {
      const [badgesRes, playersRes] = await Promise.all([
        fetch(apiUrl('/badges')),
        fetch(apiUrl('/players')),
      ]);

      let enrichedBadges: Badge[] = [];

      if (badgesRes.ok) {
        const rawBadges = (await badgesRes.json()) as Badge[];
        enrichedBadges = rawBadges.map((b) => {
          let category = 'Général';
          const lower = (b.name + ' ' + b.description).toLowerCase();
          if (lower.includes('shoot') || lower.includes('tir') || lower.includes('adresse') || lower.includes('3pt')) {
            category = 'Adresse & Périmètre';
          } else if (lower.includes('défens') || lower.includes('interception') || lower.includes('block') || lower.includes('verrou')) {
            category = 'Verrou Défensif';
          } else if (lower.includes('meneur') || lower.includes('capitaine') || lower.includes('leader') || lower.includes('vision') || lower.includes('passe')) {
            category = 'Playmaking & Tempo';
          } else if (lower.includes('rebond') || lower.includes('physique') || lower.includes('athlét') || lower.includes('dunk')) {
            category = 'Impact & Puissance';
          } else if (lower.includes('fair') || lower.includes('fidélité') || lower.includes('mvp') || lower.includes('champion')) {
            category = 'Prestige & Franchise';
          }
          return { ...b, category };
        });
        setBadges(enrichedBadges);
      }

      if (playersRes.ok) {
        const data = await playersRes.json();
        const list: RawPlayerProfile[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.players)
            ? data.players
            : [];
        setRawPlayers(list);
      }

      // Par défaut, sélectionner le 1er badge pour l'inspecteur d'honneur
      if (enrichedBadges.length > 0 && !selectedBadge) {
        setSelectedBadge(enrichedBadges[0]);
      }
    } catch {
      setMessage({ type: 'error', text: 'Impossible de synchroniser le registre des distinctions.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Extraction des détenteurs pour le badge actif
  const activeHolders: PlayerBadgeDetail[] = useMemo(() => {
    if (!selectedBadge) return [];
    const list: PlayerBadgeDetail[] = [];

    for (const p of rawPlayers) {
      if (p.badges && Array.isArray(p.badges)) {
        const matching = p.badges.find(
          (b) => b.badgeId === selectedBadge.id || b.badge?.id === selectedBadge.id
        );
        if (matching) {
          list.push({
            id: matching.id || `${p.id}-${selectedBadge.id}`,
            awardedAt: matching.awardedAt || new Date().toISOString(),
            note: matching.note || 'Distinction décernée pour engagement remarquable.',
            player: {
              id: p.id,
              name: p.user?.name || 'Athlète officiel',
              photo: p.photoUrl || p.user?.avatarUrl,
              position: p.position || 'Poste non renseigné',
              number: p.jerseyNumber,
            },
          });
        }
      }
    }
    return list;
  }, [selectedBadge, rawPlayers]);

  // Récipiendaires les plus récents across all badges (pour le flux d'honneur)
  const recentRecipients = useMemo(() => {
    const all: Array<{
      holder: PlayerBadgeDetail;
      badge: Badge;
    }> = [];

    for (const p of rawPlayers) {
      if (p.badges && Array.isArray(p.badges)) {
        for (const b of p.badges) {
          const badgeDef = badges.find((item) => item.id === b.badgeId || item.id === b.badge?.id);
          if (badgeDef) {
            all.push({
              badge: badgeDef,
              holder: {
                id: b.id || `${p.id}-${badgeDef.id}`,
                awardedAt: b.awardedAt || new Date().toISOString(),
                note: b.note,
                player: {
                  id: p.id,
                  name: p.user?.name || 'Athlète officiel',
                  photo: p.photoUrl || p.user?.avatarUrl,
                  position: p.position,
                  number: p.jerseyNumber,
                },
              },
            });
          }
        }
      }
    }
    return all.sort((a, b) => new Date(b.holder.awardedAt).getTime() - new Date(a.holder.awardedAt).getTime()).slice(0, 5);
  }, [rawPlayers, badges]);

  // Catégories uniques
  const categories = useMemo(() => {
    const set = new Set(badges.map((b) => b.category || 'Général'));
    return ['ALL', ...Array.from(set)];
  }, [badges]);

  // Badges filtrés
  const filteredBadges = useMemo(() => {
    return badges.filter((b) => {
      const matchCat = selectedCategory === 'ALL' || b.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        (b.category && b.category.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [badges, selectedCategory, searchQuery]);

  // Attribution d'un badge
  const handleAwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId || !selectedBadgeId) return;

    setIsSubmitting(true);
    setMessage(null);

    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) {
      setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter pour décerner une distinction.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(apiUrl(`/players/${selectedPlayerId}/badges`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          badgeId: selectedBadgeId,
          note: awardNote.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage({ type: 'error', text: data?.error || "Échec de l'attribution de l'écusson." });
      } else {
        const targetPlayer = rawPlayers.find((p) => p.id === selectedPlayerId);
        const awardedBadge = badges.find((b) => b.id === selectedBadgeId);
        setMessage({
          type: 'success',
          text: `Écusson « ${awardedBadge?.name || ''} » décerné avec succès à ${targetPlayer?.user?.name || 'l’athlète'}.`,
        });
        setIsAwardModalOpen(false);
        setAwardNote('');
        await loadData();
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau lors de la distribution.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAwardsCount = useMemo(() => {
    return rawPlayers.reduce((acc, p) => acc + (p.badges?.length || 0), 0);
  }, [rawPlayers]);

  return (
    <div className="space-y-8 pb-16">
      {/* ── 1. En-tête : Salle des Trophées & Tableau d'Honneur ── */}
      <section className="rounded-2xl border border-white/10 bg-[#0C0F1A] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFB800]/12 border border-[#FFB800]/25 text-[#FFB800] text-xs font-semibold">
              <Crown className="w-3.5 h-3.5 text-[#FFB800]" />
              Registre officiel du club
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-none tracking-tight">
              Distinctions & Écussons
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Insignes attribués aux joueurs pour récompenser la rigueur tactique, l’adresse au tir, l’autorité défensive et la fidélité au maillot.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Statistique discrète et intégrée */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <span className="text-slate-400">Total décerné :</span>{' '}
              <strong className="text-white font-mono text-sm">{totalAwardsCount}</strong>
            </div>

            {canAward && (
              <button
                type="button"
                onClick={() => {
                  if (selectedBadge) setSelectedBadgeId(selectedBadge.id);
                  setIsAwardModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF2A3B] hover:bg-[#E0202F] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Décerner un écusson
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Messages d'alerte contextuels ── */}
      {message && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-xs font-medium ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── 2. Filtres tactiques & Recherche ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Catégories façon marquage de parquet */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-white text-black font-extrabold shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                }`}
              >
                {cat === 'ALL' ? 'Tous les écussons' : cat}
              </button>
            );
          })}
        </div>

        {/* Barre de recherche */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, tir, défense..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFB800]/50"
          />
        </div>
      </div>

      {/* ── 3. Agencement Master-Detail : Grille des Écussons + Registre d'Honneur ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Colonne gauche (8 cols) : Galerie des Écussons */}
        <div className="lg:col-span-8 space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-white/10 bg-[#0A0B10] p-5 space-y-3 animate-pulse"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/10" />
                  <div className="h-4 bg-white/10 rounded w-2/3" />
                  <div className="h-3 bg-white/10 rounded w-5/6" />
                </div>
              ))}
            </div>
          ) : filteredBadges.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#08090D] p-12 text-center space-y-3">
              <Award className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Aucun écusson ne correspond aux filtres</h3>
              <p className="text-xs text-slate-400">
                Ajustez votre recherche ou sélectionnez une autre catégorie sportive.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredBadges.map((badge) => {
                const tone = getCategoryTone(badge.category);
                const isSelected = selectedBadge?.id === badge.id;
                const holdersCount = rawPlayers.filter((p) =>
                  p.badges?.some((b) => b.badgeId === badge.id || b.badge?.id === badge.id)
                ).length;

                return (
                  <article
                    key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    className={`group relative rounded-3xl border p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer overflow-hidden ${
                      isSelected
                        ? 'border-white/40 bg-[#0E1017] shadow-xl'
                        : 'border-white/10 bg-[#090A0E] hover:border-white/20 hover:bg-[#0D0E14]'
                    }`}
                  >
                    {/* Lueur subtile de catégorie */}
                    <div
                      className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-25 pointer-events-none"
                      style={{ backgroundColor: tone.accent }}
                    />

                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between">
                        {/* Emblème visuel court */}
                        <div
                          className="w-12 h-12 rounded-2xl border flex items-center justify-center text-xl shadow-inner transition-transform group-hover:scale-105"
                          style={{
                            borderColor: tone.accent,
                            backgroundColor: 'rgba(15, 17, 26, 0.95)',
                          }}
                        >
                          {badge.icon && badge.icon.length <= 2 ? (
                            <span>{badge.icon}</span>
                          ) : (
                            getBadgeIcon(badge.category)
                          )}
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tone.badgeBg} ${tone.border}`}
                        >
                          {badge.category}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-black text-white group-hover:text-white transition-colors">
                          {badge.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {badge.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {holdersCount} {holdersCount > 1 ? 'titulaires' : 'titulaire'}
                      </span>

                      <span
                        className={`text-[11px] font-bold flex items-center gap-0.5 transition-colors ${
                          isSelected ? 'text-[#FFB800]' : 'text-slate-400 group-hover:text-white'
                        }`}
                      >
                        Inspecter <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne droite (4 cols) : Volet d'Honneur & Récipiendaires */}
        <aside className="lg:col-span-4 sticky top-24 space-y-6">
          {selectedBadge ? (
            <div className="rounded-3xl border border-white/15 bg-[#090A0E] p-6 space-y-6 shadow-2xl">
              {/* Détail du badge sélectionné */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className="w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl shadow-lg"
                    style={{
                      borderColor: getCategoryTone(selectedBadge.category).accent,
                      backgroundColor: '#0F111A',
                    }}
                  >
                    {selectedBadge.icon && selectedBadge.icon.length <= 2 ? (
                      selectedBadge.icon
                    ) : (
                      getBadgeIcon(selectedBadge.category)
                    )}
                  </div>

                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                    {selectedBadge.category}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-black text-white">{selectedBadge.name}</h2>
                  <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                    {selectedBadge.description}
                  </p>
                </div>

                {canAward && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBadgeId(selectedBadge.id);
                      setIsAwardModalOpen(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#FFB800]" />
                    Décerner cet écusson à un joueur
                  </button>
                )}
              </div>

              {/* Liste des détenteurs */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#FFB800]" />
                    Récipiendaires ({activeHolders.length})
                  </h3>
                </div>

                {activeHolders.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center space-y-2">
                    <p className="text-xs font-medium text-slate-300">Aucun athlète n'a encore reçu cet écusson.</p>
                    <p className="text-[11px] text-slate-500">
                      Les récompenses attribuées par le staff apparaîtront directement ici.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {activeHolders.map((h) => (
                      <div
                        key={h.id}
                        className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3"
                      >
                        <img
                          src={
                            h.player.photo ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              h.player.name
                            )}&background=1E293B&color=fff`
                          }
                          alt={h.player.name}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-800 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-1">
                            <h4 className="text-xs font-bold text-white truncate">{h.player.name}</h4>
                            {h.player.number !== undefined && (
                              <span className="text-[10px] font-mono text-[#FFB800] font-bold">
                                #{h.player.number}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{h.player.position}</div>
                          {h.note && (
                            <p className="mt-1 text-[11px] text-slate-300 italic border-l-2 border-[#FFB800]/40 pl-2">
                              « {h.note} »
                            </p>
                          )}
                          <div className="mt-1 text-[9px] text-slate-500">
                            Distinction remise le {new Date(h.awardedAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-[#090A0E] p-8 text-center text-xs text-slate-400">
              Sélectionnez un écusson pour consulter ses récipiendaires.
            </div>
          )}

          {/* Flux d'honneur récent (tous écussons confondus) */}
          {recentRecipients.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-[#08090D] p-5 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Dernières distinctions remises
              </h4>
              <div className="space-y-2">
                {recentRecipients.map((item) => (
                  <div
                    key={item.holder.id}
                    className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs">
                        {item.badge.icon && item.badge.icon.length <= 2 ? item.badge.icon : '🏅'}
                      </span>
                      <span className="text-white font-medium truncate">{item.holder.player.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {item.badge.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── 4. Modale : Décerner une distinction ── */}
      {isAwardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0A0B10] p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-black text-white">Décerné un Écusson</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enregistrez une citation d'honneur officielle pour valoriser l'impact d'un athlète.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAwardModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAwardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Athlète bénéficiaire
                </label>
                <select
                  required
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full rounded-xl p-3 text-xs bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">Sélectionner un joueur de l'effectif...</option>
                  {rawPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.user?.name || 'Joueur'} {p.position ? `(${p.position})` : ''}{' '}
                      {p.jerseyNumber ? `— #${p.jerseyNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Écusson à attribuer
                </label>
                <select
                  required
                  value={selectedBadgeId}
                  onChange={(e) => setSelectedBadgeId(e.target.value)}
                  className="w-full rounded-xl p-3 text-xs bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">Sélectionner un écusson...</option>
                  {badges.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.category || 'Général'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Aperçu de l'écusson sélectionné */}
              {selectedBadgeId && (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="text-2xl">
                    {badges.find((b) => b.id === selectedBadgeId)?.icon || '🏅'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {badges.find((b) => b.id === selectedBadgeId)?.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {badges.find((b) => b.id === selectedBadgeId)?.description}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Citation / Motif d'attribution
                </label>
                <textarea
                  value={awardNote}
                  onChange={(e) => setAwardNote(e.target.value)}
                  placeholder="Ex : 4 tirs primés consécutifs en money-time du derby, sang-froid exemplaire."
                  className="w-full rounded-xl p-3 text-xs bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 min-h-24"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAwardModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedPlayerId || !selectedBadgeId}
                  className="flex-1 py-3 rounded-xl bg-[#FF2A3B] hover:bg-[#E02434] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Valider la distinction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
