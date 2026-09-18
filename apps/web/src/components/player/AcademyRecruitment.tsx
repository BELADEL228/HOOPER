import React, { useState, useEffect } from 'react';
import type { AcademyApplication, UserRole } from '../../types';
import { GraduationCap, CheckCircle2, UserPlus, Video, AlertCircle } from 'lucide-react';
import { apiUrl } from '../../services/api';

interface AcademyRecruitmentProps {
  currentRole: UserRole;
  onPromoteToPlayer?: (name: string, position: string) => void;
}

export const AcademyRecruitment: React.FC<AcademyRecruitmentProps> = ({ currentRole }) => {
  const isAuthorized = ['SUPER_ADMIN', 'ADMIN', 'COACH'].includes(currentRole);

  const [applications, setApplications] = useState<AcademyApplication[]>([
    {
      id: 'app_1',
      candidateName: 'Thomas "Kid" Morel',
      email: 'thomas.morel@gmail.com',
      age: 18,
      height: '1m91',
      preferredPosition: 'Arrière',
      videoHighlightsUrl: 'https://youtube.com',
      status: 'EN_ATTENTE',
      submittedDate: '2026-07-30',
      notes: 'Formé au club local. Bon tir à 3-pts et vitesse d\'exécution.',
    },
    {
      id: 'app_2',
      candidateName: 'Kévin Bangoura',
      email: 'kevin.bangoura@yahoo.fr',
      age: 19,
      height: '2m02',
      preferredPosition: 'Ailier Fort',
      videoHighlightsUrl: 'https://youtube.com',
      status: 'EN_ATTENTE',
      submittedDate: '2026-07-28',
      notes: 'Grand gabarit athlétique, potentiel au rebond défensif.',
    },
    {
      id: 'app_3',
      candidateName: 'Léo Martin',
      email: 'leo.martin@outlook.fr',
      age: 17,
      height: '1m84',
      preferredPosition: 'Meneur',
      status: 'ACCEPTÉ',
      submittedDate: '2026-07-20',
      notes: 'Admis aux détections de septembre.',
    },
  ]);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateAge, setCandidateAge] = useState('');
  const [candidateHeight, setCandidateHeight] = useState('');
  const [candidatePosition, setCandidatePosition] = useState('Meneur');
  const [candidateVideo, setCandidateVideo] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState('');

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (session?.token && isAuthorized) {
      fetch(apiUrl('/academy/applications'), {
        headers: { Authorization: `Bearer ${session.token}` },
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              setApplications(data);
            }
          }
        })
        .catch(() => {});
    }
  }, [isAuthorized]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName || !candidateEmail) return;

    const newApp: AcademyApplication = {
      id: `app_${Date.now()}`,
      candidateName,
      email: candidateEmail,
      age: parseInt(candidateAge) || 18,
      height: candidateHeight || '1m88',
      preferredPosition: candidatePosition,
      videoHighlightsUrl: candidateVideo,
      status: 'EN_ATTENTE',
      submittedDate: new Date().toISOString().split('T')[0],
    };

    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
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
        // Fallback local en cas de coupure
      }
    }

    setApplications([newApp, ...applications]);
    setShowApplyModal(false);
    setSubmittedMessage('Candidature transmise avec succès au staff technique !');
    setTimeout(() => setSubmittedMessage(''), 4000);
  };

  const updateStatus = (id: string, newStatus: 'ACCEPTÉ' | 'REFUSÉ') => {
    setApplications(
      applications.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <GraduationCap className="w-3.5 h-3.5" /> Centre de Formation & Détection
          </div>
          <h2 className="text-3xl font-extrabold text-white">Académie FIRE STONE</h2>
          <p className="text-slate-400 text-sm">Découvrez les futurs talents du club et postulez aux sessions de détection.</p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs shadow-lg hover:scale-105 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Postuler au Centre de Formation</span>
        </button>
      </div>

      {submittedMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {submittedMessage}
        </div>
      )}

      {/* Info Card */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <div className="text-xs text-slate-400 font-medium">Inscription Plateforme ≠ Équipe Première</div>
          <div className="text-sm font-bold text-white">Processus de Sélection</div>
          <p className="text-xs text-slate-300">Tout utilisateur peut créer un compte sur la plateforme. L'intégration à l'Équipe Première nécessite la validation des Coachs.</p>
        </div>
        <div className="space-y-1 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
          <div className="text-xs text-slate-400 font-medium">Prochaine Session Détection</div>
          <div className="text-sm font-bold text-[#FFB800]">15 Septembre 2026</div>
          <p className="text-xs text-slate-300">Terrain du Lycée d'Adétikopé, Quartier Adétikopé, Lomé — Togo. Ateliers physique, tirs & matchs 5v5.</p>
        </div>
        <div className="space-y-1 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
          <div className="text-xs text-slate-400 font-medium">Encadrement Pro</div>
          <div className="text-sm font-bold text-emerald-400">Staff Head Coach & Préparateurs</div>
          <p className="text-xs text-slate-300">Suivi vidéo individuel, préparation physique et intégration progressive en pro.</p>
        </div>
      </div>

      {/* Candidate Applications Table for Authorized Coach/Admin */}
      {isAuthorized ? (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-400" /> Candidatures reçues (Vue Coach & Admin)
            </h3>
            <span className="text-xs text-slate-400 font-medium">{applications.length} Candidats en attente de revue</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/10 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Candidat</th>
                  <th className="px-3 py-3">Âge & Taille</th>
                  <th className="px-3 py-3">Poste Visé</th>
                  <th className="px-3 py-3">Date Dépôt</th>
                  <th className="px-3 py-3 text-center">Vidéo</th>
                  <th className="px-3 py-3 text-center">Statut</th>
                  <th className="px-4 py-3 text-right">Actions Coach / Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">
                      <div>{app.candidateName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{app.email}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-300">{app.age} ans • {app.height}</td>
                    <td className="px-3 py-3 font-semibold text-[#FFB800]">{app.preferredPosition}</td>
                    <td className="px-3 py-3 text-slate-400 font-mono">{app.submittedDate}</td>
                    <td className="px-3 py-3 text-center">
                      {app.videoHighlightsUrl ? (
                        <a href={app.videoHighlightsUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-1">
                          <Video className="w-3.5 h-3.5" /> Voir
                        </a>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        app.status === 'ACCEPTÉ' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        app.status === 'REFUSÉ' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => updateStatus(app.id, 'ACCEPTÉ')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] border border-emerald-500/40"
                      >
                        Accepter
                      </button>
                      <button
                        onClick={() => updateStatus(app.id, 'REFUSÉ')}
                        className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-[10px] border border-red-500/40"
                      >
                        Refuser
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-2">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h4 className="text-base font-bold text-white">Espace Candidat Académie</h4>
          <p className="text-xs text-slate-300">Vous pouvez soumettre votre dossier ci-dessus. L'examen des candidatures est réservé au Staff Technique.</p>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel rounded-3xl border border-white/20 max-w-md w-full p-6 space-y-5">
            <h3 className="text-xl font-bold text-white">Candidature Centre de Formation</h3>

            <form onSubmit={handleApply} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nom Complet</label>
                <input
                  type="text"
                  required
                  placeholder="Thomas Morel"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="candidat@email.com"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Âge</label>
                  <input
                    type="number"
                    required
                    placeholder="18"
                    value={candidateAge}
                    onChange={(e) => setCandidateAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Taille (ex: 1m90)</label>
                  <input
                    type="text"
                    placeholder="1m90"
                    value={candidateHeight}
                    onChange={(e) => setCandidateHeight(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Poste Souhaité</label>
                  <select
                    value={candidatePosition}
                    onChange={(e) => setCandidatePosition(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input bg-[#090A0F]"
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
                <label className="block text-slate-300 font-medium mb-1">Lien Vidéo Highlights (YouTube/Vimeo)</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={candidateVideo}
                  onChange={(e) => setCandidateVideo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-slate-300 font-bold hover:bg-white/15"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md"
                >
                  Envoyer Candidature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
