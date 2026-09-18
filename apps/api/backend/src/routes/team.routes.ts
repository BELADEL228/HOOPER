import { Router } from 'express';
import { TeamController } from '../controllers/team.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { requireTeamManager } from '../middlewares/club-access.middleware';

export const teamRouter = Router();

teamRouter.get('/', TeamController.listTeams);
teamRouter.get('/:id', TeamController.getTeam);
teamRouter.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER']), requireTeamManager, TeamController.createTeam);
teamRouter.patch('/:id/theme', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER']), requireTeamManager, TeamController.patchTeamTheme);
