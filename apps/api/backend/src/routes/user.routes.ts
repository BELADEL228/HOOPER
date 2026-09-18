import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware';

export const userRouter = Router();

// Recherche (accessible à tous)
userRouter.get('/search', optionalAuth, UserController.search);

// Profil public
userRouter.get('/:id', optionalAuth, UserController.getPublicProfile);

// Follow stats
userRouter.get('/:id/follow-stats', optionalAuth, UserController.getFollowStats);

// Toggle follow (auth requise)
userRouter.post('/:id/follow', requireAuth, UserController.toggleFollow);

// Badges
userRouter.get('/:id/badges', optionalAuth, UserController.getUserBadges);