import type { Request, Response } from 'express';
import { prisma } from '../config/database';
import { pushNotificationToUser } from '../services/socketServer.service';

export class UserController {
    /**
     * GET /api/users/search?q=terme&limit=15
     */
    static async search(req: Request, res: Response) {
        try {
            const currentUserId = (req as any).user?.id || (req as any).userId;
            const q = String(req.query.q || '').trim();
            const limit = Math.min(Number(req.query.limit) || 15, 50);

            if (q.length < 2) return res.json([]);

            const users = await prisma.user.findMany({
                where: {
                    isSuspended: false,
                    ...(currentUserId ? { NOT: { id: currentUserId } } : {}),
                    OR: [
                        { name: { contains: q } },
                        { city: { contains: q } },
                        { country: { contains: q } },
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
            });

            res.json(users);
        } catch (err: any) {
            console.error('[UserController.search]', err?.message);
            res.status(500).json({ error: 'Erreur lors de la recherche' });
        }
    }

    /**
     * GET /api/users/:id
     * Profil public complet d'un utilisateur.
     */
    static async getPublicProfile(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const currentUserId = (req as any).user?.id || (req as any).userId;

            const user = await prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    role: true,
                    bio: true,
                    city: true,
                    country: true,
                    createdAt: true,
                    isSuspended: true,
                    player: {
                        select: {
                            id: true,
                            jerseyNumber: true,
                            position: true,
                            heightCm: true,
                            weightKg: true,
                            age: true,
                            category: true,
                            experienceYears: true,
                            photoUrl: true,
                            ppg: true,
                            rpg: true,
                            apg: true,
                            spg: true,
                            bpg: true,
                            efficiency: true,
                            fgPct: true,
                            threePtPct: true,
                            ftPct: true,
                            achievementsJson: true,
                        },
                    },
                    clubMemberships: {
                        select: {
                            role: true,
                            joinedAt: true,
                            club: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    logoUrl: true,
                                    city: true,
                                    primaryColor: true,
                                },
                            },
                        },
                        take: 3,
                    },
                    _count: {
                        select: {
                            posts: true,
                            following: true,
                            followers: true,
                        },
                    },
                },
            });

            if (!user || user.isSuspended) {
                return res.status(404).json({ error: 'Utilisateur introuvable' });
            }

            // Vérifie si l'user courant suit cet utilisateur
            let isFollowing = false;
            if (currentUserId && currentUserId !== id) {
                const follow = await prisma.follow.findUnique({
                    where: {
                        followerId_followedId: {
                            followerId: currentUserId,
                            followedId: id,
                        },
                    },
                });
                isFollowing = Boolean(follow);
            }

            // Désérialise les achievements JSON
            let achievements: string[] = [];
            try {
                const raw = user.player?.achievementsJson || '[]';
                achievements = JSON.parse(raw);
            } catch {
                achievements = [];
            }

            res.json({
                id: user.id,
                name: user.name,
                avatarUrl: user.avatarUrl,
                role: user.role,
                bio: user.bio,
                city: user.city,
                country: user.country,
                createdAt: user.createdAt.toISOString(),
                isMe: currentUserId === id,
                isFollowing,
                player: user.player
                    ? {
                        jerseyNumber: user.player.jerseyNumber,
                        position: user.player.position,
                        heightCm: user.player.heightCm,
                        weightKg: user.player.weightKg,
                        age: user.player.age,
                        category: user.player.category,
                        experienceYears: user.player.experienceYears,
                        photoUrl: user.player.photoUrl,
                        stats: {
                            ppg: user.player.ppg,
                            rpg: user.player.rpg,
                            apg: user.player.apg,
                            spg: user.player.spg,
                            bpg: user.player.bpg,
                            efficiency: user.player.efficiency,
                            fgPct: user.player.fgPct,
                            threePtPct: user.player.threePtPct,
                            ftPct: user.player.ftPct,
                        },
                        achievements,
                    }
                    : null,
                clubs: user.clubMemberships.map((m) => ({
                    role: m.role,
                    joinedAt: m.joinedAt.toISOString(),
                    club: m.club,
                })),
                counts: {
                    posts: user._count.posts,
                    following: user._count.following,
                    followers: user._count.followers,
                },
            });
        } catch (err: any) {
            console.error('[UserController.getPublicProfile]', err?.message);
            res.status(500).json({ error: 'Erreur lors du chargement du profil' });
        }
    }

    /**
     * GET /api/users/:id/follow-stats
     * Compteurs followers/following + état de suivi.
     */
    static async getFollowStats(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const currentUserId = (req as any).user?.id || (req as any).userId;

            const [followersCount, followingCount, isFollowing] = await Promise.all([
                prisma.follow.count({ where: { followedId: id } }),
                prisma.follow.count({ where: { followerId: id } }),
                currentUserId && currentUserId !== id
                    ? prisma.follow
                        .findUnique({
                            where: {
                                followerId_followedId: {
                                    followerId: currentUserId,
                                    followedId: id,
                                },
                            },
                        })
                        .then(Boolean)
                    : Promise.resolve(false),
            ]);

            res.json({
                followers: followersCount,
                following: followingCount,
                isFollowing,
            });
        } catch (err: any) {
            console.error('[UserController.getFollowStats]', err?.message);
            res.status(500).json({ error: 'Erreur lors du chargement' });
        }
    }

    /**
     * POST /api/users/:id/follow
     * Toggle follow/unfollow + notification.
     */
    static async toggleFollow(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const currentUserId = (req as any).user?.id || (req as any).userId;

            if (!currentUserId) {
                return res.status(401).json({ error: 'Non authentifié' });
            }

            if (currentUserId === id) {
                return res.status(400).json({ error: 'Impossible de se suivre soi-même' });
            }

            // Vérifie que l'utilisateur cible existe
            const target = await prisma.user.findUnique({
                where: { id },
                select: { id: true, name: true },
            });
            if (!target) {
                return res.status(404).json({ error: 'Utilisateur introuvable' });
            }

            const existing = await prisma.follow.findUnique({
                where: {
                    followerId_followedId: {
                        followerId: currentUserId,
                        followedId: id,
                    },
                },
            });

            if (existing) {
                await prisma.follow.delete({
                    where: {
                        followerId_followedId: {
                            followerId: currentUserId,
                            followedId: id,
                        },
                    },
                });
                return res.json({ following: false });
            }

            await prisma.follow.create({
                data: {
                    followerId: currentUserId,
                    followedId: id,
                },
            });

            // ✅ Notification au user suivi
            try {
                const follower = await prisma.user.findUnique({
                    where: { id: currentUserId },
                    select: { name: true, avatarUrl: true },
                });

                const notif = await prisma.notification.create({
                    data: {
                        userId: id,
                        type: 'FOLLOW',
                        title: 'Nouvel abonné',
                        text: `${follower?.name || 'Quelqu\'un'} a commencé à vous suivre.`,
                    },
                });

                // ✅ Push temps réel
                pushNotificationToUser(id, {
                    id: notif.id,
                    type: notif.type,
                    title: notif.title,
                    text: notif.text,
                    read: notif.read,
                    createdAt: notif.createdAt.toISOString(),
                    meta: {
                        senderId: currentUserId,
                        senderName: follower?.name || 'Utilisateur',
                    },
                });
            } catch (err) {
                console.warn('[UserController.toggleFollow] notification error', err);
            }

            return res.json({ following: true });

        } catch (err: any) {
            console.error('[UserController.toggleFollow]', err?.message);
            res.status(500).json({ error: 'Erreur lors du suivi' });
        }
    }

    /**
     * GET /api/users/:id/badges
     * Badges attribués à un utilisateur.
     */
    static async getUserBadges(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const player = await prisma.playerProfile.findUnique({
                where: { userId: id },
                select: { id: true },
            });

            if (!player) {
                return res.json([]);
            }

            const badges = await prisma.playerBadge.findMany({
                where: { playerProfileId: player.id },
                orderBy: { awardedAt: 'desc' },
                include: {
                    badge: {
                        select: {
                            code: true,
                            name: true,
                            description: true,
                            icon: true,
                            color: true,
                        },
                    },
                },
            });

            res.json(
                badges.map((b) => ({
                    id: b.id,
                    code: b.badge.code,
                    name: b.badge.name,
                    description: b.badge.description,
                    icon: b.badge.icon,
                    color: b.badge.color,
                    awardedAt: b.awardedAt.toISOString(),
                    note: b.note,
                }))
            );
        } catch (err: any) {
            console.error('[UserController.getUserBadges]', err?.message);
            res.status(500).json({ error: 'Erreur lors du chargement des badges' });
        }
    }
}