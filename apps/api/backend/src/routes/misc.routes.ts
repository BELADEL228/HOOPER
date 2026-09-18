import { Router } from 'express';
import { MiscController } from '../controllers/misc.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { requireClubMember, requireTeamManager } from '../middlewares/club-access.middleware';

export const miscRouter = Router();

// Notifications
miscRouter.get('/notifications', requireAuth, MiscController.listNotifications);
miscRouter.post('/notifications/read-all', requireAuth, MiscController.markAllNotificationsRead);

// Messagerie
miscRouter.get('/messages/general', requireAuth, requireClubMember, MiscController.listGeneralMessages);
miscRouter.post('/messages/general', requireAuth, requireClubMember, MiscController.sendGeneralMessage);

// Tournois
miscRouter.get('/tournaments', MiscController.listTournaments);
miscRouter.post('/tournaments', requireAuth, requireRole(['SUPER_ADMIN']), MiscController.createTournament);

// Recrutement & Détection
miscRouter.get('/recruitment', MiscController.listRecruitment);
miscRouter.post('/recruitment', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER']), requireTeamManager, MiscController.createRecruitment);
miscRouter.post('/recruitment/:id/apply', requireAuth, MiscController.applyRecruitment);
miscRouter.patch('/recruitment/applications/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER', 'COACH']), MiscController.updateApplicationStatus);

// Scouting
miscRouter.get('/scouting/shortlist', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER', 'COACH']), MiscController.listScoutShortlist);
miscRouter.post('/scouting/shortlist', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER', 'COACH']), MiscController.addToScoutShortlist);
miscRouter.delete('/scouting/shortlist/:playerProfileId', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER', 'COACH']), MiscController.removeFromScoutShortlist);

// Badges
miscRouter.get('/badges', MiscController.listBadges);
miscRouter.get('/players/:id/badges', MiscController.listPlayerBadges);
miscRouter.post('/players/:id/badges', requireAuth, requireRole(['SUPER_ADMIN']), MiscController.awardBadge);

// Terrains
miscRouter.get('/venues', MiscController.listVenues);
miscRouter.post('/venues', requireAuth, requireRole(['SUPER_ADMIN']), MiscController.createVenue);

// Joueurs
miscRouter.get('/players', MiscController.listPlayers);
miscRouter.post('/players', requireAuth, requireRole(['SUPER_ADMIN']), MiscController.createPlayer);
miscRouter.put('/players/:id', requireAuth, requireRole(['SUPER_ADMIN']), MiscController.updatePlayer);
miscRouter.delete('/players/:id', requireAuth, requireRole(['SUPER_ADMIN']), MiscController.deletePlayer);

// Académie
miscRouter.get('/academy/applications', requireAuth, MiscController.listAcademyApplications);
miscRouter.post('/academy/apply', requireAuth, MiscController.applyToAcademy);

// Sponsors
miscRouter.get('/sponsors', MiscController.listSponsors);
miscRouter.post('/sponsorship-requests', requireAuth, MiscController.createSponsorshipRequest);

// Follow (gestion réelle)
miscRouter.post('/users/:id/follow', requireAuth, MiscController.toggleFollow);

// Signalements publics (persistance réelle)
miscRouter.post('/reports', requireAuth, MiscController.createReport);
