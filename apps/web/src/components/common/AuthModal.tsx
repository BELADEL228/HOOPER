import React, { useEffect, useState } from 'react';
import type { UserRole } from '../../types';
import {
  Icon,
  ClipboardList,
  Building2,
  Handshake,
  Heart,
  Star,
  Eye,
  EyeOff,
  X,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle,
  Phone,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Upload,
  FileText,
  Video,
  Loader2,
  AlertCircle,
  ClipboardCheck,
} from 'lucide-react';
import { basketball } from '@lucide/lab';
import { apiUrl } from '../../services/api';
import { uploadMedia } from '../../services/uploadService';
import logo from '../../assets/logo.jpeg';

// ─── helpers ────────────────────────────────────────────────────────────────

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
}

interface AuthSessionPayload {
  token: string;
  user: AuthUserPayload;
  message?: string;
  clubMembershipStatus?: string;
  clubId?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: AuthSessionPayload) => void;
  initialTab?: 'LOGIN' | 'REGISTER' | 'FORGOT';
}

interface ClubOption {
  id: string;
  name: string;
  city?: string;
  logoUrl?: string;
}

const ROLES: { value: UserRole; label: string; icon: React.ReactNode; desc: string; badge: string }[] = [
  {
    value: 'COACH',
    label: 'Coach / Entraîneur',
    icon: <ClipboardList className="w-6 h-6" />,
    desc: 'Gestion tactique, feuilles de match, roster et candidatures',
    badge: 'Staff Technique',
  },
  {
    value: 'CLUB_ADMIN',
    label: 'Dirigeant (Admin Club)',
    icon: <Building2 className="w-6 h-6" />,
    desc: 'Créer un nouveau club ou administrer votre club existant',
    badge: 'Gestion Complète',
  },
  {
    value: 'PLAYER',
    label: 'Joueur',
    icon: <Icon iconNode={basketball} className="w-6 h-6" />,
    desc: 'Fiche sportive, roster, calendrier des matchs et vestiaire',
    badge: 'Athlète',
  },
  {
    value: 'SPONSOR',
    label: 'Partenaire / Sponsor',
    icon: <Handshake className="w-6 h-6" />,
    desc: 'Sponsoriser des équipes et valoriser votre marque',
    badge: 'Partenariat',
  },
  {
    value: 'ACADEMY_CANDIDATE',
    label: 'Candidat (Académie)',
    icon: <Star className="w-6 h-6" />,
    desc: 'Postuler à un centre de formation et détection de talents',
    badge: 'Recrutement',
  },
  {
    value: 'SUPPORTER',
    label: 'Supporter / Fan',
    icon: <Heart className="w-6 h-6" />,
    desc: 'Suivre les matchs, commenter le feed et acheter des billets',
    badge: 'Communauté',
  },
  {
    value: 'VISITOR',
    label: 'Visiteur',
    icon: <Eye className="w-6 h-6" />,
    desc: 'Explorer librement les actualités et le basket togolais',
    badge: 'Accès Libre',
  },
];

const POSITIONS = ['Meneur', 'Arrière', 'Ailier', 'Ailier Fort', 'Pivot'];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialTab = 'LOGIN',
}) => {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>(initialTab);
  // Étape 1 : Rôle | Étape 2 : Identité & Compte | Étape 3 : Contexte Métier | Étape 4 : Récapitulatif
  const [registerStep, setRegisterStep] = useState<number>(1);

  // Étape 1 : Rôle
  const [selectedRole, setSelectedRole] = useState<UserRole>('PLAYER');

  // Étape 2 : Informations de compte
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Lomé');
  const [country, setCountry] = useState('Togo');

  // Étape 3 : Champs contextuels selon le rôle
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [selectedClubId, setSelectedClubId] = useState('');

  // Spécifique Coach
  const [experienceYears, setExperienceYears] = useState('3');
  const [certificates, setCertificates] = useState('');

  // Spécifique Dirigeant
  const [createClubMode, setCreateClubMode] = useState<boolean>(true);
  const [newClubName, setNewClubName] = useState('');
  const [newClubLogoUrl, setNewClubLogoUrl] = useState('');
  const [newClubArena, setNewClubArena] = useState('');
  const [newClubAddress, setNewClubAddress] = useState('');
  const [newClubCity, setNewClubCity] = useState('Lomé');

  // Spécifique Joueur
  const [position, setPosition] = useState('Ailier');
  const [heightCm, setHeightCm] = useState('188');
  const [weightKg, setWeightKg] = useState('82');
  const [age, setAge] = useState('21');
  const [jerseyNumber, setJerseyNumber] = useState('10');

  // Spécifique Sponsor
  const [sponsorType, setSponsorType] = useState('Entreprise');
  const [sponsorDomain, setSponsorDomain] = useState('Sport & Équipement');
  const [sponsorBudget, setSponsorBudget] = useState('500000');
  const [sponsorTeamImmediate, setSponsorTeamImmediate] = useState(true);

  // Spécifique Candidat
  const [candidateCvUrl, setCandidateCvUrl] = useState('');
  const [candidateVideoUrl, setCandidateVideoUrl] = useState('');

  // États d'upload Cloudinary
  const [uploadingClubLogo, setUploadingClubLogo] = useState(false);
  const [uploadingCandidateCv, setUploadingCandidateCv] = useState(false);
  const [uploadingCandidateVideo, setUploadingCandidateVideo] = useState(false);

  // Derived: selected club object for preview
  const selectedClub = clubs.find(c => c.id === selectedClubId);

  const handleUploadClubLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingClubLogo(true);
      setError('');
      const res = await uploadMedia(file, 'firestone/clubs/logos');
      setNewClubLogoUrl(res.secure_url || res.url);
    } catch (err: any) {
      setError(err?.message || 'Échec du téléversement du logo sur Cloudinary.');
    } finally {
      setUploadingClubLogo(false);
    }
  };

  const handleUploadCandidateCv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCandidateCv(true);
      setError('');
      const res = await uploadMedia(file, 'firestone/academy/cv');
      setCandidateCvUrl(res.secure_url || res.url);
    } catch (err: any) {
      setError(err?.message || 'Échec du téléversement du document CV sur Cloudinary.');
    } finally {
      setUploadingCandidateCv(false);
    }
  };

  const handleUploadCandidateVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCandidateVideo(true);
      setError('');
      const res = await uploadMedia(file, 'firestone/academy/videos');
      setCandidateVideoUrl(res.secure_url || res.url);
    } catch (err: any) {
      setError(err?.message || 'Échec du téléversement de la vidéo sur Cloudinary.');
    } finally {
      setUploadingCandidateVideo(false);
    }
  };

  // Reset password
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [registeredSession, setRegisteredSession] = useState<AuthSessionPayload | null>(null);

  // Charger les clubs au montage
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setRegisterStep(1);
      setError('');
      setSubmittedMessage('');
      setRegisteredSession(null);

      setLoading(true);
      fetch(apiUrl('/clubs'))
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setClubs(data.map((c: any) => ({ id: c.id, name: c.name, city: c.city, logoUrl: c.logoUrl })));
            if (data.length > 0 && !selectedClubId) {
              setSelectedClubId(data[0].id);
            }
          }
        })
        .catch(() => {
          // Clubs par défaut de secours
          setClubs([
            { id: 'fire-stone-club', name: 'FIRE STONE Basketball Club', city: 'Lomé' },
            { id: 'eperviers-bbc', name: 'Éperviers BBC', city: 'Lomé' },
            { id: 'swallows-bbc', name: 'Swallows BBC', city: 'Lomé' },
            { id: 'kara-hawks', name: 'Kara Hawks BBC', city: 'Kara' },
          ]);
          setSelectedClubId('fire-stone-club');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, initialTab]);

  const resetAll = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setPhone('');
    setCity('Lomé');
    setCountry('Togo');
    setSelectedRole('PLAYER');
    setRegisterStep(1);
    setError('');
    setSubmittedMessage('');
    setRegisteredSession(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const passwordStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const map = [
      { level: 1, label: 'Faible', color: '#ef4444' },
      { level: 2, label: 'Moyen', color: '#f97316' },
      { level: 3, label: 'Fort', color: '#eab308' },
      { level: 4, label: 'Excellent', color: '#22c55e' },
    ];
    return map[Math.min(score - 1, 3)] || { level: 0, label: '', color: '' };
  };

  const pwdStrength = passwordStrength(password);

  if (!isOpen) return null;

  const handleLoginOrForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'FORGOT') {
        if (!resetToken) {
          const r = await fetch(apiUrl('/auth/forgot-password'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d?.error || 'Impossible d\'envoyer le code.');
          setResetToken(d?.resetToken || '');
          setSubmittedMessage(d?.message || 'Code généré avec succès.');
          return;
        }
        const r = await fetch(apiUrl('/auth/reset-password'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken || resetCode, newPassword }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d?.error || 'Erreur de réinitialisation.');
        setSubmittedMessage(d?.message || 'Mot de passe réinitialisé.');
        setTimeout(() => {
          setTab('LOGIN');
          setSubmittedMessage('');
        }, 1800);
        return;
      }

      // LOGIN
      const r = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Échec de connexion.');
      onLoginSuccess(d);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterFinal = async () => {
    setError('');
    setLoading(true);
    try {
      const payload: Record<string, any> = {
        name,
        email,
        password,
        role: selectedRole,
        phoneNumber: phone || undefined,
        city: city || 'Lomé',
        country: country || 'Togo',
      };

      // Configuration selon le rôle choisi
      if (selectedRole === 'CLUB_ADMIN') {
        payload.createClub = createClubMode;
        if (createClubMode) {
          payload.newClubData = {
            name: newClubName,
            logoUrl: newClubLogoUrl || undefined,
            arena: newClubArena || undefined,
            address: newClubAddress || undefined,
            city: newClubCity || city || 'Lomé',
            country: country || 'Togo',
          };
        } else {
          payload.clubId = selectedClubId || undefined;
        }
      } else if (selectedRole === 'COACH') {
        payload.clubId = selectedClubId || undefined;
        payload.experienceYears = parseInt(experienceYears) || 0;
        payload.certificates = certificates || undefined;
      } else if (selectedRole === 'PLAYER') {
        payload.clubId = selectedClubId || undefined;
        payload.position = position;
        payload.heightCm = parseInt(heightCm) || 185;
        payload.weightKg = parseInt(weightKg) || 78;
        payload.age = parseInt(age) || 20;
        payload.jerseyNumber = parseInt(jerseyNumber) || 0;
      } else if (selectedRole === 'SPONSOR') {
        payload.sponsorType = sponsorType;
        payload.sponsorDomain = sponsorDomain;
        payload.sponsorBudget = parseInt(sponsorBudget) || 0;
        payload.sponsorTeam = sponsorTeamImmediate;
        if (sponsorTeamImmediate) {
          payload.clubId = selectedClubId || undefined;
        }
      } else if (selectedRole === 'ACADEMY_CANDIDATE') {
        payload.clubId = selectedClubId || undefined;
        payload.candidateCvUrl = candidateCvUrl || undefined;
        payload.candidateVideoUrl = candidateVideoUrl || undefined;
        payload.position = position;
        payload.heightCm = parseInt(heightCm) || 180;
        payload.weightKg = parseInt(weightKg) || 70;
        payload.age = parseInt(age) || 17;
      }

      const r = await fetch(apiUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Échec de l\'inscription.');

      // Message de feedback officiel selon le cahier des charges
      const targetClubName = clubs.find((c) => c.id === selectedClubId)?.name || 'votre club';
      let message = d.message;
      if (!message) {
        if (selectedRole === 'COACH') {
          message = `Votre inscription en tant que COACH a été envoyée au club ${targetClubName} pour approbation.`;
        } else if (selectedRole === 'CLUB_ADMIN' && createClubMode) {
          message = `Bravo! Votre club ${newClubName} a été créé. Vous êtes administrateur. Logo importé & design system généré.`;
        } else if (selectedRole === 'PLAYER') {
          message = `Votre candidature a été envoyée au club. Vous serez notifié de la décision.`;
        } else if (selectedRole === 'SPONSOR') {
          message = `Vous êtes maintenant sponsor officiel de ${targetClubName}. Une notification d'annonce a été envoyée aux membres.`;
        } else if (selectedRole === 'ACADEMY_CANDIDATE') {
          message = `Votre candidature à l'académie a été envoyée au club. Vous serez notifié de la décision.`;
        } else {
          message = `Bienvenue sur HOOPER ! Votre compte est actif.`;
        }
      }

      setSubmittedMessage(message);
      setRegisteredSession(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  // Total steps depends on role
  const totalSteps = (selectedRole === 'SUPPORTER' || selectedRole === 'VISITOR') ? 3 : 4;

  const nextStep = () => {
    setError('');
    if (registerStep === 1) {
      setRegisterStep(2);
      return;
    }

    if (registerStep === 2) {
      if (!name.trim()) { setError('Le nom complet est obligatoire.'); return; }
      if (!email.trim() || !isValidEmail(email)) { setError('Veuillez saisir une adresse email valide.'); return; }
      if (!password.trim() || password.length < 8) { setError('Le mot de passe doit comporter au moins 8 caractères.'); return; }
      if (confirmPassword && confirmPassword !== password) { setError('Les mots de passe ne correspondent pas.'); return; }
      if (confirmPassword && confirmPassword === password) { /* ok */ }
      // Pour Supporter ou Visiteur : passe directement au récapitulatif
      if (selectedRole === 'SUPPORTER' || selectedRole === 'VISITOR') {
        setRegisterStep(3); // récapitulatif
        return;
      }
      setRegisterStep(3);
      return;
    }

    if (registerStep === 3) {
      if (selectedRole === 'CLUB_ADMIN' && createClubMode && !newClubName.trim()) {
        setError('Le nom du club est obligatoire pour la création.');
        return;
      }
      // Supporter/Visitor: step 3 is recap → submit directly
      if (selectedRole === 'SUPPORTER' || selectedRole === 'VISITOR') {
        handleRegisterFinal();
        return;
      }
      // Others: show recap step 4
      setRegisterStep(4);
      return;
    }

    if (registerStep === 4) {
      handleRegisterFinal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className={`rounded-2xl border border-white/10 bg-[#0C0F1A] w-full p-6 sm:p-8 space-y-5 relative max-h-[90vh] overflow-y-auto shadow-2xl transition-all ${
        tab === 'REGISTER' ? 'max-w-xl' : 'max-w-md'
      }`}>
        {/* Bouton Fermer */}
        <button
          onClick={() => {
            onClose();
            resetAll();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* En-tête officiel HOOPER */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-12 h-12 mx-auto rounded-xl overflow-hidden border border-white/15 shadow-md bg-black flex items-center justify-center">
            <img className="w-full h-full object-cover" src={logo} alt="HOOPER" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              {tab === 'LOGIN' ? 'Connexion' : tab === 'REGISTER' ? 'Créer un compte' : 'Mot de passe oublié'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {tab === 'LOGIN'
                ? 'Accédez à votre espace club, statistiques et vestiaire.'
                : tab === 'REGISTER'
                ? 'Rejoignez la plateforme officielle du basketball togolais.'
                : 'Saisissez votre email pour réinitialiser votre accès.'}
            </p>
          </div>
        </div>

        {/* Onglets Connexion / Inscription */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab('LOGIN');
              setError('');
              setSubmittedMessage('');
              setRegisteredSession(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${
              tab === 'LOGIN' || tab === 'FORGOT' ? 'bg-[#FF2A3B] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('REGISTER');
              setError('');
              setSubmittedMessage('');
              setRegisteredSession(null);
              setRegisterStep(1);
            }}
            className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${
              tab === 'REGISTER' ? 'bg-[#FF2A3B] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Inscription
          </button>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/40 p-3 rounded-xl text-xs text-red-200">
            {error}
          </div>
        )}

        {/* FEEDBACK IMMÉDIAT APRÈS SOUMISSION */}
        {submittedMessage ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-black text-white">Demande enregistrée !</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-medium bg-black/40 p-3 rounded-xl border border-emerald-500/20">
                {submittedMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (registeredSession) {
                  onLoginSuccess(registeredSession);
                  onClose();
                } else {
                  setTab('LOGIN');
                  setSubmittedMessage('');
                }
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Accéder à HOOPER maintenant →
            </button>
          </div>
        ) : tab === 'REGISTER' ? (
          /* WORKFLOW D'INSCRIPTION */
          <div className="space-y-5 text-xs">
            {/* Barre de progression */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                <span>
                  {registerStep === 1 && 'Étape 1 · Choix du profil'}
                  {registerStep === 2 && 'Étape 2 · Identifiants & Compte'}
                  {registerStep === 3 && (selectedRole === 'SUPPORTER' || selectedRole === 'VISITOR' ? 'Étape 3 · Confirmation' : 'Étape 3 · Fiche sportive & Club')}
                  {registerStep === 4 && 'Étape 4 · Récapitulatif'}
                </span>
                <span className="font-bold text-white font-mono">{registerStep}/{totalSteps}</span>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      i < registerStep ? 'bg-[#FF2A3B]' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                ÉCRAN 1 : CHOIX DU RÔLE
                ══════════════════════════════════════════════════════════════════ */}
            {registerStep === 1 && (
              <div className="space-y-3">
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-bold text-white">Sélectionnez votre profil d'accès</h4>
                  <p className="text-[11px] text-slate-400">
                    Votre vestiaire et vos outils seront configurés selon votre rôle.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {ROLES.map((r) => {
                    const isSelected = selectedRole === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setSelectedRole(r.value)}
                        className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer flex flex-col justify-between gap-2.5 relative ${
                          isSelected
                            ? 'border-[#FF2A3B] bg-[#FF2A3B]/10 text-white shadow-sm'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8 text-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className={isSelected ? 'text-[#FF2A3B]' : 'text-slate-300'}>{r.icon}</div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-[#FF2A3B] text-white'
                                : 'bg-white/10 text-slate-400'
                            }`}
                          >
                            {r.badge}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{r.label}</div>
                          <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{r.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                ÉCRAN 2 : INFORMATIONS PERSONNELLES & COMPTE (SECTION 3.2)
                ══════════════════════════════════════════════════════════════════ */}
            {registerStep === 2 && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-[#FF2A3B]" />
                    Vos Coordonnées & Identifiants
                  </h4>
                  <span className="text-[10px] text-slate-400 bg-white/10 px-2.5 py-0.5 rounded-full font-bold">
                    Profil : {ROLES.find((r) => r.value === selectedRole)?.label}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nom complet *</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Marcus Vance"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Adresse Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="nom@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Mot de passe *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="8 caractères minimum"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input"
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {pwdStrength.level > 0 && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex gap-1 h-1">
                        {[1, 2, 3, 4].map(lvl => (
                          <div key={lvl} className="flex-1 rounded-full transition-all" style={{
                            backgroundColor: lvl <= pwdStrength.level ? pwdStrength.color : 'rgba(255,255,255,0.1)'
                          }} />
                        ))}
                      </div>
                      <p className="text-[10px]" style={{ color: pwdStrength.color }}>Sécurité : {pwdStrength.label}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Répétez le mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl glass-input ${confirmPassword && confirmPassword !== password ? 'border-red-500/50' : ''
                        }`}
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Les mots de passe ne correspondent pas
                    </p>
                  )}
                  {confirmPassword && confirmPassword === password && (
                    <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Mots de passe identiques
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Téléphone</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        placeholder="+228 90 00 00 00"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Ville</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Lomé"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                ÉCRAN 3 : FORMULAIRE CONTEXTUALISÉ SELON LE RÔLE (SECTION 2 & 3)
                ══════════════════════════════════════════════════════════════════ */}
            {registerStep === 3 && (
              <div className="space-y-4">
                {/* ─── 1. DIRIGEANT : Créer club ou rejoindre ─────────────────── */}
                {selectedRole === 'CLUB_ADMIN' && (
                  <div className="space-y-3.5">
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#FFB800]" />
                      Gestion de Club & Administration
                    </h4>

                    {/* Question clé : Créer un nouveau club ? */}
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
                      <label className="block text-slate-200 font-bold text-xs">
                        Voulez-vous créer un nouveau club sur HOOPER ?
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCreateClubMode(true)}
                          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all ${createClubMode
                            ? 'bg-[#FF2A3B] text-white shadow-md'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                        >
                          Oui, créer mon club
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreateClubMode(false)}
                          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all ${!createClubMode
                            ? 'bg-[#FF2A3B] text-white shadow-md'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                        >
                          Non, rejoindre un club
                        </button>
                      </div>
                    </div>

                    {createClubMode ? (
                      <div className="space-y-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                        <div>
                          <label className="block text-slate-300 font-medium mb-1">Nom officiel du club *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Éperviers BBC Elite"
                            value={newClubName}
                            onChange={(e) => setNewClubName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl glass-input"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-slate-300 font-medium">Logo officiel du club</label>
                            <label className="text-[11px] text-slate-400 hover:text-white cursor-pointer flex items-center gap-1 font-semibold transition-colors">
                              {uploadingClubLogo ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Téléversement...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3 h-3" />
                                  <span>Importer un fichier</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                disabled={uploadingClubLogo}
                                onChange={handleUploadClubLogo}
                              />
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            {newClubLogoUrl && (
                              <img
                                src={newClubLogoUrl}
                                alt="Aperçu logo"
                                className="w-9 h-9 rounded-xl object-contain bg-white/10 border border-white/20 shrink-0"
                              />
                            )}
                            <input
                              type="text"
                              placeholder="URL du logo ou importez un fichier"
                              value={newClubLogoUrl}
                              onChange={(e) => setNewClubLogoUrl(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-slate-300 font-medium mb-1">Salle / Terrain</label>
                            <input
                              type="text"
                              placeholder="Stade omnisports"
                              value={newClubArena}
                              onChange={(e) => setNewClubArena(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl glass-input"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 font-medium mb-1">Ville du club</label>
                            <input
                              type="text"
                              placeholder="Lomé"
                              value={newClubCity}
                              onChange={(e) => setNewClubCity(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl glass-input"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-slate-300 font-medium mb-1">Adresse / Siège du club</label>
                          <input
                            type="text"
                            placeholder="Boulevard du Mono, Nyékonakpoé"
                            value={newClubAddress}
                            onChange={(e) => setNewClubAddress(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl glass-input"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Sélectionnez le club à rejoindre *</label>
                        <select
                          value={selectedClubId}
                          onChange={(e) => setSelectedClubId(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl glass-input"
                        >
                          {clubs.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.city || 'Togo'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── 2. COACH : Sélection club + Expérience ─────────────────── */}
                {selectedRole === 'COACH' && (
                  <div className="space-y-3.5">
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-[#FF2A3B]" />
                      Affiliation Club & Qualifications
                    </h4>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Club affilié *</label>
                      <select
                        value={selectedClubId}
                        onChange={(e) => setSelectedClubId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl glass-input"
                      >
                        {clubs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.city || 'Togo'})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-amber-300/90 mt-1">
                        Demande transmise avec statut PENDING à l'administrateur du club.
                      </p>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Années d'expérience de coaching</label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl glass-input"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Diplômes & Certifications FIBA</label>
                      <input
                        type="text"
                        placeholder="Ex: Brevet d'État, Licence FIBA Niveau 2"
                        value={certificates}
                        onChange={(e) => setCertificates(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl glass-input"
                      />
                    </div>
                  </div>
                )}

                {/* ─── 3. JOUEUR : Fiche sportive + Club ──────────────────────── */}
                {selectedRole === 'PLAYER' && (
                  <div className="space-y-3.5">
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-[#FF2A3B]" />
                      Fiche Sportive & Club
                    </h4>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Club affilié *</label>
                      <select
                        value={selectedClubId}
                        onChange={(e) => setSelectedClubId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl glass-input"
                      >
                        {clubs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.city || 'Togo'})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Poste de jeu</label>
                        <select
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl glass-input"
                        >
                          {POSITIONS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Numéro maillot</label>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={jerseyNumber}
                          onChange={(e) => setJerseyNumber(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl glass-input"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Taille (cm)</label>
                        <input
                          type="number"
                          min="150"
                          max="250"
                          value={heightCm}
                          onChange={(e) => setHeightCm(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl glass-input"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Poids (kg)</label>
                        <input
                          type="number"
                          min="40"
                          max="180"
                          value={weightKg}
                          onChange={(e) => setWeightKg(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl glass-input"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Âge</label>
                        <input
                          type="number"
                          min="14"
                          max="50"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl glass-input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── 4. SPONSOR : Formulaire Partenaire ──────────────────────── */}
                {selectedRole === 'SPONSOR' && (
                  <div className="space-y-3.5">
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Handshake className="w-4 h-4 text-[#FFB800]" />
                      Partenariat & Sponsoring
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Type d'entité</label>
                        <select
                          value={sponsorType}
                          onChange={(e) => setSponsorType(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl glass-input"
                        >
                          <option value="Entreprise">Entreprise</option>
                          <option value="Marque Sportive">Marque Sportive</option>
                          <option value="Institution">Institution</option>
                          <option value="Particulier">Mécène Particulier</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Secteur</label>
                        <input
                          type="text"
                          value={sponsorDomain}
                          onChange={(e) => setSponsorDomain(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl glass-input"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Budget annuel indicatif (XOF)</label>
                      <input
                        type="number"
                        step="50000"
                        value={sponsorBudget}
                        onChange={(e) => setSponsorBudget(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl glass-input"
                      />
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-200 font-bold text-xs">
                          Voulez-vous sponsoriser un club dès maintenant ?
                        </label>
                        <input
                          type="checkbox"
                          checked={sponsorTeamImmediate}
                          onChange={(e) => setSponsorTeamImmediate(e.target.checked)}
                          className="w-4 h-4 rounded text-[#FF2A3B] cursor-pointer"
                        />
                      </div>
                      {sponsorTeamImmediate && (
                        <div>
                          <label className="block text-slate-400 text-[11px] mb-1">Club à sponsoriser :</label>
                          <select
                            value={selectedClubId}
                            onChange={(e) => setSelectedClubId(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                          >
                            {clubs.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} — {c.city || 'Togo'}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── 5. CANDIDAT ACADÉMIE ───────────────────────────────────── */}
                {selectedRole === 'ACADEMY_CANDIDATE' && (
                  <div className="space-y-3.5">
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Star className="w-4 h-4 text-[#FFB800]" />
                      Candidature Centre de Formation
                    </h4>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Académie / Club visé *</label>
                      <select
                        value={selectedClubId}
                        onChange={(e) => setSelectedClubId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl glass-input"
                      >
                        {clubs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} — Centre de formation
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-300 font-medium">Vidéo de vos performances</label>
                        <label className="text-[11px] text-amber-300 hover:text-amber-200 cursor-pointer flex items-center gap-1 font-semibold">
                          {uploadingCandidateVideo ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Téléversement CDN...</span>
                            </>
                          ) : (
                            <>
                              <Video className="w-3 h-3" />
                              <span>Uploader vidéo (Cloudinary)</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="video/mp4,video/quicktime,video/webm"
                            className="hidden"
                            disabled={uploadingCandidateVideo}
                            onChange={handleUploadCandidateVideo}
                          />
                        </label>
                      </div>
                      <input
                        type="url"
                        placeholder="https://... (Cloudinary, YouTube, Drive)"
                        value={candidateVideoUrl}
                        onChange={(e) => setCandidateVideoUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-300 font-medium">CV sportif ou dossier PDF</label>
                        <label className="text-[11px] text-amber-300 hover:text-amber-200 cursor-pointer flex items-center gap-1 font-semibold">
                          {uploadingCandidateCv ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Téléversement CDN...</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-3 h-3" />
                              <span>Uploader document (Cloudinary)</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,image/*"
                            className="hidden"
                            disabled={uploadingCandidateCv}
                            onChange={handleUploadCandidateCv}
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="https://... ou téléversez un PDF"
                        value={candidateCvUrl}
                        onChange={(e) => setCandidateCvUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                ÉCRAN 4 : RÉCAPITULATIF AVANT SOUMISSION
                ══════════════════════════════════════════════════════════════════ */}
            {registerStep === 4 && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-black text-white flex items-center justify-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                    Récapitulatif de votre inscription
                  </h4>
                  <p className="text-[11px] text-slate-400">Vérifiez vos informations avant de valider.</p>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    { label: 'Rôle', value: ROLES.find(r => r.value === selectedRole)?.label },
                    { label: 'Nom', value: name },
                    { label: 'Email', value: email },
                    { label: 'Ville', value: city },
                    phone && { label: 'Téléphone', value: phone },
                    selectedRole === 'COACH' && { label: 'Expérience', value: `${experienceYears} ans` },
                    selectedRole === 'COACH' && certificates && { label: 'Certifications', value: certificates },
                    selectedRole === 'PLAYER' && { label: 'Poste', value: `${position} — #${jerseyNumber}` },
                    selectedRole === 'PLAYER' && { label: 'Gabarit', value: `${heightCm} cm · ${weightKg} kg · ${age} ans` },
                    selectedRole === 'SPONSOR' && { label: 'Type sponsor', value: `${sponsorType} — ${sponsorDomain}` },
                    selectedRole === 'SPONSOR' && { label: 'Budget', value: `${Number(sponsorBudget).toLocaleString('fr-FR')} XOF` },
                    (selectedRole !== 'CLUB_ADMIN' || !createClubMode) && selectedClub && { label: 'Club', value: `${selectedClub.name} (${selectedClub.city || 'Togo'})` },
                    selectedRole === 'CLUB_ADMIN' && createClubMode && { label: 'Nouveau club', value: newClubName },
                  ].filter(Boolean).map((row: any, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                      <span className="text-slate-400 font-medium">{row.label}</span>
                      <span className="text-white font-bold text-right max-w-[60%] truncate">{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Club preview card */}
                {selectedClub && (selectedRole === 'PLAYER' || selectedRole === 'COACH' || selectedRole === 'ACADEMY_CANDIDATE' || (selectedRole === 'SPONSOR' && sponsorTeamImmediate)) && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                    {selectedClub.logoUrl ? (
                      <img src={selectedClub.logoUrl} alt={selectedClub.name} className="w-10 h-10 rounded-xl object-contain bg-white/10 border border-white/10 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 text-lg">🏀</div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-white">{selectedClub.name}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{selectedClub.city || 'Togo'}</p>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-[11px] text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  En cliquant sur « Valider mon Inscription », vous acceptez les conditions d'utilisation de la plateforme HOOPER.
                </div>
              </div>
            )}

            {/* Navigation entre étapes */}
            <div className="flex gap-2.5 pt-2">
              {registerStep > 1 && (
                <button
                  type="button"
                  onClick={() => setRegisterStep((s) => s - 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/10 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Retour
                </button>
              )}
              <button
                type="button"
                onClick={nextStep}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-[#FF2A3B] hover:bg-[#e6001f] text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Traitement...</>
                ) : registerStep < totalSteps ? (
                  <>Continuer <ChevronRight className="w-4 h-4" /></>
                ) : (
                  <>Valider l'inscription <CheckCircle className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* FORMULAIRE CONNEXION / RÉCUPÉRATION */
          <form onSubmit={handleLoginOrForgot} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Adresse Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input"
                />
              </div>
            </div>

            {tab === 'FORGOT' && resetToken ? (
              <>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Code de vérification</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Code reçu par email"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nouveau mot de passe</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="8 caractères minimum"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input"
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-medium">
                    {tab === 'FORGOT' ? 'Adresse Email (saisie ci-dessus)' : 'Mot de passe'}
                  </label>
                  {tab === 'LOGIN' && (
                    <button
                      type="button"
                      onClick={() => { setTab('FORGOT'); setError(''); setSubmittedMessage(''); }}
                      className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                {tab === 'LOGIN' && (
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input"
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#FF2A3B] hover:bg-[#e6001f] text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</>
              ) : tab === 'LOGIN' ? (
                'Se connecter'
              ) : resetToken ? (
                'Valider le nouveau mot de passe'
              ) : (
                'Envoyer le code de réinitialisation'
              )}
            </button>

            {tab === 'FORGOT' && !resetToken && (
              <button
                type="button"
                onClick={() => { setTab('LOGIN'); setError(''); setSubmittedMessage(''); }}
                className="w-full text-center text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer py-1"
              >
                ← Retour à la connexion
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
