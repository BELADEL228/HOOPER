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
}

export interface AuthSession {
  token: string;
  user: AuthenticatedUser;
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
  visualStyle?: string;
  shapeCharacteristics?: string[];
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
