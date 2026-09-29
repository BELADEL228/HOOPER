import { Request, Response, NextFunction } from 'express';
import { PermissionService, PermissionError } from '../services/permission.service';
import type { Permission } from '../config/constants';
import type { AuthenticatedUser } from '../types';

export interface RequirePermissionOptions {
    /** Nom du paramètre d'URL contenant le clubId. Ex: 'id' pour /clubs/:id/... */
    clubIdFromParams?: string;
    /** Si true → lit `req.body.clubId` */
    clubIdFromBody?: boolean;
    /** Si true → lit `req.query.clubId` */
    clubIdFromQuery?: boolean;
    /** Nom du paramètre d'URL contenant l'ID du propriétaire (pour les `:self`). */
    ownerIdFromParams?: string;
    /** Si true → lit `req.body.userId` comme resourceOwnerId */
    ownerIdFromBody?: boolean;
}

/**
 * Middleware générique de vérification de permission.
 *
 * ⚠️ Doit être utilisé APRÈS `requireAuth` (qui peuple `req.user`).
 *
 * @example
 *   router.patch(
 *     '/:id/members/:userId/approve',
 *     requireAuth,
 *     requirePermission('members:approve', { clubIdFromParams: 'id' }),
 *     controller.approve
 *   );
 */
export const requirePermission =
    (permission: Permission, options: RequirePermissionOptions = {}) =>
        (req: Request, res: Response, next: NextFunction) => {
            const user = (req as any).user as AuthenticatedUser | undefined;

            if (!user) {
                return res.status(401).json({ error: 'Non authentifié.' });
            }

            // ─── Résolution du clubId ──────────────────────────────────────────
            let clubId: string | undefined;
            if (options.clubIdFromParams) {
                clubId = req.params[options.clubIdFromParams];
            } else if (options.clubIdFromBody) {
                clubId = req.body?.clubId;
            } else if (options.clubIdFromQuery) {
                const q = req.query?.clubId;
                clubId = typeof q === 'string' ? q : undefined;
            }

            // ─── Résolution du resourceOwnerId ────────────────────────────────
            let resourceOwnerId: string | undefined;
            if (options.ownerIdFromParams) {
                resourceOwnerId = req.params[options.ownerIdFromParams];
            } else if (options.ownerIdFromBody) {
                resourceOwnerId = req.body?.userId;
            }

            try {
                PermissionService.assertPermission(user, permission, {
                    clubId,
                    resourceOwnerId,
                });
                return next();
            } catch (err) {
                if (err instanceof PermissionError) {
                    console.warn(
                        `[requirePermission] Refusé : user=${user.id} role=${user.role} perm=${permission} clubId=${clubId ?? 'N/A'}`
                    );
                    return res.status(403).json({ error: err.message });
                }
                console.error('[requirePermission] Erreur inattendue :', err);
                return res.status(500).json({ error: 'Erreur de vérification des permissions.' });
            }
        };