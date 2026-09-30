import React, { useState, useEffect, useMemo } from 'react';
import type { AcademyApplication, UserRole } from '../../types';
import {
  GraduationCap,
  CheckCircle2,
  UserPlus,
  Video,
  Calendar,
  MapPin,
  Search,
  X,
  Award,
  Users,
  Shield,
  Loader2,
} from 'lucide-react';
import { apiUrl } from '../../services/api';
import { useClub } from '../../context/ClubContext';

interface AcademyRecruitmentProps {
  currentRole: UserRole;
  onPromoteToPlayer?: (name: string, position: string) => void;
}

export const AcademyRecruitment: React.FC<AcademyRecruitmentProps> = ({
  currentRole,
  onPromoteToPlayer,
}) => {
  const isAuthorized = ['SUPER_ADMIN', 'ADMIN', 'CLUB_ADMIN', 'COACH'].includes(currentRole);
  const { activeClub } = useClub();

  const [applications, setApplications] = useState<AcademyApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EN_ATTENTE' | 'ACCEPTÉ' | 'REFUSÉ'>('ALL');
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  // Formulaire de candidature
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateAge, setCandidateAge] = useState('17');
  const [candidateHeight, setCandidateHeight] = useState('1m88');
  const [candidatePosition, setCandidatePosition] = useState('Meneur');
  const [candidateVideo, setCandidateVideo] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState('');

  // Récupération de la session
  const getSession = () => {
    try {
      return JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    } catch {
      return {};
    }
  };

  useEffect(() => {
    const session = getSession();
    if (session?.token && isAuthorized) {
      setLoading(true);
      fetch(apiUrl('/academy/applications'), {
        headers: { Authorization: `Bearer ${session.token}` },
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setApplications(data);
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isAuthorized]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !candidateEmail.trim()) return;

    const newApp: AcademyApplication = {
      id: `app_${Date.now()}`,
      candidateName: candidateName.trim(),
      email: candidateEmail.trim(),
      age: parseInt(candidateAge) || 18,
      height: candidateHeight.trim() || '1m88',
      preferredPosition: candidatePosition,
      videoHighlightsUrl: candidateVideo.trim() || undefined,
      status: 'EN_ATTENTE',
      submittedDate: new Date().toISOString().split('T')[0],
    };

    const session = getSession();
    if (session?.token) {
      try {
        await fetch(apiUrl('/academy/apply'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify(newApp),
        });
      } catch {
        // Mode dégradé si backend injoignable
      }
    }

    setApplications((prev) => [newApp, ...prev]);
    setShowApplyModal(false);
    setCandidateName('');
    setCandidateEmail('');
    setCandidateVideo('');
    setSubmittedMessage(
      `Félicitations ! Votre candidature pour l'académie de ${activeClub.name} a été transmise aux préparateurs et coachs.`
    );
    setTimeout(() => setSubmittedMessage(''), 5000);
  };

  const updateStatus = (id: string, newStatus: 'ACCEPTÉ' | 'REFUSÉ') => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
  };

  const handlePromote = (app: AcademyApplication) => {
    if (onPromoteToPlayer) {
      onPromoteToPlayer(app.candidateName, app.preferredPosition);
    }
    updateStatus(app.id, 'ACCEPTÉ');
  };

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        app.candidateName.toLowerCase().includes(q) ||
        app.email.toLowerCase().includes(q) ||
        app.preferredPosition.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || app.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  const counts = useMemo(() => {
    const pending = applications.filter((a) => a.status === 'EN_ATTENTE').length;
    const accepted = applications.filter((a) => a.status === 'ACCEPTÉ').length;
    const declined = applications.filter((a) => a.status === 'REFUSÉ').length;
    return { pending, accepted, declined, total: applications.length };
  }, [applications]);

  return (
    <div className="space-y-8 pb-16">
      {/* ── En-tête de section ── */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-300">
            <GraduationCap className="w-3.5 h-3.5" />
            Centre de Formation & Pôle Espoirs
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            Académie {activeClub.name}
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-slate-300 font-semibold border border-white/10">
              U16 - U20
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            Détection des jeunes potentiels du basketball togolais, perfectionnement tactique et
            passerelle directe vers le roster professionnel.
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-all cursor-pointer self-start sm:self-auto uppercase tracking-wider"
        >
          <UserPlus className="w-4 h-4" />
          <span>Postuler aux Sélections</span>
        </button>
      </header>

      {/* ── Feedback de soumission ── */}
      {submittedMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{submittedMessage}</span>
        </div>
      )}

      {/* ── Cartes Synthèse & Calendrier Détection ── */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            Cursus Sport-Études & Formation
          </div>
          <div className="text-sm font-black text-white">Processus de Détection Rigoureux</div>
          <p className="text-xs text-slate-300 leading-relaxed">
            L'académie forme les espoirs aux standards FIBA. Les dossiers sont évalués par les
            entraîneurs avant convocation sur le terrain pour les tests d'aptitude.
          </p>
        </div>

        <div className="space-y-2 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
          <div className="text-[10px] uppercase font-black tracking-wider text-[#FFB800] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Prochaine Session Détection
          </div>
          <div className="text-sm font-black text-[#FFB800]">Samedi 15 Septembre 2026</div>
          <p className="text-xs text-slate-300 leading-relaxed flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 mt-0.5 text-amber-400 shrink-0" />
            Arène de {activeClub.city || 'Lomé'} — Ateliers fondamentaux, tests de détente verticale
            et confrontations 5x5 arbitrées.
          </p>
        </div>

        <div className="space-y-2 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
          <div className="text-[10px] uppercase font-black tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            Encadrement Professionnel
          </div>
          <div className="text-sm font-black text-emerald-400">Staff Head Coach & Préparateurs</div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Suivi vidéo individualisé, renforcement athlétique encadré et opportunités d'intégration
            dans l'équipe fanion selon les performances.
          </p>
        </div>
      </div>

      {/* ── Espace Coach / Staff : Gestion des dossiers ── */}
      {isAuthorized ? (
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6 shadow-xl">
          {/* Header du tableau */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  Dossiers de Candidature Reçus
                </h3>
                <p className="text-xs text-slate-400">
                  Vue réservée à la direction sportive et aux entraîneurs
                </p>
              </div>
            </div>

            {/* Filtres de statut */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Tous ({counts.total})
              </button>
              <button
                onClick={() => setStatusFilter('EN_ATTENTE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'EN_ATTENTE'
                    ? 'bg-amber-500 text-black font-extrabold'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                En attente ({counts.pending})
              </button>
              <button
                onClick={() => setStatusFilter('ACCEPTÉ')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'ACCEPTÉ'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Retenus ({counts.accepted})
              </button>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, poste, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-9 pr-3 py-2 text-xs rounded-xl w-full border border-white/10"
            />
          </div>

          {/* Tableau moderne des candidatures */}
          {loading ? (
            <div className="p-12 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF2A3B]" />
              <p className="text-xs text-slate-400">Chargement des candidatures de l'académie...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-white">Aucune candidature dans cette vue</p>
              <p className="text-xs text-slate-400">
                Les candidats qui postulent apparaîtront instantanément ici pour évaluation.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/10 text-slate-400 uppercase font-black text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Candidat</th>
                    <th className="px-3 py-3.5">Gabarit & Âge</th>
                    <th className="px-3 py-3.5">Poste</th>
                    <th className="px-3 py-3.5">Date</th>
                    <th className="px-3 py-3.5 text-center">Highlights</th>
                    <th className="px-3 py-3.5 text-center">Statut</th>
                    <th className="px-4 py-3.5 text-right">Décision Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {app.candidateName[0] || 'C'}
                          </div>
                          <div>
                            <div>{app.candidateName}</div>
                            <div className="text-[10px] text-slate-400 font-mono font-normal">
                              {app.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-slate-300 font-medium">
                        {app.height} • {app.age} ans
                      </td>
                      <td className="px-3 py-3.5 font-bold text-[#FFB800]">
                        {app.preferredPosition}
                      </td>
                      <td className="px-3 py-3.5 text-slate-400 font-mono text-[11px]">
                        {app.submittedDate}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {app.videoHighlightsUrl ? (
                          <button
                            onClick={() => setSelectedVideoUrl(app.videoHighlightsUrl!)}
                            className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-bold cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" /> Voir
                          </button>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            app.status === 'ACCEPTÉ'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : app.status === 'REFUSÉ'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {app.status === 'ACCEPTÉ'
                            ? 'Retenu'
                            : app.status === 'REFUSÉ'
                            ? 'Non retenu'
                            : 'En évaluation'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2">
                        {app.status !== 'ACCEPTÉ' && (
                          <button
                            onClick={() => handlePromote(app)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white font-bold text-[10px] border border-emerald-500/40 transition-all cursor-pointer"
                            title="Retenir pour détection terrain"
                          >
                            Retenir
                          </button>
                        )}
                        {app.status !== 'REFUSÉ' && (
                          <button
                            onClick={() => updateStatus(app.id, 'REFUSÉ')}
                            className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white font-bold text-[10px] border border-red-500/40 transition-all cursor-pointer"
                            title="Décliner la candidature"
                          >
                            Refuser
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-3 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">Espace Candidat Pôle Espoirs</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Vous avez moins de 21 ans et rêvez de porter les couleurs de {activeClub.name} ?
            Déposez votre dossier pour participer aux journées de détection de l'académie.
          </p>
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            Déposer ma candidature
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL : CANDIDATER À L'ACADÉMIE
          ══════════════════════════════════════════════════════════════════ */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel rounded-3xl border border-white/20 max-w-md w-full p-6 sm:p-7 space-y-5 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-black text-white">Postuler au Centre de Formation</h3>
                <p className="text-xs text-slate-400">Académie {activeClub.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nom & Prénom *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Koffi Mensah"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Adresse Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="koffi@exemple.tg"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Âge</label>
                  <input
                    type="number"
                    min="12"
                    max="22"
                    required
                    value={candidateAge}
                    onChange={(e) => setCandidateAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Taille (ex: 1m92)</label>
                  <input
                    type="text"
                    placeholder="1m92"
                    value={candidateHeight}
                    onChange={(e) => setCandidateHeight(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Poste de prédilection</label>
                  <select
                    value={candidatePosition}
                    onChange={(e) => setCandidatePosition(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input bg-slate-900 text-white"
                  >
                    <option value="Meneur">Meneur</option>
                    <option value="Arrière">Arrière</option>
                    <option value="Ailier">Ailier</option>
                    <option value="Ailier Fort">Ailier Fort</option>
                    <option value="Pivot">Pivot</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-indigo-400" />
                  Lien Vidéo Highlights (YouTube / Cloudinary)
                </label>
                <input
                  type="url"
                  placeholder="https://youtu.be/..."
                  value={candidateVideo}
                  onChange={(e) => setCandidateVideo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                />
              </div>

              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] leading-relaxed">
                ℹ️ Votre dossier sera étudié par les recruteurs du club. Vous recevrez une convocation
                par email pour la prochaine détection physique.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:scale-[1.02] shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  Envoyer Candidature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL VIDEO PREVIEW
          ══════════════════════════════════════════════════════════════════ */}
      {selectedVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/20 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" />
                Vidéo Highlights du Candidat
              </h4>
              <button
                onClick={() => setSelectedVideoUrl(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
              {selectedVideoUrl.includes('youtube.com') || selectedVideoUrl.includes('youtu.be') ? (
                <iframe
                  src={selectedVideoUrl.replace('watch?v=', 'embed/')}
                  title="Vidéo highlights"
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : (
                <video src={selectedVideoUrl} controls className="w-full h-full" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
