import type { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

/** Enregistre l'instance io (appelé depuis socket.ts) */
export const setIO = (io: SocketIOServer): void => {
    ioInstance = io;
};

/** Récupère l'instance io (peut être null si le serveur n'est pas prêt) */
export const getIO = (): SocketIOServer | null => {
    return ioInstance;
};

/** Helper : push une notification à un utilisateur précis */
export const pushNotificationToUser = (
    userId: string,
    notification: {
        id: string;
        type: string;
        title: string;
        text: string;
        read: boolean;
        createdAt: string;
        meta?: Record<string, unknown>;
    }
): void => {
    const io = getIO();
    if (!io) {
        console.warn('[socketServer] io non initialisé — notification non poussée');
        return;
    }
    io.to(`user:${userId}`).emit('notification:new', notification);
};