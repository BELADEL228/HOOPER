import React, { useEffect, useState } from 'react';
import type { UserRole } from '../../types';
import {
  User,
  Lock,
  Save,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Camera,
  Edit3,
} from 'lucide-react';
import { apiUrl } from '../../services/api';

interface AccountSettingsProps {
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
  onNavigateToProfile?: () => void;
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

// ✅ Helper : label humain du rôle
const getRoleShortLabel = (role?: string): string => {
  switch (role) {
    case 'PLAYER':
      return 'Joueur';
    case 'COACH':
      return 'Coach';
    case 'CLUB_MANAGER':
      return 'Dirigeant';
    case 'TREASURER':
      return 'Trésorier';
    case 'SPONSOR':
      return 'Sponsor';
    case 'ACADEMY_CANDIDATE':
      return 'Candidat';
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return 'Admin';
    case 'VISITOR':
    default:
      return 'Fan';
  }
};

// ✅ Helper : fallback avatar
const avatarFallback = (name: string): string =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || 'Utilisateur'
  )}&background=B91C1C&color=fff&size=256`;

export const AccountSettings: React.FC<AccountSettingsProps> = ({
  authUser,
  onNavigateToProfile,
  onUserUpdate,
}) => {
  // ✅ State local du nom (évite les updates à chaque frappe)
  const [name, setName] = useState(authUser?.name || '');

  const [phone, setPhone] = useState(authUser?.phoneNumber || '');
  const [email, setEmail] = useState(authUser?.email || '');
  const [address, setAddress] = useState(authUser?.address || '');
  const [emergencyContact, setEmergencyContact] = useState(
    authUser?.emergencyContact || ''
  );

  // ✅ Photo avec fallback ui-avatars
  const [photoUrl, setPhotoUrl] = useState(
    authUser?.avatarUrl || avatarFallback(authUser?.name || 'Utilisateur')
  );

  const [bioText, setBioText] = useState(authUser?.bio || '');
  const [country, setCountry] = useState(authUser?.country || 'Togo');
  const [city, setCity] = useState(authUser?.city || 'Lomé');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ Sync du state quand authUser change
  useEffect(() => {
    if (!authUser) return;
    setName(authUser.name || '');
    setPhone(authUser.phoneNumber || '');
    setEmail(authUser.email || '');
    setAddress(authUser.address || '');
    setEmergencyContact(authUser.emergencyContact || '');
    setPhotoUrl(authUser.avatarUrl || avatarFallback(authUser.name || 'Utilisateur'));
    setBioText(authUser.bio || '');
    setCountry(authUser.country || 'Togo');
    setCity(authUser.city || 'Lomé');
  }, [authUser]);

  // ─── Sauvegarde des paramètres ─────────────────────────────────────
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) {
      setSaveSuccess(false);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(apiUrl('/auth/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          name,           // ✅ State local
          email,
          avatarUrl: photoUrl,
          phoneNumber: phone,
          address,
          emergencyContact,
          bio: bioText,
          country,
          city,
        }),
      });

      const data = await response.json();
      if (response.ok && data?.user && onUserUpdate) {
        onUserUpdate(data.user);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.warn('[AccountSettings] save', err);
    } finally {
      setSaving(false);
    }
  };

  // ─── Changement de mot de passe ────────────────────────────────────
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tous les champs de mot de passe sont requis.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('La confirmation du mot de passe ne correspond pas.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) {
      setPasswordError('Vous devez être connecté pour modifier votre mot de passe.');
      return;
    }

    try {
      const response = await fetch(apiUrl('/auth/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Erreur lors du changement de mot de passe.');
      }

      setPasswordSuccess(data?.message || 'Mot de passe modifié avec succès.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Erreur inconnue.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B91C1C]/20 text-[#B91C1C] text-xs font-bold uppercase tracking-wider mb-2 border border-[#B91C1C]/30">
            <User className="w-3.5 h-3.5 text-[#D97706]" /> Paramètres du Compte & Profil
          </div>
          {/* ✅ Header neutre (plus "Compte Joueur") */}
          <h2 className="text-3xl font-extrabold text-white">Gestion du Compte & Profil</h2>
          <p className="text-slate-400 text-sm">
            Mettez à jour vos coordonnées personnelles et préférences de compte.
          </p>
        </div>

        {onNavigateToProfile && (
          <button
            onClick={onNavigateToProfile}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-all self-start sm:self-auto flex items-center gap-2 cursor-pointer"
          >
            <User className="w-4 h-4 text-[#D97706]" />
            <span>Voir Mon Profil Public</span>
          </button>
        )}
      </div>

      {/* ─── Message de succès ───────────────────────────────────────── */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Vos modifications de compte ont été enregistrées avec succès !
        </div>
      )}

      {/* ─── Formulaire principal ────────────────────────────────────── */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1 : Photo */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-[#0A0C13]">
          <div className="flex items-center gap-2 text-sm font-extrabold text-white pb-3 border-b border-white/10">
            <Camera className="w-4 h-4 text-[#D97706]" /> Photo de Profil & Avatar
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative shrink-0">
              <img
                src={photoUrl}
                alt={name || 'Utilisateur'}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-[#D97706] shadow-xl bg-slate-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = avatarFallback(name);
                }}
              />
              {/* ✅ Badge rôle lisible */}
              <span
                className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-[#B91C1C] text-white text-[10px] font-black uppercase whitespace-nowrap"
                title={authUser?.role || 'VISITOR'}
              >
                {getRoleShortLabel(authUser?.role)}
              </span>
            </div>

            <div className="space-y-2 flex-1 w-full">
              <label className="block text-xs font-bold text-slate-300">
                URL de l'image de profil :
              </label>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#B91C1C]"
              />
              <p className="text-[10px] text-slate-500">
                Formats acceptés : JPG, PNG, WEBP. Laissez vide pour un avatar généré automatiquement.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2 : Informations personnelles */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-[#0A0C13]">
          <div className="flex items-center gap-2 text-sm font-extrabold text-white pb-3 border-b border-white/10">
            <User className="w-4 h-4 text-[#B91C1C]" /> Informations Personnelles & Coordonnées
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* ✅ Champ nom : state local */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Nom Complet :
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Adresse Email :
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 pl-9 text-white focus:outline-none focus:border-[#B91C1C]"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Téléphone Portable :
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+228 90 00 00 00"
                  className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 pl-9 text-white focus:outline-none focus:border-[#B91C1C]"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Adresse Résidentielle :
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Quartier, ville"
                  className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 pl-9 text-white focus:outline-none focus:border-[#B91C1C]"
                />
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Ville :
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Lomé"
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Pays :
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Togo"
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
              />
            </div>

            {/* ✅ Contact d'urgence : visible pour tous (option A) */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-300 mb-1">
                Contact d'Urgence :
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Nom, lien de parenté & numéro"
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Utilisé uniquement en cas d'urgence médicale lors d'événements officiels.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3 : Biographie — ✅ Éditable par TOUS */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-[#0A0C13]">
          <div className="flex items-center gap-2 text-sm font-extrabold text-white pb-3 border-b border-white/10">
            <Edit3 className="w-4 h-4 text-[#D97706]" /> Biographie & Présentation
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-400">
              Cette biographie apparaît sur votre profil public. Présentez-vous en quelques
              lignes.
            </p>
            <textarea
              rows={4}
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              placeholder="Ex: Passionné de basket, meneur de jeu au Fire Stone Lomé depuis 2023..."
              maxLength={280}
              className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-[#B91C1C] resize-none"
            />
            <p className="text-[10px] text-slate-500 text-right">
              {bioText.length} / 280
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-2xl bg-linear-to-r from-[#B91C1C] to-[#881337] text-white font-extrabold text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Enregistrement…' : 'Enregistrer les Paramètres'}</span>
          </button>
        </div>
      </form>

      {/* ─── Section mot de passe ─────────────────────────────────────── */}
      <form
        onSubmit={handlePasswordChange}
        className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-[#0A0C13]"
      >
        <div className="flex items-center gap-2 text-sm font-extrabold text-white pb-3 border-b border-white/10">
          <Lock className="w-4 h-4 text-[#D97706]" /> Sécurité du Compte
        </div>

        {passwordError && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-xs">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-xs">
            {passwordSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Ancien mot de passe
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Confirmer
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-linear-to-r from-[#D97706] to-[#F59E0B] text-black font-black text-xs hover:scale-[1.01] transition-all cursor-pointer"
          >
            Changer le mot de passe
          </button>
        </div>
      </form>
    </div>
  );
};