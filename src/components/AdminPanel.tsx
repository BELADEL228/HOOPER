import React, { useState } from 'react';
import type { UserRole } from '../types';
import { ShieldAlert, Users, Settings, Save, CheckCircle, Trash2, ShieldCheck, Crown } from 'lucide-react';

interface AdminPanelProps {
  currentRole: UserRole;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentRole }) => {
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';
  const isAuthorized = ['SUPER_ADMIN', 'ADMIN', 'COACH'].includes(currentRole);

  const [activeTab, setActiveTab] = useState<'USERS' | 'ROSTER' | 'SETTINGS'>('USERS');
  const [successMsg, setSuccessMsg] = useState('');

  // Sample users list
  const [usersList, setUsersList] = useState([
    { id: 'u1', name: 'Marcus Vance', email: 'marcus.vance@firestone.com', role: 'PLAYER' as UserRole },
    { id: 'u2', name: 'Sophie Laurent', email: 'sophie.laurent@firestone.com', role: 'TREASURER' as UserRole },
    { id: 'u3', name: 'David Vance', email: 'david.vance@firestone.com', role: 'COACH' as UserRole },
    { id: 'u4', name: 'Abel (Super Admin)', email: 'superadmin@firestone.com', role: 'SUPER_ADMIN' as UserRole },
    { id: 'u5', name: 'Thomas Morel (Candidat)', email: 'thomas.morel@gmail.com', role: 'ACADEMY_CANDIDATE' as UserRole },
  ]);

  if (!isAuthorized) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-red-500/40 text-center space-y-4 max-w-xl mx-auto my-12">
        <ShieldAlert className="w-16 h-16 text-[#FF2A3B] mx-auto animate-bounce" />
        <h3 className="text-2xl font-black text-white">Accès Restreint</h3>
        <p className="text-slate-300 text-sm">
          Cette console nécessite les privilèges **SUPER ADMINISTRATEUR** ou **COACH**. Utilisez le sélecteur de rôle dans le menu latéral pour activer la vue Super Admin.
        </p>
      </div>
    );
  }

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsersList(usersList.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    setSuccessMsg('Droits et rôle utilisateur modifiés.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeleteUser = (userId: string) => {
    setUsersList(usersList.filter((u) => u.id !== userId));
    setSuccessMsg('Compte utilisateur révoqué.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
            {isSuperAdmin ? <Crown className="w-3.5 h-3.5 text-yellow-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-red-400" />}
            {isSuperAdmin ? 'SUPER ADMINISTRATEUR (Pouvoir Absolu A-Z)' : 'Console de Gestion Staff & Admin'}
          </div>
          <h2 className="text-3xl font-extrabold text-white">Panneau de Contrôle Général</h2>
          <p className="text-slate-400 text-sm">Administrez l'ensemble de la plateforme, les autorisations, le recrutement et la configuration du système.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'USERS' ? 'bg-[#FF2A3B] text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            Utilisateurs & Rôles
          </button>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'SETTINGS' ? 'bg-[#FF2A3B] text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            Paramètres Système
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Users & Roles Matrix */}
      {activeTab === 'USERS' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FFB800]" /> Matrice des Droits & Attribution des Rôles (RBAC)
            </h3>
            {isSuperAdmin && (
              <span className="text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/30">
                Mode Super Admin : Modification instantanée
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/10 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Nom complet</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rôle système</th>
                  <th className="px-4 py-3 text-right">Actions Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usersList.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                      <span>{user.name}</span>
                      {user.role === 'SUPER_ADMIN' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="SUPER_ADMIN" className="bg-[#090A0F]">SUPER ADMINISTRATEUR (Tout Pouvoir)</option>
                        <option value="ADMIN" className="bg-[#090A0F]">ADMINISTRATEUR</option>
                        <option value="COACH" className="bg-[#090A0F]">ENTRAÎNEUR (Head Coach)</option>
                        <option value="PLAYER" className="bg-[#090A0F]">JOUEUR (Roster Officiel)</option>
                        <option value="TREASURER" className="bg-[#090A0F]">TRÉSORIÈRE</option>
                        <option value="SPONSOR" className="bg-[#090A0F]">SPONSOR / PARTENAIRE</option>
                        <option value="ACADEMY_CANDIDATE" className="bg-[#090A0F]">CANDIDAT ACADÉMIE</option>
                        <option value="VISITOR" className="bg-[#090A0F]">VISITEUR / SUPPORTER</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        title="Supprimer l'utilisateur"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === 'SETTINGS' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 max-w-2xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#FF2A3B]" /> Configuration Serveur & Base de Données
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Nom Officiel de l'Équipe</label>
              <input type="text" defaultValue="FIRE STONE Basketball Club" className="w-full px-4 py-2.5 rounded-xl glass-input" />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">URL Base de Données (PostgreSQL / Prisma Connection)</label>
              <input type="text" defaultValue="postgresql://postgres:secret@localhost:5432/firestone_db" className="w-full px-4 py-2.5 rounded-xl glass-input font-mono" />
            </div>

            <button
              onClick={() => {
                setSuccessMsg('Paramètres système et base de données sauvegardés.');
                setTimeout(() => setSuccessMsg(''), 3000);
              }}
              className="px-6 py-2.5 rounded-xl bg-[#FF2A3B] text-white font-bold text-xs hover:bg-red-600 shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Sauvegarder les modifications
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
