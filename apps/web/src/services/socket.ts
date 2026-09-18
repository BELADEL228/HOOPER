import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

// ─── Extraire le token JWT du localStorage ────────────────────────────
const getAuthToken = (): string => {
    try {
        const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
        return session?.token || '';
    } catch {
        return '';
    }
};

// ─── Adresse du serveur Socket.IO (sans le /api) ──────────────────────
// Ex: si API_BASE_URL = "http://localhost:5000/api" → "http://localhost:5000"
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

// ─── Types des événements ─────────────────────────────────────────────
export interface SocketMessage {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string | null;
    text: string;
    createdAt: string;
    timestamp: string;
}

export interface TypingPayload {
    conversationId: string;
    userId: string;
    userName: string;
}

export interface SocketNotification {
    id: string;
    type: string;
    title: string;
    text: string;
    read: boolean;
    createdAt: string;
    meta?: {
        conversationId?: string;
        senderId?: string;
        senderName?: string;
    };
}


// ─── Service singleton ────────────────────────────────────────────────
class SocketService {
    private socket: Socket | null = null;
    private isConnecting = false;

    /**
     * Connecte le socket (idempotent — appels répétés = no-op).
     * Renvoie null si aucun token n'est disponible.
     */
    connect(): Socket | null {
        const token = getAuthToken();
        if (!token) return null;

        if (this.socket?.connected) return this.socket;
        if (this.isConnecting) return this.socket;

        this.isConnecting = true;

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity,
            autoConnect: true,
        });

        this.socket.on('connect', () => {
            console.log('[socket] ✅ Connected:', this.socket?.id);
            this.isConnecting = false;
        });

        this.socket.on('connect_error', (err) => {
            console.warn('[socket] ❌ Connect error:', err.message);
            this.isConnecting = false;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[socket] 🔌 Disconnected:', reason);
        });

        return this.socket;
    }

    /** Déconnecte le socket (au logout) */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnecting = false;
        }
    }

    getSocket(): Socket | null {
        return this.socket;
    }

    isConnected(): boolean {
        return Boolean(this.socket?.connected);
    }

    // ─── Émissions ──────────────────────────────────────────────────────
    joinConversation(conversationId: string): void {
        this.socket?.emit('conversation:join', { conversationId });
    }

    leaveConversation(conversationId: string): void {
        this.socket?.emit('conversation:leave', { conversationId });
    }

    sendMessage(conversationId: string, text: string): void {
        this.socket?.emit('message:send', { conversationId, text });
    }

    startTyping(conversationId: string): void {
        this.socket?.emit('typing:start', { conversationId });
    }

    stopTyping(conversationId: string): void {
        this.socket?.emit('typing:stop', { conversationId });
    }

    markAsRead(conversationId: string): void {
        this.socket?.emit('messages:read', { conversationId });
    }

    // ─── Écouteurs (retournent une fonction de cleanup) ─────────────────
    onNewMessage(handler: (msg: SocketMessage) => void): () => void {
        this.socket?.on('message:new', handler);
        return () => this.socket?.off('message:new', handler);
    }

    onTypingStart(handler: (data: TypingPayload) => void): () => void {
        this.socket?.on('typing:start', handler);
        return () => this.socket?.off('typing:start', handler);
    }

    onTypingStop(
        handler: (data: { conversationId: string; userId: string }) => void
    ): () => void {
        this.socket?.on('typing:stop', handler);
        return () => this.socket?.off('typing:stop', handler);
    }

    onUserOnline(handler: (data: { userId: string }) => void): () => void {
        this.socket?.on('user:online', handler);
        return () => this.socket?.off('user:online', handler);
    }

    onUserOffline(handler: (data: { userId: string }) => void): () => void {
        this.socket?.on('user:offline', handler);
        return () => this.socket?.off('user:offline', handler);
    }

    onMessagesRead(
        handler: (data: {
            conversationId: string;
            userId: string;
            readAt: string;
        }) => void
    ): () => void {
        this.socket?.on('messages:read', handler);
        return () => this.socket?.off('messages:read', handler);
    }

    // Dans la même classe SocketService

    onNotification(handler: (notif: SocketNotification) => void): () => void {
        this.socket?.on('notification:new', handler);
        return () => this.socket?.off('notification:new', handler);
    }

    onNotificationRead(
        handler: (data: { notificationId: string; userId: string }) => void
    ): () => void {
        this.socket?.on('notification:read', handler);
        return () => this.socket?.off('notification:read', handler);
    }

    onNotificationDelete(
        handler: (data: { notificationId: string; userId: string }) => void
    ): () => void {
        this.socket?.on('notification:delete', handler);
        return () => this.socket?.off('notification:delete', handler);
    }

    onNotificationDeleteAll(
        handler: (data: { userId: string }) => void
    ): () => void {
        this.socket?.on('notification:delete-all', handler);
        return () => this.socket?.off('notification:delete-all', handler);
    }

}

// ✅ Singleton exporté
export const socketService = new SocketService();