export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TREASURER' | 'COACH' | 'PLAYER' | 'VISITOR' | 'SPONSOR' | 'ACADEMY_CANDIDATE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  jerseyNumber?: number;
  position?: string;
}

export interface PlayerStats {
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  fgm: number;
  fga: number;
  threePm: number;
  threePa: number;
  ftm: number;
  fta: number;
  min: number;
}

export interface PlayerMatchStat extends PlayerStats {
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  position: string;
  isMvp?: boolean;
}

export interface QuarterScores {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  ot?: number;
}

export interface Match {
  id: string;
  opponent: string;
  opponentLogo: string;
  isHome: boolean;
  date: string;
  time: string;
  venue: string;
  address: string;
  status: 'UPCOMING' | 'FINISHED';
  scoreTeam?: number;
  scoreOpponent?: number;
  quarterScoresTeam?: QuarterScores;
  quarterScoresOpponent?: QuarterScores;
  summary?: string;
  mvpPlayerName?: string;
  mvpPlayerAvatar?: string;
  boxscore?: PlayerMatchStat[];
  videoUrl?: string;
  photos?: string[];
}

export type PlayerCategory = 'SENIOR' | 'JUNIOR' | 'MINIME';
export type PlayerGender = 'MASCULIN' | 'FÉMININ' | 'MIXTE';

export interface PlayerGameLog {
  matchId: string;
  opponent: string;
  date: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  min: number;
  isMvp?: boolean;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: 'Meneur' | 'Arrière' | 'Ailier' | 'Ailier Fort' | 'Pivot';
  category?: PlayerCategory;
  gender?: PlayerGender;
  height: string;
  weight: string;
  age: number;
  photo: string;
  bio: string;
  experienceYears: number;
  seasonStats: {
    ppg: number;
    rpg: number;
    apg: number;
    spg: number;
    bpg: number;
    fgPct: number;
    threePtPct: number;
    ftPct: number;
    efficiency: number;
  };
  achievements: string[];
  skillsRadar: {
    shooting: number;
    passing: number;
    defense: number;
    athleticism: number;
    iq: number;
    rebounding: number;
  };
  recentForm: number[];
  matchHistory?: PlayerGameLog[];
}

export interface Coach {
  id: string;
  name: string;
  roleTitle: string;
  photo: string;
  experience: string;
  bio: string;
  winRate: string;
  specialty: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  description: string;
  category: 'Cotisation' | 'Sponsoring' | 'Équipement' | 'Déplacement' | 'Événement' | 'Buvette';
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  userOrOrg: string;
  status: 'PAYÉ' | 'EN ATTENTE' | 'RETARD';
  proofUrl?: string;
}

export interface EventActivity {
  time: string;
  label: string;
  icon: string;
  duration: string;
  coach?: string;
}

export interface AbsenceJustification {
  playerId: string;
  playerName: string;
  reason: string;
  details: string;
  submittedAt: string;
  isRead: boolean;
}

export interface EventItem {
  id: string;
  title: string;
  type: 'ENTRAÎNEMENT' | 'MATCH' | 'RÉUNION' | 'ACTIVITÉ';
  date: string;
  time: string;
  location: string;
  description: string;
  coverImage?: string;
  programme?: EventActivity[];
  userRsvp?: 'CONFIRMED' | 'DECLINED' | 'PENDING';
  confirmedCount: number;
  declinedCount: number;
  absenceJustifications?: AbsenceJustification[];
}

export interface ArticleSection {
  heading?: string;
  body: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  category: string;
  date: string;
  author: string;
  authorAvatar?: string;
  image: string;
  summary: string;
  content: string;
  sections?: ArticleSection[];
  tags?: string[];
  readTime?: string;
  videoUrl?: string;
  galleryImages?: string[];
  views: number;
  isFeatured?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  mediaUrl?: string;
  reactions: { emoji: string; count: number }[];
  isPrivate?: boolean;
  recipientId?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  tier: 'PLATINE' | 'OR' | 'ARGENT';
  description: string;
  website: string;
  contribution: string;
}

export interface TeamStatsSummary {
  wins: number;
  losses: number;
  avgPointsScored: number;
  avgPointsAllowed: number;
  fgPercentage: number;
  threePtPercentage: number;
  ftPercentage: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
}

export interface AcademyApplication {
  id: string;
  candidateName: string;
  email: string;
  age: number;
  height: string;
  preferredPosition: string;
  videoHighlightsUrl?: string;
  status: 'EN_ATTENTE' | 'ACCEPTÉ' | 'REFUSÉ';
  submittedDate: string;
  notes?: string;
}

export interface ChampionsDayEvent {
  id: string;
  editionYear: number;
  date: string;
  dunkContestWinner: string;
  threePtContestWinner: string;
  seasonMvp: string;
  academyRookieOfYear: string;
  tournamentMatches: {
    stage: 'DEMI-FINALE' | 'FINALE';
    teamA: string;
    teamB: string;
    scoreA: number;
    scoreB: number;
  }[];
}

export interface SocialPostComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorRole: UserRole;
  text: string;
  timestamp: string;
}

export interface SocialPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorRole: UserRole;
  authorBadge?: string;
  timestamp: string;
  createdAtMs?: number;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  tags?: string[];
  likesCount: number;
  isLiked?: boolean;
  reactions: { emoji: string; count: number; userReacted?: boolean }[];
  comments: SocialPostComment[];
}

