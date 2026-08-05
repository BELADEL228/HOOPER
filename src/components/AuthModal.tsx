import React, { useState } from 'react';
import type { UserRole } from '../types';
import { Flame, X, Lock, Mail, User as UserIcon, CheckCircle } from 'lucide-react';

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
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'FORGOT') {
        if (!resetToken) {
          const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data?.error || 'Impossible d’envoyer le code de réinitialisation.');
          }

          setResetToken(data?.resetToken || '');
          setSubmittedMessage(data?.message || 'Un code de réinitialisation a été généré.');
          return;
        }

        const response = await fetch('http://localhost:5000/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken || resetCode, newPassword }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Erreur lors de la réinitialisation.');
        }

        setSubmittedMessage(data?.message || 'Mot de passe réinitialisé avec succès.');
        setPassword('');
        setNewPassword('');
        setResetCode('');
        setResetToken('');
        setTimeout(() => {
          setTab('LOGIN');
          setSubmittedMessage('');
        }, 1800);
        return;
      }

      const endpoint = tab === 'LOGIN'
        ? 'http://localhost:5000/api/auth/login'
        : 'http://localhost:5000/api/auth/register';

      const payload = tab === 'LOGIN'
        ? { email, password }
        : { name, email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Échec de l’authentification.');
      }

      if (tab === 'LOGIN') {
        onLoginSuccess(data);
        onClose();
      } else {
        setSubmittedMessage('Compte créé avec succès. Vous pouvez maintenant vous connecter.');
        setTab('LOGIN');
        setPassword('');
        setName('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel rounded-3xl border border-white/20 max-w-md w-full p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in-95">
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#FF2A3B] to-[#FFB800] p-0.5 shadow-lg shadow-red-500/30">
            <div className="w-full h-full bg-[#090A0F] rounded-[14px] flex items-center justify-center">
              <Flame className="w-8 h-8 text-[#FF2A3B]" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white">Espace Membre FIRE STONE</h3>
          <p className="text-xs text-slate-400">Accédez à votre tableau de bord sécurisé</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => { setTab('LOGIN'); setSubmittedMessage(''); setError(''); setResetToken(''); setResetCode(''); setNewPassword(''); }}
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${
              tab === 'LOGIN' ? 'bg-[#FF2A3B] text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => { setTab('REGISTER'); setSubmittedMessage(''); setError(''); setResetToken(''); setResetCode(''); setNewPassword(''); }}
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${
              tab === 'REGISTER' ? 'bg-[#FF2A3B] text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            Inscription
          </button>
          <button
            onClick={() => { setTab('FORGOT'); setSubmittedMessage(''); setError(''); setResetToken(''); setResetCode(''); setNewPassword(''); }}
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${
              tab === 'FORGOT' ? 'bg-[#FF2A3B] text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            Oublié
          </button>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/40 p-3 rounded-xl text-xs text-red-200">
            {error}
          </div>
        )}

        {submittedMessage ? (
          <div className="bg-emerald-500/20 border border-emerald-500/40 p-4 rounded-2xl text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-xs text-slate-200">{submittedMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {tab === 'REGISTER' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nom complet</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Marcus Vance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input"
                  />
                </div>
              </div>
            )}

            {tab === 'FORGOT' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">Email du compte</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="joueur@firestone.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input"
                    disabled={Boolean(resetToken)}
                  />
                </div>
              </div>
            )}

            {tab !== 'FORGOT' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">Adresse Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="joueur@firestone.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input"
                  />
                </div>
              </div>
            )}

            {tab === 'FORGOT' && resetToken && (
              <>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Code de vérification</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Entrez le code reçu"
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
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input"
                    />
                  </div>
                </div>
              </>
            )}

            {tab !== 'FORGOT' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#E60023] text-white font-bold text-sm shadow-lg shadow-red-500/25 hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Chargement...'
                : tab === 'LOGIN'
                  ? 'Se Connecter'
                  : tab === 'REGISTER'
                    ? 'Créer mon Compte'
                    : resetToken
                      ? 'Valider le code & réinitialiser'
                      : 'Envoyer le code de réinitialisation'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
