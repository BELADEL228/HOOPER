import { Router } from 'express';
import { ClubRequestController } from '../controllers/club-request.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

export const clubRequestRouter = Router();
clubRequestRouter.post('/', requireAuth, ClubRequestController.submit);
clubRequestRouter.get('/my', requireAuth, ClubRequestController.mine);
clubRequestRouter.get('/', requireAuth, requireRole(['SUPER_ADMIN']), ClubRequestController.list);
clubRequestRouter.patch('/:id/approve', requireAuth, requireRole(['SUPER_ADMIN']), ClubRequestController.approve);
clubRequestRouter.patch('/:id/reject', requireAuth, requireRole(['SUPER_ADMIN']), ClubRequestController.reject);
