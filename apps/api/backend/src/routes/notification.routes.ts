import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { requireAuth } from '../middlewares/auth.middleware';

export const notificationRouter = Router();

notificationRouter.get('/', requireAuth, NotificationController.list);
notificationRouter.get('/unread-count', requireAuth, NotificationController.getUnreadCount);
notificationRouter.patch('/read-all', requireAuth, NotificationController.markAllAsRead);
notificationRouter.patch('/:id/read', requireAuth, NotificationController.markAsRead);
notificationRouter.delete('/:id', requireAuth, NotificationController.delete);
notificationRouter.delete('/', requireAuth, NotificationController.deleteAll);