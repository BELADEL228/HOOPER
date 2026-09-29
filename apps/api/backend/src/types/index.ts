import { UserRole } from '../config/constants';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  bio?: string | null;
  country?: string | null;
  city?: string | null;
  isSuspended: boolean;
  suspendReason?: string | null;
  suspendedUntil?: string | null;
  createdAt?: string;

  // ✅ NOUVEAU : Contexte club pour le RBAC scoped
  /** IDs des clubs où l'utilisateur est ClubMember ACTIVE. */
  activeClubIds?: string[];
  /** Map clubId → rôle dans le club (PRESIDENT, CLUB_ADMIN, TREASURER, COACH, PLAYER, MEMBER). */
  clubRoles?: Record<string, string>;
}

export interface AuthSession {
  token: string;
  user: AuthenticatedUser;
  message?: string;
  clubMembershipStatus?: string;
  clubId?: string;
}

export interface ThemeTokens {
  primary: string;
  primaryLight?: string;
  primaryDark?: string;
  primaryTint?: string;
  primaryShade?: string;
  secondary: string;
  secondaryLight?: string;
  secondaryDark?: string;
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
  vibrationMode?: 'vibrant' | 'minimal';
  palette?: string[];
  contrastRatio?: number;
  visualStyle?: string;
  shapeCharacteristics?: string[];
  neutrals?: {
    black: string;
    gray1: string;
    gray2: string;
    gray3: string;
    gray4: string;
    gray5: string;
    white: string;
    transparent: string;
  };
  spacing?: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography?: {
    bodyFont: string;
    headingFont: string;
    bodySize: string;
    headingSize: string;
  };
  elevation?: {
    sm: string;
    md: string;
    lg: string;
  };
  homeKit?: {
    jerseyBase: string;
    jerseyTrims: string;
    jerseyAccent: string;
    textColor: string;
    shortsBase: string;
    pattern: string;
  };
  awayKit?: {
    jerseyBase: string;
    jerseyTrims: string;
    jerseyAccent: string;
    textColor: string;
    shortsBase: string;
    pattern: string;
  };
}

export interface ClubSummary {
  id: string;
  name: string;
  slug: string;
  shortName?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  city: string;
  country: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  themeType?: string | null;
  themeJson?: string | null;
  isVerified: boolean;
  teamsCount?: number;
  postsCount?: number;
}