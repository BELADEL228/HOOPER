import { prisma } from '../config/database';

export interface CreateLiveInput {
  title: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
  clubId?: string;
  scheduledAt?: string;
  visibility?: string;
  isChatEnabled?: boolean;
  isRecorded?: boolean;
}

export class LiveService {
  // ── Créer une session live ────────────────────────────────────────────────
  static async createSession(hostId: string, input: CreateLiveInput) {
    const session = await prisma.liveSession.create({
      data: {
        hostId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        category: input.category || 'SPORT',
        thumbnailUrl: input.thumbnailUrl || null,
        clubId: input.clubId || null,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        visibility: input.visibility || 'PUBLIC',
        isChatEnabled: input.isChatEnabled ?? true,
        isRecorded: input.isRecorded ?? true,
        streamKey: crypto.randomUUID(),
        status: 'SCHEDULED',
      },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true, role: true } },
        club: { select: { id: true, name: true, logoUrl: true, primaryColor: true } },
      },
    });

    return LiveService.formatSession(session, 0);
  }

  // ── Démarrer un live (SCHEDULED → LIVE) ──────────────────────────────────
  static async startSession(sessionId: string, hostId: string) {
    const session = await prisma.liveSession.findUnique({ where: { id: sessionId } });
    if (!session) throw Object.assign(new Error('Live introuvable.'), { statusCode: 404 });
    if (session.hostId !== hostId) throw Object.assign(new Error('Accès refusé.'), { statusCode: 403 });
    if (session.status === 'LIVE') throw Object.assign(new Error('Le live est déjà en cours.'), { statusCode: 409 });
    if (session.status === 'ENDED') throw Object.assign(new Error('Ce live est terminé.'), { statusCode: 409 });

    const updated = await prisma.liveSession.update({
      where: { id: sessionId },
      data: { status: 'LIVE', startedAt: new Date() },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true, role: true } },
        club: { select: { id: true, name: true, logoUrl: true, primaryColor: true } },
      },
    });

    return LiveService.formatSession(updated, 0);
  }

  // ── Terminer un live (LIVE → ENDED) ──────────────────────────────────────
  static async endSession(sessionId: string, hostId: string, playbackUrl?: string) {
    const session = await prisma.liveSession.findUnique({ where: { id: sessionId } });
    if (!session) throw Object.assign(new Error('Live introuvable.'), { statusCode: 404 });
    if (session.hostId !== hostId) throw Object.assign(new Error('Accès refusé.'), { statusCode: 403 });

    const updated = await prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
        playbackUrl: playbackUrl || null,
      },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true, role: true } },
        club: { select: { id: true, name: true, logoUrl: true, primaryColor: true } },
      },
    });

    return LiveService.formatSession(updated, 0);
  }

  // ── Mettre à jour l'URL HLS (quand le stream démarre côté serveur) ─────
  static async setHlsUrl(sessionId: string, hlsUrl: string) {
    return prisma.liveSession.update({
      where: { id: sessionId },
      data: { hlsUrl },
    });
  }

  // ── Mise à jour du pic de viewers ────────────────────────────────────────
  static async updatePeakViewers(sessionId: string, currentViewers: number) {
    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      select: { peakViewers: true, totalViews: true },
    });
    if (!session) return;

    const updates: any = { totalViews: { increment: 1 } };
    if (currentViewers > session.peakViewers) {
      updates.peakViewers = currentViewers;
    }

    await prisma.liveSession.update({ where: { id: sessionId }, data: updates });
  }

  // ── Lister les lives ──────────────────────────────────────────────────────
  static async listSessions(filters: {
    status?: string;
    clubId?: string;
    hostId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.clubId) where.clubId = filters.clubId;
    if (filters.hostId) where.hostId = filters.hostId;

    const sessions = await prisma.liveSession.findMany({
      where,
      include: {
        host: { select: { id: true, name: true, avatarUrl: true, role: true } },
        club: { select: { id: true, name: true, logoUrl: true, primaryColor: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [
        { status: 'asc' }, // LIVE d'abord
        { startedAt: 'desc' },
        { scheduledAt: 'asc' },
      ],
      take: filters.limit || 20,
      skip: filters.offset || 0,
    });

    // On trie pour avoir LIVE en premier, puis SCHEDULED, puis ENDED
    const ordered = [
      ...sessions.filter((s) => s.status === 'LIVE'),
      ...sessions.filter((s) => s.status === 'SCHEDULED'),
      ...sessions.filter((s) => s.status === 'ENDED'),
    ];

    return ordered.map((s) => LiveService.formatSession(s, (s as any)._count?.comments ?? 0));
  }

  // ── Récupérer un live par ID ──────────────────────────────────────────────
  static async getSession(sessionId: string) {
    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true, role: true } },
        club: { select: { id: true, name: true, logoUrl: true, primaryColor: true } },
        _count: { select: { comments: true } },
      },
    });
    if (!session) throw Object.assign(new Error('Live introuvable.'), { statusCode: 404 });
    return LiveService.formatSession(session, (session as any)._count?.comments ?? 0);
  }

  // ── Récupérer par streamKey (authentification streamer) ──────────────────
  static async getSessionByStreamKey(streamKey: string) {
    return prisma.liveSession.findUnique({
      where: { streamKey },
      include: {
        host: { select: { id: true, name: true } },
      },
    });
  }

  // ── Ajouter un message au chat (persisté) ────────────────────────────────
  static async addComment(sessionId: string, authorId: string, text: string) {
    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      select: { status: true, isChatEnabled: true },
    });
    if (!session) throw Object.assign(new Error('Live introuvable.'), { statusCode: 404 });
    if (!session.isChatEnabled) throw Object.assign(new Error('Le chat est désactivé.'), { statusCode: 403 });
    if (session.status === 'ENDED') throw Object.assign(new Error('Le live est terminé.'), { statusCode: 409 });

    const comment = await prisma.liveComment.create({
      data: { sessionId, authorId, text: text.trim() },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });

    return {
      id: comment.id,
      sessionId: comment.sessionId,
      text: comment.text,
      authorId: comment.author.id,
      authorName: comment.author.name,
      authorAvatar: comment.author.avatarUrl
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}&background=FF2A3B&color=fff`,
      authorRole: comment.author.role,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  // ── Charger les derniers messages du chat ─────────────────────────────────
  static async getComments(sessionId: string, limit = 50, before?: string) {
    const where: any = { sessionId };
    if (before) where.createdAt = { lt: new Date(before) };

    const comments = await prisma.liveComment.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return comments.reverse().map((c) => ({
      id: c.id,
      sessionId: c.sessionId,
      text: c.text,
      authorId: c.author.id,
      authorName: c.author.name,
      authorAvatar: c.author.avatarUrl
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author.name)}&background=FF2A3B&color=fff`,
      authorRole: c.author.role,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  // ── Formateur interne ─────────────────────────────────────────────────────
  private static formatSession(s: any, commentsCount: number) {
    return {
      id: s.id,
      title: s.title,
      description: s.description,
      category: s.category,
      thumbnailUrl: s.thumbnailUrl,
      status: s.status,
      startedAt: s.startedAt?.toISOString() || null,
      endedAt: s.endedAt?.toISOString() || null,
      scheduledAt: s.scheduledAt?.toISOString() || null,
      peakViewers: s.peakViewers,
      totalViews: s.totalViews,
      hlsUrl: s.hlsUrl,
      playbackUrl: s.playbackUrl,
      streamKey: s.streamKey,
      isRecorded: s.isRecorded,
      isChatEnabled: s.isChatEnabled,
      visibility: s.visibility,
      createdAt: s.createdAt.toISOString(),

      // Host
      hostId: s.host.id,
      hostName: s.host.name,
      hostAvatar: s.host.avatarUrl
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.host.name)}&background=FF2A3B&color=fff`,
      hostRole: s.host.role,

      // Club (optionnel)
      clubId: s.club?.id || null,
      clubName: s.club?.name || null,
      clubLogo: s.club?.logoUrl || null,
      clubPrimaryColor: s.club?.primaryColor || null,

      commentsCount,
    };
  }
}
