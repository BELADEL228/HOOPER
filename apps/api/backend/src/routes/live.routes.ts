import { Router } from 'express';
import { LiveController } from '../controllers/live.controller';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware';

export const liveRouter = Router();

// ── Lecture publique ──────────────────────────────────────────────────────────
liveRouter.get('/', optionalAuth, LiveController.listSessions);
liveRouter.get('/:id', optionalAuth, LiveController.getSession);
liveRouter.get('/:id/comments', optionalAuth, LiveController.getComments);

// ── Actions authentifiées (streamer) ─────────────────────────────────────────
liveRouter.post('/', requireAuth, LiveController.createSession);
liveRouter.patch('/:id/start', requireAuth, LiveController.startSession);
liveRouter.patch('/:id/end', requireAuth, LiveController.endSession);
liveRouter.post('/:id/comments', requireAuth, LiveController.addComment);
