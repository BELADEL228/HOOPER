import type { Request, Response } from 'express';
import { prisma } from '../config/database';

/**
 * GET /api/search?q=terme&limit=5
 * Recherche globale unifiée : users, clubs, posts, players
 */
export class SearchController {
  static async globalSearch(req: Request, res: Response) {
    try {
      const q = String(req.query.q || '').trim();
      const limit = Math.min(Number(req.query.limit) || 5, 20);

      if (q.length < 2) {
        return res.json({ users: [], clubs: [], posts: [], players: [] });
      }

      // ─── Requêtes parallèles ──────────────────────────────────────────
      const [users, clubs, posts, players] = await Promise.all([
        // Utilisateurs
        prisma.user.findMany({
          where: {
            isSuspended: false,
            OR: [
              { name: { contains: q } },
              { city: { contains: q } },
            ],
          },
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            city: true,
            country: true,
          },
          take: limit,
          orderBy: { name: 'asc' },
        }),

        // Clubs
        prisma.club.findMany({
          where: {
            OR: [
              { name: { contains: q } },
              { city: { contains: q } },
              { description: { contains: q } },
              { shortName: { contains: q } },
            ],
          },
          select: {
            id: true,
            name: true,
            slug: true,
            shortName: true,
            logoUrl: true,
            city: true,
            country: true,
            primaryColor: true,
            isVerified: true,
            _count: { select: { members: true, followers: true } },
          },
          take: limit,
          orderBy: { name: 'asc' },
        }),

        // Posts
        prisma.post.findMany({
          where: {
            content: { contains: q },
          },
          select: {
            id: true,
            content: true,
            mediaUrl: true,
            createdAt: true,
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),

        // Joueurs (PlayerProfile → User)
        // Note: PlayerProfile has no direct `team` relation in schema.
        // We resolve teamName via User.teamMemberships.
        prisma.playerProfile.findMany({
          where: {
            user: {
              isSuspended: false,
              name: { contains: q },
            },
          },
          include: {
            user: {
              include: {
                teamMemberships: {
                  include: { team: true },
                  take: 1,
                },
              },
            },
          },
          take: limit,
        }),
      ]);

      return res.json({
        users,
        clubs: clubs.map((c) => ({
          ...c,
          membersCount: c._count.members,
          followersCount: c._count.followers,
          _count: undefined,
        })),
        posts: posts.map((p) => ({
          id: p.id,
          content: p.content.length > 120 ? `${p.content.slice(0, 120)}…` : p.content,
          mediaUrl: p.mediaUrl,
          createdAt: p.createdAt.toISOString(),
          authorId: p.author.id,
          authorName: p.author.name,
          authorAvatar: p.author.avatarUrl,
        })),
        players: players.map((pl) => ({
          id: pl.id,
          userId: pl.user.id,
          name: pl.user.name,
          avatarUrl: pl.user.avatarUrl,
          position: pl.position,
          jerseyNumber: pl.jerseyNumber,
          teamName: pl.user.teamMemberships[0]?.team?.name ?? null,
          stats: { ppg: pl.ppg, rpg: pl.rpg, apg: pl.apg },
        })),
      });
    } catch (err: any) {
      console.error('[SearchController.globalSearch]', err?.message);
      return res.status(500).json({ error: 'Erreur lors de la recherche.' });
    }
  }
}
