import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';
import { prisma, fallbackUsers, isDatabaseAvailable } from '../config/database';
import { UserRole, userRoles } from '../config/constants';
import { AuthenticatedUser } from '../types';

export const toRole = (input?: string | null): UserRole => {
  const normalized = input?.toUpperCase();
  // Gérer la compatibilité : CLUB_MANAGER -> CLUB_MANAGER
  if (normalized === 'CLUB_MANAGER') return 'CLUB_MANAGER';
  return userRoles.includes(normalized as UserRole)
    ? (normalized as UserRole)
    : 'VISITOR';
};

export const sanitizeUser = (user: {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  bio?: string | null;
  country?: string | null;
  city?: string | null;
  isSuspended?: boolean | null;
  suspendReason?: string | null;
  suspendedUntil?: Date | string | null;
  createdAt?: Date | string | null;
}): AuthenticatedUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: toRole(user.role),
  avatarUrl: user.avatarUrl ?? null,
  phoneNumber: user.phoneNumber ?? null,
  address: user.address ?? null,
  emergencyContact: user.emergencyContact ?? null,
  bio: user.bio ?? null,
  country: user.country ?? 'Togo',
  city: user.city ?? null,
  isSuspended: Boolean(user.isSuspended),
  suspendReason: user.suspendReason ?? null,
  suspendedUntil: user.suspendedUntil ? new Date(user.suspendedUntil).toISOString() : null,
  createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
});

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide.' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role: UserRole };
    let userRecord: any = null;

    if (!isDatabaseAvailable()) {
      userRecord = fallbackUsers.find((user) => user.id === payload.sub || user.email === payload.email) ?? null;
    } else {
      userRecord = await prisma.user.findUnique({ where: { id: payload.sub } });
    }

    if (!userRecord) {
      return res.status(401).json({ error: 'Utilisateur inconnu.' });
    }

    if (userRecord.isSuspended) {
      if (userRecord.suspendedUntil && new Date(userRecord.suspendedUntil) < new Date()) {
        if (isDatabaseAvailable()) {
          await prisma.user.update({
            where: { id: userRecord.id },
            data: { isSuspended: false, suspendReason: null, suspendedUntil: null },
          });
        }
        userRecord.isSuspended = false;
        userRecord.suspendReason = null;
        userRecord.suspendedUntil = null;
      } else {
        return res.status(403).json({
          error: `Votre compte est actuellement suspendu. Motif : ${userRecord.suspendReason || 'Non précisé'}${userRecord.suspendedUntil ? ` (jusqu'au ${new Date(userRecord.suspendedUntil).toLocaleDateString('fr-FR')})` : ''}`,
        });
      }
    }

    (req as any).user = sanitizeUser(userRecord);
    next();
  } catch {
    return res.status(401).json({ error: 'Session expirée ou token invalide.' });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role: UserRole };
    let userRecord: any = null;

    if (!isDatabaseAvailable()) {
      userRecord = fallbackUsers.find((user) => user.id === payload.sub || user.email === payload.email) ?? null;
    } else {
      userRecord = await prisma.user.findUnique({ where: { id: payload.sub } });
    }

    if (userRecord && !userRecord.isSuspended) {
      (req as any).user = sanitizeUser(userRecord);
    }
  } catch {
    // Silencieux pour auth optionnelle
  }
  next();
};

export const requireRole = (allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as AuthenticatedUser | undefined;
  if (!user?.role || !allowedRoles.includes(user.role)) {
    return res.status(403).json({ error: 'Accès refusé : autorisation insuffisante pour cette action.' });
  }
  next();
};
