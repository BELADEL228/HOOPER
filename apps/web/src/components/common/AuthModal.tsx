import React, { useEffect, useState } from 'react';
import type { UserRole } from '../../types';
import { Icon, ClipboardList, Building2, Handshake, Heart, Star, X, Lock, Mail, User as UserIcon, CheckCircle, Phone, MapPin, ChevronRight, ChevronLeft } from 'lucide-react';
import { basketball } from '@lucide/lab';
import { apiUrl } from '../../services/api';
import logo from '../../assets/logo.jpeg';

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
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: AuthSessionPayload) => void;
  initialTab?: 'LOGIN' | 'REGISTER' | 'FORGOT';   // ✅ nouveau
}

const ROLES: { value: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    value: 'PLAYER',
    label: 'Joueur',
    icon: <Icon iconNode={basketball} className="w-6 h-6" />,
    desc: 'Je joue au basketball dans un club'
  },
  {
    value: 'COACH',
    label: 'Coach / Staff',
    icon: <ClipboardList className="w-6 h-6" />,
    desc: 'Entraineur ou membre du staff technique'
  },
  {
    value: 'CLUB_MANAGER',
    label: 'Dirigeant de Club',
    icon: <Building2 className="w-6 h-6" />,
    desc: 'Je gere un club ou une association'
  },
  {
    value: 'SPONSOR',
    label: 'Partenaire / Sponsor',
    icon: <Handshake className="w-6 h-6" />,
    desc: 'Entreprise ou sponsor officiel'
  },
  {
    value: 'VISITOR',
    label: 'Supporter / Fan',
    icon: <Heart className="w-6 h-6" />,
    desc: 'Je suis passionné de basketball'
  },
  {
    value: 'ACADEMY_CANDIDATE',
    label: 'Candidat Académie',
    icon: <Star className="w-6 h-6" />,
    desc: 'Je postule a une académie de formation'
  },
];

const POSITIONS = ['Meneur', 'Arrière', 'Ailier', 'Ailier Fort', 'Pivot'];

const validateSportData = (data: { position?: string; height?: string; weight?: string; age?: string }): { valid: boolean; error?: string } => {
  if (data.height) {
    const heightNum = parseInt(data.height);
    if (isNaN(heightNum) || heightNum < 150 || heightNum > 250) {
      return { valid: false, error: 'La taille doit être entre 150cm et 250cm.' };
    }
  }

  if (data.weight) {
    const weightNum = parseInt(data.weight);
    if (isNaN(weightNum) || weightNum < 40 || weightNum > 200) {
      return { valid: false, error: 'Le poids doit être entre 40kg et 200kg.' };
    }
  }

  if (data.age) {
    const ageNum = parseInt(data.age);
    if (isNaN(ageNum) || ageNum < 14 || ageNum > 50) {
      return { valid: false, error: 'L\'âge doit être entre 14 et 50 ans.' };
    }
  }

  return { valid: true };
};


export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialTab = 'LOGIN',
}) => {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>(initialTab);
  const [registerStep, setRegisterStep] = useState(1);

  // Step 1 - Compte
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Step 2 - Contact & Localisation
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  // Step 3 - Role
  const [selectedRole, setSelectedRole] = useState<UserRole>('PLAYER');

  // Step 4 - Infos sportives (conditionnelles selon le role)
  const [position, setPosition] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');

  // Reset password
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState('');
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setRegisterStep(1);
      setError('');
      setSubmittedMessage('');
    }
  }, [isOpen, initialTab]);
  const resetAll = () => {
    setEmail(''); setPassword(''); setName(''); setPhone(''); setCity(''); setCountry('');
    setSelectedRole('PLAYER'); setPosition(''); setHeight(''); setWeight(''); setAge('');
    setResetCode(''); setNewPassword(''); setResetToken('');
    setError(''); setSubmittedMessage(''); setRegisterStep(1);
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
  const needsSportInfo = ['PLAYER', 'COACH', 'ACADEMY_CANDIDATE'].includes(selectedRole);
  const needsOrgInfo = ['CLUB_MANAGER', 'SPONSOR'].includes(selectedRole);
  const totalSteps = (needsSportInfo || needsOrgInfo) ? 4 : 3;

  if (!isOpen) return null;

  const handleLoginOrForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'FORGOT') {
        if (!resetToken) {
          const r = await fetch(apiUrl('/auth/forgot-password'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
          const d = await r.json();
          if (!r.ok) throw new Error(d?.error || 'Impossible d\'envoyer le code.');
          setResetToken(d?.resetToken || '');
          setSubmittedMessage(d?.message || 'Code genere.');
          return;
        }
        const r = await fetch(apiUrl('/auth/reset-password'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: resetToken || resetCode, newPassword }) });
        const d = await r.json();
        if (!r.ok) throw new Error(d?.error || 'Erreur de reinitialisation.');
        setSubmittedMessage(d?.message || 'Mot de passe reinitialise.');
        setTimeout(() => { setTab('LOGIN'); setSubmittedMessage(''); }, 1800);
        return;
      }
      const r = await fetch(apiUrl('/auth/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Echec de connexion.');
      onLoginSuccess(d);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterFinal = async () => {
    setError('');
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { name, email, password, role: selectedRole };
      if (phone) payload.phone = phone;
      if (city) payload.city = city;
      if (country) payload.country = country;
      if (position) payload.position = position;
      if (height) payload.height = height;
      if (weight) payload.weight = weight;
      if (age) payload.age = parseInt(age);

      const r = await fetch(apiUrl('/auth/register'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Echec de l\'inscription.');
      setSubmittedMessage('Compte cree avec succes ! Vous pouvez maintenant vous connecter.');
      setTimeout(() => { setTab('LOGIN'); setSubmittedMessage(''); setRegisterStep(1); }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setError('');
    if (registerStep === 1 && (!name.trim() || !email.trim() || !password.trim())) { setError('Veuillez remplir tous les champs obligatoires.'); return; }

    if (registerStep === 4 && needsSportInfo) {
      const validation = validateSportData({ position, height, weight, age });
      if (!validation.valid) {
        setError(validation.error || 'Données sportives invalides.');
        return;
      }
    }

    if (registerStep < totalSteps) setRegisterStep((s) => s + 1);
    else handleRegisterFinal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel rounded-3xl border border-white/20 max-w-md w-full p-6 sm:p-8 space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button onClick={() => { onClose(); resetAll(); }} className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black flex items-center justify-center">
            <img
              className="w-full h-full object-cover"
              src={logo}
              alt="HOOPER"
            />
          </div>
          <h3 className="text-2xl font-black text-white">
            {tab === 'LOGIN' ? 'Bienvenue' : tab === 'REGISTER' ? 'Rejoindre la Ligue' : 'Récupérer l\'Accès'}
          </h3>
          <p className="text-xs text-slate-400">Plateforme officielle de basketball professionnel</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
          {(['LOGIN', 'REGISTER', 'FORGOT'] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); resetAll(); }}
              className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${tab === t ? 'bg-[#FF2A3B] text-white shadow-md' : 'text-slate-300 hover:text-white'}`}>
              {t === 'LOGIN' ? 'Connexion' : t === 'REGISTER' ? 'Inscription' : 'Oublié'}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-500/15 border border-red-500/40 p-3 rounded-xl text-xs text-red-200">{error}</div>}

        {submittedMessage ? (
          <div className="bg-emerald-500/20 border border-emerald-500/40 p-5 rounded-2xl text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm text-slate-200">{submittedMessage}</p>
          </div>
        ) : tab === 'REGISTER' ? (
          /* REGISTER : Formulaire progressif multi-étapes */
          <div className="space-y-5 text-xs">
            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>Étape {registerStep} / {totalSteps}</span>
                <span>{Math.round((registerStep / totalSteps) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#FF2A3B] to-[#FFB800] rounded-full transition-all duration-500" style={{ width: `${(registerStep / totalSteps) * 100}%` }} />
              </div>
            </div>

            {/* STEP 1 : Compte */}
            {registerStep === 1 && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-white">👤 Informations de compte</h4>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nom complet *</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input type="text" required placeholder="Marcus Vance" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input" />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input type="email" required placeholder="joueur@basket.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input" />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Mot de passe *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input" />
                  </div>
                  {pwdStrength.level > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(pwdStrength.level / 4) * 100}%`, backgroundColor: pwdStrength.color }} />
                      </div>
                      <p className="text-[10px]" style={{ color: pwdStrength.color }}>Force : {pwdStrength.label}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2 : Contact & Localisation */}
            {registerStep === 2 && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-white">📍 Contact & Localisation</h4>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Téléphone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input type="tel" placeholder="+228 79 83 30 34" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input" />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Ville</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input type="text" placeholder="Lomé" value={city} onChange={(e) => setCity(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input" />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Pays</label>
                  <input type="text" placeholder="Togo" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-4 py-2.5 rounded-xl glass-input" />
                </div>
              </div>
            )}

            {/* STEP 3 : Rôle */}
            {registerStep === 3 && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-white">🎯 Votre Profil</h4>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((r) => (
                    <button key={r.value} type="button" onClick={() => setSelectedRole(r.value)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${selectedRole === r.value ? 'border-[#FF2A3B] bg-[#FF2A3B]/15' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                      <div className="text-xl">{r.icon}</div>
                      <div className="font-bold text-white text-[11px]">{r.label}</div>
                      <div className="text-[9px] text-slate-400 leading-relaxed">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4 : Infos sportives ou org */}
            {registerStep === 4 && needsSportInfo && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-white">🏀 Profil Sportif</h4>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Poste préféré</label>
                  <select value={position} onChange={(e) => setPosition(e.target.value)} className="w-full px-4 py-2.5 rounded-xl glass-input">
                    <option value="">— Sélectionner un poste —</option>
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Taille</label>
                    <input type="text" placeholder="1m88" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full px-3 py-2.5 rounded-xl glass-input" />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Poids</label>
                    <input type="text" placeholder="84 kg" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full px-3 py-2.5 rounded-xl glass-input" />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Âge</label>
                    <input type="number" placeholder="22" min="14" max="50" value={age} onChange={(e) => setAge(e.target.value)} className="w-full px-3 py-2.5 rounded-xl glass-input" />
                  </div>
                </div>
              </div>
            )}

            {registerStep === 4 && needsOrgInfo && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-white">🏛️ Organisation</h4>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-sm text-emerald-200">
                  <p>Vous pourrez créer ou rejoindre un club après votre inscription via le formulaire de demande de club.</p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              {registerStep > 1 && (
                <button type="button" onClick={() => setRegisterStep((s) => s - 1)} className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/10 transition-all cursor-pointer">
                  <ChevronLeft className="w-4 h-4" /> Retour
                </button>
              )}
              <button type="button" onClick={nextStep} disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#E60023] text-white font-bold text-sm shadow-lg shadow-red-500/25 hover:scale-[1.01] transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer">
                {loading ? 'Traitement...' : registerStep < totalSteps ? (<>Suite <ChevronRight className="w-4 h-4" /></>) : 'Créer mon Compte 🎉'}
              </button>
            </div>
          </div>
        ) : (
          /* LOGIN / FORGOT */
          <form onSubmit={handleLoginOrForgot} className="space-y-4 text-xs">
            {tab === 'FORGOT' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">Email du compte</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input type="email" required placeholder="joueur@basket.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input" disabled={Boolean(resetToken)} />
                </div>
              </div>
            )}
            {tab !== 'FORGOT' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input type="email" required placeholder="joueur@basket.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input" />
                </div>
              </div>
            )}
            {tab === 'FORGOT' && resetToken && (
              <>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Code de vérification</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input type="text" required placeholder="Code reçu" value={resetCode} onChange={(e) => setResetCode(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input" />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nouveau mot de passe</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input type="password" required placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input" />
                  </div>
                </div>
              </>
            )}
            {tab !== 'FORGOT' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input" />
                </div>
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#E60023] text-white font-bold text-sm shadow-lg shadow-red-500/25 hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              {loading ? 'Chargement...' : tab === 'LOGIN' ? 'Se Connecter' : resetToken ? 'Valider le code' : 'Envoyer le code'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
