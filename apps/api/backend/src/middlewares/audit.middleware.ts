import { prisma, fallbackUsers, isDatabaseAvailable } from '../config/database';
import Logger from '../utils/logger';

export const logAuditAction = async (params: {
  userId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, unknown> | string;
  ipAddress?: string | null;
}) => {
  try {
    if (isDatabaseAvailable()) {
      await prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId ?? null,
          details: typeof params.details === 'object' ? JSON.stringify(params.details) : params.details ?? null,
          ipAddress: params.ipAddress ?? null,
        },
      });
    }
  } catch (err) {
    Logger.error('Erreur lors de l\'enregistrement de l\'audit log', 'AuditMiddleware', { error: err });
  }
};
