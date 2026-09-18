import { Router } from 'express';
import { MatchController } from '../controllers/match.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { requireMatchManager, requireTeamManager } from '../middlewares/club-access.middleware';

export const matchRouter = Router();

matchRouter.get('/', MatchController.listMatches);
matchRouter.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER']), requireMatchManager, MatchController.createMatch);
matchRouter.put('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER']), requireMatchManager, MatchController.updateMatch);
matchRouter.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER']), requireMatchManager, MatchController.deleteMatch);
matchRouter.get('/:id/events', MatchController.listEvents);
matchRouter.post('/:id/events', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER']), requireMatchManager, MatchController.addEvent);

export const matchRequestRouter = Router();
matchRequestRouter.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER']), MatchController.listMatchRequests);
matchRequestRouter.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER']), requireTeamManager, MatchController.createMatchRequest);
matchRequestRouter.patch('/:id', requireAuth, requireRole(['SUPER_ADMIN']), MatchController.updateMatchRequestStatus);
