import React, { useState } from 'react';
import type { UserRole } from '../types';
import {
  Flame,
  LayoutDashboard,
  Trophy,
  BarChart3,
  Users,
  Calendar,
  Newspaper,
  Wallet,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  GraduationCap,
  Award,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Menu,
  X,
  LogIn,
  MapPinned
} from 'lucide-react';

interface SidebarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadNotifications: number;
  onOpenAuth: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  isAuthenticated?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  setActiveTab,
  onOpenAuth,
  collapsed: externalCollapsed,
  onToggleCollapse,
  isAuthenticated = false,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const handleToggle = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));
  const [mobileOpen, setMobileOpen] = useState(false);

  const mainNavItems = [
    { id: 'accueil', label: 'Accueil & Club', icon: LayoutDashboard },
    { id: 'matchs', label: 'Match Center', icon: Trophy },
    { id: 'stats', label: 'Statistiques Pro', icon: BarChart3 },
    { id: 'equipe', label: 'Effectif & Staff', icon: Users },
    { id: 'evenements', label: 'Agenda & RSVP', icon: Calendar },
    { id: 'actus', label: 'Galerie & Actus', icon: Newspaper },
    { id: 'terrains', label: 'Terrains & Cartographie', icon: MapPinned },
  ];

  const roleSpecificItems = [
    {
      id: 'mon-profil',
      label: 'Mon Profil & Stats Indiv',
      icon: UserCheck,
      rolesAllowed: ['PLAYER', 'COACH', 'SUPER_ADMIN', 'ADMIN'],
    },
    {
      id: 'academie',
      label: 'Centre de Formation',
      icon: GraduationCap,
    },
    {
      id: 'journee-champions',
      label: 'Journée des Champions',
      icon: Award,
    },
    {
      id: 'finances',
      label: 'Trésorerie & Cotisations',
      icon: Wallet,
      rolesAllowed: ['TREASURER', 'SUPER_ADMIN', 'ADMIN'],
    },
    {
      id: 'messagerie',
      label: 'Messagerie Équipe',
      icon: MessageSquare,
      hideForRole: ['VISITOR'],
    },
    {
      id: 'sponsors',
      label: 'Sponsors & Dons',
      icon: Sparkles,
    },
    {
      id: 'admin',
      label: 'Super Admin Console',
      icon: ShieldAlert,
      rolesAllowed: ['SUPER_ADMIN', 'ADMIN', 'COACH'],
    },
  ];

  const filterItems = (items: typeof roleSpecificItems) =>
    items.filter((item) => {
      const privateItems = new Set(['mon-profil', 'finances', 'messagerie', 'admin', 'parametres']);
      if (!isAuthenticated && privateItems.has(item.id)) return false;
      if (item.rolesAllowed && !item.rolesAllowed.includes(currentRole)) return false;
      if (item.hideForRole && item.hideForRole.includes(currentRole)) return false;
      return true;
    });

  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between p-4 space-y-6">
      
      {/* Brand Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div
            onClick={() => setActiveTab('accueil')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B91C1C] to-[#D97706] p-0.5 shadow-lg shadow-red-950/40 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-[#090A0F] rounded-[10px] flex items-center justify-center">
                <Flame className="w-6 h-6 text-[#B91C1C]" />
              </div>
            </div>
            {!collapsed && (
              <div>
                <span className="text-lg font-black tracking-wider text-white flex items-center gap-1">
                  FIRE <span className="text-gradient-fire">STONE</span>
                </span>
                <span className="text-[9px] font-bold text-[#FFB800] uppercase tracking-widest block -mt-1">
                  Pro Platform
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleToggle}
            className="hidden lg:flex p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        
        {/* Navigation Générale */}
        <div className="space-y-1">
          {!collapsed && (
            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider px-3 mb-2">
              Menu Principal
            </div>
          )}
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#B91C1C] to-[#881337] text-white shadow-md shadow-red-950/30 font-bold border border-red-800/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                title={item.label}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Modules Spécifiques */}
        <div className="space-y-1 pt-2 border-t border-white/5">
          {!collapsed && (
            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider px-3 mb-2">
              Espaces & Métiers
            </div>
          )}
          {filterItems(roleSpecificItems).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#B91C1C] to-[#881337] text-white shadow-md shadow-red-950/30 font-bold border border-red-800/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                title={item.label}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#FFB800]'}`} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

      </div>

      {/* User Footer Card */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        {!collapsed ? (
          <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <img
                src={isAuthenticated ? 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'}
                alt="User"
                className="w-9 h-9 rounded-xl object-cover border border-[#B91C1C]"
              />
              <div className="text-left text-xs overflow-hidden">
                <div className="font-bold text-white truncate">{isAuthenticated ? 'Session En Cours' : 'Visiteur'}</div>
                <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#B91C1C]/20 text-[#FFB800] border border-[#B91C1C]/30">
                  {isAuthenticated ? currentRole : 'PUBLIC'}
                </span>
              </div>
            </div>
            <button
              onClick={onOpenAuth}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title={isAuthenticated ? 'Espace membre' : 'Se connecter'}
            >
              <LogIn className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex justify-center"
          >
            <LogIn className="w-5 h-5" />
          </button>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#090A0F]/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div 
          onClick={() => setActiveTab('accueil')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#B91C1C] to-[#D97706] p-0.5">
            <div className="w-full h-full bg-[#090A0F] rounded-[6px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-[#B91C1C]" />
            </div>
          </div>
          <span className="font-extrabold text-white text-base">FIRE STONE</span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-white/5 text-slate-300"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop Permanent Sidebar */}
      <aside
        className={`hidden lg:block fixed top-0 left-0 bottom-0 z-30 bg-[#07080D]/95 backdrop-blur-2xl border-r border-white/10 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex">
          <div className="w-80 bg-[#07080D] h-full border-r border-white/10">
            {renderNavContent()}
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
};
