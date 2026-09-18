import React, { useState, useRef, useEffect } from 'react';
import type { UserRole } from '../../types';
import logo from '../../assets/logo.jpeg';

import {
  Bell,
  Menu,
  X,
  User,
  Settings,
  ChevronDown,
  LogOut,
  MoonStar,
  SunMedium,
} from 'lucide-react';
import { filterAccessibleTabs, PRIVATE_TABS } from '../../config/permissions';

interface NavbarProps {
  currentRole: UserRole;
  authUser?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string | null;
  } | null;
  onRoleChange: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadNotifications: number;
  onToggleNotifications: () => void;
  onOpenAuth: () => void;
  onLogout?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  isAuthenticated?: boolean;
}

interface NavItem {
  id: string;
  label: string;
}

/**
 * Navigation principale du WORKSPACE club.
 * ⚠️ Le filtrage par rôle est délégué à `workspacePermissions`
 *    (via `filterAccessibleTabs`), pas redéfini ici.
 */
const NAV_ITEMS: NavItem[] = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'matchs', label: 'Match Center' },
  { id: 'stats', label: 'Statistiques' },
  { id: 'equipe', label: 'Équipe' },
  { id: 'evenements', label: 'Agenda & RSVP' },
  { id: 'actus', label: 'Galerie & Actus' },
  { id: 'finances', label: 'Finances' },
  { id: 'messagerie', label: 'Messagerie' },
  { id: 'sponsors', label: 'Sponsors & Dons' },
  { id: 'admin', label: 'Supervision' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  authUser,
  activeTab,
  setActiveTab,
  unreadNotifications,
  onToggleNotifications,
  onOpenAuth,
  onLogout,
  theme = 'dark',
  onToggleTheme,
  isAuthenticated = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayUserName = authUser?.name || 'Visiteur';
  const displayUserRole = authUser?.role || 'VISITOR';
  const displayAvatar =
    authUser?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayUserName
    )}&background=B91C1C&color=fff&size=128`;

  // ✅ Filtrage délégué aux permissions centralisées
  const filteredNavItems = filterAccessibleTabs(
    NAV_ITEMS,
    currentRole,
    'club_workspace'
  ).filter((item) => {
    // ✅ Masque les onglets privés si non connecté
    if (!isAuthenticated && PRIVATE_TABS.has(item.id)) return false;
    return true;
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#090A0F]/90 backdrop-blur-xl border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo FIRE STONE */}
          <div
            onClick={() => setActiveTab('accueil')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-md flex items-center justify-center bg-black group-hover:scale-105 transition-transform shrink-0">
                <img className="w-full h-full object-cover" src={logo} alt="HOOPER" />
              </div>
              <span className="font-black text-xl text-white tracking-tight hidden sm:block">
                HOOPER
              </span>
            </div>
          </div>

          {/* Right Section: Notifications + User Profile Header Dropdown */}
          <div className="hidden lg:flex items-center gap-3">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              >
                {theme === 'dark' ? (
                  <SunMedium className="w-4 h-4" />
                ) : (
                  <MoonStar className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Notifications Button */}
            <button
              onClick={onToggleNotifications}
              className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#B91C1C] text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* HEADER USER PROFILE DROPDOWN */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-xs font-bold text-white group"
                >
                  <img
                    src={displayAvatar}
                    alt={displayUserName}
                    className="w-8 h-8 rounded-xl object-cover border-2 border-[#D97706] shadow-sm"
                  />
                  <div className="text-left hidden xl:block">
                    <div className="text-xs font-extrabold text-white leading-none">
                      {displayUserName.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-[#D97706] font-semibold">
                      {displayUserRole}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0D0E15] border border-white/15 shadow-2xl shadow-black/80 py-2 z-50 space-y-1">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
                      <img
                        src={displayAvatar}
                        alt={displayUserName}
                        className="w-10 h-10 rounded-xl object-cover border border-[#D97706]"
                      />
                      <div>
                        <div className="font-extrabold text-white text-xs">
                          {displayUserName}
                        </div>
                        <div className="text-[10px] text-slate-400">Membre connecté</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('mon-profil');
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-2.5 transition-colors ${activeTab === 'mon-profil'
                          ? 'bg-[#B91C1C]/20 text-[#D97706]'
                          : 'text-slate-200 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      <User className="w-4 h-4 text-[#D97706]" />
                      <span>👤 Mon Profil</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('parametres');
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-2.5 transition-colors ${activeTab === 'parametres'
                          ? 'bg-[#B91C1C]/20 text-[#D97706]'
                          : 'text-slate-200 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>⚙️ Paramètres du Compte</span>
                    </button>

                    <div className="pt-1 border-t border-white/10">
                      <button
                        onClick={() => {
                          if (onLogout) {
                            onLogout();
                          } else {
                            onOpenAuth();
                          }
                          setUserDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Se Déconnecter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 rounded-xl bg-[#B91C1C] px-3 py-2 text-xs font-bold text-white shadow-lg shadow-red-900/20"
              >
                <User className="w-4 h-4" />
                <span>Se connecter</span>
              </button>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="lg:hidden flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/5 text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#090A0F] border-b border-white/10 px-4 pt-2 pb-6 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 mb-2">
            <img
              src={displayAvatar}
              alt={displayUserName}
              className="w-10 h-10 rounded-xl object-cover border border-[#D97706]"
            />
            <div>
              <div className="font-extrabold text-white text-xs">{displayUserName}</div>
              <div className="text-[10px] text-[#D97706] font-bold">
                Rôle actuel : {displayUserRole}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {filteredNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-2.5 rounded-lg text-left text-xs font-bold ${activeTab === item.id
                    ? 'bg-[#B91C1C] text-white font-bold'
                    : 'bg-white/5 text-slate-300'
                  }`}
              >
                {item.label}
              </button>
            ))}
            {isAuthenticated && (
              <>
                <button
                  onClick={() => {
                    setActiveTab('mon-profil');
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-2.5 rounded-lg text-left text-xs font-bold bg-white/5 text-amber-300 border border-amber-500/30"
                >
                  👤 Mon Profil
                </button>
                <button
                  onClick={() => {
                    setActiveTab('parametres');
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-2.5 rounded-lg text-left text-xs font-bold bg-white/5 text-slate-200 border border-white/10"
                >
                  ⚙️ Paramètres
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};