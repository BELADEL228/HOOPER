import type { Request, Response } from 'express';
import { prisma } from '../config/database';

/**
 * Controller pour la messagerie sociale.
 * Relation Conversation <-> User : M-N implicite via `participants`.
 */
export class ConversationController {
    /**
     * GET /api/conversations
     * Liste toutes les conversations où l'utilisateur courant est participant.
     */
    static async listMyConversations(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || (req as any).userId;
            if (!userId) return res.status(401).json({ error: 'Non authentifié' });

            // 1. Charge les conversations avec participants + dernier message + reads
            const conversations = await prisma.conversation.findMany({
                where: {
                    participants: { some: { id: userId } },
                },
                include: {
                    participants: {
                        select: { id: true, name: true, avatarUrl: true, role: true },
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        include: {
                            sender: { select: { id: true, name: true, avatarUrl: true } },
                        },
                    },
                    // ✅ Récupère uniquement le read de l'utilisateur courant
                    reads: {
                        where: { userId },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            });

            // 2. Pour chaque conversation, calcule le vrai unreadCount
            const formatted = await Promise.all(
                conversations.map(async (conv) => {
                    const lastMsg = conv.messages?.[0];
                    const otherMember = conv.participants.find((p) => p.id !== userId);
                    const lastReadAt = conv.reads[0]?.lastReadAt ?? new Date(0);

                    // ✅ Compte les messages créés APRÈS le dernier read,
                    //    en excluant les messages envoyés par l'utilisateur lui-même
                    const unreadCount = await prisma.message.count({
                        where: {
                            conversationId: conv.id,
                            createdAt: { gt: lastReadAt },
                            NOT: { senderId: userId },
                        },
                    });

                    const displayName =
                        conv.title ||
                        otherMember?.name ||
                        (conv.type === 'GROUP' ? 'Groupe' : 'Conversation');

                    const displayAvatar =
                        conv.type === 'DIRECT' ? otherMember?.avatarUrl || null : null;

                    return {
                        id: conv.id,
                        name: displayName,
                        avatar: displayAvatar,
                        role: otherMember?.role || null,
                        lastMessage: lastMsg?.text || '',
                        timestamp: lastMsg
                            ? new Date(lastMsg.createdAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })
                            : '',
                        unreadCount,
                        isOnline: false,
                        isClub: conv.type === 'GROUP',
                    };
                })
            );

            res.json(formatted);
        } catch (err: any) {
            console.error('[ConversationController.listMyConversations]', err?.message);
            res.status(500).json({ error: 'Erreur lors du chargement des conversations' });
        }
    }

    /**
     * GET /api/conversations/:id/messages
     * Historique d'une conversation (réservé aux participants).
     */
    static async getMessages(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user?.id || (req as any).userId;
            if (!userId) return res.status(401).json({ error: 'Non authentifié' });

            const isMember = await prisma.conversation.findFirst({
                where: {
                    id,
                    participants: { some: { id: userId } },
                },
                select: { id: true },
            });
            if (!isMember) {
                return res.status(403).json({ error: 'Accès refusé à cette conversation' });
            }

            const messages = await prisma.message.findMany({
                where: { conversationId: id },
                orderBy: { createdAt: 'asc' },
                take: 200,
                include: {
                    sender: { select: { id: true, name: true, avatarUrl: true } },
                },
            });

            const formatted = messages.map((m) => ({
                id: m.id,
                senderId: m.senderId,
                senderName: m.sender?.name || 'Utilisateur',
                senderAvatar: m.sender?.avatarUrl || null,
                text: m.text,
                createdAt: m.createdAt.toISOString(),
                timestamp: new Date(m.createdAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
            }));

            res.json(formatted);
        } catch (err: any) {
            console.error('[ConversationController.getMessages]', err?.message);
            res.status(500).json({ error: 'Erreur lors du chargement des messages' });
        }
    }

    /**
     * POST /api/conversations/:id/messages
     * Envoi d'un message via REST (fallback si socket indisponible).
     */
    static async sendMessage(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { text } = req.body;
            const userId = (req as any).user?.id || (req as any).userId;
            if (!userId) return res.status(401).json({ error: 'Non authentifié' });
            if (!text?.trim()) return res.status(400).json({ error: 'Message vide' });

            const isMember = await prisma.conversation.findFirst({
                where: {
                    id,
                    participants: { some: { id: userId } },
                },
                select: { id: true },
            });
            if (!isMember) {
                return res.status(403).json({ error: 'Accès refusé à cette conversation' });
            }

            const message = await prisma.message.create({
                data: {
                    conversationId: id,
                    senderId: userId,
                    text: text.trim(),
                },
                include: {
                    sender: { select: { id: true, name: true, avatarUrl: true } },
                },
            });

            // Met à jour le updatedAt de la conversation (utile pour le tri)
            await prisma.conversation.update({
                where: { id },
                data: { updatedAt: new Date() },
            });

            res.status(201).json({
                id: message.id,
                senderId: message.senderId,
                senderName: message.sender?.name || 'Utilisateur',
                senderAvatar: message.sender?.avatarUrl || null,
                text: message.text,
                createdAt: message.createdAt.toISOString(),
                timestamp: new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
            });
        } catch (err: any) {
            console.error('[ConversationController.sendMessage]', err?.message);
            res.status(500).json({ error: "Erreur lors de l'envoi" });
        }
    }

    /**
     * POST /api/conversations
     * Créer une nouvelle conversation (DIRECT ou GROUP).
     * Body : { title?: string, type: 'DIRECT' | 'GROUP', participantIds: string[] }
     */
    static async createConversation(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || (req as any).userId;
            if (!userId) return res.status(401).json({ error: 'Non authentifié' });

            const { title, type = 'DIRECT', participantIds = [] } = req.body;

            const allIds: string[] = Array.from(new Set([userId, ...participantIds]));

            const conversation = await prisma.conversation.create({
                data: {
                    title: title || 'Nouvelle conversation',
                    type,
                    participants: {
                        connect: allIds.map((id) => ({ id })),
                    },
                },
                include: {
                    participants: {
                        select: { id: true, name: true, avatarUrl: true, role: true },
                    },
                },
            });

            res.status(201).json(conversation);
        } catch (err: any) {
            console.error('[ConversationController.createConversation]', err?.message);
            res.status(500).json({ error: 'Erreur lors de la création' });
        }
    }

    /**
 * POST /api/conversations/:id/read
 * Marque une conversation comme lue pour l'utilisateur courant.
 * Upsert la ligne ConversationRead avec lastReadAt = maintenant.
 */
    static async markAsRead(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user?.id || (req as any).userId;
            if (!userId) return res.status(401).json({ error: 'Non authentifié' });

            // Vérifie que l'utilisateur est bien participant
            const isMember = await prisma.conversation.findFirst({
                where: {
                    id,
                    participants: { some: { id: userId } },
                },
                select: { id: true },
            });
            if (!isMember) {
                return res.status(403).json({ error: 'Accès refusé à cette conversation' });
            }

            // Upsert : crée ou met à jour le lastReadAt
            const now = new Date();
            await prisma.conversationRead.upsert({
                where: {
                    conversationId_userId: {
                        conversationId: id,
                        userId,
                    },
                },
                create: {
                    conversationId: id,
                    userId,
                    lastReadAt: now,
                },
                update: {
                    lastReadAt: now,
                },
            });

            res.json({ success: true, lastReadAt: now.toISOString() });
        } catch (err: any) {
            console.error('[ConversationController.markAsRead]', err?.message);
            res.status(500).json({ error: 'Erreur lors du marquage comme lu' });
        }
    }

    /**
     * DELETE /api/conversations/:id/messages/:messageId
     * Supprime un message de la conversation (auteur ou admin).
     */
    static async deleteMessage(req: Request, res: Response) {
        try {
            const { id: conversationId, messageId } = req.params;
            const userId = (req as any).user?.id || (req as any).userId;
            const userRole = (req as any).user?.role;
            if (!userId) return res.status(401).json({ error: 'Non authentifié' });

            const message = await prisma.message.findUnique({
                where: { id: messageId },
            });

            if (!message || message.conversationId !== conversationId) {
                return res.status(404).json({ error: 'Message introuvable' });
            }

            if (message.senderId !== userId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
                return res.status(403).json({ error: 'Non autorisé à supprimer ce message' });
            }

            await prisma.message.delete({
                where: { id: messageId },
            });

            res.json({ success: true, messageId });
        } catch (err: any) {
            console.error('[ConversationController.deleteMessage]', err?.message);
            res.status(500).json({ error: 'Erreur lors de la suppression du message' });
        }
    }
}