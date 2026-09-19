import { useEffect, useState } from 'react';
import type { Player, UserRole } from '../../types';
import { Award, Star } from 'lucide-react';
import { apiUrl } from '../../services/api';

interface Badge { id: string; code: string; name: string; description: string; icon: string; color: string; _count?: { holders: number } }

export function BadgesPage({ currentRole }: { currentRole: UserRole }) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState('');
  const [badgeId, setBadgeId] = useState('');
  const [message, setMessage] = useState('');
  const canAward = ['SUPER_ADMIN', 'ADMIN', 'COACH'].includes(currentRole);
  useEffect(() => { Promise.all([fetch(apiUrl('/badges')), fetch(apiUrl('/players'))]).then(async ([badgesResponse, playersResponse]) => { if (badgesResponse.ok) { const next = await badgesResponse.json(); setBadges(next); setBadgeId(next[0]?.id || ''); } if (playersResponse.ok) setPlayers(await playersResponse.json()); }).catch(() => setMessage('Impossible de charger les badges.')); }, []);
  const award = async (event: React.FormEvent) => { event.preventDefault(); const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}'); const response = await fetch(apiUrl(`/players/${playerId}/badges`), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ badgeId }) }); const data = await response.json(); setMessage(response.ok ? 'Badge attribué au joueur.' : data?.error || 'Attribution impossible.'); };
  return <div className="space-y-8 pb-12"><header><h2 className="mt-2 text-3xl font-black text-white">Badges & distinctions</h2><p className="mt-1 text-sm text-slate-400">Les accomplissements qui construisent l’identité sportive des joueurs.</p></header>{canAward && <form onSubmit={award} className="glass-panel flex flex-col md:flex-row gap-3 rounded-3xl border border-white/10 p-5"><select required value={playerId} onChange={(e) => setPlayerId(e.target.value)} className="glass-input flex-1 rounded-xl p-3 text-xs"><option value="">Choisir un joueur</option>{players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select><select required value={badgeId} onChange={(e) => setBadgeId(e.target.value)} className="glass-input flex-1 rounded-xl p-3 text-xs">{badges.map((badge) => <option key={badge.id} value={badge.id}>{badge.icon} {badge.name}</option>)}</select><button type="submit" className="rounded-xl bg-[#D97706] px-4 py-2 text-xs font-black text-black">Attribuer</button></form>}{message && <p className="text-xs text-amber-300">{message}</p>}<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{badges.map((badge) => <article key={badge.id} className="glass-panel rounded-3xl border border-white/10 p-5 text-center space-y-3"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-4xl" style={{ borderColor: badge.color, borderWidth: 1 }}>{badge.icon}</div><h3 className="font-black text-white">{badge.name}</h3><p className="text-xs leading-relaxed text-slate-400">{badge.description}</p><div className="text-xs text-[#FFB800]"><Star className="mr-1 inline h-3.5 w-3.5 fill-current" />{badge._count?.holders || 0} détenteur(s)</div></article>)}</div></div>;
}
