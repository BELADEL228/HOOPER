import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { logAuditAction } from '../middlewares/audit.middleware';
import { AuthenticatedUser } from '../types';

export class AdminController {
  static async getSupervision(_req: Request, res: Response) {
    try { return res.json(await AdminService.getSupervision()); }
    catch { return res.status(500).json({ error: 'Impossible de charger la supervision système.' }); }
  }

  static async getMetrics(_req: Request, res: Response) {
    try {
      const metrics = await AdminService.getMetrics();
      return res.json(metrics);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erreur lors du calcul des métriques.' });
    }
  }

  static async listUsers(req: Request, res: Response) {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;
    try {
      const users = await AdminService.listUsers(search, role);
      return res.json(users);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs.' });
    }
  }

  static async changeUserRole(req: Request, res: Response) {
    const adminUser = (req as any).user as AuthenticatedUser;
    const { id } = req.params;
    const { role } = req.body ?? {};

    if (!role) {
      return res.status(400).json({ error: 'Rôle manquant.' });
    }

    try {
      const updated = await AdminService.changeUserRole(id, role);
      await logAuditAction({
        userId: adminUser.id,
        action: 'USER_ROLE_CHANGED',
        targetType: 'USER',
        targetId: id,
        details: { newRole: role },
        ipAddress: req.ip,
      });
      return res.json({ success: true, user: updated });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Impossible de modifier le rôle.' });
    }
  }

  static async changeUserStatus(req: Request, res: Response) {
    const adminUser = (req as any).user as AuthenticatedUser;
    const { id } = req.params;
    const { isSuspended, reason, suspendedUntil } = req.body ?? {};

    try {
      const updated = await AdminService.changeUserStatus(id, Boolean(isSuspended), reason, suspendedUntil);
      await logAuditAction({
        userId: adminUser.id,
        action: isSuspended ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
        targetType: 'USER',
        targetId: id,
        details: { isSuspended, reason, suspendedUntil },
        ipAddress: req.ip,
      });
      return res.json({ success: true, user: updated });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Impossible de modifier le statut.' });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    const adminUser = (req as any).user as AuthenticatedUser;
    const { id } = req.params;

    try {
      await AdminService.deleteUser(id);
      await logAuditAction({
        userId: adminUser.id,
        action: 'USER_DELETED',
        targetType: 'USER',
        targetId: id,
        ipAddress: req.ip,
      });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erreur lors de la suppression.' });
    }
  }

  static async listReports(req: Request, res: Response) {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    try {
      const reports = await AdminService.listReports(status);
      return res.json(reports);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erreur lors du chargement des signalements.' });
    }
  }

  static async updateReport(req: Request, res: Response) {
    const adminUser = (req as any).user as AuthenticatedUser;
    const { id } = req.params;
    const { status, resolutionNote } = req.body ?? {};

    try {
      const updated = await AdminService.updateReport(id, status, resolutionNote, adminUser.name);
      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du signalement.' });
    }
  }

  static async listAuditLogs(req: Request, res: Response) {
    const limit = Number(req.query.limit) || 100;
    try {
      const logs = await AdminService.listAuditLogs(limit);
      return res.json(logs);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erreur lors du chargement des logs.' });
    }
  }
}
