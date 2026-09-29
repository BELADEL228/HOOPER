import { Router } from 'express';
import { ClubController } from '../controllers/club.controller';
import { ClubMemberController } from '../controllers/club-member.controller';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.middleware';
import { requireClubManager } from '../middlewares/club-access.middleware';
import { requirePermission } from '../middlewares/permission.middleware';

export const clubRouter = Router();

// ═══════════════════════════════════════════════════════════════════════════
// LECTURE PUBLIQUE (pas d'auth)
// ═══════════════════════════════════════════════════════════════════════════
clubRouter.get('/my-clubs', requireAuth, ClubController.getMyClubs);
clubRouter.get('/', ClubController.listClubs);
clubRouter.get('/:id', ClubController.getClub);
clubRouter.get('/:id/roster', ClubController.getClubRoster);
clubRouter.get('/:id/matches', ClubController.getClubMatches);
clubRouter.get('/:id/news', ClubController.getClubNews);
clubRouter.get('/:id/stats', ClubController.getClubStats);
clubRouter.get('/:id/follow-stats', optionalAuth, ClubController.getFollowStats);

// ═══════════════════════════════════════════════════════════════════════════
// CRÉATION & GESTION CLUB
// ═══════════════════════════════════════════════════════════════════════════
clubRouter.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'CLUB_ADMIN']), ClubController.createClub);
clubRouter.post('/analyze-logo', requireAuth, ClubController.analyzeLogo);
clubRouter.patch('/:id/theme', requireAuth, requireClubManager, ClubController.patchTheme);

// ═══════════════════════════════════════════════════════════════════════════
// FOLLOW CLUB
// ═══════════════════════════════════════════════════════════════════════════
clubRouter.post('/:id/follow', requireAuth, ClubController.toggleFollow);

// ═══════════════════════════════════════════════════════════════════════════
// MEMBRES — ROUTES NOUVELLES (RBAC resource:action)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /clubs/:id/members
 * Liste les membres (filtre optionnel ?status=ACTIVE|PENDING|...).
 * Requiert permission `members:read` sur le club.
 */
clubRouter.get(
    '/:id/members',
    requireAuth,
    requirePermission('members:read', { clubIdFromParams: 'id' }),
    ClubMemberController.listMembers
);

/**
 * GET /clubs/:id/members/pending
 * Liste uniquement les demandes en attente.
 */
clubRouter.get(
    '/:id/members/pending',
    requireAuth,
    requirePermission('members:read', { clubIdFromParams: 'id' }),
    ClubMemberController.listPending
);

/**
 * POST /clubs/:id/members/request
 * Auto-inscription d'un user connecté (crée PENDING).
 */
clubRouter.post(
    '/:id/members/request',
    requireAuth,
    ClubMemberController.requestJoin
);

/**
 * POST /clubs/:id/members/invite
 * Invitation par admin club (crée user + ClubMember ACTIVE).
 */
clubRouter.post(
    '/:id/members/invite',
    requireAuth,
    requirePermission('members:invite', { clubIdFromParams: 'id' }),
    ClubMemberController.invite
);

/**
 * PATCH /clubs/:id/members/:userId/approve
 */
clubRouter.patch(
    '/:id/members/:userId/approve',
    requireAuth,
    requirePermission('members:approve', { clubIdFromParams: 'id' }),
    ClubMemberController.approve
);

/**
 * PATCH /clubs/:id/members/:userId/reject
 */
clubRouter.patch(
    '/:id/members/:userId/reject',
    requireAuth,
    requirePermission('members:reject', { clubIdFromParams: 'id' }),
    ClubMemberController.reject
);

/**
 * PATCH /clubs/:id/members/:userId/suspend
 */
clubRouter.patch(
    '/:id/members/:userId/suspend',
    requireAuth,
    requirePermission('members:suspend', { clubIdFromParams: 'id' }),
    ClubMemberController.suspend
);

/**
 * PATCH /clubs/:id/members/:userId/role
 * Change le rôle d'un membre. Migré vers `requirePermission`.
 */
clubRouter.patch(
    '/:id/members/:userId/role',
    requireAuth,
    requirePermission('members:role:write', { clubIdFromParams: 'id' }),
    ClubController.updateClubMemberRole
);

/**
 * DELETE /clubs/:id/members/:userId
 */
clubRouter.delete(
    '/:id/members/:userId',
    requireAuth,
    requirePermission('members:remove', { clubIdFromParams: 'id' }),
    ClubMemberController.remove
);