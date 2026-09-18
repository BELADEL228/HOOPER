import { useEffect, useState } from 'react';
import type { UserRole } from '../../types';
import { CalendarDays, Plus, Trophy } from 'lucide-react';
import { apiUrl } from '../../services/api';

interface TournamentTeam { team: { id: string; name: string } }
interface Standing { team: { name: string }; played: number; wins: number; losses: number; pointsFor: number; pointsAgainst: number }
interface Tournament { id: string; name: string; slug: string; description?: string | null; startDate: string; endDate: string; location: string; format: string; maxTeams: number; status: string; teams: TournamentTeam[]; standings: Standing[] }

export function TournamentsPage({ currentRole }: { currentRole: UserRole }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', slug: '', startDate: '', endDate: '', location: '', description: '', maxTeams: 8 });
  const canManage = ['SUPER_ADMIN', 'ADMIN', 'COACH'].includes(currentRole);

  const loadTournaments = async () => {
    const response = await fetch(apiUrl('/tournaments'));
    if (response.ok) setTournaments(await response.json());
  };
  useEffect(() => { loadTournaments().catch(() => setMessage('Impossible de charger les tournois.')); }, []);

  const createTournament = async (event: React.FormEvent) => {
    event.preventDefault();
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    const response = await fetch(apiUrl('/tournaments'), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) { setMessage(data?.error || 'Création impossible.'); return; }
    setMessage('Tournoi créé.');
    setShowForm(false);
    setForm({ name: '', slug: '', startDate: '', endDate: '', location: '', description: '', maxTeams: 8 });
    await loadTournaments();
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFB800]/30 bg-[#FFB800]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FFB800]"><Trophy className="w-3.5 h-3.5" /> Compétitions nationales</div>
          <h2 className="mt-2 text-3xl font-black text-white">Tournois & classements</h2>
          <p className="mt-1 text-sm text-slate-400">Suivez les compétitions, les équipes inscrites et la course au titre.</p>
        </div>
        {canManage && <button type="button" onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-xl bg-[#B91C1C] px-4 py-2.5 text-xs font-bold text-white"><Plus className="w-4 h-4" /> Créer un tournoi</button>}
      </header>

      {showForm && <form onSubmit={createTournament} className="glass-panel grid grid-cols-1 md:grid-cols-2 gap-3 rounded-3xl border border-white/10 p-5">
        <input required placeholder="Nom du tournoi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="glass-input rounded-xl p-3 text-xs" />
        <input required placeholder="slug-du-tournoi" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="glass-input rounded-xl p-3 text-xs" />
        <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="glass-input rounded-xl p-3 text-xs" />
        <input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="glass-input rounded-xl p-3 text-xs" />
        <input required placeholder="Lieu" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="glass-input rounded-xl p-3 text-xs" />
        <input required type="number" min="2" max="64" value={form.maxTeams} onChange={(e) => setForm({ ...form, maxTeams: Number(e.target.value) })} className="glass-input rounded-xl p-3 text-xs" />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="glass-input min-h-20 rounded-xl p-3 text-xs md:col-span-2" />
        <button type="submit" className="rounded-xl bg-[#D97706] px-4 py-2.5 text-xs font-black text-black md:col-span-2">Enregistrer le tournoi</button>
      </form>}

      {message && <p className="text-xs text-amber-300">{message}</p>}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {tournaments.map((tournament) => <article key={tournament.id} className="glass-panel rounded-3xl border border-white/10 p-5 space-y-5">
          <div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-black text-white">{tournament.name}</h3><p className="mt-1 text-xs text-slate-400">{tournament.description || 'Compétition FIRE STONE ouverte aux équipes inscrites.'}</p></div><span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-300">{tournament.status}</span></div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300"><span><CalendarDays className="mr-1 inline w-3.5 h-3.5 text-[#FFB800]" />{new Date(tournament.startDate).toLocaleDateString('fr-FR')} - {new Date(tournament.endDate).toLocaleDateString('fr-FR')}</span><span>{tournament.location}</span><span>{tournament.teams.length}/{tournament.maxTeams} équipes</span></div>
          <div><h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#FFB800]">Classement</h4>{tournament.standings.length === 0 ? <p className="text-xs text-slate-500">Aucune équipe inscrite.</p> : <div className="space-y-1">{tournament.standings.map((standing, index) => <div key={standing.team.name} className="grid grid-cols-[24px_1fr_repeat(3,42px)] items-center rounded-lg bg-white/5 px-2 py-2 text-xs"><span className="text-slate-500">{index + 1}</span><strong className="text-white">{standing.team.name}</strong><span className="text-center text-emerald-300">{standing.wins} V</span><span className="text-center text-red-300">{standing.losses} D</span><span className="text-right text-slate-300">{standing.pointsFor - standing.pointsAgainst}</span></div>)}</div>}</div>
        </article>)}
      </div>
    </div>
  );
}
