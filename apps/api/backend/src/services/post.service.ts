import { prisma } from '../config/database';
import { CreatePostInput } from '../validators/post.validator';
import { pushNotificationToUser } from './socketServer.service';

export class PostService {
  static async listPosts(filters: {
    clubId?: string;
    authorId?: string;         // ✅ Nouveau
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.clubId) where.clubId = filters.clubId;
    if (filters.authorId) where.authorId = filters.authorId;   // ✅ Nouveau

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true, role: true },
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
        likes: { select: { userId: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, name: true, avatarUrl: true, role: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });

    return posts.map((post) => ({
      id: post.id,
      content: post.content,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType || 'image',
      clubId: post.clubId,
      clubName: post.club?.name || null,
      clubSlug: post.club?.slug || null,
      clubLogo: post.club?.logoUrl || null,
      clubPrimaryColor: post.club?.primaryColor || null,
      authorName: post.author.name,
      authorAvatar:
        post.author.avatarUrl ||
        `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
          post.author.name
        )}`,
      authorRole: post.author.role,
      authorId: post.author.id,
      timestamp: post.createdAt.toISOString(),
      createdAtMs: post.createdAt.getTime(),
      likesCount: post.likes.length,
      likes: post.likes.map((l) => l.userId),
      comments: post.comments.map((c) => ({
        id: c.id,
        authorName: c.author.name,
        authorAvatar:
          c.author.avatarUrl ||
          `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
            c.author.name
          )}`,
        authorRole: c.author.role,
        text: c.content,
        timestamp: c.createdAt.toISOString(),
      })),
      reactions: [],
    }));
  }

  static async createPost(authorId: string, input: CreatePostInput) {
    const post = await prisma.post.create({
      data: {
        content: input.content,
        mediaUrl: input.mediaUrl,
        mediaType: input.mediaType || 'image',
        authorId,
        clubId: input.clubId,
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
        club: {
          select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true },
        },
      },
    });

    return {
      id: post.id,
      content: post.content,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      clubId: post.clubId,
      clubName: post.club?.name || null,
      authorName: post.author.name,
      authorAvatar: post.author.avatarUrl,
      authorRole: post.author.role,
      timestamp: post.createdAt.toISOString(),
      likesCount: 0,
      comments: [],
      reactions: [{ emoji: '🔥', count: 0 }],
    };
  }

  static async toggleLike(postId: string, userId: string) {
    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    // ── Retrait du like ────────────────────────────────────────────────
    if (existing) {
      await prisma.like.delete({
        where: { postId_userId: { postId, userId } },
      });
      return { liked: false };
    }

    // ── Ajout du like ──────────────────────────────────────────────────
    await prisma.like.create({
      data: { postId, userId },
    });

    // ✅ Notification à l'auteur du post (s'il n'est pas celui qui like)
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });

      if (post && post.authorId !== userId) {
        const liker = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });

        const notif = await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: 'POST_LIKE',
            title: 'Nouveau J\'aime',
            text: `${liker?.name || 'Quelqu\'un'} a aimé votre publication.`,
          },
        });

        // ✅ Push temps réel
        pushNotificationToUser(post.authorId, {
          id: notif.id,
          type: notif.type,
          title: notif.title,
          text: notif.text,
          read: notif.read,
          createdAt: notif.createdAt.toISOString(),
          meta: {
            postId,
            senderId: userId,
            senderName: liker?.name || 'Utilisateur',
          },
        });
      }
    } catch (err) {
      console.warn('[PostService.toggleLike] notification error', err);
    }

    return { liked: true };
  }

  static async addComment(postId: string, authorId: string, content: string) {
    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId,
        content,
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
      },
    });

    // ✅ Notification à l'auteur du post (s'il n'est pas celui qui commente)
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true, content: true },
      });

      if (post && post.authorId !== authorId) {
        const preview =
          content.length > 60 ? `${content.slice(0, 60)}...` : content;

        const notif = await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: 'POST_COMMENT',
            title: 'Nouveau commentaire',
            text: `${comment.author.name} : « ${preview} »`,
          },
        });

        // ✅ Push temps réel
        pushNotificationToUser(post.authorId, {
          id: notif.id,
          type: notif.type,
          title: notif.title,
          text: notif.text,
          read: notif.read,
          createdAt: notif.createdAt.toISOString(),
          meta: {
            postId,
            senderId: authorId,
            senderName: comment.author.name,
          },
        });
      }
    } catch (err) {
      console.warn('[PostService.addComment] notification error', err);
    }

    return {
      id: comment.id,
      authorName: comment.author.name,
      authorAvatar: comment.author.avatarUrl,
      authorRole: comment.author.role,
      text: comment.content,
      timestamp: comment.createdAt.toISOString(),
    };
  }
}
