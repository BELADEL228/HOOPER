import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireClubPublisher, requirePostClubMember } from '../middlewares/club-access.middleware';

export const postRouter = Router();

postRouter.get('/', PostController.listPosts);
postRouter.post('/', requireAuth, requireClubPublisher, PostController.createPost);
postRouter.delete('/:id', requireAuth, requireClubPublisher, PostController.deletePost);
postRouter.post('/:id/like', requireAuth, requirePostClubMember, PostController.toggleLike);
postRouter.post('/:id/comments', requireAuth, requirePostClubMember, PostController.addComment);
