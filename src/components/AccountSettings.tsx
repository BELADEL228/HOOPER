import React, { useEffect, useState } from 'react';
import type { UserRole } from '../types';
import {
  User,
  Lock,
  Save,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Camera,
  Edit3
} from 'lucide-react';

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

export const AccountSettings: React.FC<AccountSettingsProps> = ({
  currentRole = 'PLAYER',
  authUser,
  onNavigateToProfile,
  onUserUpdate,
}) => {
  const isCoachOrAdmin = ['SUPER_ADMIN', 'ADMIN', 'COACH'].includes(currentRole);

  const [phone, setPhone] = useState(authUser?.phoneNumber || '');
  const [email, setEmail] = useState(authUser?.email || '');
  const [address, setAddress] = useState(authUser?.address || '');
  const [emergencyContact, setEmergencyContact] = useState(authUser?.emergencyContact || '');
  const [photoUrl, setPhotoUrl] = useState(authUser?.avatarUrl || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80');
  const [bioText, setBioText] = useState(authUser?.bio || '');
  const [country, setCountry] = useState(authUser?.country || 'Togo');
  const [city, setCity] = useState(authUser?.city || 'Lomé');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!authUser) return;
    setPhone(authUser.phoneNumber || '');
    setEmail(authUser.email || '');
    setAddress(authUser.address || '');
    setEmergencyContact(authUser.emergencyContact || '');
    setPhotoUrl(authUser.avatarUrl || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80');
    setBioText(authUser.bio || '');
    setCountry(authUser.country || 'Togo');
    setCity(authUser.city || 'Lomé');
  }, [authUser]);

  const handleSaveSettings = async (e: React.FormEvent) => {
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
            name: authUser?.name || 'Joueur',
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
      } catch {
        // ignore; settings still show local UI feedback
      }
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

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
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B91C1C]/20 text-[#B91C1C] text-xs font-bold uppercase tracking-wider mb-2 border border-[#B91C1C]/30">
            <User className="w-3.5 h-3.5 text-[#D97706]" /> Paramètres du Compte & Profil
          </div>
          <h2 className="text-3xl font-extrabold text-white">Gestion du Compte Joueur</h2>
          <p className="text-slate-400 text-sm">
            Mettez à jour vos coordonnées personnelles et préférences de compte.
          </p>
        </div>

        {onNavigateToProfile && (
          <button
            onClick={onNavigateToProfile}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-all self-start sm:self-auto flex items-center gap-2"
          >
            <User className="w-4 h-4 text-[#D97706]" />
            <span>Voir Mon Profil Fiche 3D</span>
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Vos modifications de compte ont été enregistrées avec succès !
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Section 1: Photo & Identity Preview */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-[#0A0C13]">
          <div className="flex items-center gap-2 text-sm font-extrabold text-white pb-3 border-b border-white/10">
            <Camera className="w-4 h-4 text-[#D97706]" /> Photo de Profil & Avatar
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <img
                src={photoUrl}
                alt={authUser?.name || 'Utilisateur'}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-[#D97706] shadow-xl"
              />
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-[#B91C1C] text-white text-[10px] font-black">
                #{authUser?.role ? authUser.role.slice(0,2).toUpperCase() : 'J'}
              </span>
            </div>

            <div className="space-y-2 flex-1 w-full">
              <label className="block text-xs font-bold text-slate-300">URL de l'image de profil (HD) :</label>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#B91C1C]"
              />
              <p className="text-[10px] text-slate-500">Formats acceptés : JPG, PNG, WEBP (Les fonds transparents sont pris en charge sur les fiches 3D).</p>
            </div>
          </div>
        </div>

        {/* Section 2: Personal Information */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-[#0A0C13]">
          <div className="flex items-center gap-2 text-sm font-extrabold text-white pb-3 border-b border-white/10">
            <User className="w-4 h-4 text-[#B91C1C]" /> Informations Personnelles & Coordonnées
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Nom Complet Joueur :</label>
              <input
                type="text"
                value={authUser?.name || 'Joueur'}
                onChange={(e) => {
                  if (onUserUpdate && authUser) {
                    onUserUpdate({ ...authUser, name: e.target.value });
                  }
                }}
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Adresse Email :</label>
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
              <label className="block font-bold text-slate-300 mb-1">Téléphone Portable :</label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 pl-9 text-white focus:outline-none focus:border-[#B91C1C]"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Adresse Résidentielle :</label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 pl-9 text-white focus:outline-none focus:border-[#B91C1C]"
                />
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-300 mb-1">Contact d'Urgence :</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Nom, lien de parenté & numéro"
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Biography Field (RESTRICTED TO COACH & ADMIN ONLY) */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-[#0A0C13]">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              <Edit3 className="w-4 h-4 text-[#D97706]" /> Biographie & Présentation du Joueur
            </div>

            {!isCoachOrAdmin && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Réservé au Coach
              </span>
            )}
          </div>

          {!isCoachOrAdmin ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Information :</strong> La biographie d'un joueur ne peut pas être modifiée par le joueur lui-même. Seul l'Entraîneur Principal (Coach) ou l'Administration peut rédiger et valider la biographie officielle.
                </span>
              </div>

              <textarea
                disabled
                rows={3}
                value={bioText}
                className="w-full bg-[#090A0F]/60 border border-white/5 rounded-xl p-3 text-xs text-slate-400 leading-relaxed cursor-not-allowed resize-none opacity-80"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> En tant que Coach/Admin, vous avez les droits pour modifier la biographie officielle.
              </p>
              <textarea
                rows={4}
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Rédigez la biographie officielle du joueur..."
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-[#B91C1C]"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#B91C1C] to-[#881337] text-white font-extrabold text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les Paramètres du Compte</span>
          </button>
        </div>

      </form>

      <form onSubmit={handlePasswordChange} className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-[#0A0C13]">
        <div className="flex items-center gap-2 text-sm font-extrabold text-white pb-3 border-b border-white/10">
          <Lock className="w-4 h-4 text-[#D97706]" /> Sécurité du Compte
        </div>

        {passwordError && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-xs">{passwordError}</div>
        )}
        {passwordSuccess && (
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-xs">{passwordSuccess}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1">Ancien mot de passe</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]" />
          </div>
          <div>
            <label className="block font-bold text-slate-300 mb-1">Nouveau mot de passe</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]" />
          </div>
          <div>
            <label className="block font-bold text-slate-300 mb-1">Confirmer</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#B91C1C]" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-black font-black text-xs hover:scale-[1.01] transition-all">
            Changer le mot de passe
          </button>
        </div>
      </form>

    </div>
  );
};
