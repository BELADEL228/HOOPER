import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { UserRole } from './constants';
import { NODE_ENV } from './env';

export const prisma = new PrismaClient();

let isFallbackMode = false;
export const fallbackUsers: Array<{
  id: string; email: string; passwordHash: string; name: string; role: UserRole;
  avatarUrl?: string | null; phoneNumber?: string | null; address?: string | null;
  emergencyContact?: string | null; bio?: string | null; country?: string | null; city?: string | null;
  isSuspended?: boolean; suspendReason?: string | null; suspendedUntil?: Date | null; createdAt?: Date;
}> = [];

/** Vérifie si le système est en mode fallback (base de données inaccessible) */
export const isDatabaseAvailable = (): boolean => !isFallbackMode;

/** Bootstrap only the platform operator. Club data must come from approved requests. */
export const ensureDatabaseAndSeed = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    const systemEmail = 'superadmin@firestone.com';
    if (!await prisma.user.findUnique({ where: { email: systemEmail } })) {
      await prisma.user.create({ data: {
        email: systemEmail, name: 'Super Administrateur', role: 'SUPER_ADMIN',
        passwordHash: await bcrypt.hash('FireStone2026!', 10),
      } });
    }
    console.log(`✅ Prisma connecté à la base ${NODE_ENV === 'production' ? 'de production' : 'SQLite locale'}; compte système prêt.`);
    return true;
  } catch (error) {
    console.warn('⚠️ Base de données inaccessible. Passage en mode mémoire temporaire.', error);
    isFallbackMode = true;
    fallbackUsers.push({ id: 'fallback-superadmin', email: 'superadmin@firestone.com', name: 'Super Administrateur', role: 'SUPER_ADMIN', passwordHash: bcrypt.hashSync('FireStone2026!', 10) });
    console.warn('⚠️ MODE FALLBACK ACTIVÉ : Les données ne seront pas persistées. Certaines fonctionnalités sont limitées.');
    return false;
  }
};
