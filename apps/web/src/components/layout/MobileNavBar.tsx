import { useState } from 'react';
import {
  Flame,
  Grid,
  X,
  MapPin,
  Sparkles,
  Award,
  UserPlus,
  Shield,
  CreditCard,
  Settings,
  UserCheck,
  ShoppingBag,
  Search,
  User,
  MessageSquare,
  Calendar,
  Trophy,
  Users,
  Newspaper,
  BarChart3,
} from 'lucide-react';
import type { UserRole } from '../../types';
import { filterAccessibleTabs } from '../../config/permissions';

interface MobileNavBarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  userRole: UserRole;
  isAuthenticated?: boolean;
  unreadCount?: number;
  unreadMessagesCount?: number;
  onCreateClick?: () => void;
  mode?: 'social' | 'club_workspace';
}

interface TabDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isCreate?: boolean;
  badge?: number;
  desc?: string;
}

// ✅ Helper : formate un badge (99+ au-delà)
const formatBadge = (count: number): string => {
  if (count <= 0) return '';
  return count > 99 ? '99+' : String(count);
};

export function MobileNavBar({
  activeTab,
  onSelectTab,
  userRole = 'VISITOR',
  isAuthenticated = false,
  unreadCount = 0,
  unreadMessagesCount = 0,
  mode = 'club_workspace',
}: MobileNavBarProps) {
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);

  // ─── Onglets principaux selon le mode ─────────────────────────────────
  const socialMainTabs: TabDef[] = [
    { id: 'accueil', label: 'Accueil', icon: Flame },
    { id: 'explorer', label: 'Explorer', icon: Search },
    {
      id: 'messagerie',
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessagesCount,
    },
    { id: 'mon-profil', label: 'Profil', icon: User },
  ];

  const workspaceMainTabs: TabDef[] = [
    { id: 'accueil', label: 'Club', icon: Flame },
    { id: 'matchs', label: 'Matchs', icon: Trophy },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'equipe', label: 'Roster', icon: Users },
    {
      id: 'messagerie',
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessagesCount,
    },
  ];

  const sourceMainTabs = mode === 'social' ? socialMainTabs : workspaceMainTabs;

  // ─── Menu "Plus" selon le mode ────────────────────────────────────────
  const socialMoreItems: TabDef[] = [
    { id: 'marketplace', label: 'Boutique', icon: ShoppingBag, desc: 'Maillots & billets' },
    { id: 'terrains', label: 'Terrains', icon: MapPin, desc: 'Géolocalisation' },
    { id: 'designer', label: 'Designer', icon: Sparkles, desc: 'AI Team Designer' },
    { id: 'badges', label: 'Badges', icon: Award, desc: 'Succès & MVP' },
    { id: 'recrutement', label: 'Recrutement', icon: UserPlus, desc: 'Détections & draft' },
    { id: 'scouting', label: 'Scouting', icon: UserCheck, desc: 'Fiches talents' },
    { id: 'parametres', label: 'Paramètres', icon: Settings, desc: 'Compte' },
  ];

  const workspaceMoreItems: TabDef[] = [
    { id: 'evenements', label: 'Agenda', icon: Calendar, desc: 'Entraînements & matchs' },
    { id: 'actus', label: 'Actualités', icon: Newspaper, desc: 'Communiqués du club' },
    { id: 'tournois', label: 'Tournois', icon: Trophy, desc: 'Compétitions' },
    { id: 'finances', label: 'Trésorerie', icon: CreditCard, desc: 'Comptes & cotisations' },
    { id: 'marketplace', label: 'Boutique', icon: ShoppingBag, desc: 'Maillots & billets' },
    { id: 'sponsors', label: 'Sponsors', icon: Sparkles, desc: 'Partenaires' },
    { id: 'academie', label: 'Académie', icon: Award, desc: 'Formation' },
    { id: 'club-admin', label: 'Gestion Club', icon: Shield, desc: 'Administration club' },
    { id: 'admin', label: 'Admin Système', icon: Shield, desc: 'Modération plateforme' },
    { id: 'mon-profil', label: 'Mon Profil', icon: User, desc: 'Profil personnel' },
    { id: 'parametres', label: 'Paramètres', icon: Settings, desc: 'Configuration' },
  ];

  const sourceMoreItems = mode === 'social' ? socialMoreItems : workspaceMoreItems;

  // Filtre via permissions centralisées
  const visibleMainTabs = filterAccessibleTabs(
    sourceMainTabs,
    userRole,
    mode,
    isAuthenticated
  );

  const visibleMoreItems = filterAccessibleTabs(
    sourceMoreItems,
    userRole,
    mode,
    isAuthenticated
  );

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* Barre de navigation basse pour smartphone */}
      <nav
        aria-label="Navigation mobile principale"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090A0F]/95 backdrop-blur-xl border-t border-white/10 px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl shadow-black"
      >
        <div className="flex items-center justify-around">
          {visibleMainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id && !showMoreMenu;
            const badgeText = formatBadge(tab.badge ?? 0);   // ✅ Cap 99+

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                type="button"
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 cursor-pointer ${isActive ? 'text-[#FFB800] scale-105' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {isActive && (
                  <span className="absolute -top-1.5 w-7 h-1 rounded-full bg-gradient-to-r from-[#FF2A3B] to-[#FFB800] shadow-sm shadow-red-500" />
                )}

                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#FF2A3B]' : ''}`} />
                  {badgeText && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-[#FF2A3B] text-white text-[9px] font-black">
                      {badgeText}
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-black tracking-tight mt-1">
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* Bouton "Plus / Menu" */}
          <button
            onClick={() => setShowMoreMenu((prev) => !prev)}
            type="button"
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 cursor-pointer ${showMoreMenu ? 'text-[#FF2A3B] scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            {showMoreMenu && (
              <span className="absolute -top-1.5 w-7 h-1 rounded-full bg-gradient-to-r from-[#FF2A3B] to-[#FFB800] shadow-sm shadow-red-500" />
            )}

            <div className="relative">
              <Grid className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-[#FF2A3B] text-white text-[9px] font-black">
                  {formatBadge(unreadCount)}
                </span>
              )}
            </div>

            <span className="text-[10px] font-black tracking-tight mt-1">
              {showMoreMenu ? 'Fermer' : 'Plus'}
            </span>
          </button>
        </div>
      </nav>

      {/* Tiroir "Plus d'options" pour Mobile */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col justify-end animate-fadeIn">
          <div className="flex-1" onClick={() => setShowMoreMenu(false)} />

          <div className="rounded-t-3xl border-t border-white/15 bg-[#0F121E] p-5 pb-24 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FFB800]">
                  {mode === 'social' ? 'Menu Social' : 'Menu Club Workspace'}
                </span>
                <h3 className="text-base font-black text-white">
                  {mode === 'social' ? 'Modules FIRE STONE' : 'Outils de Gestion Club'}
                </h3>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                type="button"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {visibleMoreItems.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Aucun module supplémentaire accessible avec votre rôle actuel.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {visibleMoreItems.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      type="button"
                      className={`flex flex-col text-left p-3 rounded-2xl border transition-all cursor-pointer ${isSelected
                        ? 'bg-white/15 border-[#FF2A3B] text-white shadow-lg'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#FFB800] mb-2">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-white leading-tight">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}