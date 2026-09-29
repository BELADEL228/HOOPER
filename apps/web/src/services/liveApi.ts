import { apiUrl } from './api';
import type { LiveSession, LiveComment, CreateLivePayload } from '../types/live';

const getAuthHeaders = (): Record<string, string> => {
  const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
};

export const liveApi = {
  // ── Lister les lives (optionnel: ?status=LIVE|SCHEDULED|ENDED) ───────────
  async listSessions(params?: { status?: string; clubId?: string; hostId?: string }): Promise<LiveSession[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.clubId) qs.set('clubId', params.clubId);
    if (params?.hostId) qs.set('hostId', params.hostId);

    const res = await fetch(apiUrl(`/lives?${qs}`));
    if (!res.ok) throw new Error('Impossible de charger les lives.');
    return res.json();
  },

  // ── Récupérer un live par ID ─────────────────────────────────────────────
  async getSession(id: string): Promise<LiveSession> {
    const res = await fetch(apiUrl(`/lives/${id}`));
    if (!res.ok) throw new Error('Live introuvable.');
    return res.json();
  },

  // ── Créer un live (SCHEDULED) ────────────────────────────────────────────
  async createSession(payload: CreateLivePayload): Promise<LiveSession> {
    const res = await fetch(apiUrl('/lives'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Impossible de créer le live.');
    return data;
  },

  // ── Démarrer un live ─────────────────────────────────────────────────────
  async startSession(id: string): Promise<LiveSession> {
    const res = await fetch(apiUrl(`/lives/${id}/start`), {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Impossible de démarrer le live.');
    return data;
  },

  // ── Terminer un live ─────────────────────────────────────────────────────
  async endSession(id: string, playbackUrl?: string): Promise<LiveSession> {
    const res = await fetch(apiUrl(`/lives/${id}/end`), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ playbackUrl }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Impossible de terminer le live.');
    return data;
  },

  // ── Charger le chat ──────────────────────────────────────────────────────
  async getComments(id: string, limit = 50, before?: string): Promise<LiveComment[]> {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (before) qs.set('before', before);
    const res = await fetch(apiUrl(`/lives/${id}/comments?${qs}`));
    if (!res.ok) return [];
    return res.json();
  },

  // ── Envoyer un message via REST (fallback si socket indispo) ────────────
  async postComment(id: string, text: string): Promise<LiveComment> {
    const res = await fetch(apiUrl(`/lives/${id}/comments`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Erreur envoi message.');
    return data;
  },
};
