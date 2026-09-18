import { Router } from 'express';
import { ClubController } from '../controllers/club.controller';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.middleware';
import { requireClubManager } from '../middlewares/club-access.middleware';

export const clubRouter = Router();

clubRouter.get('/', ClubController.listClubs);
clubRouter.get('/:id', ClubController.getClub);
clubRouter.get('/:id/roster', ClubController.getClubRoster);
clubRouter.get('/:id/matches', ClubController.getClubMatches);
clubRouter.get('/:id/news', ClubController.getClubNews);
clubRouter.get('/:id/stats', ClubController.getClubStats);
clubRouter.get('/:id/members', requireAuth, requireClubManager, ClubController.getClubMembers);
clubRouter.patch('/:id/members/:userId/role', requireAuth, requireClubManager, ClubController.updateClubMemberRole);
clubRouter.post('/', requireAuth, requireRole(['SUPER_ADMIN']), ClubController.createClub);
clubRouter.patch('/:id/theme', requireAuth, requireClubManager, ClubController.patchTheme);
clubRouter.post('/analyze-logo', requireAuth, ClubController.analyzeLogo);
clubRouter.post('/:id/follow', requireAuth, ClubController.toggleFollow);
clubRouter.get('/:id/follow-stats', optionalAuth, ClubController.getFollowStats);
