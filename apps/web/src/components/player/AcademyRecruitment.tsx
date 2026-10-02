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
  Sparkles,
  ArrowUpRight,
  Target,
  Check,
  Zap,
  Play
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

  // Récupération session
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
        // Mode dégradé si offline
      }
    }

    setApplications((prev) => [newApp, ...prev]);
    setShowApplyModal(false);
    setCandidateName('');
    setCandidateEmail('');
    setCandidateVideo('');
    setSubmittedMessage(
      `Candidature enregistrée ! Le staff technique de l'Académie ${activeClub.name} étudiera votre dossier en vue du prochain combine.`
    );
    setTimeout(() => setSubmittedMessage(''), 5500);
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
    <div className="space-y-8 pb-20">
      {/* Toast Feedback */}
      {submittedMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-3 backdrop-blur-xl animate-fade-in shadow-2xl">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{submittedMessage}</span>
        </div>
      )}

      {/* En-tête Académie & Détection */}
      <div className="rounded-2xl border border-white/10 bg-[#0C0F1A] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/12 border border-indigo-500/25 text-indigo-300 text-xs font-semibold">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                Centre de formation & pôle espoirs
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold">
                Filière U16 • U18 • U21
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white leading-none tracking-tight">
              Académie {activeClub.name}
            </h1>

            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Pépinière de détection et de formation des espoirs du basketball togolais.
              Cursus sport-études, perfectionnement tactique et passerelle directe vers le roster professionnel.
            </p>
          </div>

          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF2A3B] hover:bg-[#E0202F] text-white font-bold text-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Postuler aux sélections</span>
          </button>
        </div>

        {/* 3 Piliers de l'Académie */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Standard FIBA & Pédagogie
            </div>
            <div className="text-sm font-black text-white">Fondamentaux & QI Basket</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maîtrise du dribble sous pression, lecture du pick-and-roll et discipline défensive
              adaptée aux exigences du haut niveau.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Prochain Combine Détection
            </div>
            <div className="text-sm font-black text-amber-300">Session Automne 2026</div>
            <p className="text-xs text-slate-400 leading-relaxed flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 mt-0.5 text-amber-400 shrink-0" />
              Arène de {activeClub.city || 'Lomé'} — Évaluations physiques (détente, vitesse) et match d'application 5x5.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Passerelle Roster Fanion
            </div>
            <div className="text-sm font-black text-emerald-300">Promotion Directe en D1</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Suivi personnalisé par les coachs de l'équipe première, avec intégration progressive
              aux entraînements du groupe senior.
            </p>
          </div>
        </div>
      </div>

      {/* Section Staff : Tableau de Détection des Espoirs */}
      {isAuthorized ? (
        <div className="rounded-3xl border border-white/10 bg-[#0F131F] p-5 sm:p-7 space-y-5 shadow-xl">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  Dossiers de Candidature Espoirs
                </h3>
                <p className="text-xs text-slate-400">
                  Évaluation sportive réservée à la direction technique du club
                </p>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-white/15 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tous ({counts.total})
              </button>
              <button
                onClick={() => setStatusFilter('EN_ATTENTE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'EN_ATTENTE'
                    ? 'bg-amber-500 text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                En attente ({counts.pending})
              </button>
              <button
                onClick={() => setStatusFilter('ACCEPTÉ')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'ACCEPTÉ'
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Retenus ({counts.accepted})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, poste, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs rounded-xl w-full bg-black/50 border border-white/10 text-white focus:outline-none focus:border-indigo-400 placeholder:text-slate-500"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-16 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
              <p className="text-xs uppercase tracking-widest font-black text-slate-400">
                Chargement des profils espoirs...
              </p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-2 max-w-md mx-auto">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">Aucun profil dans cette sélection</p>
              <p className="text-xs text-slate-400">
                Les jeunes athlètes ayant postulé pour l'académie apparaîtront ici pour arbitrage.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#141926] text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-white/5">
                  <tr>
                    <th className="px-4 py-3.5">Candidat Espoir</th>
                    <th className="px-3 py-3.5">Gabarit & Âge</th>
                    <th className="px-3 py-3.5">Poste Ciblé</th>
                    <th className="px-3 py-3.5">Date Dépôt</th>
                    <th className="px-3 py-3.5 text-center">Highlights</th>
                    <th className="px-3 py-3.5 text-center">Statut</th>
                    <th className="px-4 py-3.5 text-right">Arbitrage Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#0C101A]/60">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3.5 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md">
                            {app.candidateName[0] || 'E'}
                          </div>
                          <div>
                            <div className="text-sm font-black text-white">{app.candidateName}</div>
                            <div className="text-[11px] text-slate-400 font-mono font-normal">
                              {app.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-slate-300 font-semibold">
                        <span className="text-white font-bold">{app.height}</span>
                        <span className="text-slate-500 mx-1.5">•</span>
                        <span>{app.age} ans</span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-black text-[11px]">
                          {app.preferredPosition}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-slate-400 font-mono text-[11px]">
                        {app.submittedDate}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {app.videoHighlightsUrl ? (
                          <button
                            onClick={() => setSelectedVideoUrl(app.videoHighlightsUrl!)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500 text-indigo-300 hover:text-white inline-flex items-center gap-1 font-bold text-[11px] transition-all cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" /> Voir Tape
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">Aucune</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            app.status === 'ACCEPTÉ'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : app.status === 'REFUSÉ'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
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
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white font-semibold text-[10px] border border-emerald-500/40 transition-colors cursor-pointer"
                            title="Convoquer pour essai physique ou intégrer au roster"
                          >
                            Retenir
                          </button>
                        )}
                        {app.status !== 'REFUSÉ' && (
                          <button
                            onClick={() => updateStatus(app.id, 'REFUSÉ')}
                            className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white font-semibold text-[10px] border border-red-500/40 transition-colors cursor-pointer"
                            title="Classer sans suite"
                          >
                            Décliner
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
        <div className="rounded-3xl border border-white/10 bg-[#0F131F] p-8 sm:p-10 text-center space-y-4 max-w-lg mx-auto shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-lg font-black text-white">Espace Candidat Pôle Espoirs</h4>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              Vous avez entre 14 et 21 ans et rêvez de défendre les couleurs de {activeClub.name} ?
              Déposez votre dossier pour participer aux journées de détection officielle.
            </p>
          </div>
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-5 py-3 rounded-xl bg-[#FF2A3B] hover:bg-[#E0202F] text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Déposer ma candidature
          </button>
        </div>
      )}

      {/* MODAL : CANDIDATER À L'ACADÉMIE */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="rounded-3xl border border-white/20 max-w-md w-full p-6 sm:p-7 space-y-5 bg-[#0F131F] shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-black">
                  Sélections Espoirs
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">Candidater à l'Académie</h3>
                <p className="text-xs text-slate-400">Franchise {activeClub.name}</p>
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
                <label className="block text-slate-300 font-bold mb-1">Nom & Prénom complet *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Mensah Kodjo"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Email de contact *</label>
                  <input
                    type="email"
                    required
                    placeholder="mensah@exemple.tg"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-indigo-400"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-indigo-400"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Poste de prédilection</label>
                  <select
                    value={candidatePosition}
                    onChange={(e) => setCandidatePosition(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-indigo-400"
                  >
                    <option value="Meneur" className="bg-slate-900 text-white">Meneur (Point Guard)</option>
                    <option value="Arrière" className="bg-slate-900 text-white">Arrière (Shooting Guard)</option>
                    <option value="Ailier" className="bg-slate-900 text-white">Ailier (Small Forward)</option>
                    <option value="Ailier Fort" className="bg-slate-900 text-white">Ailier Fort (Power Forward)</option>
                    <option value="Pivot" className="bg-slate-900 text-white">Pivot (Center)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-indigo-400" />
                  Lien Vidéo Highlights (YouTube / Drive)
                </label>
                <input
                  type="url"
                  placeholder="https://youtu.be/..."
                  value={candidateVideo}
                  onChange={(e) => setCandidateVideo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] leading-relaxed">
                ℹ️ Votre dossier sera analysé par le staff technique de formation. Une convocation
                sera transmise par email pour les tests physiques sur le terrain.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/15 text-white font-bold hover:bg-white/10 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#FF2A3B] hover:bg-[#E0202F] text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Envoyer ma candidature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VIDEO THEATER */}
      {selectedVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/20 bg-[#0F131F] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" />
                Vidéo Highlights du Candidat Espoir
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
