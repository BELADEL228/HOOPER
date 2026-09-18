import { useEffect, useState } from 'react';
import type { Match, UserRole } from '../../types';
import { Activity, Plus } from 'lucide-react';
import { apiUrl } from '../../services/api';

interface MatchEvent { id: string; quarter: number; clock: string; kind: string; playerName?: string | null; points: number; createdAt: string }

export function LiveScorePanel({ match, currentRole }: { match: Match | null; currentRole: UserRole }) {
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [quarter, setQuarter] = useState(1);
  const [clock, setClock] = useState('10:00');
  const [playerName, setPlayerName] = useState('');
  const [message, setMessage] = useState('');
  const canScore = ['SUPER_ADMIN', 'ADMIN', 'COACH'].includes(currentRole);

  useEffect(() => {
    if (!match?.id) return;
    fetch(apiUrl(`/matches/${match.id}/events`)).then(async (response) => { if (response.ok) setEvents(await response.json()); }).catch(() => setMessage('Play-by-play indisponible.'));
  }, [match?.id]);

  const addEvent = async (points: number, kind: string) => {
    if (!match) return;
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    const response = await fetch(apiUrl(`/matches/${match.id}/events`), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ quarter, clock, kind, playerName, points }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data?.error || 'Événement impossible.'); return; }
    setEvents((current) => [data.event, ...current]);
    setMessage(`${kind} enregistré.`);
  };

  if (!match) return null;
  return <section className="glass-panel rounded-3xl border border-emerald-500/20 p-5 space-y-4"><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300">Live scoring</p><h3 className="text-lg font-black text-white">{match.opponent} • {match.scoreTeam ?? 0} - {match.scoreOpponent ?? 0}</h3></div><Activity className="w-5 h-5 text-emerald-400" /></div>{canScore && <div className="grid grid-cols-2 md:grid-cols-5 gap-2"><select value={quarter} onChange={(e) => setQuarter(Number(e.target.value))} className="glass-input rounded-xl p-2 text-xs"><option value={1}>Q1</option><option value={2}>Q2</option><option value={3}>Q3</option><option value={4}>Q4</option><option value={5}>OT</option></select><input value={clock} onChange={(e) => setClock(e.target.value)} placeholder="08:42" className="glass-input rounded-xl p-2 text-xs" /><input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Joueur" className="glass-input rounded-xl p-2 text-xs md:col-span-2" /><button type="button" onClick={() => addEvent(1, 'Lancer franc')} className="rounded-xl bg-[#B91C1C] p-2 text-xs font-bold text-white"><Plus className="mr-1 inline w-3.5 h-3.5" />1 pt</button><button type="button" onClick={() => addEvent(2, 'Panier 2 points')} className="rounded-xl bg-[#D97706] p-2 text-xs font-bold text-black"><Plus className="mr-1 inline w-3.5 h-3.5" />2 pts</button><button type="button" onClick={() => addEvent(3, 'Panier 3 points')} className="rounded-xl bg-emerald-500 p-2 text-xs font-bold text-black"><Plus className="mr-1 inline w-3.5 h-3.5" />3 pts</button></div>}{message && <p className="text-xs text-amber-300">{message}</p>}<div className="max-h-52 overflow-y-auto space-y-2">{events.length === 0 ? <p className="text-xs text-slate-500">Aucun événement enregistré.</p> : events.map((event) => <div key={event.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs"><span className="text-[#FFB800]">Q{event.quarter} • {event.clock}</span><span className="text-slate-200">{event.kind}{event.playerName ? ` • ${event.playerName}` : ''}</span><strong className="text-emerald-300">{event.points ? `+${event.points}` : '-'}</strong></div>)}</div></section>;
}
