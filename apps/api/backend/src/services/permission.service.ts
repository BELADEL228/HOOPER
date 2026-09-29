import type { AuthenticatedUser } from '../types';
import type { Permission, PermissionContext } from '../config/constants';
import { rolePermissionMap } from '../config/constants';

/**
 * Erreur personnalisée pour les refus de permission.
 * Status HTTP 403 (Forbidden).
 */
export class PermissionError extends Error {
  statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Service centralisé de vérification des permissions.
 *
 * Règles :
 *   1. SUPER_ADMIN → toujours autorisé
 *   2. Permission `xxx:self` → nécessite resourceOwnerId === user.id
 *   3. Si `context.clubId` fourni → l'user doit être ClubMember ACTIVE de ce club
 *   4. Sinon → vérification classique du rôle via `rolePermissionMap`
 */
export class PermissionService {
  /**
   * Vérifie si l'utilisateur possède la permission demandée.
   */
  static hasPermission(
    user: AuthenticatedUser,
    permission: Permission,
    context: PermissionContext = {}
  ): boolean {
    // 1. SUPER_ADMIN bypasse toutes les vérifications
    if (user.role === 'SUPER_ADMIN') return true;

    // 2. Permission de type `:self`
    if (permission.endsWith(':self')) {
      if (!context.resourceOwnerId) return false;
      if (context.resourceOwnerId !== user.id) return false;
      const basePermission = permission.replace(':self', '') as Permission;
      return rolePermissionMap[user.role]?.includes(basePermission) ?? false;
    }

    // 3. Scope club : si un clubId est fourni, l'utilisateur doit y être membre ACTIVE
    if (context.clubId) {
      const isActiveMember = user.activeClubIds?.includes(context.clubId) ?? false;
      if (!isActiveMember) return false;
    }

    // 4. Vérification du rôle
    return rolePermissionMap[user.role]?.includes(permission) ?? false;
  }

  /**
   * Raccourci : vérifie une permission dans un contexte club précis.
   */
  static hasClubPermission(
    user: AuthenticatedUser,
    permission: Permission,
    clubId: string,
    resourceOwnerId?: string
  ): boolean {
    return this.hasPermission(user, permission, { clubId, resourceOwnerId });
  }

  /**
   * Lève une erreur `PermissionError` si l'utilisateur n'a pas la permission.
   */
  static assertPermission(
    user: AuthenticatedUser,
    permission: Permission,
    context: PermissionContext = {}
  ): void {
    if (!this.hasPermission(user, permission, context)) {
      throw new PermissionError(
        `Permission refusée : '${permission}'${
          context.clubId ? ` pour le club ${context.clubId}` : ''
        }`
      );
    }
  }

  /**
   * Renvoie toutes les permissions effectives d'un utilisateur.
   * (Utile pour le frontend / debug)
   */
  static getEffectivePermissions(user: AuthenticatedUser): Permission[] {
    return rolePermissionMap[user.role] ?? [];
  }
}