import { useEffect, useState } from 'react';
import type { UserRole } from '../../types';
import { Check, Clock3, Send, X } from 'lucide-react';
import { apiUrl } from '../../services/api';

interface TeamOption {
  id: string;
  name: string;
}

interface MatchRequestItem {
  id: string;
  proposedDate: string;
  proposedTime: string;
  venue: string;
  category: string;
  message?: string | null;
  status: string;
  requesterTeam: TeamOption;
  targetTeam: TeamOption;
}

interface MatchRequestsPanelProps {
  currentRole: UserRole;
}

export function MatchRequestsPanel({ currentRole }: MatchRequestsPanelProps) {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [requests, setRequests] = useState<MatchRequestItem[]>([]);
  const [form, setForm] = useState({ requesterTeamId: '', targetTeamId: '', date: new Date().toISOString().split('T')[0], time: '20:30', venue: '', message: '' });
  const [message, setMessage] = useState('');
  const canManage = ['SUPER_ADMIN', 'ADMIN', 'COACH'].includes(currentRole);

  const loadData = async () => {
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) return;
    const headers = { Authorization: `Bearer ${session.token}` };
    const [teamsResponse, requestsResponse] = await Promise.all([fetch(apiUrl('/teams')), fetch(apiUrl('/match-requests'), { headers })]);
    if (teamsResponse.ok) {
      const nextTeams = await teamsResponse.json() as TeamOption[];
      setTeams(nextTeams);
      setForm((current) => ({ ...current, requesterTeamId: current.requesterTeamId || nextTeams[0]?.id || '' }));
    }
    if (requestsResponse.ok) setRequests(await requestsResponse.json());
  };

  useEffect(() => { loadData().catch(() => setMessage('Impossible de charger les demandes.')); }, []);

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) { setMessage('Connectez-vous pour proposer un match.'); return; }
    const response = await fetch(apiUrl('/match-requests'), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) { setMessage(data?.error || 'Demande impossible.'); return; }
    setMessage('Demande envoyée.');
    setForm((current) => ({ ...current, targetTeamId: '', venue: '', message: '' }));
    await loadData();
  };

  const updateRequest = async (id: string, status: string) => {
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    const response = await fetch(apiUrl(`/match-requests/${id}`), { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ status }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data?.error || 'Mise à jour impossible.'); return; }
    setMessage(status === 'ACCEPTED' ? 'Demande acceptée, match créé.' : 'Demande mise à jour.');
    await loadData();
  };

  if (!canManage) return null;

  return (
    <section className="glass-panel rounded-3xl border border-white/10 p-5 space-y-5">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#FFB800]">Organisation sportive</p>
        <h3 className="mt-1 text-xl font-black text-white">Demandes de matchs</h3>
        <p className="mt-1 text-xs text-slate-400">Proposez une rencontre et suivez les réponses des autres équipes.</p>
      </div>

      <form onSubmit={submitRequest} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
        <select value={form.requesterTeamId} onChange={(event) => setForm({ ...form, requesterTeamId: event.target.value })} className="glass-input rounded-xl px-3 py-2 text-xs xl:col-span-2" required>
          <option value="">Équipe demandeuse</option>
          {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select>
        <select value={form.targetTeamId} onChange={(event) => setForm({ ...form, targetTeamId: event.target.value })} className="glass-input rounded-xl px-3 py-2 text-xs xl:col-span-2" required>
          <option value="">Équipe adverse</option>
          {teams.filter((team) => team.id !== form.requesterTeamId).map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select>
        <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="glass-input rounded-xl px-3 py-2 text-xs" required />
        <input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className="glass-input rounded-xl px-3 py-2 text-xs" required />
        <input value={form.venue} onChange={(event) => setForm({ ...form, venue: event.target.value })} placeholder="Terrain proposé" className="glass-input rounded-xl px-3 py-2 text-xs md:col-span-2 xl:col-span-3" required />
        <input value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Message optionnel" className="glass-input rounded-xl px-3 py-2 text-xs md:col-span-2 xl:col-span-2" />
        <button type="submit" className="rounded-xl bg-[#B91C1C] px-3 py-2 text-xs font-bold text-white flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Envoyer</button>
      </form>

      {message && <p className="text-xs text-amber-300">{message}</p>}
      <div className="space-y-2">
        {requests.length === 0 && <p className="text-xs text-slate-500">Aucune demande de match pour le moment.</p>}
        {requests.map((request) => (
          <div key={request.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-slate-300"><strong className="text-white">{request.requesterTeam.name}</strong> contre <strong className="text-white">{request.targetTeam.name}</strong><span className="block mt-1 text-slate-400"><Clock3 className="inline w-3 h-3 mr-1" />{new Date(request.proposedDate).toLocaleDateString('fr-FR')} à {request.proposedTime} • {request.venue}</span></div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-300">{request.status}</span>
              {request.status === 'PENDING' && <><button type="button" onClick={() => updateRequest(request.id, 'ACCEPTED')} title="Accepter" className="rounded-lg bg-emerald-500/20 p-2 text-emerald-300"><Check className="w-4 h-4" /></button><button type="button" onClick={() => updateRequest(request.id, 'DECLINED')} title="Refuser" className="rounded-lg bg-red-500/20 p-2 text-red-300"><X className="w-4 h-4" /></button></>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
