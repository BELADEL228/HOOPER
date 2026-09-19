import { prisma } from '../config/database';
import { STATUS_CONFIG, StatusReactionType, StatusVisibility } from '../config/status.config';
import { CreateStatusInput } from '../validators/status.validator';
import { ClubService } from './club.service';
import { pushNotificationToUser } from './socketServer.service';

export class StatusServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'StatusServiceError';
    this.statusCode = statusCode;
  }
}

export class StatusService {
  /**
   * Crée un nouveau Status pour un utilisateur OU un club.
   */
  static async createStatus(
    authorUserId: string,
    userRole: string,
    input: CreateStatusInput
  ) {
    const isClub = Boolean(input.clubId);

    // Règle 1: User ≠ Club & Permissions
    if (isClub) {
      const clubId = input.clubId!;
      const club = await prisma.club.findUnique({ where: { id: clubId } });
      if (!club) {
        throw new StatusServiceError('Club cible introuvable.', 404);
      }

      // Vérifier les droits du membre pour publier au nom du club
      const canManage = await ClubService.isClubManager(clubId, authorUserId, userRole);
      if (!canManage) {
        throw new StatusServiceError(
          'Vous n’avez pas les droits nécessaires pour publier au nom de ce club. Rôles requis : Président ou Administrateur du club.',
          403
        );
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + STATUS_CONFIG.LIFETIME_MS);

    // Transaction Prisma pour garantir l'atomicité
    const createdStatus = await prisma.$transaction(async (tx) => {
      const status = await tx.status.create({
        data: {
          userId: isClub ? null : authorUserId,
          clubId: isClub ? input.clubId : null,
          text: input.text || null,
          visibility: input.visibility || 'PUBLIC',
          createdAt: now,
          expiresAt,
        },
      });

      // Création des médias ordonnés
      if (input.media && input.media.length > 0) {
        await tx.statusMedia.createMany({
          data: input.media.map((m, idx) => ({
            statusId: status.id,
            type: m.type,
            url: m.url,
            width: m.width,
            height: m.height,
            size: m.size,
            duration: m.duration,
            mimeType: m.mimeType,
            position: m.position !== undefined ? m.position : idx,
            createdAt: now,
          })),
        });
      }

      // Création des mentions
      if (input.mentions && input.mentions.length > 0) {
        for (const mention of input.mentions) {
          await tx.statusMention.create({
            data: {
              statusId: status.id,
              userId: mention.userId || null,
              clubId: mention.clubId || null,
              createdAt: now,
            },
          });

          // Notification si mention d'un utilisateur
          if (mention.userId && mention.userId !== authorUserId) {
            await tx.notification.create({
              data: {
                userId: mention.userId,
                type: 'STATUS_MENTION',
                title: 'Mention dans un Status',
                text: isClub
                  ? `Le club a mentionné votre profil dans sa story.`
                  : `Un utilisateur vous a mentionné dans sa story.`,
              },
            });
          }
        }
      }

      // Création de l'audience personnalisée (CUSTOM)
      if (input.visibility === 'CUSTOM' && input.audienceUserIds && input.audienceUserIds.length > 0) {
        await tx.statusAudience.createMany({
          data: input.audienceUserIds.map((targetUserId) => ({
            statusId: status.id,
            userId: targetUserId,
            createdAt: now,
          })),
        });
      }

      return status;
    });

    return this.getStatus(createdStatus.id, authorUserId, userRole);
  }

  /**
   * Vérifie si un utilisateur donné est autorisé à consulter un status selon sa confidentialité.
   */
  static async canUserViewStatus(
    status: {
      id: string;
      userId: string | null;
      clubId: string | null;
      visibility: string;
      expiresAt: Date;
      audiences?: Array<{ userId: string }>;
    },
    currentUserId: string,
    userRole?: string
  ): Promise<boolean> {
    // 1. Expiration : jamais visible si expiré
    if (new Date(status.expiresAt) <= new Date()) {
      return false;
    }

    // 2. Super admin a toujours accès
    if (userRole === 'SUPER_ADMIN') {
      return true;
    }

    // 3. Propriétaire du Status
    if (status.userId && status.userId === currentUserId) {
      return true;
    }

    // Si status de club, les managers du club ont toujours accès
    if (status.clubId) {
      const isManager = await ClubService.isClubManager(status.clubId, currentUserId, userRole || 'VISITOR');
      if (isManager) return true;
    }

    // 4. Règles selon la visibilité
    switch (status.visibility) {
      case 'PUBLIC':
        return true;

      case 'PRIVATE':
        // Déjà vérifié ci-dessus : seul le propriétaire/manager y accède
        return false;

      case 'FOLLOWERS': {
        if (status.userId) {
          // L'utilisateur connecté doit suivre l'auteur
          const follow = await prisma.follow.findUnique({
            where: {
              followerId_followedId: {
                followerId: currentUserId,
                followedId: status.userId,
              },
            },
          });
          return Boolean(follow);
        }
        if (status.clubId) {
          // Pour un club, les membres du club ont accès aux followers stories
          const member = await prisma.clubMember.findUnique({
            where: {
              clubId_userId: {
                clubId: status.clubId,
                userId: currentUserId,
              },
            },
          });
          return Boolean(member);
        }
        return false;
      }

      case 'FRIENDS': {
        if (status.userId) {
          // Amis = Abonnements mutuels réciproques (A suit B ET B suit A)
          const [followsAuthor, authorFollowsUser] = await Promise.all([
            prisma.follow.findUnique({
              where: {
                followerId_followedId: {
                  followerId: currentUserId,
                  followedId: status.userId,
                },
              },
            }),
            prisma.follow.findUnique({
              where: {
                followerId_followedId: {
                  followerId: status.userId,
                  followedId: currentUserId,
                },
              },
            }),
          ]);
          return Boolean(followsAuthor && authorFollowsUser);
        }
        if (status.clubId) {
          // Pour un club, membres confirmés
          const member = await prisma.clubMember.findUnique({
            where: {
              clubId_userId: {
                clubId: status.clubId,
                userId: currentUserId,
              },
            },
          });
          return Boolean(member);
        }
        return false;
      }

      case 'CUSTOM': {
        // Vérifier si l'utilisateur fait partie de l'audience
        const audienceEntry = await prisma.statusAudience.findUnique({
          where: {
            statusId_userId: {
              statusId: status.id,
              userId: currentUserId,
            },
          },
        });
        return Boolean(audienceEntry);
      }

      default:
        return false;
    }
  }

  /**
   * Récupère le Feed complet des Stories actives (non expirées et autorisées)
   * Regroupées par Auteur (User ou Club) avec indicateur hasUnseenStatus.
   */
  static async getFeed(currentUserId: string, userRole?: string) {
    const now = new Date();

    // Récupération de tous les status non expirés
    const activeStatuses = await prisma.status.findMany({
      where: {
        expiresAt: {
          gt: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
          },
        },
        media: {
          orderBy: { position: 'asc' },
        },
        reactions: {
          select: {
            id: true,
            userId: true,
            type: true,
            createdAt: true,
          },
        },
        views: {
          select: {
            userId: true,
            viewedAt: true,
          },
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        mentions: {
          include: {
            user: { select: { id: true, name: true } },
            club: { select: { id: true, name: true } },
          },
        },
        audiences: {
          select: { userId: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Filtrer selon la confidentialité
    const authorizedStatuses: typeof activeStatuses = [];
    for (const status of activeStatuses) {
      const canView = await this.canUserViewStatus(status, currentUserId, userRole);
      if (canView) {
        authorizedStatuses.push(status);
      }
    }

    // Regrouper par auteur (User ou Club)
    const authorGroupsMap = new Map<string, {
      author: {
        id: string;
        name: string;
        avatarUrl: string | null;
        type: 'USER' | 'CLUB';
        slug?: string | null;
        primaryColor?: string | null;
      };
      hasUnseenStatus: boolean;
      statuses: any[];
    }>();

    for (const status of authorizedStatuses) {
      const isClub = Boolean(status.clubId && status.club);
      const authorKey = isClub ? `club_${status.clubId}` : `user_${status.userId}`;

      if (!authorGroupsMap.has(authorKey)) {
        authorGroupsMap.set(authorKey, {
          author: isClub
            ? {
              id: status.club!.id,
              name: status.club!.name,
              avatarUrl: status.club!.logoUrl,
              type: 'CLUB',
              slug: status.club!.slug,
              primaryColor: status.club!.primaryColor,
            }
            : {
              id: status.user!.id,
              name: status.user!.name,
              avatarUrl: status.user!.avatarUrl,
              type: 'USER',
            },
          hasUnseenStatus: false,
          statuses: [],
        });
      }

      const group = authorGroupsMap.get(authorKey)!;
      const isViewedByCurrentUser = status.views.some((v) => v.userId === currentUserId);
      const isOwner = isClub
        ? await ClubService.isClubManager(status.clubId!, currentUserId, userRole || 'VISITOR')
        : status.userId === currentUserId;

      if (!isViewedByCurrentUser && !isOwner) {
        group.hasUnseenStatus = true;
      }

      group.statuses.push({
        id: status.id,
        text: status.text,
        visibility: status.visibility,
        createdAt: status.createdAt,
        expiresAt: status.expiresAt,
        media: status.media,
        reactionsCount: status.reactions.length,
        reactions: status.reactions,
        userReaction: status.reactions.find((r) => r.userId === currentUserId)?.type || null,
        repliesCount: status.replies.length,
        viewsCount: status.views.length,
        isViewed: isViewedByCurrentUser,
        mentions: status.mentions,
      });
    }

    // Placer en tête de liste les stories avec des status non vus, puis l'utilisateur lui-même
    const groups = Array.from(authorGroupsMap.values()).sort((a, b) => {
      // Si l'utilisateur connecté est dans le groupe
      if (a.author.id === currentUserId) return -1;
      if (b.author.id === currentUserId) return 1;

      // Sinon privilégier les stories non vues
      if (a.hasUnseenStatus && !b.hasUnseenStatus) return -1;
      if (!a.hasUnseenStatus && b.hasUnseenStatus) return 1;
      return 0;
    });

    return groups;
  }

  /**
   * Récupère un Status individuel par ID avec vérification des autorisations.
   */
  static async getStatus(statusId: string, currentUserId: string, userRole?: string) {
    const status = await prisma.status.findUnique({
      where: { id: statusId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
          },
        },
        media: {
          orderBy: { position: 'asc' },
        },
        reactions: true,
        views: {
          select: {
            userId: true,
            viewedAt: true,
          },
        },
        replies: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        mentions: {
          include: {
            user: { select: { id: true, name: true } },
            club: { select: { id: true, name: true } },
          },
        },
        audiences: {
          select: { userId: true },
        },
      },
    });

    if (!status) {
      throw new StatusServiceError('Status introuvable.', 404);
    }

    const canView = await this.canUserViewStatus(status, currentUserId, userRole);
    if (!canView) {
      throw new StatusServiceError('Accès non autorisé à ce Status.', 403);
    }

    const isOwner = status.userId === currentUserId || (
      Boolean(status.clubId) && await ClubService.isClubManager(status.clubId!, currentUserId, userRole || 'VISITOR')
    );

    return {
      id: status.id,
      userId: status.userId,
      clubId: status.clubId,
      text: status.text,
      visibility: status.visibility,
      createdAt: status.createdAt,
      expiresAt: status.expiresAt,
      author: status.clubId
        ? {
          id: status.club!.id,
          name: status.club!.name,
          avatarUrl: status.club!.logoUrl,
          type: 'CLUB' as const,
          slug: status.club!.slug,
          primaryColor: status.club!.primaryColor,
        }
        : {
          id: status.user!.id,
          name: status.user!.name,
          avatarUrl: status.user!.avatarUrl,
          type: 'USER' as const,
        },
      media: status.media,
      reactionsCount: status.reactions.length,
      reactions: status.reactions,
      userReaction: status.reactions.find((r) => r.userId === currentUserId)?.type || null,
      replies: status.replies,
      viewsCount: status.views.length,
      isViewed: status.views.some((v) => v.userId === currentUserId),
      isOwner,
      mentions: status.mentions,
    };
  }

  /**
   * Supprime un Status. Seul le propriétaire (User) ou un gestionnaire (Club) ou SUPER_ADMIN peut supprimer.
   */
  static async deleteStatus(statusId: string, currentUserId: string, userRole: string) {
    const status = await prisma.status.findUnique({
      where: { id: statusId },
      include: {
        media: { select: { url: true } },
      },
    });

    if (!status) {
      throw new StatusServiceError('Status introuvable.', 404);
    }

    // Contrôle d'autorisation
    let canDelete = false;
    if (userRole === 'SUPER_ADMIN') {
      canDelete = true;
    } else if (status.userId && status.userId === currentUserId) {
      canDelete = true;
    } else if (status.clubId) {
      canDelete = await ClubService.isClubManager(status.clubId, currentUserId, userRole);
    }

    if (!canDelete) {
      throw new StatusServiceError('Vous n’avez pas le droit de supprimer ce Status.', 403);
    }

    // Suppression en cascade dans Prisma
    await prisma.status.delete({
      where: { id: statusId },
    });

    return { success: true, message: 'Status supprimé avec succès.' };
  }

  /**
   * Enregistre la vue d'un Status par un utilisateur.
   * Contrainte unique statusId_userId : ne compte jamais plusieurs fois la même personne.
   */
  static async markAsViewed(statusId: string, currentUserId: string, userRole?: string) {
    const status = await prisma.status.findUnique({
      where: { id: statusId },
      select: {
        id: true,
        userId: true,
        clubId: true,
        visibility: true,
        expiresAt: true,
      },
    });

    if (!status) {
      throw new StatusServiceError('Status introuvable.', 404);
    }

    const canView = await this.canUserViewStatus(status, currentUserId, userRole);
    if (!canView) {
      throw new StatusServiceError('Accès refusé.', 403);
    }

    // Enregistrement unique (upsert idempotent)
    const view = await prisma.statusView.upsert({
      where: {
        statusId_userId: {
          statusId,
          userId: currentUserId,
        },
      },
      create: {
        statusId,
        userId: currentUserId,
        viewedAt: new Date(),
      },
      update: {
        viewedAt: new Date(),
      },
    });

    return { success: true, view };
  }

  /**
   * Récupère la liste des spectateurs d'un Status.
   * Accessible UNIQUEMENT au créateur du Status (User ou manager du Club) ou SUPER_ADMIN.
   */
  static async getViewers(statusId: string, currentUserId: string, userRole: string) {
    const status = await prisma.status.findUnique({
      where: { id: statusId },
      select: {
        id: true,
        userId: true,
        clubId: true,
      },
    });

    if (!status) {
      throw new StatusServiceError('Status introuvable.', 404);
    }

    let isOwner = false;
    if (userRole === 'SUPER_ADMIN') {
      isOwner = true;
    } else if (status.userId && status.userId === currentUserId) {
      isOwner = true;
    } else if (status.clubId) {
      isOwner = await ClubService.isClubManager(status.clubId, currentUserId, userRole);
    }

    if (!isOwner) {
      throw new StatusServiceError('Accès refusé : vous n’êtes pas autorisé à consulter les spectateurs de ce Status.', 403);
    }

    const views = await prisma.statusView.findMany({
      where: { statusId },
      orderBy: { viewedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    return {
      statusId,
      totalViews: views.length,
      viewers: views.map((v) => ({
        user: v.user,
        viewedAt: v.viewedAt,
      })),
    };
  }

  /**
   * Ajoute ou met à jour une réaction sur un Status.
   * Un utilisateur ne peut avoir qu'une seule réaction active par status (@@unique([statusId, userId])).
   */
  static async addReaction(
    statusId: string,
    currentUserId: string,
    type: StatusReactionType,
    userRole?: string
  ) {
    const status = await prisma.status.findUnique({
      where: { id: statusId },
      select: {
        id: true,
        userId: true,
        clubId: true,
        visibility: true,
        expiresAt: true,
      },
    });

    if (!status) {
      throw new StatusServiceError('Status introuvable.', 404);
    }

    const canView = await this.canUserViewStatus(status, currentUserId, userRole);
    if (!canView) {
      throw new StatusServiceError('Accès refusé.', 403);
    }

    // Upsert pour modifier sans créer de doublon
    const reaction = await prisma.statusReaction.upsert({
      where: {
        statusId_userId: {
          statusId,
          userId: currentUserId,
        },
      },
      create: {
        statusId,
        userId: currentUserId,
        type,
        createdAt: new Date(),
      },
      update: {
        type,
        createdAt: new Date(),
      },
    });

    // Notification à l'auteur si ce n'est pas lui-même
    if (status.userId && status.userId !== currentUserId) {
      try {
        const actor = await prisma.user.findUnique({
          where: { id: currentUserId },
          select: { name: true, avatarUrl: true },
        });

        const emojiMap: Record<string, string> = {
          LIKE: '👍',
          LOVE: '❤️',
          FIRE: '🔥',
          CLAP: '👏',
          HAHA: '😂',
          WOW: '😮',
          SAD: '😢',
          ANGRY: '😡',
        };
        const emoji = emojiMap[type] || '🔥';
        const actorName = actor?.name || 'Un utilisateur';

        const notif = await prisma.notification.create({
          data: {
            userId: status.userId,
            type: 'STATUS_REACTION',
            title: 'Réaction à votre story',
            text: `${actorName} a réagi avec ${emoji} à votre story.`,
          },
        });

        pushNotificationToUser(status.userId, {
          id: notif.id,
          type: notif.type,
          title: notif.title,
          text: notif.text,
          read: notif.read,
          createdAt: notif.createdAt.toISOString(),
          meta: { statusId, actorAvatar: actor?.avatarUrl, emoji },
        });
      } catch (notifErr) {
        console.warn('[StatusService] Erreur notification réaction:', notifErr);
      }
    }

    return reaction;
  }

  /**
   * Supprime la réaction d'un utilisateur sur un status.
   */
  static async removeReaction(statusId: string, currentUserId: string) {
    const existing = await prisma.statusReaction.findUnique({
      where: {
        statusId_userId: {
          statusId,
          userId: currentUserId,
        },
      },
    });

    if (!existing) {
      return { removed: false, message: 'Aucune réaction active.' };
    }

    await prisma.statusReaction.delete({
      where: {
        statusId_userId: {
          statusId,
          userId: currentUserId,
        },
      },
    });

    return { removed: true, message: 'Réaction retirée.' };
  }

  /**
   * Répond à un Status.
   */
  static async replyToStatus(
    statusId: string,
    currentUserId: string,
    content: string,
    userRole?: string
  ) {
    const status = await prisma.status.findUnique({
      where: { id: statusId },
      select: {
        id: true,
        userId: true,
        clubId: true,
        visibility: true,
        expiresAt: true,
      },
    });

    if (!status) {
      throw new StatusServiceError('Status introuvable.', 404);
    }

    const canView = await this.canUserViewStatus(status, currentUserId, userRole);
    if (!canView) {
      throw new StatusServiceError('Accès refusé.', 403);
    }

    const reply = await prisma.statusReply.create({
      data: {
        statusId,
        userId: currentUserId,
        content,
        createdAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Notification à l'auteur
    if (status.userId && status.userId !== currentUserId) {
      try {
        const notif = await prisma.notification.create({
          data: {
            userId: status.userId,
            type: 'STATUS_REPLY',
            title: 'Réponse à votre story',
            text: `${reply.user.name} a répondu à votre story : « ${content.slice(0, 60)} »`,
          },
        });

        pushNotificationToUser(status.userId, {
          id: notif.id,
          type: notif.type,
          title: notif.title,
          text: notif.text,
          read: notif.read,
          createdAt: notif.createdAt.toISOString(),
          meta: { statusId, replyId: reply.id, actorAvatar: reply.user.avatarUrl },
        });
      } catch (notifErr) {
        console.warn('[StatusService] Erreur notification réponse:', notifErr);
      }
    }

    return reply;
  }

  /**
   * Supprime une réponse de status.
   * Autorisé : auteur de la réponse, propriétaire du status, ou SUPER_ADMIN.
   */
  static async deleteReply(
    statusId: string,
    replyId: string,
    currentUserId: string,
    userRole: string
  ) {
    const reply = await prisma.statusReply.findUnique({
      where: { id: replyId },
      include: {
        status: {
          select: {
            userId: true,
            clubId: true,
          },
        },
      },
    });

    if (!reply || reply.statusId !== statusId) {
      throw new StatusServiceError('Réponse introuvable.', 404);
    }

    let canDelete = false;
    if (userRole === 'SUPER_ADMIN') {
      canDelete = true;
    } else if (reply.userId === currentUserId) {
      canDelete = true;
    } else if (reply.status.userId && reply.status.userId === currentUserId) {
      canDelete = true;
    } else if (reply.status.clubId) {
      canDelete = await ClubService.isClubManager(reply.status.clubId, currentUserId, userRole);
    }

    if (!canDelete) {
      throw new StatusServiceError('Vous n’avez pas le droit de supprimer cette réponse.', 403);
    }

    await prisma.statusReply.delete({
      where: { id: replyId },
    });

    return { success: true, message: 'Réponse supprimée.' };
  }

  /**
 * Récupère les insights complets d'un status (auteur uniquement).
 * Renvoie : vues, réactions groupées, réponses.
 */
  static async getInsights(
    statusId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    // 1. Charge le status avec son propriétaire
    const status = await prisma.status.findUnique({
      where: { id: statusId },
      select: {
        id: true,
        userId: true,
        clubId: true,
        text: true,
        visibility: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    if (!status) {
      throw new StatusServiceError('Status introuvable.', 404);
    }

    // 2. Vérifie la propriété
    const isSuperAdmin = requesterRole === 'SUPER_ADMIN';
    const isOwner = status.userId === requesterId;

    // Si c'est un status de club, vérifier que l'user gère ce club
    let isClubOwner = false;
    if (status.clubId && !isOwner) {
      const membership = await prisma.clubMember.findFirst({
        where: {
          clubId: status.clubId,
          userId: requesterId,
          role: { in: ['PRESIDENT', 'CLUB_ADMIN', 'COACH'] },
        },
      });
      isClubOwner = Boolean(membership);
    }

    if (!isOwner && !isClubOwner && !isSuperAdmin) {
      throw new StatusServiceError('Accès refusé : vous n\'êtes pas l\'auteur.', 403);
    }

    // 3. Charge les vues avec utilisateurs
    const views = await prisma.statusView.findMany({
      where: { statusId },
      orderBy: { viewedAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
      },
    });

    // 4. Charge les réactions
    const reactions = await prisma.statusReaction.findMany({
      where: { statusId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
      },
    });

    // 5. Charge les réponses
    const replies = await prisma.statusReply.findMany({
      where: { statusId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
      },
    });

    // 6. Groupe les réactions par type
    const reactionsByType = reactions.reduce((acc, r) => {
      if (!acc[r.type]) acc[r.type] = [];
      acc[r.type].push({
        id: r.id,
        user: r.user,
        createdAt: r.createdAt.toISOString(),
      });
      return acc;
    }, {} as Record<string, any[]>);

    return {
      statusId: status.id,
      text: status.text,
      visibility: status.visibility,
      createdAt: status.createdAt.toISOString(),
      expiresAt: status.expiresAt.toISOString(),
      viewsCount: views.length,
      views: views.map((v) => ({
        id: v.id,
        user: v.user,
        viewedAt: v.viewedAt.toISOString(),
      })),
      reactions: Object.entries(reactionsByType).map(([type, items]) => ({
        type,
        count: items.length,
        users: items,
      })),
      repliesCount: replies.length,
      replies: replies.map((r) => ({
        id: r.id,
        user: r.user,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }
}
