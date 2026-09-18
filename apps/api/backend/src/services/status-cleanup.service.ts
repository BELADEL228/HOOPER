import fs from 'fs';
import path from 'path';
import { prisma } from '../config/database';

export class StatusCleanupService {
  /**
   * Nettoie tous les status expirés (expiresAt <= now) et supprime les fichiers locaux associés.
   */
  static async cleanupExpiredStatuses(): Promise<{ purgedCount: number; purgedIds: string[] }> {
    const now = new Date();

    // 1. Récupérer les status expirés avec leurs médias
    const expiredStatuses = await prisma.status.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        media: {
          select: {
            url: true,
          },
        },
      },
    });

    if (expiredStatuses.length === 0) {
      return { purgedCount: 0, purgedIds: [] };
    }

    const expiredIds = expiredStatuses.map((s) => s.id);

    // 2. Nettoyer les fichiers médias locaux éventuels
    for (const status of expiredStatuses) {
      for (const media of status.media) {
        if (media.url && media.url.startsWith('/uploads/')) {
          try {
            const relativePath = media.url.replace(/^\//, '');
            const absolutePath = path.resolve(process.cwd(), relativePath);
            if (fs.existsSync(absolutePath)) {
              fs.unlinkSync(absolutePath);
            }
          } catch (fileErr) {
            console.warn(`[StatusCleanup] Échec de la suppression du fichier média ${media.url}:`, fileErr);
          }
        }
      }
    }

    // 3. Suppression en base de données (onDelete: Cascade nettoie toutes les tables dépendantes)
    const result = await prisma.status.deleteMany({
      where: {
        id: {
          in: expiredIds,
        },
      },
    });

    return {
      purgedCount: result.count,
      purgedIds: expiredIds,
    };
  }
}
