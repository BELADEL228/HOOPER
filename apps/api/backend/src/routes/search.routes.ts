import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';

export const searchRouter = Router();

// GET /api/search?q=terme&limit=5
searchRouter.get('/', SearchController.globalSearch);
