import React, { useState } from 'react';
import type { UserRole, Team, User } from '../../types';
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
  ShieldCheck,
  Sparkles,
  GraduationCap,
  Award,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Menu,
  X,
  LogIn,
  LogOut,
  MapPinned,
  ShoppingBag,
  ArrowLeft,
  Download,
  Bell,
} from 'lucide-react';
import { ClubLogo } from '../common/ClubLogo';
import { filterAccessibleTabs, PRIVATE_TABS } from '../../config/permissions';
import { triggerPwaInstall } from '../common/PwaInstallPrompt';

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
  onBackToPublic?: () => void;
  selectedClub?: Team | null;
  authUser?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string | null;
  } | null;
  onLogout?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// DÉFINITION DES ONGLETS (module-level, stables entre renders)
// ═══════════════════════════════════════════════════════════════════════════

interface NavItemDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** Menu principal : navigation générale du club. */
const MAIN_NAV_ITEMS: NavItemDef[] = [
  { id: 'accueil', label: 'Accueil & Club', icon: LayoutDashboard },
  { id: 'matchs', label: 'Match Center', icon: Trophy },
  { id: 'tournois', label: 'Tournois & Classements', icon: Trophy },
  { id: 'recrutement', label: 'Recrutement & Mercato', icon: UserCheck },
  { id: 'scouting', label: 'Scouting & Analyse', icon: BarChart3 },
  { id: 'badges', label: 'Badges & Distinctions', icon: Award },
  { id: 'designer', label: 'AI Team Designer', icon: Sparkles },
  { id: 'marketplace', label: 'Boutique & Billetterie', icon: ShoppingBag },
  { id: 'stats', label: 'Statistiques Pro', icon: BarChart3 },
  { id: 'equipe', label: 'Effectif & Staff', icon: Users },
  { id: 'evenements', label: 'Agenda & RSVP', icon: Calendar },
  { id: 'actus', label: 'Galerie & Actus', icon: Newspaper },
  { id: 'terrains', label: 'Terrains & Cartographie', icon: MapPinned },
];

/** Espaces & métiers : outils spécifiques selon le rôle. */
const ROLE_SPECIFIC_ITEMS: NavItemDef[] = [
  { id: 'mon-profil', label: 'Mon Profil & Stats Indiv', icon: UserCheck },
  { id: 'academie', label: 'Centre de Formation', icon: GraduationCap },
  { id: 'journee-champions', label: 'Journée des Champions', icon: Award },
  { id: 'finances', label: 'Trésorerie & Cotisations', icon: Wallet },
  { id: 'messagerie', label: 'Messagerie Équipe', icon: MessageSquare },
  { id: 'sponsors', label: 'Sponsors & Dons', icon: Sparkles },
  { id: 'club-admin', label: 'Gérer mon club', icon: ShieldCheck },
  { id: 'admin', label: 'Super Admin Console', icon: ShieldAlert },
];

// ═══════════════════════════════════════════════════════════════════════════

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  setActiveTab,
  onOpenAuth,
  collapsed: externalCollapsed,
  onToggleCollapse,
  isAuthenticated = false,
  onBackToPublic,
  selectedClub,
  authUser,
  onLogout,
  unreadNotifications,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed =
    externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const handleToggle =
    onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));
  const [mobileOpen, setMobileOpen] = useState(false);

  // ✅ Filtrage délégué à permissions.ts (mode workspace)
  const applyFilters = (items: NavItemDef[]) =>
    filterAccessibleTabs(items, currentRole, 'club_workspace').filter((item) => {
      // Masque les onglets privés si non connecté
      if (!isAuthenticated && PRIVATE_TABS.has(item.id)) return false;
      return true;
    });

  const visibleMainItems = applyFilters(MAIN_NAV_ITEMS);
  const visibleRoleItems = applyFilters(ROLE_SPECIFIC_ITEMS);

  const renderNavButton = (item: NavItemDef, isRoleSection: boolean = false) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => {
          setActiveTab(item.id);
          setMobileOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
          ? 'bg-linear-to-r from-[#B91C1C] to-[#881337] text-white shadow-md shadow-red-950/30 font-bold border border-red-800/30'
          : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        title={item.label}
      >
        <Icon
          className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : isRoleSection ? 'text-[#FFB800]' : 'text-slate-400'
            }`}
        />
        {!collapsed && <span>{item.label}</span>}
      </button>
    );
  };

  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between p-4 space-y-6">
      {/* Brand Header & League Portal Back Button */}
      <div className="space-y-3">
        {onBackToPublic && (
          <button
            onClick={onBackToPublic}
            className={`w-full flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-all text-xs font-bold cursor-pointer ${collapsed ? 'p-2' : ''
              }`}
            title="Revenir au Portail Public de la Ligue"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span className="truncate">Portail Ligue</span>}
          </button>
        )}

        {/* Bouton Installation PWA Mobile */}
        <button
          onClick={() => {
            triggerPwaInstall();
            setMobileOpen(false);
          }}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:brightness-110 transition-all cursor-pointer shadow-sm active:scale-95 ${collapsed ? 'justify-center p-2' : ''
            }`}
          title="Installer l'application sur smartphone (PWA)"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#FF2A3B] to-[#FFB800] text-black font-black flex items-center justify-center shadow shrink-0">
              <Download className="w-3.5 h-3.5" />
            </div>
            {!collapsed && (
              <div className="text-left">
                <p className="text-xs font-black text-white">Installer l'App</p>
                <p className="text-[9px] text-slate-400">Écran d'accueil PWA</p>
              </div>
            )}
          </div>
          {!collapsed && <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />}
        </button>

        <div className="flex items-center justify-between">
          <div
            onClick={() => setActiveTab('accueil')}
            className="flex items-center gap-3 cursor-pointer group overflow-hidden"
          >
            <div
              className="w-10 h-10 rounded-xl p-0.5 shadow-lg shadow-red-950/40 group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center"
              style={{
                background: selectedClub?.primaryColor
                  ? `linear-gradient(135deg, ${selectedClub.primaryColor}, ${selectedClub.secondaryColor || '#FFB800'
                  })`
                  : 'linear-gradient(135deg, #B91C1C, #D97706)',
              }}
            >
              <div className="w-full h-full bg-[#090A0F] rounded-[10px] flex items-center justify-center text-lg">
                <ClubLogo
                  logoUrl={selectedClub?.logoUrl}
                  alt={`Logo ${selectedClub?.name || 'club'}`}
                  className="w-full h-full object-contain"
                  fallback={<Flame className="w-6 h-6 text-[#B91C1C]" />}
                />
              </div>
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <span className="text-sm font-black tracking-wider text-white truncate block">
                  {selectedClub?.name || 'FIRE STONE'}
                </span>
                <span className="text-[9px] font-bold text-[#FFB800] uppercase tracking-widest block -mt-0.5">
                  {selectedClub?.category || 'Espace Club'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleToggle}
            className="hidden lg:flex p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
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

          {visibleMainItems.length === 0 ? (
            !collapsed && (
              <p className="text-[10px] text-slate-500 italic px-3">
                Aucun module accessible.
              </p>
            )
          ) : (
            visibleMainItems.map((item) => renderNavButton(item, false))
          )}
        </div>

        {/* Modules Spécifiques */}
        {visibleRoleItems.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-white/5">
            {!collapsed && (
              <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider px-3 mb-2">
                Espaces & Métiers
              </div>
            )}
            {visibleRoleItems.map((item) => renderNavButton(item, true))}
          </div>
        )}
      </div>

      {/* User Footer Card */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        {!collapsed ? (
          <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={
                  authUser?.avatarUrl ||
                  (isAuthenticated
                    ? 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&auto=format&fit=crop&q=80'
                    : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80')
                }
                alt="User"
                className="w-9 h-9 rounded-xl object-cover border border-[#B91C1C] shrink-0"
              />
              <div className="text-left text-xs overflow-hidden">
                <div className="font-bold text-white truncate">
                  {authUser?.name || (isAuthenticated ? 'Session En Cours' : 'Visiteur')}
                </div>
                <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#B91C1C]/20 text-[#FFB800] border border-[#B91C1C]/30 truncate max-w-[120px]">
                  {isAuthenticated ? currentRole : 'PUBLIC'}
                </span>
              </div>
            </div>
            {isAuthenticated && onLogout ? (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 transition-colors shrink-0"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors shrink-0"
                title={isAuthenticated ? 'Espace membre' : 'Se connecter'}
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={isAuthenticated && onLogout ? onLogout : onOpenAuth}
            className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex justify-center"
            title={isAuthenticated ? 'Se déconnecter' : 'Se connecter'}
          >
            {isAuthenticated ? <LogOut className="w-5 h-5 text-red-400" /> : <LogIn className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar — Seul et unique header mobile du mode club */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#090A0F]/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-lg">
        <div
          onClick={() => setActiveTab('accueil')}
          className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF2A3B] to-[#FFB800] p-0.5 shadow-md">
            <div className="w-full h-full bg-[#090A0F] rounded-[9px] flex items-center justify-center overflow-hidden">
              <ClubLogo
                logoUrl={selectedClub?.logoUrl}
                alt={`Logo ${selectedClub?.name || 'club'}`}
                className="w-full h-full object-contain p-0.5"
                fallback={<Flame className="w-5 h-5 text-[#FF2A3B]" />}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-white text-sm tracking-tight truncate max-w-[130px] leading-tight">
              {selectedClub?.name || 'FIRE STONE'}
            </span>
            <span className="text-[9px] font-bold text-[#FFB800]">
              Club Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBackToPublic && (
            <button
              onClick={onBackToPublic}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 transition-all cursor-pointer active:scale-95"
              title="Retourner au portail public"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ligue</span>
            </button>
          )}

          {/* Bouton PWA mobile direct */}
          <button
            onClick={() => triggerPwaInstall()}
            className="p-2 rounded-xl bg-[#FF2A3B]/10 hover:bg-[#FF2A3B]/20 text-[#FF2A3B] border border-[#FF2A3B]/30 transition-all cursor-pointer active:scale-95"
            title="Installer l'application mobile"
            aria-label="Installer l'application mobile"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Notifications si non lues */}
          {unreadNotifications > 0 && (
            <button
              onClick={() => setActiveTab('messagerie')}
              className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all cursor-pointer active:scale-95"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF2A3B] text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                {unreadNotifications}
              </span>
            </button>
          )}

          {/* Bouton Unique Hamburger Menu Mobile */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center"
            aria-label="Ouvrir le menu de navigation"
          >
            {mobileOpen ? (
              <X className="w-5 h-5 text-red-400" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop Permanent Sidebar */}
      <aside
        className={`hidden lg:block fixed top-0 left-0 bottom-0 z-30 bg-[#07080D]/95 backdrop-blur-2xl border-r border-white/10 transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'
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