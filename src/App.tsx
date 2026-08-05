import { useEffect, useState } from 'react';
import type { UserRole } from './types';
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
import { AccountSettings } from './components/AccountSettings';
import { AcademyRecruitment } from './components/AcademyRecruitment';
import { ChampionsDayManager } from './components/ChampionsDayManager';
import { AuthModal } from './components/AuthModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { TerrainsMapPage } from './components/TerrainsMapPage';
import { Flame, MapPin, Phone, Mail, MessageCircle, Shield } from 'lucide-react';

const pagePermissions: Record<string, UserRole[]> = {
  accueil: ['SUPER_ADMIN', 'ADMIN', 'TREASURER', 'COACH', 'PLAYER', 'VISITOR', 'SPONSOR', 'ACADEMY_CANDIDATE'],
  matchs: ['SUPER_ADMIN', 'ADMIN', 'TREASURER', 'COACH', 'PLAYER', 'VISITOR', 'SPONSOR', 'ACADEMY_CANDIDATE'],
  stats: ['SUPER_ADMIN', 'ADMIN', 'TREASURER', 'COACH', 'PLAYER', 'VISITOR', 'SPONSOR', 'ACADEMY_CANDIDATE'],
  equipe: ['SUPER_ADMIN', 'ADMIN', 'TREASURER', 'COACH', 'PLAYER', 'VISITOR', 'SPONSOR', 'ACADEMY_CANDIDATE'],
  evenements: ['SUPER_ADMIN', 'ADMIN', 'TREASURER', 'COACH', 'PLAYER', 'VISITOR', 'SPONSOR', 'ACADEMY_CANDIDATE'],
  actu: ['SUPER_ADMIN', 'ADMIN', 'TREASURER', 'COACH', 'PLAYER', 'VISITOR', 'SPONSOR', 'ACADEMY_CANDIDATE'],
  finances: ['SUPER_ADMIN', 'ADMIN', 'TREASURER'],
  messagerie: ['SUPER_ADMIN', 'ADMIN', 'TREASURER', 'COACH', 'PLAYER'],
  sponsors: ['SUPER_ADMIN', 'ADMIN', 'TREASURER', 'COACH', 'PLAYER', 'VISITOR', 'SPONSOR'],
  admin: ['SUPER_ADMIN', 'ADMIN', 'COACH'],
  'mon-profil': ['SUPER_ADMIN', 'ADMIN', 'COACH', 'PLAYER', 'TREASURER'],
  parametres: ['SUPER_ADMIN', 'ADMIN', 'COACH', 'PLAYER', 'TREASURER'],
  academie: ['SUPER_ADMIN', 'ADMIN', 'COACH', 'PLAYER', 'ACADEMY_CANDIDATE', 'VISITOR'],
  'journee-champions': ['SUPER_ADMIN', 'ADMIN', 'COACH', 'PLAYER', 'VISITOR'],
  terrains: ['SUPER_ADMIN', 'ADMIN', 'TREASURER', 'COACH', 'PLAYER', 'VISITOR', 'SPONSOR', 'ACADEMY_CANDIDATE'],
};

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
  const [currentRole, setCurrentRole] = useState<UserRole>('VISITOR');
  const [authUser, setAuthUser] = useState<AuthSession['user'] | null>(null);
  const [activeTab, setActiveTab] = useState<string>('accueil');
  const [unreadNotifications, setUnreadNotifications] = useState<number>(3);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const isAuthenticated = Boolean(authUser);
  const publicTabs = new Set(['accueil', 'matchs', 'stats', 'equipe', 'evenements', 'actus', 'terrains', 'sponsors', 'academie', 'journee-champions']);
  const privateTabs = new Set(['mon-profil', 'parametres', 'finances', 'messagerie', 'admin']);

  const canAccessPage = (tab: string, role: UserRole) => {
    const allowed = pagePermissions[tab];
    return !allowed || allowed.includes(role);
  };

  const handleLoginSuccess = (session: AuthSession) => {
    setAuthUser(session.user);
    setCurrentRole(session.user.role);
    localStorage.setItem('firestone-auth', JSON.stringify(session));
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    const savedSession = localStorage.getItem('firestone-auth');
    if (savedSession) {
      const parsed = JSON.parse(savedSession) as AuthSession;
      if (parsed?.token) {
        fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${parsed.token}` },
        }).catch(() => undefined);
      }
    }

    localStorage.removeItem('firestone-auth');
    setAuthUser(null);
    setCurrentRole('VISITOR');
    setActiveTab('accueil');
  };

  useEffect(() => {
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
        fetch('http://localhost:5000/api/auth/me', {
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
  }, []);

  useEffect(() => {
    if (!isAuthenticated && privateTabs.has(activeTab)) {
      setActiveTab('accueil');
      return;
    }

    if (!canAccessPage(activeTab, currentRole)) {
      setActiveTab('accueil');
    }
  }, [activeTab, currentRole, isAuthenticated]);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.body.style.background = theme === 'light' ? '#f4f7fb' : '#090A0F';
  }, [theme]);

  const renderAccessiblePage = () => {
    if (!canAccessPage(activeTab, currentRole)) {
      return (
        <div className="glass-panel rounded-3xl border border-amber-500/30 p-8 text-center max-w-xl mx-auto">
          <h3 className="text-2xl font-black text-white">Accès restreint</h3>
          <p className="mt-3 text-sm text-slate-300">
            Cette section est réservée à un type d’utilisateur spécifique. Connectez-vous avec le bon profil ou retournez à l’accueil.
          </p>
          <button
            onClick={() => setActiveTab('accueil')}
            className="mt-5 px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#E60023] text-white font-bold"
          >
            Revenir à l’accueil
          </button>
        </div>
      );
    }

    if (activeTab === 'accueil') return <LandingHero currentRole={currentRole} onNavigate={setActiveTab} onOpenAuth={() => setShowAuthModal(true)} />;
    if (activeTab === 'matchs') return <MatchCenter currentRole={currentRole} />;
    if (activeTab === 'stats') return <StatsDashboard />;
    if (activeTab === 'equipe') return <RosterSection currentRole={currentRole} />;
    if (activeTab === 'evenements') return <EventCalendar />;
    if (activeTab === 'actus') return <NewsGallery />;
    if (activeTab === 'terrains') return <TerrainsMapPage />;
    if (activeTab === 'finances') return <FinanceManager />;
    if (activeTab === 'messagerie') return <MessagingSystem currentRole={currentRole} />;
    if (activeTab === 'sponsors') return <SponsorDonationPortal />;
    if (activeTab === 'admin') return <AdminPanel currentRole={currentRole} />;
    if (activeTab === 'mon-profil') return <PlayerPersonalProfile currentRole={currentRole} authUser={authUser} onNavigateToSettings={() => setActiveTab('parametres')} onUserUpdate={(user) => { setAuthUser(user); const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}'); if (session?.token) localStorage.setItem('firestone-auth', JSON.stringify({ ...session, user })); setCurrentRole(user.role); }} />;
    if (activeTab === 'parametres') return <AccountSettings currentRole={currentRole} authUser={authUser} onNavigateToProfile={() => setActiveTab('mon-profil')} onUserUpdate={(user) => { setAuthUser(user); const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}'); if (session?.token) localStorage.setItem('firestone-auth', JSON.stringify({ ...session, user })); setCurrentRole(user.role); }} />;
    if (activeTab === 'academie') return <AcademyRecruitment currentRole={currentRole} />;
    if (activeTab === 'journee-champions') return <ChampionsDayManager currentRole={currentRole} />;

    return <LandingHero currentRole={currentRole} onNavigate={setActiveTab} onOpenAuth={() => setShowAuthModal(true)} />;
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between selection:bg-[#B91C1C] selection:text-white ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      
      {/* Sidebar Latéral (Desktop & Mobile) */}
      <Sidebar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadNotifications={unreadNotifications}
        onOpenAuth={() => setShowAuthModal(true)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isAuthenticated={isAuthenticated}
      />

      {/* Main Wrapper offset dynamically for Desktop Sidebar */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        
        <div className="bg-gradient-to-r from-[#881337]/40 via-[#D97706]/15 to-purple-950/40 border-b border-white/10 px-4 py-1.5 text-center text-xs font-semibold text-white flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#FFB800]" />
          <span>
            {isAuthenticated
              ? <>Compte connecté : <strong className="text-[#FFB800] uppercase tracking-wider">{authUser?.name}</strong></>
              : <>Accès public — connectez-vous pour voir les espaces privés</>}
          </span>
        </div>

        {/* Top Navbar Header */}
        <Navbar
          currentRole={currentRole}
          authUser={authUser}
          onRoleChange={setCurrentRole}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadNotifications={unreadNotifications}
          onToggleNotifications={() => setShowNotifications(!showNotifications)}
          onOpenAuth={() => setShowAuthModal(true)}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          isAuthenticated={isAuthenticated}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 pt-6 sm:pt-8 flex-1 w-full">
          {renderAccessiblePage()}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-[#06070A] pt-12 pb-8 mt-16 theme-footer">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className={`rounded-2xl border px-4 py-3 text-sm ${isAuthenticated ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-200'}`}>
              {isAuthenticated
                ? <>Bienvenue {authUser?.name}. Votre espace membre est désormais actif.</>
                : <>Vous êtes en visite. Connectez-vous pour accéder aux modules personnels, la messagerie et la trésorerie.</>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Club Brand */}
              <div className="md:col-span-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF2A3B] to-[#FFB800] p-0.5">
                    <div className="w-full h-full bg-[#090A0F] rounded-[10px] flex items-center justify-center">
                      <Flame className="w-6 h-6 text-[#FF2A3B]" />
                    </div>
                  </div>
                  <span className="text-xl font-extrabold tracking-wider text-white">
                    FIRE <span className="text-gradient-fire">STONE</span>
                  </span>
                </div>
                 <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                   FIRE STONE Basketball Club — Lomé, Togo. Club de référence en Afrique de l'Ouest. Puissance, détermination et excellence collective sur et en dehors du terrain, du quartier d'Adetikopé au sommet continental.
                 </p>
                <div className="flex items-center gap-3 text-xs text-[#FFB800]">
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">🔴 Rouge Feu</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">🟡 Or Solaire</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">⚫ Noir Profond</span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="md:col-span-4 space-y-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Navigation Rapide</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <button onClick={() => setActiveTab('accueil')} className="hover:text-white text-left">Accueil</button>
                  <button onClick={() => setActiveTab('matchs')} className="hover:text-white text-left">Match Center</button>
                  <button onClick={() => setActiveTab('stats')} className="hover:text-white text-left">Statistiques</button>
                  <button onClick={() => setActiveTab('equipe')} className="hover:text-white text-left">Roster Joueurs</button>
                  <button onClick={() => setActiveTab('evenements')} className="hover:text-white text-left">Agenda</button>
                  <button onClick={() => setActiveTab('academie')} className="hover:text-white text-left">Centre de Formation</button>
                  <button onClick={() => setActiveTab('journee-champions')} className="hover:text-white text-left">Journée Champions</button>
                  <button onClick={() => setActiveTab('finances')} className="hover:text-white text-left">Trésorerie</button>
                </div>
              </div>

              {/* Contact & Arena Location */}
              <div className="md:col-span-4 space-y-3 text-xs text-slate-300">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Contact & QG Club</h4>
                <div className="space-y-2">
                   <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#FF2A3B]" /> Terrain du Lycée d'Adetikopé, Quartier Adetikopé, Lomé — Togo
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#FFB800]" /> +228 79 83 30 34
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400" /> contact@firestone-basketball.tg
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp : +228 79 83 30 34
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-8 border-t border-white/10 text-center text-xs text-slate-500">
              © 2026 FIRE STONE Basketball Club — Lomé, Togo. Tous droits réservés. Plateforme conçue avec passion & ingénierie de haut niveau.
            </div>

          </div>
        </footer>
      </div>

      {/* Modals & Drawers */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onClear={() => setUnreadNotifications(0)}
      />

    </div>
  );
}
