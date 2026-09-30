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
  Plus,
  User,
  MessageSquare,
  Calendar,
  Trophy,
  Users,
  Newspaper,
  BarChart3,
  Zap,
  Bell,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { UserRole } from '../../types';
import { filterAccessibleTabs } from '../../config/permissions';
import { triggerHaptic } from '../../pwa/haptics';
import { PushNotificationModal } from '../common/PushNotificationModal';

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

// Helper : formate un badge (99+ au-delà)
const formatBadge = (count: number): string => {
  if (count <= 0) return '';
  return count > 99 ? '99+' : String(count);
};

export function MobileNavBar({
  activeTab,
  onSelectTab,
  userRole = 'VISITOR',
  isAuthenticated = userRole !== 'VISITOR',
  unreadCount = 0,
  unreadMessagesCount = 0,
  onCreateClick,
  mode = 'social',
}: MobileNavBarProps) {
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [showPushModal, setShowPushModal] = useState<boolean>(false);

  // ─── Onglets principaux selon le mode ─────────────────────────────────
  const socialMainTabs: TabDef[] = [
    { id: 'accueil', label: 'Accueil', icon: Flame },
    { id: 'explorer', label: 'Explorer', icon: Search },
    { id: 'create', label: 'Créer', icon: Plus, isCreate: true },
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
    { id: 'live', label: 'Live Center', icon: Zap, desc: 'Matchs en direct & replays' },
    { id: 'stats', label: 'Statistiques Joueurs', icon: BarChart3, desc: 'Classements & points' },
    { id: 'marketplace', label: 'Boutique & Billets', icon: ShoppingBag, desc: 'Maillots, QR tickets' },
    { id: 'terrains', label: 'Terrains du Togo', icon: MapPin, desc: 'Cartographie & réservations' },
    { id: 'tournois', label: 'Tournois & Cups', icon: Trophy, desc: 'Compétitions officielles' },
    { id: 'badges', label: 'Badges & Trophées', icon: Award, desc: 'Distinctions & succès' },
    { id: 'recrutement', label: 'Recrutement', icon: UserPlus, desc: 'Mercato & détection' },
    { id: 'scouting', label: 'Scouting Staff', icon: UserCheck, desc: 'Shortlists talents' },
    { id: 'annuaire', label: 'Clubs & Franchises', icon: Shield, desc: 'Annuaire national' },
    { id: 'parametres', label: 'Paramètres', icon: Settings, desc: 'Préférences & compte' },
  ];

  const workspaceMoreItems: TabDef[] = [
    { id: 'evenements', label: 'Agenda & Présences', icon: Calendar, desc: 'Entraînements & matchs' },
    { id: 'actus', label: 'Actualités Club', icon: Newspaper, desc: 'Communiqués & galeries' },
    { id: 'tournois', label: 'Tournois & Brackets', icon: Trophy, desc: 'Compétitions engagées' },
    { id: 'finances', label: 'Trésorerie & Cotisations', icon: CreditCard, desc: 'Budgets & transactions' },
    { id: 'sponsors', label: 'Partenaires & Dons', icon: Sparkles, desc: 'Mécénat & marques' },
    { id: 'academie', label: 'Académie Espoirs', icon: Award, desc: 'Centre de formation' },
    { id: 'club-admin', label: 'Gestion du Club', icon: Shield, desc: 'Administration & rôles' },
    { id: 'marketplace', label: 'Boutique Club', icon: ShoppingBag, desc: 'Merchandising & billets' },
    { id: 'mon-profil', label: 'Fiche Joueur / Staff', icon: User, desc: 'Profil individuel' },
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
    triggerHaptic('selection');
    onSelectTab(tabId);
    setShowMoreMenu(false);
  };

  const handleCreateClick = () => {
    triggerHaptic('medium');
    if (onCreateClick) onCreateClick();
    else handleTabClick('create');
  };

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <>
      {/* ── Barre de navigation basse pour smartphone ── */}
      <nav
        aria-label="Navigation mobile principale"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090A0F]/95 backdrop-blur-xl border-t border-white/10 px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl shadow-black select-none"
      >
        <div className="flex items-center justify-around">
          {visibleMainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id && !showMoreMenu;
            const badgeText = formatBadge(tab.badge ?? 0);

            if (tab.isCreate) {
              return (
                <button
                  key={tab.id}
                  onClick={handleCreateClick}
                  type="button"
                  aria-label="Créer une publication ou une story"
                  className="relative -top-3 flex flex-col items-center justify-center p-3 rounded-full bg-gradient-to-tr from-[#FF2A3B] to-[#FFB800] text-white shadow-xl shadow-[#FF2A3B]/40 hover:scale-110 active:scale-90 transition-transform cursor-pointer border-2 border-[#090A0F]"
                >
                  <Plus className="w-6 h-6 stroke-[3]" />
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                type="button"
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer ${
                  isActive ? 'text-[#FFB800] scale-105' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="absolute -top-1.5 w-7 h-1 rounded-full bg-gradient-to-r from-[#FF2A3B] to-[#FFB800] shadow-sm shadow-red-500 animate-fade-in" />
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
            onClick={() => {
              triggerHaptic('light');
              setShowMoreMenu((prev) => !prev);
            }}
            type="button"
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer ${
              showMoreMenu ? 'text-[#FF2A3B] scale-105' : 'text-slate-400 hover:text-slate-200'
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

      {/* ── Tiroir "Plus d'options" pour Mobile ── */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end animate-fade-in">
          {/* Backdrop dismiss */}
          <div
            className="flex-1"
            onClick={() => {
              triggerHaptic('light');
              setShowMoreMenu(false);
            }}
          />

          <div className="rounded-t-3xl border-t border-white/15 bg-[#0F121E] p-5 pb-28 shadow-2xl space-y-4 max-h-[82vh] overflow-y-auto animate-slide-up">
            {/* Poignée tactile de tirage (Pull Handle) */}
            <div
              className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-1 cursor-grab"
              onClick={() => setShowMoreMenu(false)}
            />

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FFB800]">
                  {mode === 'social' ? 'Menu Social HOOPER' : 'Gestion Club Workspace'}
                </span>
                <h3 className="text-base font-black text-white">
                  {mode === 'social' ? 'Services & Navigation' : 'Outils de Direction'}
                </h3>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowMoreMenu(false);
                }}
                type="button"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar (Notifications Push & Réseau) */}
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setShowPushModal(true);
                }}
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Alertes Live</span>
              </button>

              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 text-[11px] text-slate-300 font-medium">
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span>En ligne</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cache PWA</span>
                  </>
                )}
              </div>
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
                      className={`flex flex-col text-left p-3 rounded-2xl border transition-all active:scale-95 cursor-pointer ${
                        isSelected
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

      {/* Modal d'activation des notifications push */}
      <PushNotificationModal
        isOpen={showPushModal}
        onClose={() => setShowPushModal(false)}
      />
    </>
  );
}