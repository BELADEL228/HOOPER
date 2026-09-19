import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { optionalAuth } from '../middlewares/auth.middleware';

export const uploadRouter = Router();

uploadRouter.post('/', optionalAuth, UploadController.upload);
