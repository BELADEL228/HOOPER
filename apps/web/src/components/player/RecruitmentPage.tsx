import { useEffect, useState } from 'react';
import type { UserRole } from '../../types';
import { Search, Send, UserRound, Plus, X, CheckCircle2 } from 'lucide-react';
import { apiUrl } from '../../services/api';

interface RecruitmentPost {
  id: string;
  title: string;
  description: string;
  position: string;
  minAge?: number | null;
  maxAge?: number | null;
  city: string;
  team: { name: string; city: string };
  _count: { applications: number };
}

export function RecruitmentPage({ currentRole }: { currentRole: UserRole }) {
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [position, setPosition] = useState('');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Formulaire de création d'annonce (Coach/Admin)
  const [newTitle, setNewTitle] = useState('');
  const [newPosition, setNewPosition] = useState('Meneur');
  const [newCity, setNewCity] = useState('Lomé');
  const [newDescription, setNewDescription] = useState('');
  const [newMinAge, setNewMinAge] = useState('18');
  const [newMaxAge, setNewMaxAge] = useState('25');
  const [createLoading, setCreateLoading] = useState(false);

  const isManager = ['SUPER_ADMIN', 'ADMIN', 'COACH'].includes(currentRole);

  const fetchPosts = () => {
    fetch(apiUrl(`/recruitment?position=${encodeURIComponent(position)}&city=${encodeURIComponent(city)}`))
      .then(async (response) => {
        if (response.ok) setPosts(await response.json());
      })
      .catch(() => setMessage('Impossible de charger les annonces.'));
  };

  useEffect(() => {
    fetchPosts();
  }, [position, city]);

  const apply = async (id: string) => {
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) {
      setMessage('Connectez-vous avec un profil joueur pour candidater.');
      return;
    }
    try {
      const response = await fetch(apiUrl(`/recruitment/${id}/apply`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ message: 'Je souhaite être étudié pour cette opportunité.' }),
      });
      const data = await response.json();
      setMessage(response.ok ? 'Candidature envoyée.' : data?.error || 'Candidature impossible.');
    } catch {
      setMessage('Candidature impossible (erreur réseau).');
    }
  };

  const updateApplicationStatus = async (appId: string, status: 'ACCEPTED' | 'DECLINED') => {
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) return;
    try {
      const res = await fetch(apiUrl(`/recruitment/applications/${appId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setMessage(`Candidature mise à jour (${status === 'ACCEPTED' ? 'Acceptée' : 'Refusée'}).`);
        fetchPosts();
      }
    } catch {
      setMessage('Impossible de mettre à jour la candidature.');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) {
      setMessage('Session expirée ou non autorisée.');
      return;
    }

    setCreateLoading(true);
    try {
      const response = await fetch(apiUrl('/recruitment'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          position: newPosition,
          city: newCity,
          description: newDescription,
          minAge: parseInt(newMinAge) || null,
          maxAge: parseInt(newMaxAge) || null,
        }),
      });

      if (response.ok) {
        setIsCreateModalOpen(false);
        setNewTitle('');
        setNewDescription('');
        setMessage('Annonce de recrutement publiée avec succès !');
        fetchPosts();
      } else {
        const err = await response.json().catch(() => ({}));
        setMessage(err.error || 'Erreur lors de la publication.');
      }
    } catch {
      setMessage('Impossible de contacter le serveur.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFB800]/30 bg-[#FFB800]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FFB800]">
            <UserRound className="w-3.5 h-3.5" /> Mercato basketball
          </div>
          <h2 className="mt-2 text-3xl font-black text-white">Recrutement & opportunités</h2>
          <p className="mt-1 text-sm text-slate-400">Trouvez une équipe ou publiez un besoin précis.</p>
        </div>

        {isManager && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white text-xs font-bold uppercase tracking-wider shadow-lg transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Publier une annonce
          </button>
        )}
      </header>

      <div className="glass-panel flex flex-col md:flex-row gap-3 rounded-3xl border border-white/10 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Filtrer par poste (Meneur, Pivot...)"
            className="glass-input w-full rounded-xl py-2.5 pl-9 pr-3 text-xs"
          />
        </div>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ville"
          className="glass-input rounded-xl px-3 py-2.5 text-xs md:w-48"
        />
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {posts.map((post) => (
          <article key={post.id} className="glass-panel rounded-3xl border border-white/10 p-5 space-y-4">
            <div className="flex justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#FFB800]">
                  {post.team?.name || 'Club FIRE STONE'} • {post.city}
                </p>
                <h3 className="mt-1 text-lg font-black text-white">{post.title}</h3>
              </div>
              <span className="h-fit rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300">
                OUVERT
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">{post.description}</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="rounded-lg bg-white/5 px-2 py-1">Poste : {post.position}</span>
              {post.minAge && (
                <span className="rounded-lg bg-white/5 px-2 py-1">
                  Âge : {post.minAge}
                  {post.maxAge ? `-${post.maxAge}` : '+'}
                </span>
              )}
              <span className="rounded-lg bg-white/5 px-2 py-1">
                {post._count?.applications ?? 0} candidature(s)
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => apply(post.id)}
                className="flex items-center gap-2 rounded-xl bg-[#B91C1C] hover:bg-red-600 px-3.5 py-2 text-xs font-bold text-white transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Candidater
              </button>
              {isManager && (
                <button
                  type="button"
                  onClick={() => updateApplicationStatus(post.id, 'ACCEPTED')}
                  title="Traiter ou accepter un dossier de candidature"
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-300 transition-all cursor-pointer"
                >
                  Statut candidatures
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="glass-panel rounded-3xl border border-white/10 p-8 text-center text-sm text-slate-400">
          Aucune annonce ne correspond à ces critères.
        </div>
      )}

      {/* Modal Créer une annonce de recrutement */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-slate-900 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Publier une opportunité</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Titre de l'annonce *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Meneur titulaire U20 recherché"
                  className="glass-input w-full rounded-xl py-2 px-3 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Poste</label>
                  <select
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    className="glass-input w-full rounded-xl py-2 px-3 text-xs text-white"
                  >
                    {['Meneur', 'Arrière', 'Ailier', 'Ailier Fort', 'Pivot'].map((pos) => (
                      <option key={pos} value={pos} className="bg-slate-900 text-white">
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Ville</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="glass-input w-full rounded-xl py-2 px-3 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Âge min</label>
                  <input
                    type="number"
                    value={newMinAge}
                    onChange={(e) => setNewMinAge(e.target.value)}
                    className="glass-input w-full rounded-xl py-2 px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Âge max</label>
                  <input
                    type="number"
                    value={newMaxAge}
                    onChange={(e) => setNewMaxAge(e.target.value)}
                    className="glass-input w-full rounded-xl py-2 px-3 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Description & Profil recherché *</label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Détaillez le profil athlétique, les attentes tactiques et les conditions..."
                  className="glass-input w-full rounded-xl py-2 px-3 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold uppercase tracking-wider text-xs shadow-lg cursor-pointer disabled:opacity-50"
              >
                {createLoading ? 'Publication...' : 'Diffuser l’annonce'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
