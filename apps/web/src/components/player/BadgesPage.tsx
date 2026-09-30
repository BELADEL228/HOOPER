import React, { useEffect, useState, useMemo } from 'react';
import type { Player, UserRole } from '../../types';
import {
  Award,
  Star,
  Search,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  Flame,
  ChevronRight,
  Medal,
} from 'lucide-react';
import { apiUrl } from '../../services/api';

interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category?: string;
  _count?: { holders: number };
}

interface PlayerBadgeDetail {
  id: string;
  awardedAt: string;
  note?: string | null;
  player: {
    id: string;
    name: string;
    photo?: string | null;
    position?: string;
    number?: number;
    team?: { name: string; city: string };
  };
}

export function BadgesPage({ currentRole }: { currentRole: UserRole }) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal d'attribution
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  const [awardNote, setAwardNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal d'inspection des détenteurs
  const [activeBadgeDetail, setActiveBadgeDetail] = useState<Badge | null>(null);
  const [badgeHolders, setBadgeHolders] = useState<PlayerBadgeDetail[]>([]);
  const [loadingHolders, setLoadingHolders] = useState(false);

  const canAward = ['SUPER_ADMIN', 'CLUB_ADMIN', 'COACH'].includes(currentRole);

  const loadData = async () => {
    setLoading(true);
    try {
      const [badgesRes, playersRes] = await Promise.all([
        fetch(apiUrl('/badges')),
        fetch(apiUrl('/players')),
      ]);

      if (badgesRes.ok) {
        const rawBadges = (await badgesRes.json()) as Badge[];
        // Enrichir badges avec catégories баскет
        const enriched = rawBadges.map((b) => {
          let category = 'Général';
          const lower = (b.name + ' ' + b.description).toLowerCase();
          if (lower.includes('shoot') || lower.includes('tir') || lower.includes('adresse') || lower.includes('3pt')) {
            category = 'Adresse & Tir';
          } else if (lower.includes('défens') || lower.includes('interception') || lower.includes('block') || lower.includes('verrou')) {
            category = 'Défense';
          } else if (lower.includes('meneur') || lower.includes('capitaine') || lower.includes('leader') || lower.includes('vision') || lower.includes('passe')) {
            category = 'Playmaking & Leadership';
          } else if (lower.includes('rebond') || lower.includes('physique') || lower.includes('athlét') || lower.includes('dunk')) {
            category = 'Impact & Athlétisme';
          } else if (lower.includes('fair') || lower.includes('fidélité') || lower.includes('mvp') || lower.includes('champion')) {
            category = 'Prestige & Distinctions';
          }
          return { ...b, category };
        });
        setBadges(enriched);
        if (enriched.length > 0 && !selectedBadgeId) {
          setSelectedBadgeId(enriched[0].id);
        }
      }

      if (playersRes.ok) {
        const data = await playersRes.json();
        setPlayers(Array.isArray(data) ? data : Array.isArray(data?.players) ? data.players : []);
      }
    } catch {
      setMessage({ type: 'error', text: 'Impossible de charger la collection de badges.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleOpenHolders = async (badge: Badge) => {
    setActiveBadgeDetail(badge);
    setLoadingHolders(true);
    setBadgeHolders([]);
    try {
      // Trouver les joueurs qui ont ce badge
      const holdersList: PlayerBadgeDetail[] = [];
      for (const p of players) {
        if ((p as any).badges && Array.isArray((p as any).badges)) {
          const matching = (p as any).badges.find((b: any) => b.badgeId === badge.id || b.badge?.id === badge.id);
          if (matching) {
            holdersList.push({
              id: matching.id || `${p.id}-${badge.id}`,
              awardedAt: matching.awardedAt || new Date().toISOString(),
              note: matching.note || 'Attribué pour performances remarquables',
              player: {
                id: p.id,
                name: p.name,
                photo: p.photo,
                position: p.position,
                number: p.number,
                team: (p as any).team ? { name: (p as any).team.name, city: (p as any).team.city } : undefined,
              },
            });
          }
        }
      }
      setBadgeHolders(holdersList);
    } catch {
      console.warn('Erreur détenteurs');
    } finally {
      setLoadingHolders(false);
    }
  };

  const handleAwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId || !selectedBadgeId) return;

    setIsSubmitting(true);
    setMessage(null);

    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) {
      setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter.' });
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
        setMessage({ type: 'error', text: data?.error || "Échec de l'attribution du badge." });
      } else {
        const awardedBadge = badges.find((b) => b.id === selectedBadgeId);
        const targetPlayer = players.find((p) => p.id === selectedPlayerId);
        setMessage({
          type: 'success',
          text: `Badge « ${awardedBadge?.name || ''} » décerné avec succès à ${targetPlayer?.name || 'au joueur'} !`,
        });
        setIsAwardModalOpen(false);
        setAwardNote('');
        await loadData();
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau lors de la distribution du badge.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrage
  const categories = useMemo(() => {
    const set = new Set(badges.map((b) => b.category || 'Général'));
    return ['ALL', ...Array.from(set)];
  }, [badges]);

  const filteredBadges = useMemo(() => {
    return badges.filter((badge) => {
      const matchesCategory = selectedCategory === 'ALL' || badge.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        badge.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [badges, selectedCategory, searchQuery]);

  const totalHolders = useMemo(() => {
    return badges.reduce((sum, b) => sum + (b._count?.holders || 0), 0);
  }, [badges]);

  return (
    <div className="space-y-8 pb-12">
      {/* ── En-tête Principal ── */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFB800]/30 bg-[#FFB800]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FFB800]">
            <Medal className="w-3.5 h-3.5" /> Système de Distinctions Sportives
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight">
            Badges & Trophées Individuels
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            Reconnaissances officielles attribuées aux athlètes pour valoriser l'adresse, la discipline défensive, le leadership et l'esprit de franchise.
          </p>
        </div>

        {canAward && (
          <button
            type="button"
            onClick={() => setIsAwardModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] px-5 py-3 text-xs font-black text-white hover:brightness-110 transition-all shadow-lg shadow-[#FF2A3B]/20 shrink-0"
          >
            <Plus className="w-4 h-4" /> Décerné une distinction
          </button>
        )}
      </header>

      {/* ── Bannière de Statistique ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{badges.length}</div>
            <div className="text-[11px] text-slate-400">Distinctions créées</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{totalHolders}</div>
            <div className="text-[11px] text-slate-400">Badges décernés</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 flex items-center justify-center text-[#38BDF8]">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{players.length}</div>
            <div className="text-[11px] text-slate-400">Joueurs éligibles</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">Ligue Élite</div>
            <div className="text-[11px] text-slate-400">Fédération Togo</div>
          </div>
        </div>
      </div>

      {/* ── Messages Alert ── */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border text-xs font-semibold ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Filtres & Barre de recherche ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Catégories */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
              }`}
            >
              {cat === 'ALL' ? 'Toutes les catégories' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un badge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-9 pr-3 py-2 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* ── Grille des Badges ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="glass-panel p-6 rounded-3xl border border-white/10 animate-pulse space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/10 mx-auto" />
              <div className="h-4 bg-white/10 rounded w-2/3 mx-auto" />
              <div className="h-3 bg-white/10 rounded w-4/5 mx-auto" />
            </div>
          ))}
        </div>
      ) : filteredBadges.length === 0 ? (
        <div className="glass-panel rounded-3xl border border-white/10 p-12 text-center space-y-3">
          <Award className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Aucun badge trouvé</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Aucune distinction ne correspond à votre recherche ou filtre actuel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredBadges.map((badge) => {
            const badgeColor = badge.color || '#FFB800';
            const holdersCount = badge._count?.holders || 0;

            return (
              <article
                key={badge.id}
                onClick={() => handleOpenHolders(badge)}
                className="group relative glass-panel rounded-3xl border border-white/10 p-6 flex flex-col justify-between hover:border-white/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
              >
                {/* Glow décoratif en arrière-plan */}
                <div
                  className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40"
                  style={{ backgroundColor: badgeColor }}
                />

                <div className="space-y-4 text-center">
                  {/* Badge Icon Showcase */}
                  <div className="relative mx-auto w-20 h-20">
                    <div
                      className="absolute inset-0 rounded-2xl blur-md opacity-40 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: badgeColor }}
                    />
                    <div
                      className="relative w-full h-full rounded-2xl bg-slate-900/90 border flex items-center justify-center text-4xl shadow-inner transition-transform group-hover:scale-105"
                      style={{ borderColor: `${badgeColor}80` }}
                    >
                      <span>{badge.icon}</span>
                    </div>
                  </div>

                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {badge.category || 'Compétition'}
                    </span>
                    <h3 className="text-lg font-black text-white group-hover:text-[#FFB800] transition-colors">
                      {badge.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {badge.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Star className="w-3.5 h-3.5 text-[#FFB800] fill-[#FFB800]" />
                    {holdersCount} {holdersCount > 1 ? 'détenteurs' : 'détenteur'}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-white transition-colors">
                    Voir <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── Modal : Attribution d'un Badge ── */}
      {isAwardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-white/15 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#FFB800]/10 text-[#FFB800]">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Décerné un Badge</h3>
                  <p className="text-xs text-slate-400">Sélectionnez le joueur et la distinction à attribuer.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAwardModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAwardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Joueur bénéficiaire
                </label>
                <select
                  required
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="glass-input w-full rounded-xl p-3 text-xs bg-slate-900 text-white"
                >
                  <option value="">Sélectionner un athlète...</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.position ? `(${p.position})` : ''} {p.number ? `— #${p.number}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Distinction à décerner
                </label>
                <select
                  required
                  value={selectedBadgeId}
                  onChange={(e) => setSelectedBadgeId(e.target.value)}
                  className="glass-input w-full rounded-xl p-3 text-xs bg-slate-900 text-white"
                >
                  {badges.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.icon} {b.name} ({b.category || 'Général'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Aperçu rapide du badge sélectionné */}
              {selectedBadgeId && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="text-2xl">
                    {badges.find((b) => b.id === selectedBadgeId)?.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {badges.find((b) => b.id === selectedBadgeId)?.name}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {badges.find((b) => b.id === selectedBadgeId)?.description}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Motif / Citation d'honneur (Optionnel)
                </label>
                <textarea
                  value={awardNote}
                  onChange={(e) => setAwardNote(e.target.value)}
                  placeholder="Ex : Performance décisive au money-time du tournoi national..."
                  className="glass-input w-full rounded-xl p-3 text-xs min-h-20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAwardModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedPlayerId || !selectedBadgeId}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white text-xs font-black hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Attribution en cours...' : 'Confirmer la distinction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal : Détenteurs du Badge ── */}
      {activeBadgeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-white/15 p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl bg-slate-900 border flex items-center justify-center text-3xl shadow-lg"
                  style={{ borderColor: activeBadgeDetail.color || '#FFB800' }}
                >
                  {activeBadgeDetail.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{activeBadgeDetail.name}</h3>
                  <p className="text-xs text-slate-400">{activeBadgeDetail.description}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveBadgeDetail(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFB800] mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Athlètes récompensés (
                {badgeHolders.length})
              </h4>

              {loadingHolders ? (
                <div className="py-8 text-center text-xs text-slate-400">Chargement des détenteurs...</div>
              ) : badgeHolders.length === 0 ? (
                <div className="py-8 text-center bg-white/5 rounded-2xl p-6 space-y-2">
                  <Star className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    Aucun joueur n'a encore reçu cette distinction.
                  </p>
                  {canAward && (
                    <button
                      onClick={() => {
                        setSelectedBadgeId(activeBadgeDetail.id);
                        setActiveBadgeDetail(null);
                        setIsAwardModalOpen(true);
                      }}
                      className="text-xs text-[#FF2A3B] font-bold hover:underline"
                    >
                      Être le premier à l'attribuer →
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {badgeHolders.map((holder) => (
                    <div
                      key={holder.id}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            holder.player.photo ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              holder.player.name
                            )}&background=B91C1C&color=fff`
                          }
                          alt={holder.player.name}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-800"
                        />
                        <div>
                          <div className="text-xs font-black text-white">
                            {holder.player.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {holder.player.position || 'Joueur'} •{' '}
                            {holder.player.team?.name || 'Club affilié'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-400 font-bold block">
                          Attribué
                        </span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(holder.awardedAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveBadgeDetail(null)}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
