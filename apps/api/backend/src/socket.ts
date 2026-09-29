import { Server as SocketIOServer, type Socket } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config/env';
import { prisma } from './config/database';
import { setIO } from './services/socketServer.service';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userName?: string;
}

export function attachSocketIO(httpServer: HttpServer): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN?.split(',') || '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 30000,
        pingInterval: 25000,
    });
    setIO(io);
    // ─── Middleware d'authentification JWT ──────────────────────────────
    // ✅ Le JWT contient : { sub: userId, email, role }
    io.use((socket, next) => {
        try {
            const authSocket = socket as AuthenticatedSocket;
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                return next(new Error('No auth token'));
            }

            const decoded = jwt.verify(token, JWT_SECRET) as {
                sub?: string;
                email?: string;
                role?: string;
            };

            if (!decoded?.sub) {
                return next(new Error('Invalid token payload (no sub)'));
            }

            authSocket.userId = decoded.sub;
            // ⚠️ userName sera chargé depuis Prisma au moment de la connexion
            next();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'unknown';
            console.warn('[socket] auth failed:', message);
            next(new Error('Invalid token'));
        }
    });

    // ─── Connexions ─────────────────────────────────────────────────────
    io.on('connection', async (rawSocket) => {
        const socket = rawSocket as AuthenticatedSocket;
        const userId = socket.userId;

        if (!userId) {
            console.warn('[socket] No userId — disconnecting');
            socket.disconnect(true);
            return;
        }

        // ✅ Charge le VRAI nom depuis Prisma
        let userName = 'Utilisateur';
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true },
            });
            if (user?.name) {
                userName = user.name;
            }
        } catch (err) {
            console.warn('[socket] Failed to fetch userName:', err);
        }

        socket.userName = userName;

        console.log(`[socket] ✅ connected: ${userName} (userId=${userId}, socketId=${socket.id})`);

        // Room personnelle : permet de recevoir des événements ciblés
        socket.join(`user:${userId}`);
        socket.broadcast.emit('user:online', { userId });

        // ─── Rejoindre une conversation ─────────────────────────────────
        socket.on('conversation:join', (payload: { conversationId?: string }) => {
            const { conversationId } = payload || {};
            if (!conversationId) return;
            socket.join(`conversation:${conversationId}`);
            console.log(`[socket] ${userName} joined conv:${conversationId}`);
        });

        socket.on('conversation:leave', (payload: { conversationId?: string }) => {
            const { conversationId } = payload || {};
            if (!conversationId) return;
            socket.leave(`conversation:${conversationId}`);
        });

        // ─── Envoyer un message ─────────────────────────────────────────
        socket.on(
            'message:send',
            async (payload: { conversationId?: string; text?: string }) => {
                try {
                    const { conversationId, text } = payload || {};
                    if (!conversationId || !text?.trim()) return;

                    // 1. Charge la conversation AVEC ses participants
                    const conversation = await prisma.conversation.findFirst({
                        where: {
                            id: conversationId,
                            participants: { some: { id: userId } },
                        },
                        include: {
                            participants: { select: { id: true } },
                        },
                    });
                    if (!conversation) {
                        socket.emit('message:error', { error: 'Accès refusé' });
                        return;
                    }

                    // 2. Persiste le message
                    const savedMessage = await prisma.message.create({
                        data: {
                            conversationId,
                            senderId: userId,
                            text: text.trim(),
                        },
                        include: {
                            sender: { select: { id: true, name: true, avatarUrl: true } },
                        },
                    });

                    // 3. Met à jour la conversation (tri par updatedAt)
                    await prisma.conversation.update({
                        where: { id: conversationId },
                        data: { updatedAt: new Date() },
                    });

                    // ✅ 3bis. Crée une notification pour chaque participant (sauf l'expéditeur)
                    const otherParticipants = conversation.participants.filter(
                        (p) => p.id !== userId
                    );

                    for (const participant of otherParticipants) {
                        try {
                            const notif = await prisma.notification.create({
                                data: {
                                    userId: participant.id,
                                    type: 'MESSAGE',
                                    title: `Nouveau message de ${savedMessage.sender?.name || userName}`,
                                    text:
                                        text.length > 60 ? `${text.slice(0, 60)}...` : text,
                                    read: false,
                                },
                            });

                            // ✅ Push temps réel au participant
                            io.to(`user:${participant.id}`).emit('notification:new', {
                                id: notif.id,
                                type: notif.type,
                                title: notif.title,
                                text: notif.text,
                                read: notif.read,
                                createdAt: notif.createdAt.toISOString(),
                                meta: {
                                    conversationId: savedMessage.conversationId,
                                    senderId: savedMessage.senderId,
                                    senderName: savedMessage.sender?.name || userName,
                                },
                            });

                            console.log(
                                `[socket] 📩 notif sent to ${participant.id} for message from ${userName}`
                            );
                        } catch (err) {
                            console.warn('[socket] Failed to create notification:', err);
                        }
                    }

                    // 4. Formate le message
                    const formatted = {
                        id: savedMessage.id,
                        conversationId: savedMessage.conversationId,
                        senderId: savedMessage.senderId,
                        senderName: savedMessage.sender?.name || userName,
                        senderAvatar: savedMessage.sender?.avatarUrl || null,
                        text: savedMessage.text,
                        createdAt: savedMessage.createdAt.toISOString(),
                        timestamp: new Date(savedMessage.createdAt).toLocaleTimeString(
                            'fr-FR',
                            { hour: '2-digit', minute: '2-digit' }
                        ),
                    };

                    // ✅ 5. Broadcast uniquement via la room de conversation
                    //    (les participants rejoignent cette room via conversation:join)
                    //    → évite le double-envoi (user:pid + conversation:id à la fois)
                    io.to(`conversation:${conversationId}`).emit('message:new', formatted);

                    console.log(
                        `[socket] message from ${userName} → conv:${conversationId} → ${conversation.participants.length} participants`
                    );
                } catch (err) {
                    console.error('[socket] message:send error', err);
                    socket.emit('message:error', { error: 'Envoi échoué' });
                }
            }
        );

        // ─── Typing indicator ───────────────────────────────────────────
        socket.on('typing:start', (payload: { conversationId?: string }) => {
            const { conversationId } = payload || {};
            if (!conversationId) return;
            socket.to(`conversation:${conversationId}`).emit('typing:start', {
                conversationId,
                userId,
                userName,
            });
        });

        socket.on('typing:stop', (payload: { conversationId?: string }) => {
            const { conversationId } = payload || {};
            if (!conversationId) return;
            socket.to(`conversation:${conversationId}`).emit('typing:stop', {
                conversationId,
                userId,
            });
        });

        // ─── Marquer comme lu ───────────────────────────────────────────
        socket.on('messages:read', async (payload: { conversationId?: string }) => {
            try {
                const { conversationId } = payload || {};
                if (!conversationId || !userId) return;

                // 1. Persiste le read en DB
                const now = new Date();
                await prisma.conversationRead.upsert({
                    where: {
                        conversationId_userId: { conversationId, userId },
                    },
                    create: { conversationId, userId, lastReadAt: now },
                    update: { lastReadAt: now },
                });

                // 2. Récupère les participants pour broadcaster
                const conversation = await prisma.conversation.findUnique({
                    where: { id: conversationId },
                    include: { participants: { select: { id: true } } },
                });
                if (!conversation) return;

                // 3. Broadcast aux AUTRES participants (pas à soi-même)
                const others = conversation.participants.filter((p) => p.id !== userId);
                others.forEach((p) => {
                    io.to(`user:${p.id}`).emit('messages:read', {
                        conversationId,
                        userId,
                        readAt: now.toISOString(),
                    });
                });

                console.log(`[socket] ${userName} read conv:${conversationId}`);
            } catch (err) {
                console.error('[socket] messages:read error', err);
            }
        });

        // ✅ Marquer une notification comme lue via socket (utilisé par le client)
        socket.on('notification:mark-read', async (payload: { notificationId?: string }) => {
            try {
                const { notificationId } = payload || {};
                if (!notificationId || !userId) return;

                const notif = await prisma.notification.findFirst({
                    where: { id: notificationId, userId },
                });
                if (!notif) return;

                await prisma.notification.update({
                    where: { id: notificationId },
                    data: { read: true },
                });

                // Confirme au client qui a marqué
                socket.emit('notification:read', {
                    notificationId,
                    userId,
                });
            } catch (err) {
                console.warn('[socket] notification:mark-read error', err);
            }
        });

        // ─── Déconnexion ────────────────────────────────────────────────
        socket.on('disconnect', (reason) => {
            console.log(`[socket] disconnected: ${userName} (${reason})`);
            socket.broadcast.emit('user:offline', { userId });

            // ── Si le user était dans un live, notifier la room ──────────
            const liveRooms = Array.from(socket.rooms).filter((r) => r.startsWith('live:'));
            for (const room of liveRooms) {
                const sessionId = room.replace('live:', '');
                io.to(room).emit('live:viewer_left', { userId, userName, sessionId });

                // Recompte et broadcast
                io.in(room).fetchSockets().then((sockets) => {
                    const count = sockets.length;
                    io.to(room).emit('live:viewers_count', { sessionId, count });
                }).catch(() => {});
            }
        });

        // ════════════════════════════════════════════════════════════════
        // ── LIVE CENTER — WebRTC Signaling + Chat ─────────────────────
        // ════════════════════════════════════════════════════════════════

        // ─── Rejoindre la room d'un live ─────────────────────────────
        socket.on('live:join', async (payload: { sessionId?: string }) => {
            const { sessionId } = payload || {};
            if (!sessionId) return;

            const room = `live:${sessionId}`;
            socket.join(room);

            // Compte les viewers
            const sockets = await io.in(room).fetchSockets();
            const viewerCount = sockets.length;

            // Informer les autres viewers
            socket.to(room).emit('live:viewer_joined', {
                sessionId,
                userId,
                userName,
                viewerCount,
            });

            // Confirmer au nouveau viewer + envoyer le count
            socket.emit('live:joined', { sessionId, viewerCount });
            io.to(room).emit('live:viewers_count', { sessionId, count: viewerCount });

            // Incrémenter les vues en DB (silencieux)
            try {
                const { LiveService } = await import('./services/live.service');
                await LiveService.updatePeakViewers(sessionId, viewerCount);
            } catch { /* silencieux */ }

            console.log(`[live] ${userName} joined live:${sessionId} (${viewerCount} viewers)`);
        });

        // ─── Quitter la room d'un live ───────────────────────────────
        socket.on('live:leave', async (payload: { sessionId?: string }) => {
            const { sessionId } = payload || {};
            if (!sessionId) return;

            const room = `live:${sessionId}`;
            socket.leave(room);

            const sockets = await io.in(room).fetchSockets();
            const viewerCount = sockets.length;

            io.to(room).emit('live:viewer_left', { userId, userName, sessionId });
            io.to(room).emit('live:viewers_count', { sessionId, count: viewerCount });
        });

        // ─── WebRTC : Offer (streamer → viewers via serveur) ─────────
        socket.on('live:offer', (payload: { sessionId?: string; sdp?: any }) => {
            const { sessionId, sdp } = payload || {};
            if (!sessionId || !sdp) return;

            const room = `live:${sessionId}`;
            // Broadcast l'offer à tous les viewers dans la room (sauf le streamer)
            socket.to(room).emit('live:offer', {
                sessionId,
                sdp,
                streamerId: userId,
                streamerName: userName,
            });
        });

        // ─── WebRTC : Answer (viewer → streamer) ─────────────────────
        socket.on('live:answer', (payload: { sessionId?: string; sdp?: any; targetId?: string }) => {
            const { sessionId, sdp, targetId } = payload || {};
            if (!sessionId || !sdp || !targetId) return;

            // Envoie l'answer directement au streamer
            io.to(`user:${targetId}`).emit('live:answer', {
                sessionId,
                sdp,
                viewerId: userId,
                viewerName: userName,
            });
        });

        // ─── WebRTC : ICE Candidate ──────────────────────────────────
        socket.on('live:ice_candidate', (payload: {
            sessionId?: string;
            candidate?: any;
            targetId?: string;
        }) => {
            const { sessionId, candidate, targetId } = payload || {};
            if (!sessionId || !candidate) return;

            if (targetId) {
                // Envoie ciblé (1-to-1)
                io.to(`user:${targetId}`).emit('live:ice_candidate', {
                    sessionId,
                    candidate,
                    fromId: userId,
                });
            } else {
                // Broadcast à la room (streamer → tous)
                socket.to(`live:${sessionId}`).emit('live:ice_candidate', {
                    sessionId,
                    candidate,
                    fromId: userId,
                });
            }
        });

        // ─── Chat du live ────────────────────────────────────────────
        socket.on('live:chat', async (payload: { sessionId?: string; text?: string }) => {
            const { sessionId, text } = payload || {};
            if (!sessionId || !text?.trim()) return;

            try {
                const { LiveService } = await import('./services/live.service');

                // Persiste en DB
                const comment = await LiveService.addComment(sessionId, userId, text);

                // Broadcast à toute la room
                io.to(`live:${sessionId}`).emit('live:chat', comment);

            } catch (err: any) {
                socket.emit('live:chat_error', { error: err.message || 'Erreur envoi message' });
            }
        });

        // ─── Réaction emoji live (fire, clap...) ────────────────────
        socket.on('live:reaction', (payload: { sessionId?: string; emoji?: string }) => {
            const { sessionId, emoji } = payload || {};
            if (!sessionId || !emoji) return;

            io.to(`live:${sessionId}`).emit('live:reaction', {
                sessionId,
                emoji,
                userId,
                userName,
            });
        });

        // ─── Streamer démarre le live (signal aux viewers) ───────────
        socket.on('live:started', (payload: { sessionId?: string }) => {
            const { sessionId } = payload || {};
            if (!sessionId) return;

            io.to(`live:${sessionId}`).emit('live:started', {
                sessionId,
                streamerId: userId,
                streamerName: userName,
            });

            console.log(`[live] 🔴 LIVE STARTED by ${userName}: session ${sessionId}`);
        });

        // ─── Streamer termine le live (signal aux viewers) ───────────
        socket.on('live:ended', (payload: { sessionId?: string }) => {
            const { sessionId } = payload || {};
            if (!sessionId) return;

            io.to(`live:${sessionId}`).emit('live:ended', {
                sessionId,
                streamerId: userId,
                streamerName: userName,
            });

            console.log(`[live] ⭕ LIVE ENDED by ${userName}: session ${sessionId}`);
        });
    });

    return io;
}