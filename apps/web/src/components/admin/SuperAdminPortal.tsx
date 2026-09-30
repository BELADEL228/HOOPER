import { useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Building2,
  Crown,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import type { UserRole } from '../../types';
import { AdminPanel } from './AdminPanel';

interface Props {
  user: { id: string; name: string; email: string; role: UserRole } | null;
  onExit: () => void;
  onLogout: () => void;
}

export function SuperAdminPortal({ user, onExit, onLogout }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#070A12] text-white">

      {/* ── Sticky Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-cyan-400/15 bg-[#0B1020]/95 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-7 h-[72px] flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-400 to-violet-600 shadow-lg shadow-cyan-500/25">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black tracking-tight text-sm">
                FIRE STONE <span className="text-cyan-300">CONTROL</span>
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Portail Super Admin</p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-cyan-300 border-b border-cyan-300/50 pb-0.5">
              <Activity className="w-3.5 h-3.5" /> Supervision globale
            </span>
            <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
              <Building2 className="w-3.5 h-3.5" /> Tous les clubs
            </span>
            <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
              <Users className="w-3.5 h-3.5" /> Utilisateurs &amp; sécurité
            </span>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* User chip */}
            <div className="hidden sm:flex flex-col items-end mr-2">
              <p className="text-xs font-bold text-white leading-none">{user?.name}</p>
              <p className="text-[10px] text-cyan-300 uppercase tracking-wider mt-0.5">Super Admin</p>
            </div>

            <button
              onClick={onExit}
              title="Voir le portail public"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Portail public</span>
            </button>

            <button
              onClick={onLogout}
              title="Se déconnecter"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-300 hover:text-red-100 hover:bg-red-500/10 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/5 px-5 py-4 flex flex-col gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-2 text-cyan-300 font-semibold">
              <Activity className="w-3.5 h-3.5" /> Supervision globale
            </span>
            <span className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> Tous les clubs et demandes
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Utilisateurs et sécurité
            </span>
          </div>
        )}
      </header>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-7 py-8 space-y-6">

        {/* Banner */}
        <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 px-5 py-3.5 text-xs text-slate-300 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">Console Plateforme</span> — Cette interface est indépendante des
            espaces clubs et offre une vision transversale de toutes les données de la plateforme FIRE STONE.
          </div>
        </div>

        {/* Admin panel */}
        <AdminPanel currentRole="SUPER_ADMIN" authUser={user} />
      </main>
    </div>
  );
}
