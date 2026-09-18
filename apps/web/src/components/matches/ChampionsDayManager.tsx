import React, { useState, useEffect } from 'react';
import type { UserRole } from '../../types';
import {
  Award,
  Trophy,
  Flame,
  Crown,
  Zap,
  Calendar,
  MapPin,
  Users,
  HeartPulse,
  Play,
  X,
  Activity,
  Clock,
  Sparkles,
  Star,
  Edit3,
  Save,
  Plus,
  CheckCircle2,
  Shield,
  Music,
  Camera,
  Maximize2,
  Building,
  Globe,
  Target
} from 'lucide-react';

interface ChampionsDayManagerProps {
  currentRole: UserRole;
}

interface ParticipantTeam {
  id: string;
  name: string;
  city: string;
  logo: string;
  category: string;
  rosterCount: number;
  starPlayer: string;
  description: string;
  gold?: number;
  silver?: number;
  bronze?: number;
  color: string;
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
  icon: string;
  description: string;
  location: string;
  contact?: string;
}

interface EventSponsor {
  id: string;
  name: string;
  tier: 'PLATINE' | 'OR' | 'ARGENT' | 'PARTENAIRE';
  logo: string;
  contribution: string;
  website: string;
}

export const ChampionsDayManager: React.FC<ChampionsDayManagerProps> = ({ currentRole }) => {
  const isAdminOrCoach = ['SUPER_ADMIN', 'ADMIN', 'COACH'].includes(currentRole);

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TEAMS' | 'PLANNING' | 'HEALTH_VILLAGE' | 'STATS' | 'VIDEOS' | 'SPONSORS'>('OVERVIEW');
  const [activeMedia, setActiveMedia] = useState<{ type: 'IMAGE' | 'VIDEO'; url: string; title: string } | null>(null);
  const [selectedTournamentPlayer, setSelectedTournamentPlayer] = useState<{
    name: string; team: string; avatar: string; number: number;
    ppg: number; rpg: number; apg: number; spg: number; efficiency: number; achievements: string[];
  } | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Countdown to Grand Jour J (Sept 5, 2026)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const target = new Date('2026-09-05T09:00:00').getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const [eventDetails, setEventDetails] = useState({
    theme: 'Énergie du Futur, Santé Cardiovasculaire & Intégration par le Basket',
    dateJourJ: '5 Septembre 2026',
    datePreJournee: '4 Septembre 2026',
    venue: 'Terrain du Lycée d\'Adetikopé & Esplanade des Champions — Lomé',
    expectedSpectators: 5500,
    edition: 2026,
    mvp: 'Marcus "Apex" Vance',
    dunkWinner: 'Yannis "Skywalker" Konda',
    threePtWinner: 'Lucas "Flash" Dubois',
    rookieWinner: 'Inès Benali (Junior U18)',
    fairPlayWinner: 'Amazones de Grenoble',
    bestCoach: 'David Vance (FIRE STONE)',
  });

  // Editable admin form state
  const [editForm, setEditForm] = useState({ ...eventDetails });

  const participatingTeams: ParticipantTeam[] = [
    { id: 't1', name: 'FIRE STONE All-Stars', city: 'Lomé, Togo', logo: '🔥', category: 'Senior Pro', rosterCount: 12, starPlayer: 'Marcus Vance (#7)', description: 'Hôtes de la compétition. Champions nationaux togolais en titre. Basés au Lycée d\'Adetikopé, Lomé.', gold: 1, silver: 0, bronze: 0, color: 'from-amber-950/40' },
    { id: 't2', name: 'Black Stars de Cotonou', city: 'Cotonou, Bénin', logo: '🌑', category: 'Senior Pro', rosterCount: 12, starPlayer: 'Alexandre Koffi (#10)', description: 'Finalistes du Championnat National Béninois. Réputés pour leur rytme défensif de haute intensité.', gold: 0, silver: 1, bronze: 0, color: 'from-red-950/40' },
    { id: 't3', name: 'Cobras de Dakar', city: 'Dakar, Sénégal', logo: '🐍', category: 'Senior Pro', rosterCount: 10, starPlayer: 'Moussa Diallo (#5)', description: 'Rivaux west-africains historiques, adeptes du jeu rapide et de la contre-attaque. Finalistes de la FIBA Zone II.', gold: 0, silver: 0, bronze: 1, color: 'from-green-950/40' },
    { id: 't4', name: 'Amazones d\'Abidjan', city: 'Abidjan, Côte d\'Ivoire', logo: '🌸', category: 'Féminin Pro', rosterCount: 11, starPlayer: 'Fatoumata Diarra (#10)', description: 'Équipe Féminine élite. Lauréates du Prix Fair-Play pour la 2ème année consécutive. Championnes de Côte d\'Ivoire.', gold: 0, silver: 0, bronze: 0, color: 'from-pink-950/40' },
    { id: 't5', name: 'Espoirs Académie FIRE STONE', city: 'Lomé, Togo', logo: '⚡', category: 'Junior (U18)', rosterCount: 12, starPlayer: 'Inès Benali (#21)', description: 'Centre de formation concourant en catégorie Jeunesse & Espoirs lors de la Pré-Journée.', gold: 0, silver: 0, bronze: 0, color: 'from-blue-950/40' },
    { id: 't6', name: 'Titans d\'Accra', city: 'Accra, Ghana', logo: '🏛️', category: 'Senior Pro', rosterCount: 10, starPlayer: 'Kwame Asante (#14)', description: 'Équipe très athlétique reconnue pour sa domination physique dans la peinture. Champions du Ghana 2025.', gold: 0, silver: 0, bronze: 0, color: 'from-orange-950/40' },
    { id: 't7', name: 'Minimes Adetikopé', city: 'Lomé, Togo', logo: '⭐', category: 'Minimes (U15)', rosterCount: 8, starPlayer: 'Léo Kédjé (#3)', description: 'Équipe Minimes du quartier d\'Adetikopé participante lors de la Pré-Journée Jeunesse le 4 Septembre.', gold: 0, silver: 0, bronze: 0, color: 'from-cyan-950/40' },
    { id: 't8', name: 'Dragons d\'Ouagadougou', city: 'Ouagadougou, Burkina Faso', logo: '🐲', category: 'Féminin', rosterCount: 10, starPlayer: 'Aissata Compaoré (#7)', description: 'Invitées pour le match féminin de la Pré-Journée. Championnes régionales du Burkina Faso.', gold: 0, silver: 0, bronze: 0, color: 'from-violet-950/40' },
  ];

  const scheduleGames: TournamentGame[] = [
    // Pré-Journée J-1 (4 Septembre)
    { id: 'g0', day: 'PRE_JOURNEE', time: '10:00', stage: 'Ouverture Officielle de la Pré-Journée Jeunesse', teamA: 'Cérémonie d\'accueil', teamB: '', court: 'Esplanade Adetikopé', status: 'UPCOMING', type: 'CÉRÉMONIE' },
    { id: 'g1', day: 'PRE_JOURNEE', time: '11:00', stage: 'Tournoi Minimes U15 (Demi-Finale)', teamA: 'Minimes Fire Stone', teamB: 'Minimes Kégué', scoreA: 64, scoreB: 58, court: 'Terrain B — Lycée Adetikopé', status: 'FINISHED', mvp: 'Léo Kédjé', type: 'MINIMES' },
    { id: 'g2', day: 'PRE_JOURNEE', time: '13:30', stage: 'Match Exhibition Féminin Élite', teamA: 'Amazones d\'Abidjan', teamB: 'Dragons d\'Ouagadougou', scoreA: 78, scoreB: 72, court: 'Terrain Central — Lycée Adetikopé', status: 'FINISHED', mvp: 'Fatoumata Diarra', type: 'FÉMININ' },
    { id: 'g3', day: 'PRE_JOURNEE', time: '16:00', stage: 'Showcase Freestyle & Concours Dribbles', teamA: 'Open Freestyle', teamB: '', court: 'Esplanade Principale Adetikopé', status: 'FINISHED', type: 'SHOW' },
    { id: 'g4', day: 'PRE_JOURNEE', time: '18:00', stage: 'Concert & Show Musical d\'Inauguration', teamA: 'Artistes Invités', teamB: '', court: 'Scène Principale', status: 'UPCOMING', type: 'SHOW' },
    { id: 'g5', day: 'PRE_JOURNEE', time: '20:30', stage: 'Finale Minimes U15 & Remise Médailles', teamA: 'Minimes Fire Stone', teamB: 'Minimes Cotonou', court: 'Terrain B — Lycée Adetikopé', status: 'UPCOMING', type: 'MINIMES' },

    // Jour J (5 Septembre)
    { id: 'g6', day: 'JOUR_J', time: '09:00', stage: 'Ouverture Officielle & Discours Président du Club', teamA: 'Cérémonie d\'ouverture', teamB: '', court: 'Terrain Principal — Lycée Adetikopé', status: 'UPCOMING', type: 'CÉRÉMONIE' },
    { id: 'g7', day: 'JOUR_J', time: '10:00', stage: 'Demi-Finale 1 — Pro Senior', teamA: 'FIRE STONE All-Stars', teamB: 'Cobras de Dakar', scoreA: 94, scoreB: 86, court: 'Terrain Principal', status: 'FINISHED', mvp: 'Marcus Vance', type: 'PRO' },
    { id: 'g8', day: 'JOUR_J', time: '12:30', stage: 'Demi-Finale 2 — Pro Senior', teamA: 'Black Stars de Cotonou', teamB: 'Titans d\'Accra', scoreA: 89, scoreB: 82, court: 'Terrain Principal', status: 'FINISHED', mvp: 'Alexandre Koffi', type: 'PRO' },
    { id: 'g9', day: 'JOUR_J', time: '14:30', stage: 'Concours Dunk Contest — Grande Finale (Live)', teamA: 'Yannis Konda', teamB: 'Invités Pro', court: 'Terrain Principal', status: 'UPCOMING', type: 'SHOW' },
    { id: 'g10', day: 'JOUR_J', time: '15:30', stage: 'Concours 3-Pts Moneyball Challenge', teamA: 'Lucas Dubois', teamB: 'Open Elite', court: 'Terrain Principal', status: 'UPCOMING', type: 'SHOW' },
    { id: 'g11', day: 'JOUR_J', time: '17:30', stage: '🏆 GRANDE FINALE DES CHAMPIONS', teamA: 'FIRE STONE All-Stars', teamB: 'Black Stars de Cotonou', court: 'Terrain Principal — Main Stage', status: 'UPCOMING', type: 'PRO' },
    { id: 'g12', day: 'JOUR_J', time: '20:00', stage: '🎖️ Cérémonie Officielle des Trophées & Médailles', teamA: 'FIRE STONE Club', teamB: '', court: 'Terrain Principal Adetikopé', status: 'UPCOMING', type: 'CÉRÉMONIE' },
  ];

  const medicalStands: MedicalStand[] = [
    { id: 'm1', organization: 'Croix-Rouge Togolaise & CHU Sylvanus Olympio', theme: 'Dépistage Cardiovasculaire & ECG Gratuit', icon: '🫀', description: 'Contrôles de pression artérielle, électrocardiogrammes de prévention pour sportifs et ateliers de premiers secours. Ouvert à tous les participants et spectateurs.', location: 'Stand 1 — Hall Central', contact: 'info@croixrouge-togo.tg' },
    { id: 'm2', organization: 'Fédération Togolaise Sport & Santé', theme: 'Nutrition du Sportif & Hydratation Optimale', icon: '🥗', description: 'Consultations gratuites avec des diététiciens sportifs. Démonstrations de collations équilibrées et conseils hydratation pendant l\'effort.', location: 'Stand 2 — Esplanade Ouest', contact: 'contact@ftss-sante.tg' },
    { id: 'm3', organization: 'Clinique du Sport — Kinésithérapie', theme: 'Prévention des Blessures & Récupération Active', icon: '🩹', description: 'Séances de cryothérapie rapide, conseils de taping pour chevilles/genoux, évaluation posturale et bilan musculaire express.', location: 'Stand 3 — Espace Récupération', contact: '+228 90 00 00 11' },
    { id: 'm4', organization: 'Association Basket & Inclusion Jeunesse', theme: 'Handisport, Mixité & Intégration', icon: '♿', description: 'Initiation au Basket en Fauteuil, ateliers de sensibilisation au respect, à la mixité et à l\'inclusion sociale par le sport.', location: 'Stand 4 — Terrain Annexe B', contact: 'contact@basketinclusion-togo.org' },
    { id: 'm5', organization: 'Ligue Régionale Contre le Dopage (LRCD)', theme: 'Prévention Antidopage & Intégrité Sportive', icon: '🧪', description: 'Sensibilisation au risque des produits dopants, liste WADA simplifiée pour jeunes sportifs et parents, quiz interactif antidopage.', location: 'Stand 5 — Zone Jeunesse', contact: 'prevention@lrcd-togo.tg' },
  ];

  const sponsors: EventSponsor[] = [
    { id: 's1', name: 'Togocom', tier: 'PLATINE', logo: '📶', contribution: 'Sponsor Maillot & Naming Officiel de l\'Arena (FIRE STONE Arena by Togocom)', website: 'togocom.tg' },
    { id: 's2', name: 'UTB — Union Togolaise de Banque', tier: 'OR', logo: '🏛️', contribution: 'Partenaire Bancaire & Sponsor Village Santé — Académie FIRE STONE', website: 'utb.tg' },
    { id: 's3', name: 'SMAC Togo', tier: 'OR', logo: '🏀', contribution: 'Fourniture des équipements sportifs officiels & maillots de la saison', website: 'smac.tg' },
    { id: 's4', name: 'Mairie de Lomé — Direction des Sports', tier: 'PARTENAIRE', logo: '🏙️', contribution: 'Soutien institutionnel & mise à disposition du terrain du Lycée d\'Adetikopé', website: 'mairie-lome.tg' },
    { id: 's5', name: 'SGBF Santé Togo', tier: 'ARGENT', logo: '💊', contribution: 'Sponsor Village Santé & Dépistages Cardiovasculaires', website: 'sgbf-sante.tg' },
    { id: 's6', name: 'Radio Lumiere FM Lomé', tier: 'ARGENT', logo: '🎤', contribution: 'Couverture Média Live & DJ pour les Shows & Concert Pré-Journée', website: 'lumierefm.tg' },
  ];

  const tournamentPlayersStats = [
    { name: 'Marcus "Apex" Vance', team: 'FIRE STONE', avatar: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&auto=format&fit=crop&q=80', number: 7, ppg: 26.0, rpg: 4.5, apg: 11.0, spg: 3.0, efficiency: 28.5, achievements: ['MVP Journée', 'Finaliste Concours 3-Pts', 'Capitaine Finaliste'] },
    { name: 'Fatoumata "Athena" Diarra', team: 'Amazones Abidjan', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', number: 10, ppg: 24.0, rpg: 5.0, apg: 9.0, spg: 4.0, efficiency: 27.0, achievements: ['MVP Match Féminin', 'Prix Fair-Play Collectif'] },
    { name: 'Alexandre Koffi', team: 'Black Stars Cotonou', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80', number: 10, ppg: 24.5, rpg: 6.2, apg: 7.4, spg: 2.1, efficiency: 25.2, achievements: ['MVP Demi-Finale 2', 'Finaliste Journée'] },
    { name: 'Darius "Titan" Jackson', team: 'FIRE STONE', avatar: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=150&auto=format&fit=crop&q=80', number: 15, ppg: 18.0, rpg: 14.0, apg: 2.0, spg: 1.0, efficiency: 26.0, achievements: ['Leader Rebonds (14/m)', 'Meilleur Pivot Tournoi'] },
    { name: 'Yannis "Skywalker" Konda', team: 'FIRE STONE', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', number: 23, ppg: 15.5, rpg: 3.0, apg: 4.5, spg: 2.5, efficiency: 20.0, achievements: ['🏆 Champion Dunk Contest', 'Note parfaite 50/50'] },
    { name: 'Inès Benali', team: 'Académie FIRE STONE', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', number: 21, ppg: 20.0, rpg: 4.0, apg: 6.0, spg: 3.5, efficiency: 22.5, achievements: ['🏆 Rookied de l\'Année', 'Meilleure Jeune Joueuse'] },
    { name: 'Kwame Asante', team: 'Titans Accra', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', number: 14, ppg: 19.5, rpg: 9.8, apg: 3.1, spg: 0.8, efficiency: 21.4, achievements: ['Meilleur Pivot Adverse', 'Top Défenseur Adverse'] },
  ];

  const pastEditionVideos = [
    { id: 'v1', year: 2025, title: 'Revivez la Grande Finale 2025 en Intégralité (HD)', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80', views: 4800, duration: '1h 42min' },
    { id: 'v2', year: 2025, title: 'Dunk Contest Légendaire 2025 — 360° de Yannis Konda (Note Parfaite)', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&auto=format&fit=crop&q=80', views: 6200, duration: '18min' },
    { id: 'v3', year: 2025, title: 'Cérémonie Officielle des Trophées & Discours du Coach Vance', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=600&auto=format&fit=crop&q=80', views: 3100, duration: '32min' },
    { id: 'v4', year: 2024, title: 'Edition 2024 — Match d\'Ouverture Magique vs Spartans de Bordeaux', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80', views: 2800, duration: '48min' },
    { id: 'v5', year: 2024, title: 'Concert & Show Musical Édition 2024 — Nuit des Champions', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80', views: 1950, duration: '1h 10min' },
    { id: 'v6', year: 2023, title: 'Top 10 Plays All-Time Journée des Champions 2023', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80', views: 8400, duration: '12min' },
  ];

  const pastEditionPhotos = [
    { url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80', caption: 'Finale 2025 — Tip-Off' },
    { url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&auto=format&fit=crop&q=80', caption: 'Dunk Contest 2025 — Konda 360°' },
    { url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=600&auto=format&fit=crop&q=80', caption: 'Cérémonie des Médailles 2025' },
    { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80', caption: 'Village Santé & Dépistages 2024' },
    { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80', caption: 'Public & Ambiance 2024' },
    { url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80', caption: 'Équipes Féminines — Pré-Journée 2024' },
  ];

  const typeColors: Record<TournamentGame['type'], string> = {
    'PRO': 'bg-[#B91C1C]/30 text-red-300 border-[#B91C1C]/40',
    'FÉMININ': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    'MINIMES': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    'SHOW': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'CÉRÉMONIE': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };

  const tierStyle: Record<EventSponsor['tier'], string> = {
    'PLATINE': 'bg-linear-to-r from-slate-200 to-white text-slate-900 font-black border-slate-300',
    'OR': 'bg-linear-to-r from-[#D97706] to-amber-600 text-black font-black border-amber-400',
    'ARGENT': 'bg-linear-to-r from-slate-400 to-slate-500 text-white font-bold border-slate-400',
    'PARTENAIRE': 'bg-linear-to-r from-blue-700 to-blue-600 text-white font-bold border-blue-500',
  };

  const handleSaveAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setEventDetails({ ...editForm });
    setShowAdminModal(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 pb-12">

      {/* ================================================================ */}
      {/* ULTRA PREMIUM 3D HERO BANNER WITH LIVE COUNTDOWN                */}
      {/* ================================================================ */}
      <div className="relative glass-panel rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl shadow-red-950/60 bg-[#0A0C13]">
        {/* Layered Background Effects */}
        <div className="absolute inset-0 bg-linear-to-br from-red-950/60 via-[#0A0C13] to-amber-950/50" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D97706]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#B91C1C]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-10 lg:p-12 space-y-6">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-4 py-1.5 rounded-full bg-linear-to-r from-[#D97706] to-amber-700 text-black text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
              <Crown className="w-4 h-4" /> Événement Annuel Phare
            </span>
            <span className="px-3 py-1 rounded-full bg-[#B91C1C]/30 text-red-300 text-xs font-extrabold border border-[#B91C1C]/40 flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5" /> Santé & Inclusion
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-extrabold border border-purple-500/30 flex items-center gap-1">
              <Music className="w-3.5 h-3.5" /> Show & Concert
            </span>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              La Journée des{' '}
              <span className="text-gradient-gold drop-shadow-lg">CHAMPIONS</span>
              <span className="text-white"> {eventDetails.edition}</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#D97706] font-bold flex items-center gap-2 flex-wrap">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Thème Phare :</span>
              <span className="text-white italic">"{eventDetails.theme}"</span>
            </p>
          </div>

          {/* Key Info Pills */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Calendar className="w-3.5 h-3.5 text-[#D97706]" /> Pré-Journée : {eventDetails.datePreJournee}
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Star className="w-3.5 h-3.5 text-amber-300 fill-current" /> Grand Jour J : {eventDetails.dateJourJ}
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-[#B91C1C]" /> {eventDetails.venue}
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Users className="w-3.5 h-3.5 text-purple-400" /> +{eventDetails.expectedSpectators.toLocaleString()} Spectateurs
            </span>
          </div>

          {/* LIVE COUNTDOWN TIMER */}
          <div className="space-y-2">
            <div className="text-xs text-[#D97706] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Compte à Rebours — Grand Jour J :
            </div>
            <div className="flex items-center gap-3">
              {[
                { val: countdown.days, label: 'Jours' },
                { val: countdown.hours, label: 'Heures' },
                { val: countdown.minutes, label: 'Min' },
                { val: countdown.seconds, label: 'Sec' },
              ].map(({ val, label }, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/60 border border-[#D97706]/40 flex items-center justify-center text-2xl sm:text-3xl font-black text-white font-mono shadow-lg backdrop-blur-sm">
                    {String(val).padStart(2, '0')}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { val: participatingTeams.length, label: 'Équipes Engagées', icon: '🏀' },
              { val: scheduleGames.length, label: 'Matchs & Shows', icon: '🎬' },
              { val: medicalStands.length, label: 'Stands Médicaux', icon: '🏥' },
              { val: sponsors.length, label: 'Partenaires & Sponsors', icon: '🤝' },
            ].map((stat, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1 hover:bg-white/10 transition-colors">
                <div className="text-2xl">{stat.icon}</div>
                <div className="text-xl font-black text-white">{stat.val}</div>
                <div className="text-[10px] text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Admin Controls */}
          {isAdminOrCoach && (
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => { setEditForm({ ...eventDetails }); setShowAdminModal(true); }}
                className="px-5 py-2.5 rounded-xl bg-linear-to-r from-[#D97706] to-amber-700 text-black font-extrabold text-xs shadow-lg hover:scale-105 transition-all flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Administrer l'Édition {eventDetails.edition}
              </button>
              <button className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 flex items-center gap-2 transition-all">
                <Plus className="w-4 h-4 text-[#D97706]" /> Ajouter un Match / Stand
              </button>
            </div>
          )}
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Paramètres de la Journée des Champions sauvegardés avec succès !
        </div>
      )}

      {/* ================================================================ */}
      {/* MAIN NAVIGATION TABS                                            */}
      {/* ================================================================ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
        {[
          { id: 'OVERVIEW', icon: '🏆', label: 'Lauréats & Trophées' },
          { id: 'TEAMS', icon: '🏀', label: `Équipes (${participatingTeams.length})` },
          { id: 'PLANNING', icon: '📅', label: 'Planning Complet' },
          { id: 'HEALTH_VILLAGE', icon: '🏥', label: 'Village Santé' },
          { id: 'STATS', icon: '📊', label: 'Stats Joueurs' },
          { id: 'VIDEOS', icon: '🎬', label: 'Archives HD' },
          { id: 'SPONSORS', icon: '🤝', label: 'Sponsors & Partners' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-linear-to-r from-[#B91C1C] to-[#881337] text-white shadow-lg shadow-red-950/50'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* TAB 1 — TROPHIES & HALL OF FAME                                */}
      {/* ================================================================ */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          {/* Trophies grid */}
          <div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2 mb-5">
              <Trophy className="w-5 h-5 text-[#D97706]" /> Hall of Fame & Trophées Officiels {eventDetails.edition}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { label: 'MVP de la Journée', value: eventDetails.mvp, sub: '26 PPG • 11 APG • PER 28.5', icon: <Crown className="w-6 h-6" />, color: 'amber', borderColor: 'border-amber-500/40', bg: 'from-amber-950/40', iconBg: 'bg-[#D97706]/20 border-[#D97706]/40 text-[#D97706]', textColor: 'text-[#D97706]' },
                { label: '🏆 Champion Dunk Contest', value: eventDetails.dunkWinner, sub: 'Note parfaite 50/50 en Finale', icon: <Flame className="w-6 h-6" />, color: 'red', borderColor: 'border-red-500/30', bg: 'from-red-950/40', iconBg: 'bg-[#B91C1C]/20 border-[#B91C1C]/40 text-[#B91C1C]', textColor: 'text-red-400' },
                { label: 'Champion Concours 3-Pts', value: eventDetails.threePtWinner, sub: '21/25 tirs — Moneyball Challenge', icon: <Zap className="w-6 h-6" />, color: 'purple', borderColor: 'border-purple-500/30', bg: 'from-purple-950/40', iconBg: 'bg-purple-500/20 border-purple-500/40 text-purple-300', textColor: 'text-purple-300' },
                { label: '⭐ Rookie de l\'Année', value: eventDetails.rookieWinner, sub: 'Meilleure Jeune Joueuse / Joueur', icon: <Star className="w-6 h-6 fill-current" />, color: 'cyan', borderColor: 'border-cyan-500/30', bg: 'from-cyan-950/40', iconBg: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300', textColor: 'text-cyan-300' },
                { label: 'Prix du Fair-Play', value: eventDetails.fairPlayWinner, sub: 'Esprit sportif & comportement modèle', icon: <Award className="w-6 h-6" />, color: 'emerald', borderColor: 'border-emerald-500/30', bg: 'from-emerald-950/40', iconBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400', textColor: 'text-emerald-400' },
                { label: 'Meilleur Coach', value: eventDetails.bestCoach, sub: 'Reconnu par le jury technique', icon: <Shield className="w-6 h-6" />, color: 'blue', borderColor: 'border-blue-500/30', bg: 'from-blue-950/40', iconBg: 'bg-blue-500/20 border-blue-500/40 text-blue-400', textColor: 'text-blue-400' },
              ].map((trophy, idx) => (
                <div
                  key={idx}
                  className={`glass-panel p-6 rounded-3xl border ${trophy.borderColor} bg-linear-to-b ${trophy.bg} to-[#0A0C13] space-y-3 group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 cursor-default`}
                >
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${trophy.iconBg}`}>
                    {trophy.icon}
                  </div>
                  <div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider block mb-1 ${trophy.textColor}`}>{trophy.label}</span>
                    <h4 className={`text-base font-black text-white group-hover:${trophy.textColor} transition-colors leading-tight`}>{trophy.value}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">{trophy.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medals Table */}
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-amber-400" /> Tableau des Médailles — Classement Général
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-white/10 text-slate-400 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="px-4 py-3">Rang</th>
                    <th className="px-4 py-3">Équipe</th>
                    <th className="px-3 py-3 text-center">🥇 Or</th>
                    <th className="px-3 py-3 text-center">🥈 Argent</th>
                    <th className="px-3 py-3 text-center">🥉 Bronze</th>
                    <th className="px-3 py-3 text-center">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {participatingTeams
                    .filter(t => (t.gold || 0) + (t.silver || 0) + (t.bronze || 0) > 0)
                    .sort((a, b) => ((b.gold || 0) - (a.gold || 0)))
                    .map((team, idx) => (
                      <tr key={team.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 font-black text-white">{idx + 1}</td>
                        <td className="px-4 py-3 font-extrabold text-white flex items-center gap-2">
                          <span className="text-lg">{team.logo}</span> {team.name}
                        </td>
                        <td className="px-3 py-3 text-center font-black text-amber-400 text-base">{team.gold || 0}</td>
                        <td className="px-3 py-3 text-center font-mono text-slate-300">{team.silver || 0}</td>
                        <td className="px-3 py-3 text-center font-mono text-amber-700">{team.bronze || 0}</td>
                        <td className="px-3 py-3 text-center font-black text-white">{(team.gold || 0) + (team.silver || 0) + (team.bronze || 0)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2 — PARTICIPATING TEAMS                                     */}
      {/* ================================================================ */}
      {activeTab === 'TEAMS' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" /> Équipes Engagées ({participatingTeams.length} équipes — toutes catégories)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {participatingTeams.map((team) => (
              <div
                key={team.id}
                className={`glass-panel p-5 rounded-3xl border border-white/10 space-y-4 bg-linear-to-b ${team.color} to-[#0A0C13] hover:border-white/25 hover:-translate-y-1 transition-all duration-300 group`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/15 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                    {team.logo}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white leading-tight">{team.name}</h4>
                    <div className="text-[10px] text-[#D97706] font-bold">{team.city}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">{team.category} — {team.rosterCount} joueurs</div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{team.description}</p>
                <div className="pt-2 border-t border-white/10 text-xs">
                  <span className="text-slate-400">Vedette : </span>
                  <span className="font-extrabold text-white">{team.starPlayer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 3 — FULL SCHEDULE (PRE-DAY + GAME DAY)                     */}
      {/* ================================================================ */}
      {activeTab === 'PLANNING' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#D97706]" /> Planning Complet — Pré-Journée (J-1) & Grand Jour J
            </h3>
          </div>

          {(['PRE_JOURNEE', 'JOUR_J'] as const).map((day) => (
            <div key={day} className="space-y-3">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider ${day === 'PRE_JOURNEE' ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30' : 'bg-linear-to-r from-[#D97706] to-amber-700 text-black'}`}>
                {day === 'PRE_JOURNEE' ? `📅 Pré-Journée — ${eventDetails.datePreJournee}` : `⭐ Grand Jour J — ${eventDetails.dateJourJ}`}
              </div>
              <div className="space-y-2">
                {scheduleGames.filter(g => g.day === day).map((game) => (
                  <div key={game.id} className="p-4 rounded-2xl bg-[#0A0C13] border border-white/10 hover:border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${typeColors[game.type]}`}>
                        {game.type}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-[#D97706] flex items-center gap-1.5">
                          <Clock className="w-3 h-3" /> {game.time} — <span className="text-slate-400">{game.court}</span>
                        </div>
                        <div className="text-sm font-extrabold text-white mt-0.5">
                          {game.teamB ? <>{game.teamA} <span className="text-slate-500 font-normal">vs</span> {game.teamB}</> : game.teamA}
                        </div>
                        <div className="text-[10px] text-slate-400">{game.stage}</div>
                      </div>
                    </div>
                    <div className="self-end sm:self-auto">
                      {game.status === 'FINISHED' && game.scoreA !== undefined ? (
                        <div className="text-right">
                          <span className="text-sm font-black text-white bg-black/60 px-3 py-1 rounded-xl border border-white/10">
                            {game.scoreA} — {game.scoreB}
                          </span>
                          {game.mvp && <div className="text-[10px] text-emerald-400 font-bold mt-1">MVP : {game.mvp}</div>}
                        </div>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">À Venir ⏳</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 4 — HEALTH VILLAGE                                         */}
      {/* ================================================================ */}
      {activeTab === 'HEALTH_VILLAGE' && (
        <div className="space-y-5">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-emerald-400" /> Village Santé & Structures Médicales Partenaires
            </h3>
            <p className="text-xs text-slate-400 mt-1">Accès gratuit pour tous les participants et spectateurs. Dépistages et consultations sur place.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {medicalStands.map((stand) => (
              <div key={stand.id} className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-linear-to-br from-emerald-950/25 via-[#0A0C13] to-black space-y-3 hover:-translate-y-1 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl shrink-0">
                    {stand.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white leading-tight">{stand.theme}</h4>
                    <span className="text-xs text-emerald-400 font-bold">{stand.organization}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{stand.description}</p>
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <span>📍 <strong className="text-white">{stand.location}</strong></span>
                  <span className="text-emerald-400 font-bold">✅ Accès Gratuit & Sans RDV</span>
                </div>
                {stand.contact && <div className="text-[10px] text-slate-500">Contact : {stand.contact}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 5 — PLAYER STATS                                            */}
      {/* ================================================================ */}
      {activeTab === 'STATS' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" /> Classement des Joueurs du Tournoi — Toutes Équipes
            </h3>
            <span className="text-xs text-slate-400">Cliquez sur un joueur pour sa fiche complète</span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/10 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-3 py-3">#</th>
                  <th className="px-4 py-3">Joueur & Équipe</th>
                  <th className="px-3 py-3 text-center text-white font-extrabold">PPG</th>
                  <th className="px-3 py-3 text-center">RPG</th>
                  <th className="px-3 py-3 text-center">APG</th>
                  <th className="px-3 py-3 text-center">STL</th>
                  <th className="px-3 py-3 text-center">PER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tournamentPlayersStats.sort((a, b) => b.ppg - a.ppg).map((p, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedTournamentPlayer(p)}
                    className="hover:bg-white/10 cursor-pointer transition-colors group"
                  >
                    <td className="px-3 py-3 font-black text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.avatar} alt={p.name} className="w-9 h-9 rounded-xl object-cover border border-white/20 group-hover:border-[#D97706] transition-colors" />
                        <div>
                          <div className="font-extrabold text-white group-hover:text-[#D97706] transition-colors">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.team} — #{p.number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center font-black text-[#B91C1C] text-sm">{p.ppg}</td>
                    <td className="px-3 py-3 text-center font-mono">{p.rpg}</td>
                    <td className="px-3 py-3 text-center font-mono text-[#D97706]">{p.apg}</td>
                    <td className="px-3 py-3 text-center font-mono">{p.spg}</td>
                    <td className="px-3 py-3 text-center font-black text-emerald-400">{p.efficiency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 6 — VIDEO ARCHIVES + PHOTO GALLERY                         */}
      {/* ================================================================ */}
      {activeTab === 'VIDEOS' && (
        <div className="space-y-8">
          {/* Video Highlights */}
          <div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2 mb-5">
              <Play className="w-5 h-5 text-blue-400" /> Replays & Highlights Vidéos HD — Éditions Passées
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pastEditionVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => setActiveMedia({ type: 'VIDEO', url: video.url, title: video.title })}
                  className="glass-panel rounded-3xl overflow-hidden border border-white/10 group cursor-pointer bg-[#0A0C13] hover:border-blue-500/40 transition-all hover:-translate-y-1"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#B91C1C] text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-black/70 text-[#D97706] text-[9px] font-bold">Éd. {video.year}</span>
                      <span className="px-2 py-0.5 rounded-full bg-black/70 text-slate-300 text-[9px] font-mono">{video.duration}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-1">
                    <h4 className="text-xs font-extrabold text-white group-hover:text-blue-300 transition-colors line-clamp-2">{video.title}</h4>
                    <div className="text-[10px] text-slate-400">{video.views.toLocaleString()} vues</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Photo Gallery */}
          <div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2 mb-5">
              <Camera className="w-5 h-5 text-purple-400" /> Galerie Photos — Moments Inoubliables
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {pastEditionPhotos.map((photo, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveMedia({ type: 'IMAGE', url: photo.url, title: photo.caption })}
                  className="relative h-44 rounded-2xl overflow-hidden border border-white/10 group cursor-pointer hover:border-purple-500/50 transition-all"
                >
                  <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                    <div className="text-[10px] text-white font-bold line-clamp-1">{photo.caption}</div>
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

      {/* ================================================================ */}
      {/* TAB 7 — SPONSORS & PARTNERS                                     */}
      {/* ================================================================ */}
      {activeTab === 'SPONSORS' && (
        <div className="space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-[#D97706]" /> Partenaires Officiels & Sponsors de la Journée des Champions
            </h3>
            <p className="text-xs text-slate-400 mt-1">Merci à tous nos partenaires institutionnels, commerciaux et associatifs qui rendent cet événement possible.</p>
          </div>

          {(['PLATINE', 'OR', 'ARGENT', 'PARTENAIRE'] as const).map((tier) => {
            const tierSponsors = sponsors.filter(s => s.tier === tier);
            if (tierSponsors.length === 0) return null;
            const tierLabels: Record<string, string> = { PLATINE: '💿 Rang PLATINE', OR: '🥇 Rang OR', ARGENT: '🥈 Rang ARGENT', PARTENAIRE: '🤝 Partenaires Institutionnels' };
            return (
              <div key={tier} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${tierStyle[tier]}`}>{tierLabels[tier]}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tierSponsors.map((sponsor) => (
                    <div key={sponsor.id} className="glass-panel p-5 rounded-2xl border border-white/10 bg-[#0A0C13] hover:border-white/20 transition-all space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                          {sponsor.logo}
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-white">{sponsor.name}</h4>
                          <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-black ${tierStyle[sponsor.tier]}`}>{sponsor.tier}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{sponsor.contribution}</p>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {sponsor.website}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================ */}
      {/* PLAYER STATS MODAL                                             */}
      {/* ================================================================ */}
      {selectedTournamentPlayer && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-white/15 max-w-md w-full space-y-5 bg-[#0D0E15]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img src={selectedTournamentPlayer.avatar} alt={selectedTournamentPlayer.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-[#D97706] shadow-lg" />
                <div>
                  <h3 className="font-extrabold text-white text-base">{selectedTournamentPlayer.name}</h3>
                  <span className="text-xs text-[#D97706] font-bold">#{selectedTournamentPlayer.number} — {selectedTournamentPlayer.team}</span>
                </div>
              </div>
              <button onClick={() => setSelectedTournamentPlayer(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {[
                { label: 'PPG', val: selectedTournamentPlayer.ppg, color: 'text-[#B91C1C]' },
                { label: 'RPG', val: selectedTournamentPlayer.rpg, color: 'text-white' },
                { label: 'APG', val: selectedTournamentPlayer.apg, color: 'text-[#D97706]' },
                { label: 'PER', val: selectedTournamentPlayer.efficiency, color: 'text-emerald-400' },
              ].map(({ label, val, color }, i) => (
                <div key={i} className="bg-black/60 p-3 rounded-xl border border-white/5">
                  <div className="text-[9px] text-slate-400 uppercase">{label}</div>
                  <div className={`font-black text-lg ${color}`}>{val}</div>
                </div>
              ))}
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 block mb-2">🏆 Accomplissements — Journée des Champions :</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedTournamentPlayer.achievements.map((a, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-xl bg-[#D97706]/20 text-[#D97706] text-[10px] font-bold border border-[#D97706]/30">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ADMIN CONFIGURATION MODAL                                      */}
      {/* ================================================================ */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 max-w-2xl w-full space-y-5 bg-[#0D0E15] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#D97706]" />
                <h3 className="font-extrabold text-white text-base">Configuration — Journée des Champions {eventDetails.edition}</h3>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Thème Officiel de l'Édition :</label>
                <input type="text" value={editForm.theme} onChange={e => setEditForm({ ...editForm, theme: e.target.value })} className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D97706]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Date Pré-Journée :</label>
                  <input type="text" value={editForm.datePreJournee} onChange={e => setEditForm({ ...editForm, datePreJournee: e.target.value })} className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Date Grand Jour J :</label>
                  <input type="text" value={editForm.dateJourJ} onChange={e => setEditForm({ ...editForm, dateJourJ: e.target.value })} className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">MVP de la Journée :</label>
                  <input type="text" value={editForm.mvp} onChange={e => setEditForm({ ...editForm, mvp: e.target.value })} className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Vainqueur Dunk Contest :</label>
                  <input type="text" value={editForm.dunkWinner} onChange={e => setEditForm({ ...editForm, dunkWinner: e.target.value })} className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Vainqueur Concours 3-Pts :</label>
                  <input type="text" value={editForm.threePtWinner} onChange={e => setEditForm({ ...editForm, threePtWinner: e.target.value })} className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Rookie de l'Année :</label>
                  <input type="text" value={editForm.rookieWinner} onChange={e => setEditForm({ ...editForm, rookieWinner: e.target.value })} className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Prix Fair-Play (Équipe) :</label>
                  <input type="text" value={editForm.fairPlayWinner} onChange={e => setEditForm({ ...editForm, fairPlayWinner: e.target.value })} className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Meilleur Coach :</label>
                  <input type="text" value={editForm.bestCoach} onChange={e => setEditForm({ ...editForm, bestCoach: e.target.value })} className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-white" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setShowAdminModal(false)} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 font-bold">Annuler</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-linear-to-r from-[#D97706] to-amber-700 text-black font-extrabold shadow-lg flex items-center gap-2 hover:scale-105 transition-all">
                  <Save className="w-4 h-4" /> Sauvegarder les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* FULLSCREEN MEDIA LIGHTBOX                                      */}
      {/* ================================================================ */}
      {activeMedia && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <button onClick={() => setActiveMedia(null)} className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-50 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-5xl w-full space-y-4 text-center">
            <div className="text-white text-sm font-extrabold">{activeMedia.title}</div>
            {activeMedia.type === 'VIDEO' ? (
              <div className="relative aspect-video w-full rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-black">
                <iframe
                  src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1"
                  title={activeMedia.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <img src={activeMedia.url} alt={activeMedia.title} className="max-h-[80vh] max-w-[90vw] object-contain rounded-3xl border border-white/20 shadow-2xl" />
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
