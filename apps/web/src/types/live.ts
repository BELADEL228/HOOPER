// ─── Types Live Center ─────────────────────────────────────────────────────

export type LiveStatus = 'SCHEDULED' | 'LIVE' | 'ENDED';
export type LiveCategory = 'SPORT' | 'MATCH' | 'TRAINING' | 'EVENT' | 'OTHER';
export type LiveVisibility = 'PUBLIC' | 'CLUB_ONLY' | 'PRIVATE';

export interface LiveSession {
  id: string;
  title: string;
  description?: string | null;
  category: LiveCategory;
  thumbnailUrl?: string | null;
  status: LiveStatus;
  startedAt?: string | null;
  endedAt?: string | null;
  scheduledAt?: string | null;
  peakViewers: number;
  totalViews: number;
  hlsUrl?: string | null;
  playbackUrl?: string | null;
  streamKey: string;
  isRecorded: boolean;
  isChatEnabled: boolean;
  visibility: LiveVisibility;
  createdAt: string;
  // Host
  hostId: string;
  hostName: string;
  hostAvatar: string;
  hostRole: string;
  // Club (optionnel)
  clubId?: string | null;
  clubName?: string | null;
  clubLogo?: string | null;
  clubPrimaryColor?: string | null;
  commentsCount: number;
}

export interface LiveComment {
  id: string;
  sessionId: string;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  createdAt: string;
}

export interface LiveReaction {
  sessionId: string;
  emoji: string;
  userId: string;
  userName: string;
}

export interface CreateLivePayload {
  title: string;
  description?: string;
  category?: LiveCategory;
  thumbnailUrl?: string;
  clubId?: string;
  scheduledAt?: string;
  visibility?: LiveVisibility;
  isChatEnabled?: boolean;
  isRecorded?: boolean;
}
