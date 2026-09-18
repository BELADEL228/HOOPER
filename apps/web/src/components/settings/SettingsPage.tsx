import React, { useState, useRef, useCallback } from 'react';
import {
  User, Lock, Shield, Bell, Palette, Building2, HelpCircle,
  ChevronDown, ChevronUp, Upload, Loader2, CheckCircle2, AlertCircle,
  Eye, EyeOff, Trash2, ExternalLink, MessageSquare, Heart, UserPlus,
  AtSign, Sun, Moon, Globe, Users, UserCheck, X
} from 'lucide-react';
import { apiUrl } from '../../services/api';

// ─── Types ──────────────────────────────────────────────────────────────────
interface SettingsPageProps {
  authUser: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
  currentRole: string;
  onUserUpdate: (user: any) => void;
  onNavigateToProfile?: () => void;
  onLogout?: () => void;
  onSwitchToWorkspace?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getToken = (): string => {
  try { return JSON.parse(localStorage.getItem('firestone-auth') || '{}')?.token || ''; }
  catch { return ''; }
};

// ─── Toast local ─────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error';
interface Toast { id: number; msg: string; type: ToastType; }

// ─── Compressor image ────────────────────────────────────────────────────────
const compressAvatar = (file: File, maxPx = 400, quality = 0.88): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height, maxPx);
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ─── Section accordéon ───────────────────────────────────────────────────────
interface SectionProps {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  accent?: string;
}

const Section: React.FC<SectionProps> = ({ title, subtitle, icon, isOpen, onToggle, children, accent = '#FF2A3B' }) => (
  <div className="rounded-2xl bg-[#0E121B] border border-white/8 overflow-hidden transition-all duration-200">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/4 transition-colors cursor-pointer text-left"
    >
      <span className="p-2 rounded-xl shrink-0" style={{ background: `${accent}20`, color: accent }}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>
      </div>
      {isOpen
        ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
    </button>
    {isOpen && (
      <div className="px-5 pb-5 pt-1 border-t border-white/8 space-y-4 animate-in slide-in-from-top-2 duration-150">
        {children}
      </div>
    )}
  </div>
);

// ─── Champ de formulaire ──────────────────────────────────────────────────────
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

const inputClass = "w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF2A3B] transition-colors";
const btnPrimary = "flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#E60023] text-white text-sm font-bold shadow-md hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40";
const btnSecondary = "flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 border border-white/10 text-sm text-slate-300 hover:bg-white/15 transition-colors cursor-pointer";

// ─── Toggle switch ────────────────────────────────────────────────────────────
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }> = ({ checked, onChange, label, description }) => (
  <label className="flex items-center justify-between gap-4 py-2 cursor-pointer group">
    <div>
      <p className="text-sm text-white group-hover:text-slate-200 transition-colors">{label}</p>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    <div
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#FF2A3B]' : 'bg-white/15'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  </label>
);

// ─── Sélecteur de visibilité ──────────────────────────────────────────────────
const VisibilitySelect: React.FC<{ value: string; onChange: (v: string) => void; label: string; description?: string }> = ({ value, onChange, label, description }) => (
  <div className="space-y-1.5">
    <div>
      <p className="text-sm text-white">{label}</p>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    <div className="flex gap-2 flex-wrap">
      {[
        { val: 'PUBLIC', label: 'Public', icon: Globe },
        { val: 'FOLLOWERS', label: 'Abonnés', icon: Users },
        { val: 'PRIVATE', label: 'Privé', icon: UserCheck },
      ].map(({ val, label: lbl, icon: Icon }) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            value === val
              ? 'bg-[#FF2A3B] border-[#FF2A3B] text-white'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {lbl}
        </button>
      ))}
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export const SettingsPage: React.FC<SettingsPageProps> = ({
  authUser,
  onUserUpdate,
  onNavigateToProfile,
  onLogout,
  onSwitchToWorkspace,
  theme,
  onToggleTheme,
}) => {
  const [openSection, setOpenSection] = useState<string | null>('compte');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  // ── Section Compte ────────────────────────────────────────────────────────
  const [name, setName] = useState(authUser?.name || '');
  const [email, setEmail] = useState(authUser?.email || '');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(authUser?.avatarUrl || null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Section Mot de passe ──────────────────────────────────────────────────
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // ── Section Confidentialité ───────────────────────────────────────────────
  const [profileVisibility, setProfileVisibility] = useState('PUBLIC');
  const [statsVisibility, setStatsVisibility] = useState('PUBLIC');
  const [messagePrivacy, setMessagePrivacy] = useState('FOLLOWERS');
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // ── Section Notifications ─────────────────────────────────────────────────
  const [notifLikes, setNotifLikes] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifFollows, setNotifFollows] = useState(true);
  const [notifMentions, setNotifMentions] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifMatchResults, setNotifMatchResults] = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);

  // ── Suppression compte ────────────────────────────────────────────────────
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Helpers toasts ────────────────────────────────────────────────────────
  const pushToast = useCallback((msg: string, type: ToastType = 'success') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const toggle = (id: string) => setOpenSection((prev) => (prev === id ? null : id));

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressAvatar(file);
      setAvatarPreview(b64);
      setAvatarBase64(b64);
    } catch {
      pushToast('Impossible de charger cette image.', 'error');
    }
  };

  // ── Sauvegarder profil ────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!authUser) return;
    setSavingProfile(true);
    try {
      const token = getToken();
      const body: Record<string, any> = { name: name.trim(), email: email.trim() };
      if (city.trim()) body.city = city.trim();
      if (bio.trim()) body.bio = bio.trim();
      if (avatarBase64) body.avatarUrl = avatarBase64;

      const res = await fetch(apiUrl('/auth/profile'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur lors de la mise à jour.');
      onUserUpdate(data.user || { ...authUser, ...body });
      setAvatarBase64(null);
      pushToast('Profil mis à jour avec succès !');
    } catch (err: any) {
      pushToast(err.message || 'Erreur inattendue.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Changer mot de passe ──────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (newPwd !== confirmPwd) { pushToast('Les mots de passe ne correspondent pas.', 'error'); return; }
    if (newPwd.length < 8) { pushToast('Minimum 8 caractères.', 'error'); return; }
    setSavingPwd(true);
    try {
      const token = getToken();
      const res = await fetch(apiUrl('/auth/change-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Mot de passe actuel incorrect.');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      pushToast('Mot de passe changé !');
    } catch (err: any) {
      pushToast(err.message || 'Erreur.', 'error');
    } finally {
      setSavingPwd(false);
    }
  };

  // ── Sauvegarder confidentialité ───────────────────────────────────────────
  const handleSavePrivacy = async () => {
    setSavingPrivacy(true);
    // Persister localement pour l'instant (backend à brancher)
    try {
      localStorage.setItem('firestone-privacy', JSON.stringify({ profileVisibility, statsVisibility, messagePrivacy }));
      await new Promise(r => setTimeout(r, 500));
      pushToast('Paramètres de confidentialité enregistrés !');
    } finally {
      setSavingPrivacy(false);
    }
  };

  // ── Sauvegarder notifications ─────────────────────────────────────────────
  const handleSaveNotifications = async () => {
    setSavingNotifs(true);
    try {
      localStorage.setItem('firestone-notifs', JSON.stringify({ notifLikes, notifComments, notifFollows, notifMentions, notifMessages, notifMatchResults }));
      await new Promise(r => setTimeout(r, 400));
      pushToast('Préférences de notification enregistrées !');
    } finally {
      setSavingNotifs(false);
    }
  };

  if (!authUser) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <Shield className="w-12 h-12 text-slate-600" />
        <p className="text-slate-400 text-sm">Tu dois être connecté pour accéder aux paramètres.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-0 pb-16 space-y-3 relative">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold pointer-events-auto border animate-in slide-in-from-right duration-200 ${
              t.type === 'success'
                ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950 border-red-500/40 text-red-300'
            }`}
          >
            {t.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {t.msg}
          </div>
        ))}
      </div>

      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Paramètres</h1>
        <p className="text-sm text-slate-500 mt-1">Gérez votre compte, votre confidentialité et vos préférences.</p>
      </div>

      {/* ── SECTION 1 : Compte ── */}
      <Section
        id="compte"
        title="Compte"
        subtitle={`${authUser.name} · ${authUser.email}`}
        icon={<User className="w-4 h-4" />}
        isOpen={openSection === 'compte'}
        onToggle={() => toggle('compte')}
        accent="#FF2A3B"
      >
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={avatarPreview || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
              alt="Avatar"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/15 bg-slate-800"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full bg-[#FF2A3B] text-white shadow-md hover:bg-[#FF4555] transition-colors cursor-pointer"
            >
              <Upload className="w-3 h-3" />
            </button>
          </div>
          <div className="text-xs text-slate-500 space-y-0.5">
            <p className="font-semibold text-slate-300">Photo de profil</p>
            <p>JPG, PNG ou WEBP · max 5 Mo</p>
            <p>Recadrée en carré (400×400px)</p>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nom complet">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Ton nom" />
          </Field>
          <Field label="Email">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={inputClass} placeholder="email@exemple.com" />
          </Field>
          <Field label="Ville">
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="Lomé, Abidjan..." />
          </Field>
          <Field label="Bio courte">
            <input value={bio} onChange={(e) => setBio(e.target.value)} className={inputClass} placeholder="PG | Joueur de rue | Basketball lover" />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          {onNavigateToProfile && (
            <button type="button" onClick={onNavigateToProfile} className={btnSecondary}>
              <ExternalLink className="w-3.5 h-3.5" /> Voir mon profil
            </button>
          )}
          <button type="button" onClick={handleSaveProfile} disabled={savingProfile} className={btnPrimary}>
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </Section>

      {/* ── SECTION 2 : Sécurité / Mot de passe ── */}
      <Section
        id="securite"
        title="Sécurité"
        subtitle="Mot de passe et accès au compte"
        icon={<Lock className="w-4 h-4" />}
        isOpen={openSection === 'securite'}
        onToggle={() => toggle('securite')}
        accent="#FFB800"
      >
        <div className="space-y-3">
          <Field label="Mot de passe actuel">
            <div className="relative">
              <input
                type={showCurrentPwd ? 'text' : 'password'}
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className={inputClass + ' pr-10'}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowCurrentPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nouveau mot de passe">
              <div className="relative">
                <input
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className={inputClass + ' pr-10'}
                  placeholder="Min. 8 caractères"
                />
                <button type="button" onClick={() => setShowNewPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <Field label="Confirmer le nouveau">
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                className={inputClass}
                placeholder="Répète le mot de passe"
              />
            </Field>
          </div>
          {newPwd && confirmPwd && newPwd !== confirmPwd && (
            <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Les mots de passe ne correspondent pas.</p>
          )}
          {newPwd.length > 0 && (
            <div className="flex gap-1">
              {[1,2,3,4].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${newPwd.length >= i * 2 ? (newPwd.length >= 8 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-white/10'}`} />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={savingPwd || !currentPwd || !newPwd || newPwd !== confirmPwd}
            className={btnPrimary}
          >
            {savingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Changer le mot de passe
          </button>
        </div>

        {/* Danger zone */}
        <div className="mt-4 pt-4 border-t border-white/8">
          <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Zone de danger</p>
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-900/20 border border-red-500/20 text-sm text-red-400 hover:bg-red-900/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Supprimer mon compte
            </button>
          ) : (
            <div className="space-y-3 p-4 rounded-xl bg-red-900/15 border border-red-500/25">
              <p className="text-sm text-red-300">Tape <strong>SUPPRIMER</strong> pour confirmer la suppression définitive de ton compte :</p>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className={inputClass + ' border-red-500/30 focus:border-red-500'}
                placeholder="SUPPRIMER"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }} className={btnSecondary}>
                  <X className="w-3.5 h-3.5" /> Annuler
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmText !== 'SUPPRIMER'}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-40 cursor-pointer transition-colors"
                  onClick={() => {
                    // TODO: call DELETE /auth/me
                    onLogout?.();
                  }}
                >
                  <Trash2 className="w-4 h-4" /> Confirmer la suppression
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ── SECTION 3 : Confidentialité ── */}
      <Section
        id="confidentialite"
        title="Confidentialité"
        subtitle="Contrôle qui peut voir tes informations"
        icon={<Shield className="w-4 h-4" />}
        isOpen={openSection === 'confidentialite'}
        onToggle={() => toggle('confidentialite')}
        accent="#38BDF8"
      >
        <div className="space-y-5">
          <VisibilitySelect
            value={profileVisibility}
            onChange={setProfileVisibility}
            label="Visibilité du profil"
            description="Qui peut consulter ta page de profil ?"
          />
          <VisibilitySelect
            value={statsVisibility}
            onChange={setStatsVisibility}
            label="Statistiques & performances"
            description="Qui peut voir tes stats basketball ?"
          />
          <VisibilitySelect
            value={messagePrivacy}
            onChange={setMessagePrivacy}
            label="Messages privés"
            description="Qui peut t'envoyer des messages directs ?"
          />

          <div className="pt-2 border-t border-white/8 space-y-1">
            <Toggle
              checked={false}
              onChange={() => {}}
              label="Masquer mon activité récente"
              description="Les autres ne verront plus 'Vu il y a 5 min'"
            />
            <Toggle
              checked={true}
              onChange={() => {}}
              label="Afficher dans les résultats de recherche"
              description="Les autres peuvent te trouver via la recherche globale"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="button" onClick={handleSavePrivacy} disabled={savingPrivacy} className={btnPrimary}>
            {savingPrivacy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </Section>

      {/* ── SECTION 4 : Notifications ── */}
      <Section
        id="notifications"
        title="Notifications"
        subtitle="Choisir ce que tu veux recevoir"
        icon={<Bell className="w-4 h-4" />}
        isOpen={openSection === 'notifications'}
        onToggle={() => toggle('notifications')}
        accent="#A855F7"
      >
        <div className="divide-y divide-white/5">
          <Toggle checked={notifLikes} onChange={setNotifLikes} label="Likes sur mes publications" description={<><Heart className="w-3 h-3 inline mr-1 text-[#FF2A3B]" />Quand quelqu'un like ton post</>} />
          <Toggle checked={notifComments} onChange={setNotifComments} label="Commentaires" description={<><MessageSquare className="w-3 h-3 inline mr-1 text-blue-400" />Quand quelqu'un commente</>} />
          <Toggle checked={notifFollows} onChange={setNotifFollows} label="Nouveaux abonnés" description={<><UserPlus className="w-3 h-3 inline mr-1 text-emerald-400" />Quand quelqu'un te suit</>} />
          <Toggle checked={notifMentions} onChange={setNotifMentions} label="Mentions @" description={<><AtSign className="w-3 h-3 inline mr-1 text-[#FFB800]" />Quand tu es mentionné</>} />
          <Toggle checked={notifMessages} onChange={setNotifMessages} label="Messages directs" description="Nouveaux messages dans ta boîte" />
          <Toggle checked={notifMatchResults} onChange={setNotifMatchResults} label="Résultats de matchs" description="Scores et résultats de tes équipes favorites" />
        </div>

        <div className="flex justify-end pt-2">
          <button type="button" onClick={handleSaveNotifications} disabled={savingNotifs} className={btnPrimary}>
            {savingNotifs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </Section>

      {/* ── SECTION 5 : Apparence ── */}
      <Section
        id="apparence"
        title="Apparence"
        subtitle={`Thème actuel : ${theme === 'dark' ? 'Sombre' : 'Clair'}`}
        icon={<Palette className="w-4 h-4" />}
        isOpen={openSection === 'apparence'}
        onToggle={() => toggle('apparence')}
        accent="#10B981"
      >
        <div className="grid grid-cols-2 gap-3">
          {[
            { val: 'dark', label: 'Sombre', icon: Moon, desc: 'Fond noir, confort nocturne' },
            { val: 'light', label: 'Clair', icon: Sun, desc: 'Fond blanc, plus lisible en plein jour' },
          ].map(({ val, label, icon: Icon, desc }) => (
            <button
              key={val}
              type="button"
              onClick={() => { if (theme !== val) onToggleTheme(); }}
              className={`flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                theme === val
                  ? 'bg-[#FF2A3B]/15 border-[#FF2A3B]/50 ring-1 ring-[#FF2A3B]/30'
                  : 'bg-white/5 border-white/10 hover:border-white/25'
              }`}
            >
              <Icon className={`w-6 h-6 ${theme === val ? 'text-[#FF2A3B]' : 'text-slate-400'}`} />
              <div>
                <p className="text-sm font-bold text-white">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
              {theme === val && (
                <span className="text-[10px] font-bold text-[#FF2A3B] uppercase tracking-wider">Actif</span>
              )}
            </button>
          ))}
        </div>
      </Section>

      {/* ── SECTION 6 : Espace Club ── */}
      <Section
        id="club"
        title="Espace Club"
        subtitle="Gestion de ton affiliation club"
        icon={<Building2 className="w-4 h-4" />}
        isOpen={openSection === 'club'}
        onToggle={() => toggle('club')}
        accent="#FFB800"
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-400 leading-relaxed">
            Tu peux rejoindre ou créer un club pour accéder aux outils de gestion
            (matchs, roster, trésorerie, messagerie interne).
          </p>
          <div className="flex flex-wrap gap-2">
            {onSwitchToWorkspace && (
              <button type="button" onClick={onSwitchToWorkspace} className={btnPrimary}>
                <Building2 className="w-4 h-4" /> Accéder à l'espace club
              </button>
            )}
            <button type="button" className={btnSecondary}>
              <ExternalLink className="w-3.5 h-3.5" /> Demander un club
            </button>
          </div>
          <div className="p-3 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/20 text-xs text-amber-300 space-y-1">
            <p className="font-bold">💡 Tu es manager ou admin ?</p>
            <p>Passe dans l'espace Club via le bouton ci-dessus pour gérer ton équipe, tes matchs, ta trésorerie.</p>
          </div>
        </div>
      </Section>

      {/* ── SECTION 7 : Aide & Assistance ── */}
      <Section
        id="aide"
        title="Aide & Assistance"
        subtitle="FAQ, bugs, contact support"
        icon={<HelpCircle className="w-4 h-4" />}
        isOpen={openSection === 'aide'}
        onToggle={() => toggle('aide')}
        accent="#64748B"
      >
        <div className="space-y-4">
          {/* FAQ */}
          <div className="space-y-2">
            {[
              { q: 'Comment modifier mon profil ?', a: 'Clique sur ton avatar en haut à droite → "Mon profil" → bouton Modifier.' },
              { q: 'Comment rejoindre un club ?', a: 'Dans l\'onglet Clubs & Franchises, trouve ton club et clique sur "Rejoindre" ou contacte le manager.' },
              { q: 'Mon post ne s\'affiche pas ?', a: 'Vérifie ta connexion. Les posts avec des images lourdes peuvent prendre quelques secondes.' },
              { q: 'Comment signaler un utilisateur ?', a: 'Sur le profil de la personne, clique sur les 3 points "···" puis "Signaler".' },
            ].map(({ q, a }) => (
              <details key={q} className="group rounded-xl bg-white/4 border border-white/8 overflow-hidden">
                <summary className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-white cursor-pointer select-none list-none hover:bg-white/5">
                  {q}
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
                </summary>
                <p className="px-4 pb-3 text-xs text-slate-400 leading-relaxed border-t border-white/8 pt-3">{a}</p>
              </details>
            ))}
          </div>

          {/* Contact */}
          <div className="grid sm:grid-cols-2 gap-2 pt-2">
            <a
              href="mailto:support@hoopers.tg"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-[#FF2A3B]" />
              <div>
                <p className="font-semibold text-white">Contacter le support</p>
                <p className="text-xs text-slate-500">support@hoopers.tg</p>
              </div>
            </a>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-colors cursor-pointer text-left"
            >
              <AlertCircle className="w-4 h-4 text-[#FFB800]" />
              <div>
                <p className="font-semibold text-white">Signaler un bug</p>
                <p className="text-xs text-slate-500">Aide-nous à améliorer HOOPERS</p>
              </div>
            </button>
          </div>

          <p className="text-center text-xs text-slate-600 pt-2">
            HOOPERS v2.0 — © 2026 FIRE Stone • Plateforme basketball Afrique de l'Ouest
          </p>
        </div>
      </Section>

      {/* Bouton déconnexion */}
      {onLogout && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-900/20 border border-red-500/20 text-sm font-bold text-red-400 hover:bg-red-900/40 transition-colors cursor-pointer"
          >
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
};
