import { apiUrl } from './api';
import type {
  StatusItem,
  StatusReactionType,
  StatusVisibility,
  StoryGroup,
  UserRole,
} from '../types';

export interface CreateStatusPayload {
  clubId?: string;
  text?: string;
  visibility?: StatusVisibility;
  media?: Array<{
    type: 'IMAGE' | 'VIDEO';
    url: string;
    width?: number;
    height?: number;
    size?: number;
    duration?: number;
  }>;
}

const getAuthHeaders = (): Record<string, string> => {
  const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
};


export interface StatusInsightUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role?: string;
}

export interface StatusInsights {
  statusId: string;
  text: string | null;
  visibility: string;
  createdAt: string;
  expiresAt: string;
  viewsCount: number;
  views: Array<{
    id: string;
    user: StatusInsightUser;
    viewedAt: string;
  }>;
  reactions: Array<{
    type: string;
    count: number;
    users: Array<{
      id: string;
      user: StatusInsightUser;
      createdAt: string;
    }>;
  }>;
  repliesCount: number;
  replies: Array<{
    id: string;
    user: StatusInsightUser;
    content: string;
    createdAt: string;
  }>;
}
// ═══════════════════════════════════════════════════════════════════════
// 🔄 NORMALISATION — transforme la réponse API (forme backend)
//    en types frontend (StoryGroup, StatusItem)
// ═══════════════════════════════════════════════════════════════════════

/** Normalise un StatusItem brut */
function normalizeStatusItem(raw: any): StatusItem {
  return {
    id: String(raw?.id ?? ''),
    userId: raw?.userId ?? raw?.author?.id ?? null,
    clubId: raw?.clubId ?? null,
    text: raw?.text ?? null,
    visibility: (raw?.visibility ?? 'PUBLIC') as StatusVisibility,
    createdAt: String(raw?.createdAt ?? new Date().toISOString()),
    expiresAt: String(raw?.expiresAt ?? new Date().toISOString()),
    media: Array.isArray(raw?.media)
      ? raw.media.map((m: any) => ({
        id: String(m?.id ?? ''),
        type: (m?.type === 'VIDEO' ? 'VIDEO' : 'IMAGE') as 'IMAGE' | 'VIDEO',
        url: String(m?.url ?? ''),
        width: m?.width,
        height: m?.height,
        size: m?.size,
        duration: m?.duration,
        order: Number(m?.order ?? 0),
      }))
      : [],
    reactions: Array.isArray(raw?.reactions) ? raw.reactions : [],
    replies: Array.isArray(raw?.replies) ? raw.replies : [],
    viewsCount: Number(raw?.viewsCount ?? 0),
    hasViewed: Boolean(raw?.isViewed ?? raw?.hasViewed ?? false),
  };
}

/** Normalise un StoryGroup brut (forme backend) */
function normalizeStoryGroup(raw: any): StoryGroup {
  const author = raw?.author || {};

  // Extrait le nom et l'avatar depuis le sous-objet author
  const authorName = String(
    author?.name || raw?.authorName || 'Utilisateur'
  );
  const authorAvatar =
    author?.avatarUrl ||
    raw?.authorAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      authorName
    )}&background=FF2A3B&color=fff`;

  return {
    // ID du groupe = ID de l'auteur (ou ID du club si c'est un club)
    id: String(author?.id || raw?.id || ''),

    // Infos auteur
    authorId: author?.type !== 'CLUB' ? String(author?.id || '') : undefined,
    clubId: author?.type === 'CLUB' ? String(author?.id || '') : undefined,
    authorName,
    authorAvatar,
    authorRole: (author?.role as UserRole) ?? undefined,

    // Type
    isClub: author?.type === 'CLUB',
    clubBadge: author?.badge ?? undefined,

    // Statut de lecture
    hasUnseen: Boolean(raw?.hasUnseenStatus ?? raw?.hasUnseen ?? false),

    // Liste des stories du groupe
    statuses: Array.isArray(raw?.statuses)
      ? raw.statuses.map(normalizeStatusItem)
      : [],
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 📡 API
// ═══════════════════════════════════════════════════════════════════════

export const statusApi = {
  /**
   * Récupère le flux de stories actives.
   * Transforme la réponse backend `{ author: {...}, statuses: [...] }`
   * en `StoryGroup` attendu par les composants.
   */
  async getFeed(): Promise<StoryGroup[]> {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(apiUrl('/statuses/feed'), { headers });
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error('Impossible de charger les stories');
      }
      const data = await res.json();

      // ✅ Normalisation
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.stories)
          ? data.stories
          : [];

      return list.map(normalizeStoryGroup);
    } catch (err) {
      console.warn('[statusApi.getFeed]', err);
      return [];
    }
  },

  /** Crée une nouvelle story / status */
  async createStatus(payload: CreateStatusPayload): Promise<StatusItem> {
    const res = await fetch(apiUrl('/statuses'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        data?.error || 'Erreur lors de la création de la story'
      );
    }
    // ✅ Normalisation
    return normalizeStatusItem(data.status || data);
  },

  /** Marque une story comme vue */
  async markAsViewed(statusId: string): Promise<void> {
    try {
      await fetch(apiUrl(`/statuses/${statusId}/view`), {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch {
      // Ignorer silencieusement pour ne pas bloquer l'UX
    }
  },

  /** Ajoute une réaction à une story */
  async addReaction(
    statusId: string,
    reaction: StatusReactionType
  ): Promise<void> {
    const res = await fetch(apiUrl(`/statuses/${statusId}/reactions`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reaction }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Impossible d'ajouter la réaction");
    }
  },

  /** Répond à une story */
  async replyToStatus(statusId: string, text: string): Promise<void> {
    const res = await fetch(apiUrl(`/statuses/${statusId}/replies`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Impossible d'envoyer la réponse");
    }
  },

  /** Supprime une story */
  async deleteStatus(statusId: string): Promise<void> {
    const res = await fetch(apiUrl(`/statuses/${statusId}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || 'Impossible de supprimer la story');
    }
  },

  /** Récupère les insights d'un status (auteur uniquement) */
  async getInsights(statusId: string): Promise<StatusInsights | null> {
    try {
      const res = await fetch(apiUrl(`/statuses/${statusId}/insights`), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};