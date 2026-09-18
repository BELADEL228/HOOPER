import { Router } from 'express';
import { StatusController } from '../controllers/status.controller';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware';

export const statusRouter = Router();

// Feed principal des stories actives (accessible en mode public ou connecté)
statusRouter.get('/feed', optionalAuth, StatusController.getFeed);

// Nettoyage manuel/périodique des status expirés
statusRouter.post('/cleanup', requireAuth, StatusController.cleanupExpiredStatuses);

// Création d'un nouveau status (User ou Club)
statusRouter.post('/', requireAuth, StatusController.createStatus);
statusRouter.get('/:id/insights', requireAuth, StatusController.getInsights);
// Consultation d'un status individuel — optionalAuth pour les visiteurs (stories PUBLIC)
statusRouter.get('/:id', optionalAuth, StatusController.getStatus);
statusRouter.delete('/:id', requireAuth, StatusController.deleteStatus);

// Vues — optionalAuth : les visiteurs voient sans enregistrement DB
statusRouter.post('/:id/view', optionalAuth, StatusController.markAsViewed);
statusRouter.get('/:id/views', requireAuth, StatusController.getViewers);

// Réactions
statusRouter.post('/:id/reactions', requireAuth, StatusController.addReaction);
statusRouter.delete('/:id/reactions', requireAuth, StatusController.removeReaction);

// Réponses
statusRouter.post('/:id/replies', requireAuth, StatusController.replyToStatus);
statusRouter.delete('/:id/replies/:replyId', requireAuth, StatusController.deleteReply);
