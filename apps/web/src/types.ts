export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TREASURER' | 'COACH' | 'PLAYER' | 'VISITOR' | 'SPONSOR' | 'ACADEMY_CANDIDATE' | 'CLUB_MANAGER';

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
  status: 'UPCOMING' | 'FINISHED' | 'LIVE';
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
  authorRole?: UserRole;
  text: string;
  timestamp: string;
}

export type SocialComment = SocialPostComment;

export interface SocialPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorRole: UserRole;
  authorId?: string;
  authorBadge?: string;
  timestamp: string;
  createdAtMs?: number;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  tags?: string[];
  likesCount: number;
  isLiked?: boolean;
  hasLiked?: boolean;
  reactions: { emoji: string; count: number; userReacted?: boolean }[];
  comments: SocialPostComment[];
  teamId?: string;
  teamName?: string;
  videoDuration?: string;
}

export interface JerseyKitConfig {
  jerseyBase: string;
  jerseyTrims: string;
  jerseyAccent: string;
  textColor: string;
  shortsBase: string;
  pattern: 'solid' | 'gradient' | 'stripes' | 'modern';
}

export interface ThemeTokens {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  gradient: string;
  matchdayGradient?: string;
  shadow: string;
  glow: string;
  themeType: 'dark' | 'light' | string;
  palette?: string[];
  contrastRatio?: number;
  homeKit?: JerseyKitConfig;
  awayKit?: JerseyKitConfig;
}

export interface Team {
  id: string;
  clubId?: string | null;
  clubName?: string | null;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  city: string;
  category: string;
  division?: string;
  coachName?: string;
  record?: string;
  foundedYear?: number | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  themeType?: string | null;
  themeJson?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Club {
  id: string;
  name: string;
  slug: string;
  shortName?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  city: string;
  country?: string;
  address?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  foundedYear?: number | null;
  arena?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  themeType?: string | null;
  themeJson?: string | null;
  isVerified?: boolean;
  teams: Team[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  country?: string | null;
  city?: string | null;
  isSuspended: boolean;
  suspendReason?: string | null;
  suspendedUntil?: string | null;
  createdAt: string;
  postsCount?: number;
  commentsCount?: number;
  reportsReceivedCount?: number;
}

export interface AdminMetrics {
  users: {
    total: number;
    active: number;
    suspended: number;
  };
  content: {
    posts: number;
    matches: number;
    tournaments: number;
    teams: number;
  };
  moderation: {
    pendingReports: number;
    resolvedReports: number;
  };
  system: {
    uptime: number;
    memoryMb: number;
    environment: string;
  };
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  reportedUserId?: string | null;
  postId?: string | null;
  commentId?: string | null;
  targetType: 'POST' | 'COMMENT' | 'USER';
  reason: 'SPAM' | 'HARASSMENT' | 'HATE_SPEECH' | 'VIOLENCE' | 'OTHER';
  details?: string | null;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  resolutionNote?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  reportedUser?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    isSuspended?: boolean;
  } | null;
  post?: {
    id: string;
    content: string;
    mediaUrl?: string | null;
    createdAt: string;
    author?: { id: string; name: string };
  } | null;
  comment?: {
    id: string;
    content: string;
    createdAt: string;
    author?: { id: string; name: string };
  } | null;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

// ─── TYPES MARKETPLACE & BILLETTERIE QR ─────────────────────────────────────────

export type MarketplaceCategory = 'ALL' | 'JERSEYS' | 'GEAR' | 'LIFESTYLE' | 'ACCESSORIES';

export interface MarketplaceProduct {
  id: string;
  name: string;
  slug: string;
  category: 'JERSEYS' | 'GEAR' | 'LIFESTYLE' | 'ACCESSORIES';
  priceXOF: number;
  description: string;
  imageUrl: string;
  isOfficial: boolean;
  customizable: boolean;
  sizes?: string[];
  inStock: boolean;
  rating: number;
  reviewsCount: number;
  badge?: string;
}

export interface MatchTicketTier {
  id: string;
  tierName: string;
  priceXOF: number;
  description: string;
  availableSeats: number;
  totalSeats: number;
  perks: string[];
}

export interface TicketingMatch {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  competition: string;
  date: string;
  time: string;
  arenaName: string;
  arenaCity: string;
  isHotMatch?: boolean;
  tiers: MatchTicketTier[];
}

export type PaymentMethod = 'TMONEY' | 'FLOOZ' | 'CARD' | 'CASH_ARENA';

export interface CartItem {
  id: string;
  itemType: 'product' | 'ticket';
  title: string;
  priceXOF: number;
  quantity: number;
  selectedSize?: string;
  customPlayerName?: string;
  customJerseyNumber?: number;
  matchDate?: string;
  ticketTierName?: string;
  imageUrl?: string;
}

export interface IssuedTicket {
  id: string;
  ticketCode: string;
  matchId: string;
  matchTitle: string;
  arena: string;
  matchDate: string;
  tierName: string;
  holderName: string;
  holderPhone?: string;
  priceXOF: number;
  qrCodeData: string;
  isUsed: boolean;
  usedAt?: string | null;
  validatedBy?: string | null;
  createdAt: string;
}

export interface MarketplaceOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  totalAmountXOF: number;
  status: 'CONFIRMED' | 'PAID' | 'PENDING' | 'REFUNDED';
  items: CartItem[];
  tickets?: IssuedTicket[];
  createdAt: string;
}

// ─── TYPES NOUVELLE ARCHITECTURE LIGUE & VITRINE PUBLIQUE ───────────────────────

export type ViewMode = 'social' | 'public' | 'club_workspace' | 'club_request' | 'super_admin';

export interface StarPlayerSpotlight {
  id: string;
  name: string;
  nickname?: string;
  number: number;
  position: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  teamColor: string;
  photo: string;
  quote: string;
  stats: {
    ppg: number;
    apg: number;
    rpg: number;
    efficiency: number;
  };
  highlightsBadge: string;
  accolades: string[];
}

export interface TeamOfTheMonth {
  teamId: string;
  teamName: string;
  month: string;
  year: number;
  logo: string;
  city: string;
  primaryColor: string;
  secondaryColor: string;
  record: string; // e.g. "8V - 1D"
  winStreak: number;
  offensiveRating: number; // e.g. 114.6
  defensiveRating: number; // e.g. 98.2
  pointsPerGame: number;
  pointDifferential: string; // e.g. "+16.4"
  coachName: string;
  coachQuote: string;
  keyPlayerName: string;
  keyPlayerStats: string;
  tacticalAnalysis: string;
  trophyBadge: string;
}

// ─── TYPES STORIES / STATUSES (RÉSEAU SOCIAL HOOPERS) ──────────────────────────

export type StatusVisibility = 'PUBLIC' | 'CLUB_ONLY' | 'PRIVATE';
export type StatusMediaType = 'IMAGE' | 'VIDEO';
export type StatusReactionType = 'LIKE' | 'FIRE' | 'BASKET' | 'CLAP' | 'HEART';

export interface StatusMedia {
  id: string;
  type: StatusMediaType;
  url: string;
  width?: number;
  height?: number;
  size?: number;
  duration?: number;
  order: number;
}

export interface StatusReaction {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  reaction: StatusReactionType;
  createdAt: string;
}

export interface StatusReply {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface StatusItem {
  id: string;
  userId?: string | null;
  clubId?: string | null;
  text?: string | null;
  visibility: StatusVisibility;
  createdAt: string;
  expiresAt: string;
  media: StatusMedia[];
  reactions?: StatusReaction[];
  replies?: StatusReply[];
  viewsCount?: number;
  hasViewed?: boolean;
}

export interface StoryGroup {
  id: string; // author or club id
  authorId?: string;
  clubId?: string;
  authorName: string;
  authorAvatar: string;
  authorRole?: UserRole;
  isClub: boolean;
  clubBadge?: string;
  hasUnseen: boolean;
  statuses: StatusItem[];
}

// ─── Type partagé pour l'ouverture de la modale d'auth ─────────────────
export type AuthModalTab = 'LOGIN' | 'REGISTER' | 'FORGOT';