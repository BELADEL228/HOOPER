import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

export const adminRouter = Router();

// Administration de la plateforme : exclusivement SUPER_ADMIN.
adminRouter.use(requireAuth);
adminRouter.use(requireRole(['SUPER_ADMIN']));

adminRouter.get('/supervision', AdminController.getSupervision);
adminRouter.get('/metrics', AdminController.getMetrics);
adminRouter.get('/users', AdminController.listUsers);
adminRouter.patch('/users/:id/role', AdminController.changeUserRole);
adminRouter.patch('/users/:id/status', AdminController.changeUserStatus);
adminRouter.delete('/users/:id', AdminController.deleteUser);
adminRouter.get('/reports', AdminController.listReports);
adminRouter.patch('/reports/:id', AdminController.updateReport);
adminRouter.get('/audit-logs', AdminController.listAuditLogs);
