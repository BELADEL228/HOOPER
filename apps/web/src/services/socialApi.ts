import { apiUrl } from './api';
import type { SocialPost, SocialComment } from '../types';

const getAuthHeaders = (): Record<string, string> => {
  const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
};

// ✅ Récupère l'utilisateur courant
const getCurrentUser = (): {
  id?: string;
  name?: string;
  avatarUrl?: string | null;
  role?: string;
} => {
  try {
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    return session?.user || {};
  } catch {
    return {};
  }
};

export interface CreatePostPayload {
  content: string;
  mediaUrl?: string;
  matchId?: string;
  clubId?: string;
}

export const socialApi = {
  /** Liste les publications récentes */
  async fetchPosts(): Promise<SocialPost[]> {
    const res = await fetch(apiUrl('/posts'));
    if (!res.ok) throw new Error('Erreur lors du chargement des publications');
    const posts = await res.json();

    return posts.map((p: any) => ({
      id: p.id,
      // ✅ Le backend renvoie ces champs À PLAT
      authorId: p.authorId,
      authorName: p.authorName || 'Joueur Hoopers',
      authorAvatar:
        p.authorAvatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          p.authorName || 'Joueur'
        )}&background=FF2A3B&color=fff`,
      authorRole: p.authorRole || 'PLAYER',
      timestamp: new Date(p.timestamp || p.createdAt).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      content: p.content,
      mediaUrl: p.mediaUrl || undefined,
      likesCount: p.likesCount ?? 0,
      hasLiked: Boolean(p.hasLiked),
      comments: (p.comments || []).map(
        (c: any): SocialComment => ({
          id: c.id,
          authorName: c.authorName || 'Membre',
          authorAvatar:
            c.authorAvatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              c.authorName || 'Membre'
            )}&background=FF2A3B&color=fff`,
          text: c.text || c.content || '',
          timestamp: new Date(c.timestamp || c.createdAt).toLocaleTimeString(
            'fr-FR',
            { hour: '2-digit', minute: '2-digit' }
          ),
        })
      ),
      reactions: [],
    }));
  },

  /**
   * Crée une nouvelle publication.
   * ✅ Force les infos du user courant (localStorage) pour éviter tout bug d'affichage.
   */
  async createPost(payload: CreatePostPayload): Promise<SocialPost> {
    const res = await fetch(apiUrl('/posts'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || 'Impossible de créer la publication');
    }

    const p = data.post || data;
    const me = getCurrentUser(); // ✅ Source de vérité

    return {
      id: p.id,
      // ✅ FORCE les infos du user qui vient de poster
      authorId: me.id || p.authorId,
      authorName: me.name || p.authorName || 'Moi',
      authorAvatar:
        me.avatarUrl ||
        p.authorAvatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          me.name || 'Moi'
        )}&background=FF2A3B&color=fff`,
      authorRole: (me.role as any) || p.authorRole || 'PLAYER',
      timestamp: 'À l’instant',
      content: p.content || payload.content,
      mediaUrl: p.mediaUrl || payload.mediaUrl || undefined,
      likesCount: 0,
      hasLiked: false,
      comments: [],
      reactions: [],
    };
  },

  async deletePost(postId: string): Promise<void> {
    const res = await fetch(apiUrl(`/posts/${postId}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => null);

      throw new Error(
        error?.error || 'Impossible de supprimer la publication'
      );
    }
  },

  /** Bascule le like d'une publication */
  async toggleLike(
    postId: string
  ): Promise<{ liked: boolean; likesCount: number }> {
    const res = await fetch(apiUrl(`/posts/${postId}/like`), {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => null);

      throw new Error(
        error?.error || 'Action like impossible'
      );
    }

    return res.json();
  },

  /** Ajoute un commentaire */
  async addComment(postId: string, content: string): Promise<SocialComment> {
    const res = await fetch(apiUrl(`/posts/${postId}/comments`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Impossible d'ajouter le commentaire");
    }
    const c = data.comment || data;
    const me = getCurrentUser();

    return {
      id: c.id || `c_${Date.now()}`,
      authorName: me.name || c.authorName || 'Moi',
      authorAvatar:
        me.avatarUrl ||
        c.authorAvatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          me.name || 'Moi'
        )}&background=FF2A3B&color=fff`,
      text: c.text || c.content || content,
      timestamp: 'À l’instant',
    };
  },

  /** Signale un contenu inapproprié */
  async reportContent(
    postId: string,
    reason: string,
    details?: string
  ): Promise<void> {
    const res = await fetch(apiUrl('/reports'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        targetType: 'POST',
        targetId: postId,
        reason,
        details,
      }),
    });
    if (!res.ok) throw new Error('Signalement non enregistré');
  },
};