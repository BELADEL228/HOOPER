import type { Request, Response } from 'express';
import { prisma } from '../config/database';

export class NotificationController {
    /**
     * GET /api/notifications
     * Liste les notifications de l'utilisateur courant.
     */
    static async list(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || (req as any).userId;
            if (!userId) return res.status(401).json({ error: 'Non authentifié' });

            const notifications = await prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });

            res.json(notifications);
        } catch (err: any) {
            console.error('[NotificationController.list]', err?.message);
            res.status(500).json({ error: 'Erreur lors du chargement' });
        }
    }

    /**
     * PATCH /api/notifications/:id/read
     * Marque une notification comme lue.
     */
    static async markAsRead(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user?.id || (req as any).userId;
            if (!userId) return res.status(401).json({ error: 'Non authentifié' });

            const notif = await prisma.notification.findFirst({
                where: { id, userId },
            });
            if (!notif) return res.status(404).json({ error: 'Introuvable' });

            await prisma.notification.update({
                where: { id },
                data: { read: true },
            });

            res.json({ success: true });
        } catch (err: any) {
            console.error('[NotificationController.markAsRead]', err?.message);
            res.status(500).json({ error: 'Erreur' });
        }
    }

    /**
     * PATCH /api/notifications/read-all
     * Marque TOUTES les notifications comme lues.
     */
    static async markAllAsRead(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || (req as any).userId;
            if (!userId) return res.status(401).json({ error: 'Non authentifié' });

            await prisma.notification.updateMany({
                where: { userId, read: false },
                data: { read: true },
            });

            res.json({ success: true });
        } catch (err: any) {
            console.error('[NotificationController.markAllAsRead]', err?.message);
            res.status(500).json({ error: 'Erreur' });
        }
    }

    /**
     * GET /api/notifications/unread-count
     * Renvoie le nombre de notifs non lues.
     */
    static async getUnreadCount(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || (req as any).userId;
            if (!userId) return res.status(401).json({ error: 'Non authentifié' });

            const count = await prisma.notification.count({
                where: { userId, read: false },
            });

            res.json({ count });
        } catch (err: any) {
            console.error('[NotificationController.getUnreadCount]', err?.message);
            res.status(500).json({ error: 'Erreur' });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user?.id || (req as any).userId;
            if (!userId) return res.status(401).json({ error: 'Non authentifié' });

            const notif = await prisma.notification.findFirst({
                where: { id, userId },
            });
            if (!notif) return res.status(404).json({ error: 'Introuvable' });

            await prisma.notification.delete({
                where: { id },
            });

            res.json({ success: true });
        } catch (err: any) {
            console.error('[NotificationController.delete]', err?.message);
            res.status(500).json({ error: 'Erreur' });
        }
    }

    static async deleteAll(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || (req as any).userId;
            if (!userId) return res.status(401).json({ error: 'Non authentifié' });

            await prisma.notification.deleteMany({
                where: { userId },
            });

            res.json({ success: true });
        } catch (err: any) {
            console.error('[NotificationController.deleteAll]', err?.message);
            res.status(500).json({ error: 'Erreur' });
        }
    }
}