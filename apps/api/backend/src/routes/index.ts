import { Router } from 'express';
import { authRouter } from './auth.routes';
import { clubRouter } from './club.routes';
import { teamRouter } from './team.routes';
import { postRouter } from './post.routes';
import { matchRouter, matchRequestRouter } from './match.routes';
import { adminRouter } from './admin.routes';
import { marketplaceRouter, ticketingRouter } from './marketplace.routes';
import { miscRouter } from './misc.routes';
import { clubRequestRouter } from './club-request.routes';
import { statusRouter } from './status.routes';
import { searchRouter } from './search.routes';
import { uploadRouter } from './upload.routes';

export const apiRouter = Router();

// Endpoint santé
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'OK', system: 'FIRE STONE API Engine v2.0 (Modular)', time: new Date().toISOString() });
});

// Enregistrement des sous-routeurs
apiRouter.use('/auth', authRouter);
apiRouter.use('/clubs', clubRouter);
apiRouter.use('/club-requests', clubRequestRouter);
apiRouter.use('/teams', teamRouter);
apiRouter.use('/posts', postRouter);
apiRouter.use('/statuses', statusRouter);
apiRouter.use('/matches', matchRouter);
apiRouter.use('/match-requests', matchRequestRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/marketplace', marketplaceRouter);
apiRouter.use('/tickets', ticketingRouter);
apiRouter.use('/search', searchRouter);
apiRouter.use('/upload', uploadRouter);
apiRouter.use('/', miscRouter);
