import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { rateLimitAuth } from '../middlewares/rateLimiter.middleware';

export const authRouter = Router();

authRouter.post('/register', rateLimitAuth, AuthController.register);
authRouter.post('/login', rateLimitAuth, AuthController.login);
authRouter.get('/me', requireAuth, AuthController.me);
authRouter.put('/profile', requireAuth, AuthController.updateProfile);
authRouter.post('/forgot-password', AuthController.forgotPassword);
authRouter.post('/reset-password', AuthController.resetPassword);
authRouter.post('/change-password', requireAuth, AuthController.changePassword);
authRouter.post('/logout', requireAuth, AuthController.logout);
authRouter.get('/permissions', requireAuth, AuthController.permissions);
