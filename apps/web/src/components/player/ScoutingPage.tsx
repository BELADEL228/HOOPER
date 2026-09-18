import { useEffect, useState } from 'react';
import type { Player, UserRole } from '../../types';
import { BarChart3, Search, Star } from 'lucide-react';
import { apiUrl } from '../../services/api';

export function ScoutingPage({ currentRole }: { currentRole: UserRole }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const canScout = ['SUPER_ADMIN', 'ADMIN', 'COACH'].includes(currentRole);

  // ── Chargement des données ──────────────────────────────────────────
  const load = async () => {
    // ✅ Normalisation de la réponse joueurs
    const playersResponse = await fetch(apiUrl('/players'));
    if (playersResponse.ok) {
      const data = await playersResponse.json();
      setPlayers(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.players)
            ? data.players
            : []
      );
    }

    // ✅ Normalisation de la shortlist
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (session?.token) {
      const shortlistResponse = await fetch(apiUrl('/scouting/shortlist'), {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (shortlistResponse.ok) {
        const data = await shortlistResponse.json();
        const entries: Array<{ playerProfileId?: string }> = Array.isArray(data)
          ? data
          : [];
        setShortlist(
          entries
            .map((entry) => entry?.playerProfileId)
            .filter((id): id is string => typeof id === 'string')
        );
      }
    }
  };

  useEffect(() => {
    load().catch(() =>
      setMessage('Impossible de charger les données de scouting.')
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Toggle shortlist ────────────────────────────────────────────────
  const toggleShortlist = async (playerId: string) => {
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) {
      setMessage('Connectez-vous avec un rôle coach ou administrateur.');
      return;
    }

    const selected = shortlist.includes(playerId);
    const response = await fetch(
      apiUrl(selected ? `/scouting/shortlist/${playerId}` : '/scouting/shortlist'),
      {
        method: selected ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: selected ? undefined : JSON.stringify({ playerProfileId: playerId }),
      }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data?.error || 'Action impossible.');
      return;
    }

    setShortlist(
      selected
        ? shortlist.filter((id) => id !== playerId)
        : [...shortlist, playerId]
    );
  };

  // ── Filtre SAFE ─────────────────────────────────────────────────────
  const q = query.toLowerCase().trim();
  const filteredPlayers = players.filter((player) => {
    if (!q) return true;
    return (
      (player.name?.toLowerCase().includes(q) ?? false) ||
      (player.position?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
          <BarChart3 className="w-3.5 h-3.5" /> Analyse performance
        </div>
        <h2 className="mt-2 text-3xl font-black text-white">
          Scouting & comparaison
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Comparez les profils et construisez votre shortlist de talents.
        </p>
      </header>

      {/* Barre de recherche */}
      <div className="glass-panel relative rounded-3xl border border-white/10 p-4">
        <Search className="absolute left-7 top-7 w-4 h-4 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un joueur ou un poste"
          className="glass-input w-full rounded-xl py-3 pl-10 pr-3 text-xs"
        />
      </div>

      {/* Messages */}
      {message && <p className="text-xs text-amber-300">{message}</p>}
      {!canScout && (
        <p className="text-xs text-slate-400">
          La shortlist est réservée aux coachs et administrateurs. Les statistiques
          publiques restent consultables.
        </p>
      )}

      {/* Grille joueurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredPlayers.map((player) => (
          <article
            key={player.id}
            className="glass-panel rounded-3xl border border-white/10 p-5 space-y-4"
          >
            {/* En-tête joueur */}
            <div className="flex items-center gap-3">
              <img
                src={
                  player.photo ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    player.name || 'Joueur'
                  )}&background=B91C1C&color=fff`
                }
                alt={player.name || 'Joueur'}
                className="h-14 w-14 rounded-2xl object-cover bg-slate-800"
              />
              <div>
                <h3 className="font-black text-white">
                  {player.name || 'Joueur inconnu'}
                </h3>
                <p className="text-xs text-[#FFB800]">
                  {player.position || '—'} • {player.age ?? '—'} ans •{' '}
                  {player.height || '—'}
                </p>
              </div>

              {canScout && (
                <button
                  type="button"
                  title={
                    shortlist.includes(player.id)
                      ? 'Retirer de la shortlist'
                      : 'Ajouter à la shortlist'
                  }
                  onClick={() => toggleShortlist(player.id)}
                  className="ml-auto rounded-xl bg-white/5 p-2 text-[#FFB800] hover:bg-white/10 transition-colors"
                >
                  <Star
                    className={`w-5 h-5 ${shortlist.includes(player.id) ? 'fill-current' : ''
                      }`}
                  />
                </button>
              )}
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-xl bg-white/5 p-2">
                <strong className="block text-white">
                  {player.seasonStats?.ppg ?? '—'}
                </strong>
                <span className="text-slate-500">PTS</span>
              </div>
              <div className="rounded-xl bg-white/5 p-2">
                <strong className="block text-white">
                  {player.seasonStats?.rpg ?? '—'}
                </strong>
                <span className="text-slate-500">REB</span>
              </div>
              <div className="rounded-xl bg-white/5 p-2">
                <strong className="block text-white">
                  {player.seasonStats?.apg ?? '—'}
                </strong>
                <span className="text-slate-500">AST</span>
              </div>
              <div className="rounded-xl bg-white/5 p-2">
                <strong className="block text-white">
                  {player.seasonStats?.efficiency ?? '—'}
                </strong>
                <span className="text-slate-500">EFF</span>
              </div>
            </div>

            {/* Badge shortlist */}
            {shortlist.includes(player.id) && (
              <div className="flex items-center gap-2 text-xs text-emerald-300">
                <Star className="w-3.5 h-3.5 fill-current" /> Dans votre shortlist
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Aucun résultat */}
      {filteredPlayers.length === 0 && (
        <div className="glass-panel rounded-3xl border border-white/10 p-8 text-center text-sm text-slate-400">
          Aucun joueur trouvé.
        </div>
      )}
    </div>
  );
}