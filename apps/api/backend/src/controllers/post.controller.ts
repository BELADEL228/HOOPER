import { Request, Response } from 'express';
import { PostService } from '../services/post.service';
import { validateCreatePostInput } from '../validators/post.validator';
import { AuthenticatedUser } from '../types';

export class PostController {
  static async listPosts(req: Request, res: Response) {
    try {
      const user = (req as any).user as AuthenticatedUser | undefined;

      const clubId =
        typeof req.query.clubId === 'string'
          ? req.query.clubId
          : undefined;

      const authorId =
        typeof req.query.authorId === 'string'
          ? req.query.authorId
          : undefined;

      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;

      const posts = await PostService.listPosts({
        clubId,
        authorId,
        limit,
        offset,
        userId: user?.id,
      });

      return res.json(posts);
    } catch (error: any) {
      console.error('List posts error:', error);

      return res.status(500).json({
        error: 'Impossible de charger le fil d’actualités.',
      });
    }
  }

  static async createPost(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const validation = validateCreatePostInput(req.body);
    if (!validation.valid || !validation.data) {
      return res.status(400).json({ error: validation.error || 'Contenu invalide.' });
    }

    try {
      const post = await PostService.createPost(user.id, validation.data);
      return res.status(201).json(post);
    } catch (error: any) {
      console.error('Create post error:', error);
      return res.status(500).json({ error: 'Erreur lors de la publication.' });
    }
  }


  static async deletePost(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const { id } = req.params;

    try {
      const result = await PostService.deletePost(id, user.id);
      return res.json(result);
    } catch (error: any) {
      console.error('Delete post error:', error);

      return res.status(error.statusCode || 500).json({
        error: error.message || 'Erreur lors de la suppression.',
      });
    }
  }

  static async toggleLike(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const { id } = req.params;

    try {
      const result = await PostService.toggleLike(id, user.id);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erreur lors de la réaction.' });
    }
  }

  static async addComment(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const { id } = req.params;
    const { text, content } = req.body ?? {};
    const commentContent = (text || content || '').trim();

    if (!commentContent) {
      return res.status(400).json({ error: 'Le commentaire ne peut pas être vide.' });
    }

    try {
      const comment = await PostService.addComment(id, user.id, commentContent);
      return res.status(201).json(comment);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erreur lors de l’ajout du commentaire.' });
    }
  }
}
