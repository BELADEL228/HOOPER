import { useEffect, useState } from 'react';
import type { UserRole, ViewMode, Team, Club } from './types';
import { ClubProvider } from './context/ClubContext';
import { ThemeProvider } from './features/branding/ThemeProvider';
import { ClubLogo } from './components/common/ClubLogo';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { MatchCenter } from './components/MatchCenter';
import { StatsDashboard } from './components/StatsDashboard';
import { RosterSection } from './components/RosterSection';
import { EventCalendar } from './components/EventCalendar';
import { NewsGallery } from './components/NewsGallery';
import { FinanceManager } from './components/FinanceManager';
import { MessagingSystem } from './components/MessagingSystem';
import { SponsorDonationPortal } from './components/SponsorDonationPortal';
import { AdminPanel } from './components/AdminPanel';
import { PlayerPersonalProfile } from './components/PlayerPersonalProfile';
import { SettingsPage } from './components/settings/SettingsPage';
import { AcademyRecruitment } from './components/AcademyRecruitment';
import { ChampionsDayManager } from './components/ChampionsDayManager';
import { AuthModal } from './components/AuthModal';
import { TerrainsMapPage } from './components/TerrainsMapPage';
import { TournamentsPage } from './components/TournamentsPage';
import { RecruitmentPage } from './components/RecruitmentPage';
import { ScoutingPage } from './components/ScoutingPage';
import { BadgesPage } from './components/BadgesPage';
import { TeamDesignerPage } from './components/TeamDesignerPage';
import { MarketplacePage } from './components/MarketplacePage';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { MobileNavBar } from './components/MobileNavBar';
import { ClubsDirectoryPage } from './components/public/ClubsDirectoryPage';
import { ClubProfilePage } from './components/public/ClubProfilePage';
import { Flame, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { apiUrl } from './services/api';
import { clubApi, type ApiClubRequest } from './services/clubApi';
import { toFrontendClub } from './services/clubMapper';
import { ClubRequestForm } from './components/club/ClubRequestForm';
import { ClubAdministrationPanel } from './components/club/ClubAdministrationPanel';
import { SuperAdminPortal } from './components/admin/SuperAdminPortal';
import { SocialLayout } from './components/layout/SocialLayout';
import { SocialFeedView } from './components/feed/SocialFeedView';
import { ExplorePage } from './components/explore/ExplorePage';
import { SocialProfileView } from './components/profile/SocialProfileView';
import { SocialMessagingView } from './components/messaging/SocialMessagingView';
import { CreateContentModal } from './components/common/CreateContentModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalMatchCenter } from './components/matches/GlobalMatchCenter';
import { socketService } from './services/socket';

// ✅ Import des permissions centralisées
import {
  canAccessPage as canAccessPageUtil,
  PRIVATE_TABS,
  workspacePermissions,
} from './config/permissions';

type AuthSession = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string | null;
  };
};

export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('social');
  const [publicTab, setPublicTab] = useState<string>('accueil');
  const [selectedClub, setSelectedClub] = useState<Team>({
    id: 'pending-club',
    name: 'Mon Club',
    slug: 'mon-club',
    city: '',
    category: 'SENIOR',
  });
  const [clubRequest, setClubRequest] = useState<ApiClubRequest | null>(null);
  const [viewedClubProfile, setViewedClubProfile] = useState<Club | Team | null>(null);
  const [focusedTeam, setFocusedTeam] = useState<Team | undefined>(undefined);
  const [currentRole, setCurrentRole] = useState<UserRole>('VISITOR');
  const [authUser, setAuthUser] = useState<AuthSession['user'] | null>(null);
  const [activeTab, setActiveTab] = useState<string>('accueil');
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('firestone-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* ignore */ }
    return 'dark';
  });

  // ✅ State pour le profil public consulté
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);

  const isAuthenticated = Boolean(authUser);

  // ✅ Mode-aware
  const canAccessPage = (tab: string, role: UserRole) =>
    canAccessPageUtil(tab, role, viewMode);

  const openAuthModal = (tab: 'LOGIN' | 'REGISTER' | 'FORGOT' = 'LOGIN') => {
    setAuthModalTab(tab);
    setShowAuthModal(true);
  };

  const loadClubRequestState = async (token: string, role: UserRole) => {
    if (role === 'SUPER_ADMIN') return setViewMode('super_admin');
    try {
      const [requests, clubs] = await Promise.all([
        clubApi.getMyClubRequests(token).catch(() => []),
        clubApi.fetchClubs().catch(() => []),
      ]);
      const latest = requests[0] || null;
      setClubRequest(latest);
      if (latest?.status === 'APPROVED') {
        const club = clubs.find((item) => item.name === latest.clubName);
        if (club) {
          setSelectedClub({
            id: club.id,
            clubId: club.id,
            name: club.name,
            slug: club.slug,
            logoUrl: club.logoUrl,
            description: club.description,
            city: club.city,
            category: 'SENIOR',
            primaryColor: club.primaryColor,
            secondaryColor: club.secondaryColor,
            accentColor: club.accentColor,
            themeType: club.themeType,
            themeJson:
              typeof club.themeJson === 'string'
                ? club.themeJson
                : JSON.stringify(club.themeJson || {}),
          });
          if (['CLUB_MANAGER', 'ADMIN', 'TREASURER'].includes(role)) {
            setViewMode('club_workspace');
          }
          return;
        }
      }

      if (clubs.length > 0) {
        const defaultClub = clubs[0];
        setSelectedClub((prev) =>
          prev.id === 'pending-club'
            ? {
              id: defaultClub.id,
              clubId: defaultClub.id,
              name: defaultClub.name,
              slug: defaultClub.slug,
              logoUrl: defaultClub.logoUrl,
              description: defaultClub.description,
              city: defaultClub.city,
              category: 'SENIOR',
              primaryColor: defaultClub.primaryColor,
              secondaryColor: defaultClub.secondaryColor,
              accentColor: defaultClub.accentColor,
              themeType: defaultClub.themeType,
              themeJson:
                typeof defaultClub.themeJson === 'string'
                  ? defaultClub.themeJson
                  : JSON.stringify(defaultClub.themeJson || {}),
            }
            : prev
        );
      }
    } catch {
      // Ne pas forcer la redirection en mode club_request
    }
  };

  const handleLoginSuccess = (session: AuthSession) => {
    setAuthUser(session.user);
    setCurrentRole(session.user.role);
    localStorage.setItem('firestone-auth', JSON.stringify(session));
    setShowAuthModal(false);
    void loadClubRequestState(session.token, session.user.role);
  };

  const handleLogout = () => {
    const savedSession = localStorage.getItem('firestone-auth');
    if (savedSession) {
      const parsed = JSON.parse(savedSession) as AuthSession;
      if (parsed?.token) {
        fetch(apiUrl('/auth/logout'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${parsed.token}` },
        }).catch(() => undefined);
      }
    }

    socketService.disconnect();

    localStorage.removeItem('firestone-auth');
    setAuthUser(null);
    setCurrentRole('VISITOR');
    setActiveTab('accueil');
    // Reste sur le mode social (feed en lecture seule, comme Instagram non-connecté)
    setViewMode('social');
  };

  useEffect(() => {
    clubApi
      .fetchClubs()
      .then((clubs) => {
        if (clubs && clubs.length > 0) {
          const first = clubs[0];
          setSelectedClub((prev) =>
            prev.id === 'pending-club'
              ? {
                id: first.id,
                clubId: first.id,
                name: first.name,
                slug: first.slug,
                logoUrl: first.logoUrl,
                description: first.description,
                city: first.city,
                category: 'SENIOR',
                primaryColor: first.primaryColor,
                secondaryColor: first.secondaryColor,
                accentColor: first.accentColor,
                themeType: first.themeType,
                themeJson:
                  typeof first.themeJson === 'string'
                    ? first.themeJson
                    : JSON.stringify(first.themeJson || {}),
              }
              : prev
          );
        }
      })
      .catch(() => undefined);

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const requestedTab = searchParams.get('tab');
      const requestedView = searchParams.get('view');
      if (
        requestedView === 'workspace' ||
        (requestedTab && workspacePermissions[requestedTab])
      ) {
        setViewMode('club_workspace');
        if (requestedTab && workspacePermissions[requestedTab]) {
          setActiveTab(requestedTab);
        }
      }
    }

    const savedSession = localStorage.getItem('firestone-auth');
    if (!savedSession) {
      setAuthUser(null);
      return;
    }

    try {
      const parsed = JSON.parse(savedSession) as AuthSession;
      if (parsed?.user?.role) {
        setCurrentRole(parsed.user.role);
        setAuthUser(parsed.user);
      }

      if (parsed?.token) {
        fetch(apiUrl('/auth/me'), {
          headers: { Authorization: `Bearer ${parsed.token}` },
        })
          .then(async (response) => {
            if (!response.ok) throw new Error('Session invalide');
            const data = await response.json();
            if (data?.user?.role) {
              setCurrentRole(data.user.role);
              setAuthUser(data.user);
              const nextSession = { ...parsed, user: data.user };
              localStorage.setItem('firestone-auth', JSON.stringify(nextSession));
              void loadClubRequestState(parsed.token, data.user.role);
            }
          })
          .catch(() => {
            localStorage.removeItem('firestone-auth');
            setAuthUser(null);
            setCurrentRole('VISITOR');
          });
      }
    } catch {
      localStorage.removeItem('firestone-auth');
      setAuthUser(null);
      setCurrentRole('VISITOR');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated && PRIVATE_TABS.has(activeTab)) {
      setActiveTab('accueil');
      return;
    }

    if (!canAccessPage(activeTab, currentRole)) {
      setActiveTab('accueil');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentRole, isAuthenticated, viewMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.body.style.background = theme === 'light' ? '#f4f7fb' : '#090A0F';
    // ✅ Persistance du choix de thème
    try { localStorage.setItem('firestone-theme', theme); } catch { /* ignore */ }
  }, [theme]);

  const handlePublicNavigate = (tab: string) => {
    setPublicTab(tab);
    if (tab === 'accueil') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'equipes') {
      setTimeout(() => {
        document.getElementById('section-equipes')?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else if (tab === 'stars') {
      setTimeout(() => {
        document.getElementById('section-stars')?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else if (tab === 'equipe-du-mois') {
      setTimeout(() => {
        document.getElementById('section-equipe-mois')?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectTeamWorkspace = (team: Team) => {
    if (currentRole === 'SUPER_ADMIN') return setViewMode('super_admin');
    setSelectedClub(team);
    setViewMode('club_workspace');
    setActiveTab('equipe');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEnterWorkspace = () => {
    if (currentRole === 'SUPER_ADMIN') return setViewMode('super_admin');
    setViewMode('club_workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenClubById = async (clubId: string) => {
    try {
      const c = await clubApi.fetchClubById(clubId);
      if (c) {
        setViewedClubProfile(toFrontendClub(c));
        setFocusedTeam(undefined);
        setActiveTab('club-profile');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    } catch {
      // fallback
    }
    setActiveTab('annuaire');
  };

  // ✅ Nouveau : ouvre le profil public d'un utilisateur
  const handleOpenUserProfile = (userId: string) => {
    if (!userId) return;
    setViewedUserId(userId);
    setActiveTab('user-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderAccessiblePage = () => {
    if (!canAccessPage(activeTab, currentRole)) {
      return (
        <div className="glass-panel rounded-3xl border border-amber-500/30 p-8 text-center max-w-xl mx-auto">
          <h3 className="text-2xl font-black text-white">Accès restreint</h3>
          <p className="mt-3 text-sm text-slate-300">
            Cette section est réservée à un type d’utilisateur spécifique. Connectez-vous avec le
            bon profil ou retournez à l’accueil.
          </p>
          <button
            onClick={() => setActiveTab('accueil')}
            className="mt-5 px-5 py-3 rounded-xl bg-linear-to-r from-[#FF2A3B] to-[#E60023] text-white font-bold cursor-pointer"
          >
            Revenir à l’accueil
          </button>
        </div>
      );
    }

    if (activeTab === 'accueil')
      return (
        <LandingHero
          currentRole={currentRole}
          onNavigate={setActiveTab}
          onOpenAuth={openAuthModal}
        />
      );
    if (activeTab === 'matchs') return <MatchCenter currentRole={currentRole} />;
    if (activeTab === 'tournois') return <TournamentsPage currentRole={currentRole} />;
    if (activeTab === 'recrutement') return <RecruitmentPage currentRole={currentRole} />;
    if (activeTab === 'scouting') return <ScoutingPage currentRole={currentRole} />;
    if (activeTab === 'badges') return <BadgesPage currentRole={currentRole} />;
    if (activeTab === 'designer') return <TeamDesignerPage />;
    if (activeTab === 'stats') return <StatsDashboard />;
    if (activeTab === 'equipe') return <RosterSection currentRole={currentRole} />;
    if (activeTab === 'evenements') return <EventCalendar />;
    if (activeTab === 'actus') return <NewsGallery />;
    if (activeTab === 'terrains') return <TerrainsMapPage />;
    if (activeTab === 'finances') return <FinanceManager />;
    if (activeTab === 'messagerie') return <MessagingSystem currentRole={currentRole} />;
    if (activeTab === 'sponsors') return <SponsorDonationPortal />;
    if (activeTab === 'admin') return <AdminPanel currentRole={currentRole} authUser={authUser} />;
    if (activeTab === 'club-admin') return <ClubAdministrationPanel />;
    if (activeTab === 'mon-profil') {
      return (
        <PlayerPersonalProfile
          currentRole={currentRole}
          authUser={authUser}
          onNavigateToSettings={() => setActiveTab('parametres')}
          onUserUpdate={(user) => {
            setAuthUser(user);
            const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
            if (session?.token)
              localStorage.setItem(
                'firestone-auth',
                JSON.stringify({ ...session, user })
              );
            setCurrentRole(user.role);
          }}
        />
      );
    }
    if (activeTab === 'parametres' || activeTab === 'aide') {
      return (
        <SettingsPage
          authUser={authUser}
          currentRole={currentRole as any}
          onNavigateToProfile={() => setActiveTab('mon-profil')}
          onLogout={handleLogout}
          onSwitchToWorkspace={handleEnterWorkspace}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          onUserUpdate={(user) => {
            setAuthUser(user);
            const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
            if (session?.token)
              localStorage.setItem(
                'firestone-auth',
                JSON.stringify({ ...session, user })
              );
            setCurrentRole(user.role);
          }}
        />
      );
    }
    if (activeTab === 'academie') return <AcademyRecruitment currentRole={currentRole} />;
    if (activeTab === 'journee-champions')
      return <ChampionsDayManager currentRole={currentRole} />;
    if (activeTab === 'marketplace') return <MarketplacePage />;

    return (
      <LandingHero
        currentRole={currentRole}
        onNavigate={setActiveTab}
        onOpenAuth={openAuthModal}
      />
    );
  };

  if (viewMode === 'club_request' && authUser) {
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}') as AuthSession;
    return (
      <div
        className={`min-h-screen p-4 sm:p-10 ${theme === 'light' ? 'theme-light bg-slate-100' : 'theme-dark bg-[#090A0F]'
          }`}
      >
        <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode('public')}
              className="text-sm text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              ← Portail public
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => setViewMode('club_workspace')}
              className="text-sm text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              Espace Club →
            </button>
          </div>
          <span className="text-xs text-slate-400">Connecté : {authUser.name}</span>
        </div>
        <ClubRequestForm
          token={session.token}
          request={clubRequest}
          onSubmitted={(request) => {
            setClubRequest(request);
            setViewMode('club_request');
          }}
        />
      </div>
    );
  }

  if (viewMode === 'super_admin' && authUser?.role === 'SUPER_ADMIN') {
    return (
      <SuperAdminPortal
        user={authUser}
        onExit={() => setViewMode('public')}
        onLogout={handleLogout}
      />
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MODE PRINCIPAL : RÉSEAU SOCIAL BASKETBALL HOOPERS
  // ═══════════════════════════════════════════════════════════════════════════════
  if (viewMode === 'social') {
    return (
      <ErrorBoundary scope="SocialLayout" onReset={() => setActiveTab('accueil')}>
        <SocialLayout
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'create') {
              setShowCreateModal(true);
              return;
            }
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          authUser={authUser}
          currentRole={currentRole}
          onOpenAuth={openAuthModal}
          onLogout={handleLogout}
          onCreateClick={() => setShowCreateModal(true)}
          onSwitchToWorkspace={handleEnterWorkspace}
          selectedClub={selectedClub}
          onSelectClubProfile={(clubId) => void handleOpenClubById(clubId)}
        >
          {activeTab === 'accueil' ? (
            <ErrorBoundary scope="SocialFeedView">
              <SocialFeedView
                currentRole={currentRole}
                authUser={authUser}
                onOpenAuth={openAuthModal}
                onNavigateToMatches={() => setActiveTab('matchs')}
                onOpenProfile={handleOpenUserProfile}
              />
            </ErrorBoundary>
          ) : activeTab === 'explorer' ? (
            <ErrorBoundary scope="ExplorePage">
              <ExplorePage
                onSelectClubProfile={(clubId) => void handleOpenClubById(clubId)}
                onNavigateToMatches={() => setActiveTab('matchs')}
                onOpenAuth={() => openAuthModal('LOGIN')}
                isAuthenticated={isAuthenticated}
                currentRole={currentRole}
              />
            </ErrorBoundary>
          ) : activeTab === 'matchs' ? (
            <ErrorBoundary scope="GlobalMatchCenter">
              <GlobalMatchCenter
                currentRole={currentRole}
                onNavigateToMatch={() => {
                  /* optionnel : ouvrir une page détail */
                }}
              />
            </ErrorBoundary>
          ) : activeTab === 'annuaire' || activeTab === 'equipes' ? (
            <ErrorBoundary scope="ClubsDirectoryPage">
              <ClubsDirectoryPage
                onSelectTeamWorkspace={handleSelectTeamWorkspace}
                onSelectClubProfile={(club, team) => {
                  setViewedClubProfile(club);
                  setFocusedTeam(team);
                  setActiveTab('club-profile');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenAuth={openAuthModal}
                currentUserRole={currentRole}
                isAuthenticated={isAuthenticated}
              />
            </ErrorBoundary>
          ) : activeTab === 'club-profile' && viewedClubProfile ? (
            <ErrorBoundary scope="ClubProfilePage">
              <ClubProfilePage
                club={viewedClubProfile}
                focusedTeam={focusedTeam}
                onBack={() => {
                  setActiveTab('annuaire');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onEnterWorkspace={handleSelectTeamWorkspace}
                onOpenAuth={openAuthModal}
                authUser={authUser}
                currentRole={currentRole}
              />
            </ErrorBoundary>
          ) : activeTab === 'messagerie' ? (
            <ErrorBoundary scope="SocialMessagingView">
              <SocialMessagingView currentRole={currentRole} authUser={authUser} />
            </ErrorBoundary>
          ) : activeTab === 'mon-profil' || activeTab === 'user-profile' ? (
            <ErrorBoundary scope="SocialProfileView">
              <SocialProfileView
                userId={activeTab === 'user-profile' ? viewedUserId : null}
                authUser={authUser}
                currentRole={currentRole}
                onNavigateToSettings={() => setActiveTab('parametres')}
                onNavigateToMessages={() => setActiveTab('messagerie')}
                onNavigateToClub={(clubId) => void handleOpenClubById(clubId)}
                onOpenAuth={() => openAuthModal('LOGIN')}
              />
            </ErrorBoundary>
          ) : (
            renderAccessiblePage()
          )}

          {/* Modal de Création Universelle */}
          <CreateContentModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            isClubManager={currentRole === 'CLUB_MANAGER' || currentRole === 'ADMIN'}
            activeClubId={selectedClub?.id}
          />

          {/* Modals partagés */}
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onLoginSuccess={handleLoginSuccess}
            initialTab={authModalTab}
          />

          <NetworkStatusBanner />
          <PwaInstallPrompt />
        </SocialLayout>
      </ErrorBoundary>
    );
  }


  // ═══════════════════════════════════════════════════════════════════════════════
  // MODE 2 : ESPACE GESTION CLUB (WORKSPACE)
  // ═══════════════════════════════════════════════════════════════════════════════
  return (
    <ClubProvider key={selectedClub.id} initialClub={selectedClub}>
      <ThemeProvider>
        <ErrorBoundary scope="ClubLayout" onReset={() => setActiveTab('accueil')}>
          <div
            className={`min-h-screen flex flex-col justify-between selection:bg-[#B91C1C] selection:text-white ${theme === 'light' ? 'theme-light' : 'theme-dark'
              }`}
          >
            <Sidebar
              currentRole={currentRole}
              onRoleChange={setCurrentRole}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              unreadNotifications={unreadNotifications}
              onOpenAuth={openAuthModal}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              isAuthenticated={isAuthenticated}
              onBackToPublic={() => setViewMode('social')}
              selectedClub={selectedClub}
            />

            <div
              className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
                }`}
            >
              <Navbar
                currentRole={currentRole}
                authUser={authUser}
                onRoleChange={setCurrentRole}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                unreadNotifications={unreadNotifications}
                onToggleNotifications={() => setUnreadNotifications(0)}
                onOpenAuth={openAuthModal}
                onLogout={handleLogout}
                theme={theme}
                onToggleTheme={() =>
                  setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
                }
                isAuthenticated={isAuthenticated}
              />

              <main className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 pt-6 sm:pt-8 flex-1 w-full pb-24 md:pb-8">
                {renderAccessiblePage()}
              </main>

              <footer className="border-t border-white/10 bg-[#06070A] pt-12 pb-8 mt-16 theme-footer">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${isAuthenticated
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                      }`}
                  >
                    {isAuthenticated ? (
                      <>
                        Bienvenue {authUser?.name}. Votre espace de gestion pour{' '}
                        {selectedClub.name} est désormais actif.
                      </>
                    ) : (
                      <>
                        Vous êtes dans l'espace {selectedClub.name}. Connectez-vous pour accéder à
                        la messagerie interne, la trésorerie et vos fiches tactiques.
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Club Brand */}
                    <div className="md:col-span-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl p-0.5 shadow-lg flex items-center justify-center text-lg"
                          style={{
                            background: selectedClub?.primaryColor
                              ? `linear-gradient(135deg, ${selectedClub.primaryColor}, ${selectedClub.secondaryColor || '#FFB800'
                              })`
                              : 'linear-gradient(135deg, #FF2A3B, #FFB800)',
                          }}
                        >
                          <div className="w-full h-full bg-[#090A0F] rounded-[10px] flex items-center justify-center">
                            <ClubLogo
                              logoUrl={selectedClub?.logoUrl}
                              alt={`Logo ${selectedClub.name}`}
                              className="w-full h-full object-contain"
                              fallback={<Flame className="w-6 h-6 text-[#FF2A3B]" />}
                            />
                          </div>
                        </div>
                        <span className="text-xl font-extrabold tracking-wider text-white">
                          {selectedClub.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                        {selectedClub.description ||
                          'Franchise officielle de la ligue professionnelle ouest-africaine. Excellence collective, rigueur athlétique et ferveur populaire.'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-amber-400">
                        <button
                          onClick={() => setViewMode('social')}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-colors"
                        >
                          ← Revenir au Réseau Social
                        </button>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="md:col-span-4 space-y-3">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Navigation Rapide Club
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                        <button
                          onClick={() => setActiveTab('accueil')}
                          className="hover:text-white text-left cursor-pointer"
                        >
                          Accueil Club
                        </button>
                        <button
                          onClick={() => setActiveTab('matchs')}
                          className="hover:text-white text-left cursor-pointer"
                        >
                          Match Center
                        </button>
                        <button
                          onClick={() => setActiveTab('stats')}
                          className="hover:text-white text-left cursor-pointer"
                        >
                          Statistiques
                        </button>
                        <button
                          onClick={() => setActiveTab('equipe')}
                          className="hover:text-white text-left cursor-pointer"
                        >
                          Roster Joueurs
                        </button>
                        <button
                          onClick={() => setActiveTab('evenements')}
                          className="hover:text-white text-left cursor-pointer"
                        >
                          Agenda
                        </button>
                        <button
                          onClick={() => setActiveTab('academie')}
                          className="hover:text-white text-left cursor-pointer"
                        >
                          Centre de Formation
                        </button>
                        <button
                          onClick={() => setActiveTab('journee-champions')}
                          className="hover:text-white text-left cursor-pointer"
                        >
                          Journée Champions
                        </button>
                        <button
                          onClick={() => setActiveTab('finances')}
                          className="hover:text-white text-left cursor-pointer"
                        >
                          Trésorerie
                        </button>
                        <button
                          onClick={() => setActiveTab('marketplace')}
                          className="hover:text-white text-left text-amber-400 font-semibold cursor-pointer"
                        >
                          Boutique & Billets
                        </button>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="md:col-span-4 space-y-3 text-xs text-slate-300">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Contact & QG Club
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#FF2A3B]" /> Terrain & Arène :{' '}
                          {selectedClub.city}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-[#FFB800]" /> +228 79 83 30 34
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-400" />{' '}
                          contact@firestone-basketball.tg
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp : +228 79
                          83 30 34
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/10 text-center text-xs text-slate-500">
                    © 2026 {selectedClub.name} • Espace Club officiel propulsé par la plateforme
                    HOOPER.
                  </div>
                </div>
              </footer>
            </div>

            {/* Modals */}
            <AuthModal
              isOpen={showAuthModal}
              onClose={() => setShowAuthModal(false)}
              onLoginSuccess={handleLoginSuccess}
              initialTab={authModalTab}
            />

            {/* PWA & Mobile */}
            <NetworkStatusBanner />
            <PwaInstallPrompt />
            <MobileNavBar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              userRole={currentRole}
              unreadCount={unreadNotifications}
            />
          </div>
        </ErrorBoundary>
      </ThemeProvider>
    </ClubProvider>
  );
}

// 👇 Point d'entrée par défaut pour compatibilité avec main.tsx
export default App;