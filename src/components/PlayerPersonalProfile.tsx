import React, { useState } from 'react';
import type { UserRole } from '../types';
import {
  UserCheck,
  Trophy,
  Activity,
  Award,
  Edit3,
  Save,
  CheckCircle2,
  Target,
  MessageSquare,
  Clock,
  Lock,
  Sparkles,
  Send,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface PlayerPersonalProfileProps {
  currentRole?: UserRole;
  authUser?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    emergencyContact?: string | null;
    bio?: string | null;
    country?: string | null;
    city?: string | null;
  } | null;
  onNavigateToSettings?: () => void;
  onUserUpdate?: (user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    emergencyContact?: string | null;
    bio?: string | null;
    country?: string | null;
    city?: string | null;
  }) => void;
}

export const PlayerPersonalProfile: React.FC<PlayerPersonalProfileProps> = ({
  currentRole = 'SUPER_ADMIN',
  authUser,
  onNavigateToSettings,
  onUserUpdate,
}) => {
  const isCoachOrAdmin = ['SUPER_ADMIN', 'ADMIN', 'COACH'].includes(currentRole);
  const userName = authUser?.name || 'Joueur';
  const userAvatar = authUser?.avatarUrl || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80';
  const userBio = authUser?.bio || 'Aucune biographie enregistrée. Renseignez votre profil pour personnaliser votre fiche.';
  const userCity = authUser?.city || 'Lomé';
  const userCountry = authUser?.country || 'Togo';
  const userPhone = authUser?.phoneNumber || 'Non renseigné';
  const userAddress = authUser?.address || 'Adresse non renseignée';

  const [bioText, setBioText] = useState(userBio);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioSavedSuccess, setBioSavedSuccess] = useState(false);

  // 24-Hour Ephemeral Coach Evaluation Feedback State
  const nowMs = Date.now();
  const [coachFeedback, setCoachFeedback] = useState<{
    author: string;
    text: string;
    createdAtMs: number;
    strengths: string[];
    focusAreas: string[];
  } | null>({
    author: 'Head Coach David Vance',
    text: 'Marcus a livré une séance d\'entraînement exceptionnelle ce matin. Très bonne lecture des blocs Pick & Roll et excellente prise de décision en phase d\'attaque rapide. Poursuivre le travail sur les drives main gauche.',
    createdAtMs: nowMs - (3 * 3600 * 1000), // Created 3 hours ago (< 24h)
    strengths: ['Vision du jeu 5/5', 'Leadership collectif', 'Adresse sous pression'],
    focusAreas: ['Finition main gauche sous le cercle'],
  });

  // Modal to Post / Edit 24h Coach Evaluation
  const [showCoachFeedbackModal, setShowCoachFeedbackModal] = useState(false);
  const [newFeedbackText, setNewFeedbackText] = useState(coachFeedback?.text || '');
  const [newStrengthInput, setNewStrengthInput] = useState('Défense agressive, Tir rapide');

  // Check if 24h expired
  const isFeedbackActive =
    coachFeedback &&
    nowMs - coachFeedback.createdAtMs < 24 * 3600 * 1000;

  // Calculate remaining hours for feedback
  const remainingHours = coachFeedback
    ? Math.max(0, Math.floor((24 * 3600 * 1000 - (nowMs - coachFeedback.createdAtMs)) / (3600 * 1000)))
    : 0;

  const formGraphData = [
    { game: 'S1', points: 18 },
    { game: 'S2', points: 24 },
    { game: 'S3', points: 22 },
    { game: 'S4', points: 28 },
    { game: 'S5', points: 26 },
  ];

  const playerRadarData = [
    { subject: 'Tir 3 Pts', value: 82 },
    { subject: 'Passe & Vision', value: 78 },
    { subject: 'Défense', value: 74 },
    { subject: 'Athlétisme', value: 81 },
    { subject: 'QI Basket', value: 86 },
    { subject: 'Rebond', value: 68 },
  ];

  const gameLog = [
    { opponent: 'Red Dragons de Paris', date: '2026-07-28', pts: 26, reb: 4, ast: 11, stl: 3, fgPct: '56%', result: 'VICTOIRE (94-86)', isMvp: true },
    { opponent: 'Titans de Toulouse', date: '2026-07-21', pts: 19, reb: 5, ast: 9, stl: 2, fgPct: '50%', result: 'VICTOIRE (89-78)', isMvp: false },
    { opponent: 'Vipers de Lyon', date: '2026-07-14', pts: 31, reb: 3, ast: 8, stl: 4, fgPct: '62%', result: 'VICTOIRE (92-75)', isMvp: true },
  ];

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();

    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (session?.token) {
      try {
        const response = await fetch('http://localhost:5000/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            name: authUser?.name || userName,
            email: authUser?.email || '',
            avatarUrl: authUser?.avatarUrl || userAvatar,
            bio: bioText,
            phoneNumber: authUser?.phoneNumber || null,
            address: authUser?.address || null,
            emergencyContact: authUser?.emergencyContact || null,
            country: authUser?.country || userCountry,
            city: authUser?.city || userCity,
          }),
        });

        if (response.ok && authUser && onUserUpdate) {
          onUserUpdate({
            ...authUser,
            name: authUser.name,
            avatarUrl: authUser.avatarUrl || userAvatar,
            bio: bioText,
            phoneNumber: authUser.phoneNumber || null,
            address: authUser.address || null,
            emergencyContact: authUser.emergencyContact || null,
            country: authUser.country || userCountry,
            city: authUser.city || userCity,
          });
        }
      } catch {
        // ignore for now
      }
    }

    setIsEditingBio(false);
    setBioSavedSuccess(true);
    setTimeout(() => setBioSavedSuccess(false), 3000);
  };

  const handlePostCoachFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackText.trim()) return;

    setCoachFeedback({
      author: currentRole === 'COACH' ? 'Head Coach David Vance' : 'Staff Technique FIRE STONE',
      text: newFeedbackText,
      createdAtMs: Date.now(),
      strengths: newStrengthInput.split(',').map((s) => s.trim()).filter(Boolean),
      focusAreas: ['Discipline tactique & régularité'],
    });

    setShowCoachFeedbackModal(false);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Banner Player Header */}
      <div className="relative glass-panel rounded-3xl p-6 sm:p-8 border border-white/15 overflow-hidden bg-[#0A0C13]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#B91C1C]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative shrink-0">
              <img
                src={userAvatar}
                alt={userName}
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl object-cover border-2 border-[#D97706] shadow-2xl"
              />
              <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-xl bg-[#090A0F] border border-[#D97706] flex items-center justify-center font-black text-white text-base shadow-lg">
                #{authUser?.role ? authUser.role.slice(0, 2) : 'J'}
              </div>
            </div>

            <div className="space-y-3 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B91C1C]/20 text-[#B91C1C] text-xs font-bold uppercase tracking-wider border border-[#B91C1C]/30">
                <UserCheck className="w-3.5 h-3.5 text-[#D97706]" /> Espace Profil Joueur
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white">{userName}</h2>
              <div className="text-xs text-[#D97706] font-bold">
                {authUser?.role || 'PLAYER'} • {userCity}, {userCountry}
              </div>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Statut : compte vérifié
                </span>
                <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Rôle : {authUser?.role || 'PLAYER'}
                </span>
              </div>
            </div>
          </div>

          {onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-2 shrink-0 self-center md:self-start"
            >
              <Edit3 className="w-4 h-4 text-[#D97706]" />
              <span>Paramètres du Compte</span>
            </button>
          )}
        </div>
      </div>

      {bioSavedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> La biographie du joueur a été mise à jour avec succès.
        </div>
      )}

      {/* ============================================================== */}
      {/* EPHEMERAL 24H COACH FEEDBACK SECTION                           */}
      {/* ============================================================== */}
      <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 space-y-4 bg-gradient-to-r from-amber-950/20 via-[#0A0C13] to-red-950/20 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D97706]/20 border border-[#D97706]/40 flex items-center justify-center text-[#D97706]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Avis & Évaluation du Coach (Éphémère 24h)
              </h3>
              <p className="text-xs text-slate-400">
                Remarques et consignes individualisées du Coach. Disparaît automatiquement après 24h.
              </p>
            </div>
          </div>

          {isCoachOrAdmin && (
            <button
              onClick={() => setShowCoachFeedbackModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D97706] to-amber-700 text-black font-extrabold text-xs shadow-md hover:scale-105 transition-all self-start sm:self-auto flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✍️ {isFeedbackActive ? 'Mettre à jour l\'avis (24h)' : 'Rédiger l\'avis du Coach (24h)'}</span>
            </button>
          )}
        </div>

        {isFeedbackActive ? (
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-[#D97706] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" /> Publié par {coachFeedback.author}
              </span>
              <span className="flex items-center gap-1 text-amber-300 font-mono bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <Clock className="w-3.5 h-3.5" /> Expire dans environ {remainingHours}h
              </span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed bg-black/40 p-4 rounded-2xl border border-white/5 font-medium">
              "{coachFeedback.text}"
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Points Forts & Réussites :
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {coachFeedback.strengths.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" /> Axe de Progression Prise en Charge :
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {coachFeedback.focusAreas.map((f, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200 text-[10px] font-semibold">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 space-y-2 bg-black/30 rounded-2xl border border-white/5">
            <Clock className="w-6 h-6 text-slate-500 mx-auto" />
            <p>Aucun avis récent n'a été publié par le Coach durant ces dernières 24 heures.</p>
            {isCoachOrAdmin && (
              <p className="text-[#D97706] font-bold">Cliquez sur le bouton ci-dessus pour laisser une appréciation au joueur.</p>
            )}
          </div>
        )}
      </div>

      {/* Season Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1 text-center bg-[#0A0C13]">
          <div className="text-xs text-slate-400 font-medium">Moyenne Points</div>
          <div className="text-3xl font-black text-gradient-fire">{formGraphData.reduce((sum, item) => sum + item.points, 0) / formGraphData.length}</div>
          <div className="text-[10px] text-slate-400">Derniers matchs</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1 text-center bg-[#0A0C13]">
          <div className="text-xs text-slate-400 font-medium">Passe / Match</div>
          <div className="text-3xl font-black text-white">{Math.round((formGraphData.reduce((sum, item) => sum + item.points, 0) / formGraphData.length) / 2)}</div>
          <div className="text-[10px] text-slate-400">Basé sur le profil</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1 text-center bg-[#0A0C13]">
          <div className="text-xs text-slate-400 font-medium">Taux de réussite</div>
          <div className="text-3xl font-black text-gradient-gold">{Math.round((playerRadarData.reduce((sum, item) => sum + item.value, 0) / playerRadarData.length))}%</div>
          <div className="text-[10px] text-slate-400">Profil global</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1 text-center bg-[#0A0C13]">
          <div className="text-xs text-slate-400 font-medium">Évaluation</div>
          <div className="text-3xl font-black text-emerald-400">{Math.round((playerRadarData.reduce((sum, item) => sum + item.value, 0) / playerRadarData.length) * 0.9)}</div>
          <div className="text-[10px] text-emerald-500 font-bold">Profil compte</div>
        </div>
      </div>

      {/* Charts Grid: Form progression & Radar Skill */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-[#0A0C13]">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#B91C1C]" /> Évolution des Points Inscrits (Derniers Matchs)
          </h3>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formGraphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="game" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 40]} />
                <Tooltip contentStyle={{ backgroundColor: '#090A0F', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="points" name="Points Marqués" stroke="#B91C1C" strokeWidth={3} dot={{ fill: '#D97706', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-[#0A0C13]">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-[#D97706]" /> Radar de Compétences Spécifique
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={playerRadarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" stroke="#CBD5E1" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="none" />
                <Radar name={userName} dataKey="value" stroke="#D97706" fill="#D97706" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Game Log Section */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-[#0A0C13]">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#D97706]" /> Journal Individuel des Matchs Récents
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-white/10 text-slate-400 uppercase font-bold text-[10px]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Adversaire</th>
                <th className="px-3 py-3 text-center text-white font-extrabold">PTS</th>
                <th className="px-3 py-3 text-center">REB</th>
                <th className="px-3 py-3 text-center">AST</th>
                <th className="px-3 py-3 text-center">STL</th>
                <th className="px-3 py-3 text-center">FG%</th>
                <th className="px-3 py-3 text-center">Résultat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {gameLog.map((log, idx) => (
                <tr key={idx} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-slate-400 font-mono">{log.date}</td>
                  <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                    <span>{log.opponent}</span>
                    {log.isMvp && <span className="bg-[#D97706] text-black text-[9px] font-black px-1.5 py-0.5 rounded">MVP</span>}
                  </td>
                  <td className="px-3 py-3 text-center font-black text-[#B91C1C] text-sm">{log.pts}</td>
                  <td className="px-3 py-3 text-center font-mono">{log.reb}</td>
                  <td className="px-3 py-3 text-center font-mono">{log.ast}</td>
                  <td className="px-3 py-3 text-center font-mono">{log.stl}</td>
                  <td className="px-3 py-3 text-center font-mono text-[#D97706]">{log.fgPct}</td>
                  <td className="px-3 py-3 text-center text-emerald-400 font-bold">{log.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editable Bio Section (RESTRICTED FOR PLAYER ROLE) */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 max-w-3xl bg-[#0A0C13]">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-slate-300" /> Biographie Officielle du Joueur
          </h3>

          {!isCoachOrAdmin ? (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Modification par le Coach uniquement
            </span>
          ) : (
            <button
              onClick={() => setIsEditingBio(!isEditingBio)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-bold transition-colors"
            >
              {isEditingBio ? 'Annuler' : 'Modifier la biographie'}
            </button>
          )}
        </div>

        {!isCoachOrAdmin ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
              {bioText}
            </p>
            <p className="text-[10px] text-slate-500 italic">
              🔒 En tant que joueur, vous ne pouvez pas modifier votre biographie. Contactez l'Entraîneur pour demander un ajustement.
            </p>
          </div>
        ) : (
          <div>
            {isEditingBio ? (
              <form onSubmit={handleSaveBio} className="space-y-3 text-xs">
                <textarea
                  rows={4}
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#090A0F] border border-white/10 text-xs text-white leading-relaxed focus:outline-none focus:border-[#B91C1C]"
                />
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#B91C1C] text-white font-bold text-xs hover:bg-red-700 shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Enregistrer la biographie
                </button>
              </form>
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                {bioText}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: POST 24H COACH EVALUATION                              */}
      {/* ============================================================== */}
      {showCoachFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 max-w-xl w-full space-y-5 bg-[#0D0E15]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D97706]" />
                <h3 className="font-extrabold text-white text-base">Rédiger un Avis Coach (24h Éphémère)</h3>
              </div>
              <button onClick={() => setShowCoachFeedbackModal(false)} className="p-1.5 rounded-lg bg-white/5 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostCoachFeedback} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Appréciation / Consignes du Coach :</label>
                <textarea
                  rows={4}
                  required
                  value={newFeedbackText}
                  onChange={(e) => setNewFeedbackText(e.target.value)}
                  placeholder="Évaluez les prestations récentes, l'attitude à l'entraînement, les conseils..."
                  className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#B91C1C]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Points forts constatés (séparés par virgules) :</label>
                <input
                  type="text"
                  value={newStrengthInput}
                  onChange={(e) => setNewStrengthInput(e.target.value)}
                  className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Cet avis restera visible sur le profil du joueur pendant exactement 24h avant de disparaître.</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCoachFeedbackModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D97706] to-amber-700 text-black font-extrabold shadow-lg flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Publier l'Avis (24h)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
