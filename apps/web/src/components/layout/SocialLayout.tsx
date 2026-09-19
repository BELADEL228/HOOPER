import React, { useEffect, useState, useMemo, useCallback } from 'react';
import logo from '../../assets/logo.jpeg';
import {
  Flame,
  Search,
  Bell,
  MessageSquare,
  Compass,
  Shield,
  Zap,
  User,
  Plus,
  LogOut,
  LogIn,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Settings,
  ShieldCheck,
  HelpCircle,
  Trophy,
} from 'lucide-react';
import type { UserRole, Team } from '../../types';
import { MobileNavBar } from './MobileNavBar';
import { apiUrl } from '../../services/api';
import { clubApi, type ApiClub } from '../../services/clubApi';
import { filterAccessibleTabs, PRIVATE_TABS } from '../../config/permissions';
import { socketService } from '../../services/socket';
import {
  NotificationToastContainer,
  type ToastNotification,
} from '../common/NotificationToast';
import { NotificationPanel } from '../common/NotificationPanel';
import { useNotificationSound } from '../../hooks/useNotificationSound';

interface SocialLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  authUser?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string | null;
  } | null;
  currentRole: UserRole;
  unreadNotifications?: number;
  unreadMessages?: number;
  onOpenAuth: (tab?: 'LOGIN' | 'REGISTER' | 'FORGOT') => void;
  onLogout: () => void;
  onCreateClick: () => void;
  onSwitchToWorkspace?: () => void;
  selectedClub?: Team;
  onSelectClubProfile?: (clubId: string) => void;
}

interface NavItemDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  isLive?: boolean;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'accueil', label: 'Fil d’actualité', icon: Flame },
  { id: 'explorer', label: 'Explorer & Recherche', icon: Compass },
  { id: 'matchs', label: 'Match Center & Live', icon: Zap, isLive: true },
  { id: 'stats', label: 'Statistiques Joueurs', icon: Trophy },
  { id: 'annuaire', label: 'Clubs & Franchises', icon: Shield },
  { id: 'messagerie', label: 'Messagerie', icon: MessageSquare },
  { id: 'mon-profil', label: 'Mon Profil Athlète', icon: User },
];

interface TrendingTopic {
  tag: string;
  postsCount: string;
  category: string;
}

const getAuthToken = (): string => {
  try {
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    return session?.token || '';
  } catch {
    return '';
  }
};

export const SocialLayout: React.FC<SocialLayoutProps> = ({
  children,
  activeTab,
  onSelectTab,
  authUser,
  currentRole,
  unreadNotifications = 0,
  unreadMessages = 0,
  onOpenAuth,
  onLogout,
  onCreateClick,
  onSwitchToWorkspace,
  selectedClub,
  onSelectClubProfile,
}) => {
  const [suggestedClubs, setSuggestedClubs] = useState<ApiClub[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);


  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  // ✅ Compteurs temps réel
  const [liveUnreadMessages, setLiveUnreadMessages] =
    useState<number>(unreadMessages);
  const [liveUnreadNotifications, setLiveUnreadNotifications] =
    useState<number>(unreadNotifications);

  // ✅ Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // ✅ NOUVEAU : État d'ouverture du panneau de notifications
  const [showNotificationsPanel, setShowNotificationsPanel] =
    useState<boolean>(false);

  // ✅ Hook du son
  const { play: playNotificationSound, unlock: unlockSound } =
    useNotificationSound();

  const isAuthenticated = Boolean(authUser);

  // ═══════════════════════════════════════════════════════════════════
  // 📡 Chargement des clubs + tendances
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    clubApi
      .fetchClubs()
      .then((data) => setSuggestedClubs(Array.isArray(data) ? data : []))
      .catch(() => setSuggestedClubs([]));

    fetch(apiUrl('/posts'))
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        const posts: Array<{ content?: string | null }> = Array.isArray(data)
          ? data
          : Array.isArray(data?.posts)
            ? data.posts
            : [];

        const tagCounts: Record<string, number> = {};
        posts.forEach((p) => {
          const content = typeof p?.content === 'string' ? p.content : '';
          const tagMatches = content.match(/#\w+/g) || [];
          tagMatches.forEach((t) => {
            tagCounts[t] = (tagCounts[t] || 0) + 1;
          });
        });

        const topics: TrendingTopic[] = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag, count]) => ({
            tag,
            postsCount: `${count} post${count > 1 ? 's' : ''}`,
            category: 'Basketball',
          }));
        setTrendingTopics(topics);
      })
      .catch(() => setTrendingTopics([]));
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // ✅ Débloquer l'audio au premier clic utilisateur
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    const handler = () => {
      unlockSound();
      document.removeEventListener('click', handler);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [unlockSound]);

  // ═══════════════════════════════════════════════════════════════════
  // 🔢 Charger le compteur de notifications non lues
  // ═══════════════════════════════════════════════════════════════════
  const fetchUnreadNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(apiUrl('/notifications/unread-count'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setLiveUnreadNotifications(Number(data?.count ?? 0));
    } catch (err) {
      console.warn('[SocialLayout] fetchUnreadNotifications', err);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // 🔢 Charger le compteur de messages non lus
  // ═══════════════════════════════════════════════════════════════════
  const fetchUnreadCount = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(apiUrl('/conversations'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.conversations)
          ? data.conversations
          : [];

      const total = list.reduce(
        (acc: number, c: any) => acc + Number(c?.unreadCount ?? 0),
        0
      );
      setLiveUnreadMessages(total);
    } catch (err) {
      console.warn('[SocialLayout] fetchUnreadCount', err);
    }
  }, []);

  // Charge les compteurs quand on se connecte
  useEffect(() => {
    if (!isAuthenticated) {
      setLiveUnreadNotifications(0);
      setLiveUnreadMessages(0);
      return;
    }
    void fetchUnreadNotifications();
    void fetchUnreadCount();
  }, [isAuthenticated, fetchUnreadNotifications, fetchUnreadCount]);

  // Reset le badge messagerie quand on ouvre l'onglet messagerie
  useEffect(() => {
    if (activeTab === 'messagerie') {
      setLiveUnreadMessages(0);
    }
  }, [activeTab]);

  // ═══════════════════════════════════════════════════════════════════
  // 🏷️ TITRE DE L'ONGLET + BADGE NAVIGATEUR
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    const DEFAULT_TITLE = 'HOOPERS • Basket Social';
    const total = liveUnreadNotifications + liveUnreadMessages;

    if (total > 0) {
      const countLabel = total > 99 ? '99+' : String(total);
      document.title = `(${countLabel}) ${DEFAULT_TITLE}`;

      // ✅ Badging API (badge sur l'icône PWA/onglet mobile)
      // Supporté par Chrome, Edge, Safari iOS 16.4+
      if ('setAppBadge' in navigator) {
        try {
          (navigator as any).setAppBadge(total).catch(() => undefined);
        } catch {
          // ignore
        }
      }
    } else {
      document.title = DEFAULT_TITLE;

      if ('clearAppBadge' in navigator) {
        try {
          (navigator as any).clearAppBadge().catch(() => undefined);
        } catch {
          // ignore
        }
      }
    }

    // Cleanup à l'unmount
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [liveUnreadNotifications, liveUnreadMessages]);

  // ═══════════════════════════════════════════════════════════════════
  // 🔌 SOCKET — Messages + Notifications temps réel
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isAuthenticated || !authUser?.id) return;

    const socket = socketService.connect();
    if (!socket) return;

    // ── Nouveau message → incrémente badge messagerie ────────────
    const offNewMessage = socketService.onNewMessage((msg) => {
      if (msg.senderId === authUser.id) return;
      if (activeTab === 'messagerie') return;
      setLiveUnreadMessages((prev) => prev + 1);
    });

    // ── Message lu → re-fetch compteur messagerie ────────────────
    const offMessagesRead = socketService.onMessagesRead(() => {
      void fetchUnreadCount();
    });

    // ── NOUVELLE NOTIFICATION → toast + son + badge cloche ───────
    const offNotification = socketService.onNotification((notif) => {
      // Sécurité : ignore nos propres notifs
      if (notif.meta?.senderId === authUser.id) return;

      // Ignore si on est déjà sur la messagerie et c'est un message
      if (
        activeTab === 'messagerie' &&
        notif.type === 'MESSAGE' &&
        notif.meta?.conversationId
      ) {
        return;
      }

      // Incrémente le badge cloche
      setLiveUnreadNotifications((prev) => prev + 1);

      // Ajoute un toast
      setToasts((prev) => {
        if (prev.some((t) => t.id === notif.id)) return prev;
        return [
          ...prev,
          {
            id: notif.id,
            type: notif.type,
            title: notif.title,
            text: notif.text,
            onOpen: () => {
              if (notif.type === 'MESSAGE') {
                onSelectTab('messagerie');
              }
              // Marque comme lue côté serveur
              socketService
                .getSocket()
                ?.emit('notification:mark-read', { notificationId: notif.id });
            },
          },
        ];
      });

      // 🎵 Joue le son
      playNotificationSound();

      // Rafraîchit le badge messagerie
      void fetchUnreadCount();
    });

    // ── Notification lue → re-fetch compteur cloche ──────────────
    const offNotifRead = socketService.onNotificationRead(() => {
      void fetchUnreadNotifications();
    });

    return () => {
      offNewMessage();
      offMessagesRead();
      offNotification();
      offNotifRead();
    };
  }, [
    isAuthenticated,
    authUser?.id,
    activeTab,
    fetchUnreadCount,
    fetchUnreadNotifications,
    playNotificationSound,
    onSelectTab,
  ]);

  // ═══════════════════════════════════════════════════════════════════
  // 🧮 Filtrage des onglets
  // ═══════════════════════════════════════════════════════════════════
  const visibleNavItems = useMemo(() => {
    const withBadges = NAV_ITEMS.map((item) =>
      item.id === 'messagerie' ? { ...item, badge: liveUnreadMessages } : item
    );
    return filterAccessibleTabs(
      withBadges,
      currentRole,
      'social',
      isAuthenticated
    ).filter(
      (item) => {
        if (!isAuthenticated && PRIVATE_TABS.has(item.id)) return false;
        return true;
      }
    );
  }, [currentRole, liveUnreadMessages, isAuthenticated]);

  const showRightSidebar = ['accueil', 'explorer'].includes(activeTab);

  return (
    <div className="min-h-screen bg-[#08090E] text-slate-100 flex flex-col font-sans selection:bg-[#FF2A3B] selection:text-white">
      {/* ── 1. Top Navbar Header ── */}
      <header className="sticky top-0 z-40 bg-[#090A0F]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('accueil')}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-[#FF2A3B]/25 group-hover:scale-105 transition-transform border border-white/10 shrink-0 bg-black">
              <img src={logo} alt="HOOPER" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col text-left">
              <span className="hoopers-font-display text-xl sm:text-2xl tracking-tighter text-white font-black leading-none">
                HOOPERS<span className="text-[#FF2A3B]">.</span>
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#FFB800]">
                Basket Social
              </span>
            </div>
          </button>
        </div>

        {/* Barre de recherche centrale */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              onFocus={() => {
                if (activeTab !== 'explorer') onSelectTab('explorer');
              }}
              placeholder="Rechercher un joueur, un club, un match..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF2A3B] transition-colors"
            />
          </div>
        </div>

        {/* Actions Droite */}
        {authUser ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* ✅ NOUVEAU : Wrapper relative pour positionner le panneau */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsPanel((prev) => !prev)}
                aria-label="Notifications"
                className="relative p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {liveUnreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 px-1 rounded-full bg-[#FF2A3B] text-white text-[9px] font-bold ring-2 ring-[#090A0F]">
                    {liveUnreadNotifications > 99
                      ? '99+'
                      : liveUnreadNotifications}
                  </span>
                )}
              </button>

              {/* ✅ NOUVEAU : Panneau de notifications */}
              <NotificationPanel
                isOpen={showNotificationsPanel}
                onClose={() => setShowNotificationsPanel(false)}
                onUnreadCountChange={(count) =>
                  setLiveUnreadNotifications(count)
                }
                onNotificationClick={(notif) => {
                  if (notif.type === 'MESSAGE') {
                    onSelectTab('messagerie');
                  }
                }}
              />
            </div>

            <button
              onClick={() => onSelectTab('messagerie')}
              aria-label="Messages"
              className="hidden sm:flex relative p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <MessageSquare className="w-5 h-5" />
              {liveUnreadMessages > 0 && (
                <span className="absolute top-1 right-1 px-1 rounded-full bg-[#FF2A3B] text-white text-[9px] font-bold ring-2 ring-[#090A0F]">
                  {liveUnreadMessages > 99 ? '99+' : liveUnreadMessages}
                </span>
              )}
            </button>

            <div className="relative flex items-center gap-2.5 pl-2 sm:border-l sm:border-white/10">
              {/* Bouton profil / avatar */}
              <button
                type="button"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                aria-label="Ouvrir le menu du profil"
                aria-expanded={showProfileMenu}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              >
                <img
                  src={
                    authUser.avatarUrl ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                  }
                  alt={authUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-white/20 bg-slate-800"
                />

                <span className="hidden lg:inline text-xs font-bold text-white max-w-[110px] truncate">
                  {authUser.name}
                </span>
              </button>

              {/* Menu du compte */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/10 bg-[#0F121E]/98 backdrop-blur-xl shadow-2xl overflow-hidden z-50">

                  {/* Informations utilisateur */}
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          authUser.avatarUrl ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                        }
                        alt={authUser.name}
                        className="w-10 h-10 rounded-xl object-cover border border-white/10 bg-slate-800"
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {authUser.name}
                        </p>

                        <p className="text-[11px] text-slate-500 truncate">
                          {authUser.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-1.5">

                    {/* Mon profil */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onSelectTab('mon-profil');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Mon profil</span>
                    </button>

                    {/* Paramètres */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onSelectTab('parametres');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Paramètres</span>
                    </button>

                    {/* Confidentialité */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onSelectTab('parametres');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      <span>Confidentialité</span>
                    </button>

                    {/* Aide */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onSelectTab('aide');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                      <span>Aide & assistance</span>
                    </button>
                  </div>

                  {/* Déconnexion */}
                  <div className="border-t border-white/10 p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#FF4B5C] hover:bg-[#FF2A3B]/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative flex items-center">
            {/* Desktop / tablette */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('LOGIN')}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
              >
                Connexion
              </button>

              <button
                onClick={() => onOpenAuth('REGISTER')}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors"
              >
                Inscription
              </button>
            </div>

            {/* Smartphone */}
            <div className="sm:hidden">
              <button
                type="button"
                onClick={() => setShowAuthMenu((prev) => !prev)}
                aria-label="Ouvrir le menu d'authentification"
                aria-expanded={showAuthMenu}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-white hover:bg-white/10 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
              </button>

              {showAuthMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-white/10 bg-[#111318] shadow-2xl overflow-hidden z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthMenu(false);
                      onOpenAuth('LOGIN');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Se connecter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthMenu(false);
                      onOpenAuth('REGISTER');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Créer un compte</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── 2. Corps Principal ── */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 flex gap-6">
        {/* ── COLONNE GAUCHE ── */}
        <aside className="hidden md:flex flex-col w-60 lg:w-64 shrink-0 space-y-4 sticky top-22 h-[calc(100vh-6.5rem)]">
          <nav className="social-card-border rounded-3xl p-3 space-y-1 shadow-xl flex-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${isActive
                    ? 'bg-gradient-to-r from-[#FF2A3B] to-[#E60023] text-white shadow-lg shadow-[#FF2A3B]/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#FFB800]'
                        }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white text-black">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  {item.isLive && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-[#FF2A3B] text-white animate-pulse">
                      LIVE
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-3">
              <button
                onClick={onCreateClick}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#FF2A3B] via-[#E60023] to-[#FFB800] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-xl shadow-[#FF2A3B]/30 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Créer +</span>
              </button>
            </div>
          </nav>

          {onSwitchToWorkspace && (
            <div className="social-card-border rounded-3xl p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#FFB800]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Espace Club
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Accédez aux feuilles de matchs, convocations et trésorerie de{' '}
                {selectedClub?.name || 'votre club'}.
              </p>
              <button
                onClick={onSwitchToWorkspace}
                className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Ouvrir le Vestiaire</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </aside>

        {/* ── COLONNE CENTRALE ── */}
        <main className="flex-1 min-w-0 pb-24 md:pb-8">{children}</main>

        {/* ── COLONNE DROITE ── */}
        {showRightSidebar && (
          <aside className="hidden xl:flex flex-col w-72 lg:w-80 shrink-0 space-y-4 sticky top-22 h-[calc(100vh-6.5rem)] overflow-y-auto no-scrollbar">
            <div className="social-card-border rounded-3xl p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#FF2A3B]" /> Choc de la Ligue
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#FF2A3B] text-white">
                  SAMEDI
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Fire Stone Lomé</span>
                  <span className="text-slate-400 font-normal">VS</span>
                  <span>Étoile Filante</span>
                </div>
                <div className="text-[11px] text-slate-400 text-center">
                  Terrain Municipal Lomé • 16h30
                </div>
                <button
                  onClick={() => onSelectTab('matchs')}
                  className="w-full py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white transition-colors cursor-pointer"
                >
                  Détails & Convocation
                </button>
              </div>
            </div>

            <div className="social-card-border rounded-3xl p-4 space-y-3 shadow-xl">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#FFB800]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Tendances Basketball
                </span>
              </div>
              <div className="space-y-2">
                {trendingTopics.length === 0 ? (
                  <p className="text-[11px] text-slate-500 text-center py-2">
                    Aucune tendance disponible
                  </p>
                ) : (
                  trendingTopics.map((topic, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectTab('explorer')}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 text-left transition-colors cursor-pointer group"
                    >
                      <div>
                        <span className="text-xs font-extrabold text-[#FFB800] group-hover:underline block">
                          {topic.tag}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {topic.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {topic.postsCount}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="social-card-border rounded-3xl p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#FF2A3B]" /> Clubs à Découvrir
                </span>
                <button
                  onClick={() => onSelectTab('annuaire')}
                  className="text-[10px] text-[#FF2A3B] hover:underline font-bold cursor-pointer"
                >
                  Tout voir
                </button>
              </div>
              <div className="space-y-2.5">
                {suggestedClubs.slice(0, 4).map((club) => (
                  <div
                    key={club.id}
                    onClick={() => {
                      if (onSelectClubProfile) {
                        onSelectClubProfile(club.id);
                      } else {
                        onSelectTab('annuaire');
                      }
                    }}
                    className="flex items-center justify-between gap-2 p-1.5 -mx-1.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={
                          club.logoUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            club.name || 'Club'
                          )}&background=FF2A3B&color=fff`
                        }
                        alt={club.name || 'Club'}
                        className="w-8 h-8 rounded-xl object-cover bg-slate-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white group-hover:text-[#FFB800] transition-colors truncate block">
                          {club.name || 'Club inconnu'}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {club.city || '—'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectClubProfile) {
                          onSelectClubProfile(club.id);
                        } else {
                          onSelectTab('annuaire');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#FF2A3B] hover:text-white text-[10px] font-bold text-slate-300 transition-colors shrink-0 cursor-pointer"
                    >
                      Voir
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-slate-500 px-2 space-y-1">
              <div>© 2026 HOOPERS Basketball Network</div>
              <div>Règlement • Détections • Fair-play • Confidentialité</div>
            </div>
          </aside>
        )}
      </div>

      {/* ── 3. Bottom Navigation Bar Mobile ── */}
      <MobileNavBar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        userRole={currentRole}
        isAuthenticated={isAuthenticated}
        unreadCount={liveUnreadNotifications}
        unreadMessagesCount={liveUnreadMessages}
        onCreateClick={onCreateClick}
        mode="social"
      />

      {/* ✅ Toasts de notification */}
      <NotificationToastContainer
        notifications={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
};