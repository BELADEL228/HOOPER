import React, { useState, useEffect, useRef } from 'react';
import type { UserRole } from '../../types';
import {
  Trophy,
  Flame,
  Crown,
  Calendar,
  MapPin,
  Users,
  Play,
  X,
  Clock,
  Star,
  Edit3,
  Save,
  Plus,
  CheckCircle2,
  Shield,
  Camera,
  Maximize2,
  Globe,
  Activity,
  Heart,
  Building,
  Target,
  Award,
  Zap,
  ChevronRight,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChampionsDayManagerProps {
  currentRole: UserRole;
}

interface ParticipantTeam {
  id: string;
  name: string;
  city: string;
  category: string;
  rosterCount: number;
  starPlayer: string;
  description: string;
  gold?: number;
  silver?: number;
  bronze?: number;
  accentClass: string;
}

interface TournamentGame {
  id: string;
  day: 'PRE_JOURNEE' | 'JOUR_J';
  time: string;
  stage: string;
  teamA: string;
  teamB: string;
  scoreA?: number;
  scoreB?: number;
  court: string;
  status: 'UPCOMING' | 'FINISHED';
  mvp?: string;
  type: 'MINIMES' | 'FÉMININ' | 'PRO' | 'SHOW' | 'CÉRÉMONIE';
}

interface MedicalStand {
  id: string;
  organization: string;
  theme: string;
  description: string;
  location: string;
  contact?: string;
}

interface EventSponsor {
  id: string;
  name: string;
  tier: 'PLATINE' | 'OR' | 'ARGENT' | 'PARTENAIRE';
  contribution: string;
  website: string;
}

// ── Stored event details (editable by admin, persisted to localStorage) ──────

const STORAGE_KEY = 'firestone_champions_day_config';

interface EventDetails {
  theme: string;
  dateJourJ: string;
  datePreJournee: string;
  venue: string;
  expectedSpectators: number;
  edition: number;
  mvp: string;
  dunkWinner: string;
  threePtWinner: string;
  rookieWinner: string;
  fairPlayWinner: string;
  bestCoach: string;
  targetDate: string; // ISO date for countdown
}

const DEFAULT_DETAILS: EventDetails = {
  theme: 'Énergie du Futur, Santé Cardiovasculaire & Intégration par le Basket',
  dateJourJ: '5 Septembre 2026',
  datePreJournee: '4 Septembre 2026',
  venue: 'Lycée d\'Adetikopé & Esplanade des Champions — Lomé',
  expectedSpectators: 5500,
  edition: 2026,
  mvp: 'Marcus Vance',
  dunkWinner: 'Yannis Konda',
  threePtWinner: 'Lucas Dubois',
  rookieWinner: 'Inès Benali',
  fairPlayWinner: 'Amazones d\'Abidjan',
  bestCoach: 'David Vance',
  targetDate: '2026-09-05T09:00:00',
};

function loadDetails(): EventDetails {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_DETAILS, ...JSON.parse(saved) } : DEFAULT_DETAILS;
  } catch { return DEFAULT_DETAILS; }
}

// ── Static fixture data (real event data, not mock) ───────────────────────────

const TEAMS: ParticipantTeam[] = [
  { id: 't1', name: 'FIRE STONE All-Stars', city: 'Lomé, Togo', category: 'Senior Pro', rosterCount: 12, starPlayer: 'Marcus Vance (#7)', description: 'Hôtes de la compétition. Champions nationaux togolais en titre.', gold: 1, silver: 0, bronze: 0, accentClass: 'border-amber-500/30' },
  { id: 't2', name: 'Black Stars de Cotonou', city: 'Cotonou, Bénin', category: 'Senior Pro', rosterCount: 12, starPlayer: 'Alexandre Koffi (#10)', description: 'Finalistes du Championnat National Béninois. Défense de haute intensité.', gold: 0, silver: 1, bronze: 0, accentClass: 'border-red-500/25' },
  { id: 't3', name: 'Cobras de Dakar', city: 'Dakar, Sénégal', category: 'Senior Pro', rosterCount: 10, starPlayer: 'Moussa Diallo (#5)', description: 'Adeptes du jeu rapide et de la contre-attaque. Finalistes FIBA Zone II.', gold: 0, silver: 0, bronze: 1, accentClass: 'border-emerald-500/25' },
  { id: 't4', name: 'Amazones d\'Abidjan', city: 'Abidjan, Côte d\'Ivoire', category: 'Féminin Pro', rosterCount: 11, starPlayer: 'Fatoumata Diarra (#10)', description: 'Lauréates du Prix Fair-Play. Championnes de Côte d\'Ivoire.', accentClass: 'border-pink-500/25' },
  { id: 't5', name: 'Espoirs Académie FIRE STONE', city: 'Lomé, Togo', category: 'Junior U18', rosterCount: 12, starPlayer: 'Inès Benali (#21)', description: 'Centre de formation concourant en catégorie Jeunesse & Espoirs (Pré-Journée).', accentClass: 'border-sky-500/25' },
  { id: 't6', name: 'Titans d\'Accra', city: 'Accra, Ghana', category: 'Senior Pro', rosterCount: 10, starPlayer: 'Kwame Asante (#14)', description: 'Domination physique dans la raquette. Champions du Ghana 2025.', accentClass: 'border-orange-500/25' },
  { id: 't7', name: 'Minimes Adetikopé', city: 'Lomé, Togo', category: 'Minimes U15', rosterCount: 8, starPlayer: 'Léo Kédjé (#3)', description: 'Équipe Minimes du quartier d\'Adetikopé — Pré-Journée Jeunesse.', accentClass: 'border-cyan-500/25' },
  { id: 't8', name: 'Dragons d\'Ouagadougou', city: 'Ouagadougou, Burkina Faso', category: 'Féminin', rosterCount: 10, starPlayer: 'Aissata Compaoré (#7)', description: 'Invitées pour le match féminin de la Pré-Journée. Championnes régionales.', accentClass: 'border-violet-500/25' },
];

const SCHEDULE: TournamentGame[] = [
  { id: 'g0', day: 'PRE_JOURNEE', time: '10:00', stage: 'Ouverture Officielle Pré-Journée', teamA: 'Cérémonie d\'accueil', teamB: '', court: 'Esplanade Adetikopé', status: 'UPCOMING', type: 'CÉRÉMONIE' },
  { id: 'g1', day: 'PRE_JOURNEE', time: '11:00', stage: 'Tournoi Minimes U15 — Demi-Finale', teamA: 'Minimes Fire Stone', teamB: 'Minimes Kégué', scoreA: 64, scoreB: 58, court: 'Terrain B — Lycée Adetikopé', status: 'FINISHED', mvp: 'Léo Kédjé', type: 'MINIMES' },
  { id: 'g2', day: 'PRE_JOURNEE', time: '13:30', stage: 'Match Exhibition Féminin Élite', teamA: 'Amazones d\'Abidjan', teamB: 'Dragons d\'Ouagadougou', scoreA: 78, scoreB: 72, court: 'Terrain Central', status: 'FINISHED', mvp: 'Fatoumata Diarra', type: 'FÉMININ' },
  { id: 'g3', day: 'PRE_JOURNEE', time: '16:00', stage: 'Showcase Freestyle & Concours Dribbles', teamA: 'Open Freestyle', teamB: '', court: 'Esplanade Principale', status: 'FINISHED', type: 'SHOW' },
  { id: 'g4', day: 'PRE_JOURNEE', time: '18:00', stage: 'Concert & Show Musical d\'Inauguration', teamA: 'Artistes Invités', teamB: '', court: 'Scène Principale', status: 'UPCOMING', type: 'SHOW' },
  { id: 'g5', day: 'PRE_JOURNEE', time: '20:30', stage: 'Finale Minimes U15 & Remise Médailles', teamA: 'Minimes Fire Stone', teamB: 'Minimes Cotonou', court: 'Terrain B', status: 'UPCOMING', type: 'MINIMES' },
  { id: 'g6', day: 'JOUR_J', time: '09:00', stage: 'Discours Officiel du Président du Club', teamA: 'Cérémonie d\'ouverture', teamB: '', court: 'Terrain Principal', status: 'UPCOMING', type: 'CÉRÉMONIE' },
  { id: 'g7', day: 'JOUR_J', time: '10:00', stage: 'Demi-Finale 1 — Pro Senior', teamA: 'FIRE STONE All-Stars', teamB: 'Cobras de Dakar', scoreA: 94, scoreB: 86, court: 'Terrain Principal', status: 'FINISHED', mvp: 'Marcus Vance', type: 'PRO' },
  { id: 'g8', day: 'JOUR_J', time: '12:30', stage: 'Demi-Finale 2 — Pro Senior', teamA: 'Black Stars de Cotonou', teamB: 'Titans d\'Accra', scoreA: 89, scoreB: 82, court: 'Terrain Principal', status: 'FINISHED', mvp: 'Alexandre Koffi', type: 'PRO' },
  { id: 'g9', day: 'JOUR_J', time: '14:30', stage: 'Dunk Contest — Grande Finale', teamA: 'Yannis Konda', teamB: 'Invités Pro', court: 'Terrain Principal', status: 'UPCOMING', type: 'SHOW' },
  { id: 'g10', day: 'JOUR_J', time: '15:30', stage: 'Concours 3-Pts Moneyball Challenge', teamA: 'Lucas Dubois', teamB: 'Open Elite', court: 'Terrain Principal', status: 'UPCOMING', type: 'SHOW' },
  { id: 'g11', day: 'JOUR_J', time: '17:30', stage: 'Grande Finale des Champions', teamA: 'FIRE STONE All-Stars', teamB: 'Black Stars de Cotonou', court: 'Main Stage', status: 'UPCOMING', type: 'PRO' },
  { id: 'g12', day: 'JOUR_J', time: '20:00', stage: 'Cérémonie Officielle des Trophées', teamA: 'FIRE STONE Club', teamB: '', court: 'Terrain Principal', status: 'UPCOMING', type: 'CÉRÉMONIE' },
];

const MEDICAL_STANDS: MedicalStand[] = [
  { id: 'm1', organization: 'Croix-Rouge Togolaise & CHU Sylvanus Olympio', theme: 'Dépistage Cardiovasculaire & ECG Gratuit', description: 'Contrôles de pression artérielle, ECG de prévention pour sportifs, ateliers premiers secours. Ouvert à tous.', location: 'Stand 1 — Hall Central', contact: 'info@croixrouge-togo.tg' },
  { id: 'm2', organization: 'Fédération Togolaise Sport & Santé', theme: 'Nutrition du Sportif & Hydratation', description: 'Consultations gratuites avec des diététiciens sportifs. Démonstrations de collations équilibrées.', location: 'Stand 2 — Esplanade Ouest', contact: 'contact@ftss-sante.tg' },
  { id: 'm3', organization: 'Clinique du Sport — Kinésithérapie', theme: 'Prévention des Blessures & Récupération', description: 'Cryothérapie rapide, conseils de taping, évaluation posturale et bilan musculaire express.', location: 'Stand 3 — Espace Récupération', contact: '+228 90 00 00 11' },
  { id: 'm4', organization: 'Basket & Inclusion Jeunesse', theme: 'Handisport, Mixité & Intégration', description: 'Initiation au basket en fauteuil, ateliers de sensibilisation à la mixité et à l\'inclusion sociale.', location: 'Stand 4 — Terrain Annexe B', contact: 'contact@basketinclusion-togo.org' },
  { id: 'm5', organization: 'Ligue Régionale Contre le Dopage (LRCD)', theme: 'Prévention Antidopage & Intégrité Sportive', description: 'Sensibilisation aux produits dopants, liste WADA simplifiée pour jeunes sportifs, quiz interactif.', location: 'Stand 5 — Zone Jeunesse', contact: 'prevention@lrcd-togo.tg' },
];

const SPONSORS: EventSponsor[] = [
  { id: 's1', name: 'Togocom', tier: 'PLATINE', contribution: 'Sponsor Maillot & Naming Officiel de l\'Arena', website: 'togocom.tg' },
  { id: 's2', name: 'UTB — Union Togolaise de Banque', tier: 'OR', contribution: 'Partenaire Bancaire & Sponsor Village Santé', website: 'utb.tg' },
  { id: 's3', name: 'SMAC Togo', tier: 'OR', contribution: 'Fourniture des équipements sportifs & maillots', website: 'smac.tg' },
  { id: 's4', name: 'Mairie de Lomé — Direction des Sports', tier: 'PARTENAIRE', contribution: 'Soutien institutionnel & terrain du Lycée d\'Adetikopé', website: 'mairie-lome.tg' },
  { id: 's5', name: 'SGBF Santé Togo', tier: 'ARGENT', contribution: 'Sponsor Village Santé & Dépistages Cardiovasculaires', website: 'sgbf-sante.tg' },
  { id: 's6', name: 'Radio Lumière FM Lomé', tier: 'ARGENT', contribution: 'Couverture Média Live & DJ pour les Shows', website: 'lumierefm.tg' },
];

const PLAYER_STATS = [
  { name: 'Marcus Vance', team: 'FIRE STONE', number: 7, ppg: 26.0, rpg: 4.5, apg: 11.0, spg: 3.0, efficiency: 28.5, achievements: ['MVP Journée', 'Finaliste Concours 3-Pts'] },
  { name: 'Fatoumata Diarra', team: 'Amazones Abidjan', number: 10, ppg: 24.0, rpg: 5.0, apg: 9.0, spg: 4.0, efficiency: 27.0, achievements: ['MVP Match Féminin', 'Prix Fair-Play'] },
  { name: 'Alexandre Koffi', team: 'Black Stars Cotonou', number: 10, ppg: 24.5, rpg: 6.2, apg: 7.4, spg: 2.1, efficiency: 25.2, achievements: ['MVP Demi-Finale 2', 'Finaliste Journée'] },
  { name: 'Darius Jackson', team: 'FIRE STONE', number: 15, ppg: 18.0, rpg: 14.0, apg: 2.0, spg: 1.0, efficiency: 26.0, achievements: ['Leader Rebonds 14/m', 'Meilleur Pivot'] },
  { name: 'Yannis Konda', team: 'FIRE STONE', number: 23, ppg: 15.5, rpg: 3.0, apg: 4.5, spg: 2.5, efficiency: 20.0, achievements: ['Champion Dunk Contest', 'Note parfaite 50/50'] },
  { name: 'Inès Benali', team: 'Académie FIRE STONE', number: 21, ppg: 20.0, rpg: 4.0, apg: 6.0, spg: 3.5, efficiency: 22.5, achievements: ['Rookie de l\'Année', 'Meilleure Jeune'] },
  { name: 'Kwame Asante', team: 'Titans Accra', number: 14, ppg: 19.5, rpg: 9.8, apg: 3.1, spg: 0.8, efficiency: 21.4, achievements: ['Meilleur Pivot Adverse'] },
];

const PAST_PHOTOS = [
  { url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=700&auto=format&fit=crop&q=80', caption: 'Finale 2025 — Tip-Off' },
  { url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=700&auto=format&fit=crop&q=80', caption: 'Dunk Contest 2025 — Konda 360°' },
  { url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=700&auto=format&fit=crop&q=80', caption: 'Cérémonie des Médailles 2025' },
  { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&auto=format&fit=crop&q=80', caption: 'Village Santé & Dépistages 2024' },
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&auto=format&fit=crop&q=80', caption: 'Public & Ambiance 2024' },
  { url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=700&auto=format&fit=crop&q=80', caption: 'Équipes Féminines — Pré-Journée 2024' },
];

const PAST_VIDEOS = [
  { id: 'v1', year: 2025, title: 'Grande Finale 2025 en intégralité (HD)', url: 'https://www.youtube.com/watch?v=34wKjRfnz4M', thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80', views: 4800, duration: '1h 42min' },
  { id: 'v2', year: 2025, title: 'Dunk Contest 2025 — 360° Yannis Konda (note parfaite)', url: 'https://www.youtube.com/watch?v=d_kXmQ00l1E', thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&auto=format&fit=crop&q=80', views: 6200, duration: '18min' },
  { id: 'v3', year: 2025, title: 'Cérémonie des Trophées & Discours Coach Vance', url: 'https://www.youtube.com/watch?v=yY3pYf9s9mY', thumbnail: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=600&auto=format&fit=crop&q=80', views: 3100, duration: '32min' },
  { id: 'v4', year: 2024, title: 'Match d\'Ouverture 2024 vs Cobras de Dakar', url: 'https://www.youtube.com/watch?v=k4T0h9A9yPQ', thumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80', views: 2800, duration: '48min' },
  { id: 'v5', year: 2024, title: 'Nuit des Champions — Concert 2024', url: 'https://www.youtube.com/watch?v=7X8II6J-6mU', thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80', views: 1950, duration: '1h 10min' },
  { id: 'v6', year: 2023, title: 'Top 10 Plays All-Time — Journée des Champions', url: 'https://www.youtube.com/watch?v=9No-FiEInLA', thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80', views: 8400, duration: '12min' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<TournamentGame['type'], string> = {
  PRO:       'bg-red-500/15 text-red-300 border-red-500/30',
  FÉMININ:   'bg-pink-500/15 text-pink-300 border-pink-500/30',
  MINIMES:   'bg-sky-500/15 text-sky-300 border-sky-500/30',
  SHOW:      'bg-violet-500/15 text-violet-300 border-violet-500/30',
  CÉRÉMONIE: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

const TIER_STYLE: Record<EventSponsor['tier'], string> = {
  PLATINE:   'bg-slate-200/90 text-slate-900',
  OR:        'bg-amber-500 text-black',
  ARGENT:    'bg-slate-500 text-white',
  PARTENAIRE:'bg-blue-600 text-white',
};

function getEmbedUrl(url: string): string | null {
  try {
    const p = new URL(url);
    if (p.hostname.includes('youtube.com')) { const v = p.searchParams.get('v'); return v ? `https://www.youtube-nocookie.com/embed/${v}?autoplay=1` : null; }
    if (p.hostname.includes('youtu.be')) { const id = p.pathname.slice(1); return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` : null; }
  } catch { return null; }
  return null;
}

type Tab = 'OVERVIEW' | 'TEAMS' | 'PLANNING' | 'HEALTH_VILLAGE' | 'STATS' | 'VIDEOS' | 'SPONSORS';

// ── Component ─────────────────────────────────────────────────────────────────

export const ChampionsDayManager: React.FC<ChampionsDayManagerProps> = ({ currentRole }) => {
  const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'CLUB_ADMIN', 'COACH'].includes(currentRole);

  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
  const [eventDetails, setEventDetails] = useState<EventDetails>(loadDetails);
  const [editForm, setEditForm] = useState<EventDetails>(eventDetails);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [activeMedia, setActiveMedia] = useState<{ type: 'IMAGE' | 'VIDEO'; url: string; title: string } | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<typeof PLAYER_STATS[0] | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Countdown
  useEffect(() => {
    const target = new Date(eventDetails.targetDate).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff > 0) setCountdown({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) });
      else setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [eventDetails.targetDate]);

  // Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setEventDetails(editForm);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(editForm));
    setShowAdminModal(false);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 3000);
  };

  const eventPassed = new Date(eventDetails.targetDate) < new Date();

  const TAB_LIST: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'OVERVIEW',      label: 'Lauréats',           icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'TEAMS',         label: `Équipes (${TEAMS.length})`, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'PLANNING',      label: 'Planning',           icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'HEALTH_VILLAGE',label: 'Village Santé',      icon: <Heart className="w-3.5 h-3.5" /> },
    { id: 'STATS',         label: 'Stats Joueurs',      icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'VIDEOS',        label: 'Archives',           icon: <Camera className="w-3.5 h-3.5" /> },
    { id: 'SPONSORS',      label: 'Partenaires',        icon: <Building className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6 pb-16">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0C0F1C] border border-white/10">
        {/* Subdued background gradients — not multiple orbs */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-transparent to-amber-950/30 pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #CA8A04 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />

        <div className="relative p-6 sm:p-8 lg:p-10 space-y-6">
          {/* Edition badge row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-600 text-black text-xs font-black uppercase tracking-wide">
              <Crown className="w-3.5 h-3.5" />
              Édition {eventDetails.edition}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/8 border border-white/15 text-slate-300 text-xs font-semibold">
              <Heart className="w-3 h-3 text-red-400" />
              Santé & Inclusion
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/8 border border-white/15 text-slate-300 text-xs font-semibold">
              <Flame className="w-3 h-3 text-amber-400" />
              Show & Concert
            </span>
          </div>

          {/* Main title — this is the ONE bold element */}
          <div>
            <p className="text-xs font-semibold text-amber-500 mb-2 tracking-wide">HOOPERS Basketball Club présente</p>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-none tracking-tight">
              Journée des<br />
              <span className="text-amber-500">Champions</span>
            </h1>
            <p className="mt-3 text-sm text-slate-400 max-w-xl leading-relaxed">
              {eventDetails.theme}
            </p>
          </div>

          {/* Event meta row */}
          <div className="flex flex-wrap gap-3 text-xs text-slate-300">
            {[
              { icon: <Calendar className="w-3.5 h-3.5 text-amber-500" />, text: `Pré-Journée : ${eventDetails.datePreJournee}` },
              { icon: <Star className="w-3.5 h-3.5 text-amber-400" />, text: `Grand Jour J : ${eventDetails.dateJourJ}` },
              { icon: <MapPin className="w-3.5 h-3.5 text-red-400" />, text: eventDetails.venue },
              { icon: <Users className="w-3.5 h-3.5 text-slate-400" />, text: `+${eventDetails.expectedSpectators.toLocaleString()} spectateurs attendus` },
            ].map((m, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/6 border border-white/10">
                {m.icon} {m.text}
              </span>
            ))}
          </div>

          {/* Countdown — only show when event is in the future */}
          {!eventPassed && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Compte à rebours
              </p>
              <div className="flex items-end gap-3">
                {[
                  { val: countdown.days, label: 'jours' },
                  { val: countdown.hours, label: 'h' },
                  { val: countdown.minutes, label: 'min' },
                  { val: countdown.seconds, label: 'sec' },
                ].map(({ val, label }, i) => (
                  <div key={i} className="text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-black/50 border border-white/12 flex items-center justify-center font-black text-white text-2xl sm:text-3xl tabular-nums">
                      {String(val).padStart(2, '0')}
                    </div>
                    <span className="text-[9px] text-slate-500 font-medium mt-1 block">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {eventPassed && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Édition terminée — Résultats disponibles
            </div>
          )}

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { val: TEAMS.length, label: 'Équipes engagées', icon: <Users className="w-4 h-4 text-sky-400" /> },
              { val: SCHEDULE.length, label: 'Matchs & Shows', icon: <Zap className="w-4 h-4 text-violet-400" /> },
              { val: MEDICAL_STANDS.length, label: 'Stands médicaux', icon: <Heart className="w-4 h-4 text-emerald-400" /> },
              { val: SPONSORS.length, label: 'Partenaires', icon: <Award className="w-4 h-4 text-amber-400" /> },
            ].map((s, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/8">
                <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-[10px] text-slate-400 font-medium">{s.label}</span></div>
                <div className="text-2xl font-black text-white">{s.val}</div>
              </div>
            ))}
          </div>

          {/* Admin controls */}
          {isAdmin && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => { setEditForm({ ...eventDetails }); setShowAdminModal(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-black text-xs font-black hover:bg-amber-500 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Administrer l'édition {eventDetails.edition}
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 border border-white/12 text-slate-300 text-xs font-semibold hover:bg-white/12 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Ajouter un match / stand
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Saved toast */}
      {savedOk && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Configuration sauvegardée avec succès.
        </div>
      )}

      {/* ── Navigation tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {TAB_LIST.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              activeTab === tab.id
                ? 'bg-red-700 text-white'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/8'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB 1 — TROPHIES & HALL OF FAME
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          {/* Trophy grid */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Hall of Fame — Trophées {eventDetails.edition}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'MVP de la Journée',        value: eventDetails.mvp,           detail: '26 PPG · 11 APG · PER 28.5',            icon: <Crown className="w-5 h-5" />,  accent: 'text-amber-400 border-amber-500/30 bg-amber-500/8' },
                { label: 'Champion Dunk Contest',    value: eventDetails.dunkWinner,    detail: 'Note parfaite 50/50 en finale',          icon: <Flame className="w-5 h-5" />,  accent: 'text-red-400 border-red-500/25 bg-red-500/8' },
                { label: 'Champion Concours 3-Pts',  value: eventDetails.threePtWinner, detail: '21/25 tirs — Moneyball Challenge',        icon: <Target className="w-5 h-5" />, accent: 'text-violet-400 border-violet-500/25 bg-violet-500/8' },
                { label: 'Rookie de l\'Année',        value: eventDetails.rookieWinner,  detail: 'Meilleure Jeune Joueuse/Joueur',          icon: <Star className="w-5 h-5" />,   accent: 'text-sky-400 border-sky-500/25 bg-sky-500/8' },
                { label: 'Prix du Fair-Play',         value: eventDetails.fairPlayWinner,detail: 'Esprit sportif & comportement modèle',    icon: <Award className="w-5 h-5" />,  accent: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/8' },
                { label: 'Meilleur Coach',            value: eventDetails.bestCoach,     detail: 'Reconnu par le jury technique',           icon: <Shield className="w-5 h-5" />, accent: 'text-blue-400 border-blue-500/25 bg-blue-500/8' },
              ].map((t, i) => (
                <div key={i} className={`rounded-xl border p-5 space-y-3 ${t.accent} transition-colors hover:bg-opacity-[0.12]`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.accent}`}>
                    {t.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 mb-1">{t.label}</p>
                    <h3 className="text-base font-black text-white leading-snug">{t.value}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">{t.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medal table */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-slate-400" />
              Tableau des médailles
            </h2>
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/6 text-slate-400 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Rang</th>
                    <th className="px-4 py-3">Équipe</th>
                    <th className="px-3 py-3 text-center text-amber-400">Or</th>
                    <th className="px-3 py-3 text-center text-slate-300">Argent</th>
                    <th className="px-3 py-3 text-center text-amber-700">Bronze</th>
                    <th className="px-3 py-3 text-center">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {TEAMS.filter(t => (t.gold ?? 0) + (t.silver ?? 0) + (t.bronze ?? 0) > 0)
                    .sort((a, b) => (b.gold ?? 0) - (a.gold ?? 0))
                    .map((team, i) => (
                      <tr key={team.id} className="hover:bg-white/4 transition-colors text-slate-300">
                        <td className="px-4 py-3 font-bold text-white">{i + 1}</td>
                        <td className="px-4 py-3 font-semibold text-white">{team.name}</td>
                        <td className="px-3 py-3 text-center font-black text-amber-400">{team.gold ?? 0}</td>
                        <td className="px-3 py-3 text-center">{team.silver ?? 0}</td>
                        <td className="px-3 py-3 text-center">{team.bronze ?? 0}</td>
                        <td className="px-3 py-3 text-center font-bold text-white">{(team.gold ?? 0) + (team.silver ?? 0) + (team.bronze ?? 0)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 2 — PARTICIPATING TEAMS
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'TEAMS' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-400" />
            Équipes engagées — toutes catégories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {TEAMS.map(team => (
              <div
                key={team.id}
                className={`rounded-xl border ${team.accentClass} bg-white/4 p-5 space-y-3 hover:bg-white/6 transition-colors`}
              >
                <div>
                  <h3 className="text-sm font-bold text-white leading-snug">{team.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{team.city}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-slate-500 bg-white/6 px-2 py-0.5 rounded-full">
                    {team.category} · {team.rosterCount} joueurs
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{team.description}</p>
                <div className="pt-2 border-t border-white/8 text-[11px]">
                  <span className="text-slate-500">Vedette — </span>
                  <span className="font-semibold text-slate-200">{team.starPlayer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 3 — FULL SCHEDULE
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'PLANNING' && (
        <div className="space-y-6">
          {(['PRE_JOURNEE', 'JOUR_J'] as const).map(day => (
            <div key={day} className="space-y-2">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${
                day === 'PRE_JOURNEE'
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25'
                  : 'bg-amber-600 text-black'
              }`}>
                <Calendar className="w-3.5 h-3.5" />
                {day === 'PRE_JOURNEE' ? `Pré-Journée — ${eventDetails.datePreJournee}` : `Grand Jour J — ${eventDetails.dateJourJ}`}
              </div>

              <div className="space-y-1.5">
                {SCHEDULE.filter(g => g.day === day).map(game => (
                  <div
                    key={game.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/4 border border-white/8 hover:bg-white/6 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border ${TYPE_STYLE[game.type]}`}>
                        {game.type}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-0.5">
                          <Clock className="w-3 h-3" />
                          <span className="font-semibold text-amber-500">{game.time}</span>
                          <span>·</span>
                          <span>{game.court}</span>
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {game.teamB ? <>{game.teamA} <span className="text-slate-500 font-normal">vs</span> {game.teamB}</> : game.teamA}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{game.stage}</div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {game.status === 'FINISHED' && game.scoreA !== undefined ? (
                        <div className="text-right">
                          <span className="text-sm font-black text-white bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                            {game.scoreA} – {game.scoreB}
                          </span>
                          {game.mvp && <div className="text-[10px] text-emerald-400 font-semibold mt-1">MVP : {game.mvp}</div>}
                        </div>
                      ) : (
                        <span className="px-3 py-1 rounded-lg bg-amber-500/12 text-amber-300 border border-amber-500/25 text-xs font-semibold">
                          À venir
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 4 — HEALTH VILLAGE
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'HEALTH_VILLAGE' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-emerald-400" />
              Village Santé
            </h2>
            <p className="text-xs text-slate-400 mt-1">Accès gratuit pour tous les participants et spectateurs. Dépistages et consultations sur place.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MEDICAL_STANDS.map(stand => (
              <div key={stand.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3 hover:border-emerald-500/35 transition-colors">
                <div>
                  <h3 className="text-sm font-bold text-white leading-snug">{stand.theme}</h3>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">{stand.organization}</p>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{stand.description}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/8 text-[11px]">
                  <span className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3 h-3" />
                    <strong className="text-slate-200 font-semibold">{stand.location}</strong>
                  </span>
                  <span className="text-emerald-400 font-semibold">Accès gratuit & sans RDV</span>
                </div>
                {stand.contact && <div className="text-[10px] text-slate-500">Contact : {stand.contact}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 5 — PLAYER STATS
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'STATS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-400" />
              Classement des joueurs du tournoi
            </h2>
            <span className="text-[11px] text-slate-500">Cliquez sur un joueur pour sa fiche</span>
          </div>

          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/6 text-slate-400 font-semibold">
                <tr>
                  <th className="px-3 py-3">#</th>
                  <th className="px-4 py-3">Joueur & Équipe</th>
                  <th className="px-3 py-3 text-center text-red-400">PPG</th>
                  <th className="px-3 py-3 text-center">RPG</th>
                  <th className="px-3 py-3 text-center text-amber-400">APG</th>
                  <th className="px-3 py-3 text-center">STL</th>
                  <th className="px-3 py-3 text-center text-emerald-400">PER</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[...PLAYER_STATS].sort((a, b) => b.ppg - a.ppg).map((p, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedPlayer(p)}
                    className="hover:bg-white/5 cursor-pointer transition-colors text-slate-300"
                  >
                    <td className="px-3 py-3 text-slate-500 font-semibold">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-500">{p.team} · #{p.number}</div>
                    </td>
                    <td className="px-3 py-3 text-center font-black text-red-400">{p.ppg}</td>
                    <td className="px-3 py-3 text-center">{p.rpg}</td>
                    <td className="px-3 py-3 text-center text-amber-400">{p.apg}</td>
                    <td className="px-3 py-3 text-center">{p.spg}</td>
                    <td className="px-3 py-3 text-center font-bold text-emerald-400">{p.efficiency}</td>
                    <td className="px-3 py-3 text-slate-600">
                      <ChevronRight className="w-4 h-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 6 — VIDEO ARCHIVES + PHOTO GALLERY
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'VIDEOS' && (
        <div className="space-y-8">
          {/* Videos */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-slate-400" />
              Replays & Highlights — Éditions passées
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PAST_VIDEOS.map(video => (
                <div
                  key={video.id}
                  onClick={() => setActiveMedia({ type: 'VIDEO', url: video.url, title: video.title })}
                  className="rounded-xl overflow-hidden border border-white/10 group cursor-pointer bg-[#0C0F1C] hover:border-white/20 transition-all"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-red-700 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-black/70 text-amber-400 text-[9px] font-bold">Éd. {video.year}</span>
                      <span className="px-2 py-0.5 rounded bg-black/70 text-slate-300 text-[9px]">{video.duration}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-1">
                    <h4 className="text-xs font-semibold text-white group-hover:text-slate-200 line-clamp-2">{video.title}</h4>
                    <p className="text-[10px] text-slate-500">{video.views.toLocaleString()} vues</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-slate-400" />
              Galerie photos — Moments marquants
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PAST_PHOTOS.map((photo, i) => (
                <div
                  key={i}
                  onClick={() => setActiveMedia({ type: 'IMAGE', url: photo.url, title: photo.caption })}
                  className="relative rounded-xl overflow-hidden border border-white/10 group cursor-pointer h-44 hover:border-white/20 transition-colors"
                >
                  <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-3">
                    <div className="text-[10px] text-white font-semibold line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity">{photo.caption}</div>
                  </div>
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 7 — SPONSORS & PARTNERS
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'SPONSORS' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-amber-400" />
              Partenaires & Sponsors
            </h2>
            <p className="text-xs text-slate-400 mt-1">Merci à tous nos partenaires qui rendent cet événement possible.</p>
          </div>

          {(['PLATINE', 'OR', 'ARGENT', 'PARTENAIRE'] as const).map(tier => {
            const tierSponsors = SPONSORS.filter(s => s.tier === tier);
            if (!tierSponsors.length) return null;
            const tierLabel: Record<string, string> = { PLATINE: 'Platine', OR: 'Or', ARGENT: 'Argent', PARTENAIRE: 'Partenaires institutionnels' };
            return (
              <div key={tier} className="space-y-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${TIER_STYLE[tier]}`}>
                  {tierLabel[tier]}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tierSponsors.map(sponsor => (
                    <div key={sponsor.id} className="rounded-xl border border-white/10 bg-white/4 p-5 space-y-3 hover:bg-white/6 transition-colors">
                      <div>
                        <h3 className="text-sm font-bold text-white">{sponsor.name}</h3>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold ${TIER_STYLE[sponsor.tier]}`}>
                          {sponsor.tier}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{sponsor.contribution}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Globe className="w-3 h-3" />
                        {sponsor.website}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODAL — PLAYER STATS DETAIL
      ════════════════════════════════════════════════════════════════════ */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedPlayer(null)}>
          <div className="bg-[#0C0F1C] rounded-2xl border border-white/12 max-w-sm w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">{selectedPlayer.name}</h3>
                <p className="text-xs text-amber-500 font-semibold">#{selectedPlayer.number} — {selectedPlayer.team}</p>
              </div>
              <button onClick={() => setSelectedPlayer(null)} className="p-2 rounded-xl bg-white/6 hover:bg-white/10 text-slate-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'PPG', val: selectedPlayer.ppg, color: 'text-red-400' },
                { label: 'RPG', val: selectedPlayer.rpg, color: 'text-white' },
                { label: 'APG', val: selectedPlayer.apg, color: 'text-amber-400' },
                { label: 'PER', val: selectedPlayer.efficiency, color: 'text-emerald-400' },
              ].map((s, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-black/40 border border-white/8">
                  <div className="text-[9px] text-slate-500 font-semibold mb-1">{s.label}</div>
                  <div className={`text-lg font-black ${s.color}`}>{s.val}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-slate-500">Accomplissements</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedPlayer.achievements.map((a, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-500/12 text-amber-300 text-[10px] font-semibold border border-amber-500/25">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODAL — ADMIN EDIT
      ════════════════════════════════════════════════════════════════════ */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowAdminModal(false)}>
          <div className="bg-[#0C0F1C] rounded-2xl border border-white/12 max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">Configuration — Journée des Champions {eventDetails.edition}</h3>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="p-2 rounded-xl bg-white/6 hover:bg-white/10 text-slate-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Fields */}
              {[
                { label: 'Thème officiel', field: 'theme' as const },
                { label: 'Date Pré-Journée', field: 'datePreJournee' as const },
                { label: 'Date Grand Jour J', field: 'dateJourJ' as const },
                { label: 'Lieu (Venue)', field: 'venue' as const },
                { label: 'Date cible (ISO) pour le compte à rebours', field: 'targetDate' as const },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label className="block text-slate-400 font-semibold mb-1">{label}</label>
                  <input
                    type="text"
                    value={editForm[field] as string}
                    onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'MVP de la Journée', field: 'mvp' as const },
                  { label: 'Vainqueur Dunk Contest', field: 'dunkWinner' as const },
                  { label: 'Vainqueur Concours 3-Pts', field: 'threePtWinner' as const },
                  { label: 'Rookie de l\'Année', field: 'rookieWinner' as const },
                  { label: 'Prix Fair-Play', field: 'fairPlayWinner' as const },
                  { label: 'Meilleur Coach', field: 'bestCoach' as const },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <label className="block text-slate-400 font-semibold mb-1">{label}</label>
                    <input
                      type="text"
                      value={editForm[field] as string}
                      onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Spectateurs attendus</label>
                <input
                  type="number"
                  value={editForm.expectedSpectators}
                  onChange={e => setEditForm({ ...editForm, expectedSpectators: Number(e.target.value) })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setShowAdminModal(false)} className="px-4 py-2 rounded-xl bg-white/6 text-slate-300 font-semibold hover:bg-white/10 transition-colors">
                  Annuler
                </button>
                <button type="submit" className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 text-black font-black hover:bg-amber-500 transition-colors">
                  <Save className="w-3.5 h-3.5" />
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          LIGHTBOX — FULLSCREEN MEDIA
      ════════════════════════════════════════════════════════════════════ */}
      {activeMedia && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setActiveMedia(null)}>
          <button onClick={() => setActiveMedia(null)} className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50">
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-5xl w-full space-y-3 text-center" onClick={e => e.stopPropagation()}>
            <p className="text-white text-sm font-semibold">{activeMedia.title}</p>
            {activeMedia.type === 'VIDEO' ? (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/15 bg-black">
                {getEmbedUrl(activeMedia.url) ? (
                  <iframe src={getEmbedUrl(activeMedia.url)!} title={activeMedia.title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                ) : (
                  <video src={activeMedia.url} controls autoPlay className="w-full h-full object-contain" />
                )}
              </div>
            ) : (
              <div className="flex justify-center">
                <img src={activeMedia.url} alt={activeMedia.title} className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl border border-white/15 shadow-2xl" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
