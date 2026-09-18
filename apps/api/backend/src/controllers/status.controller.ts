import { Request, Response } from 'express';
import { StatusService, StatusServiceError } from '../services/status.service';
import { StatusCleanupService } from '../services/status-cleanup.service';
import {
  validateCreateStatusInput,
  validateReactionInput,
  validateReplyInput,
} from '../validators/status.validator';
import { AuthenticatedUser } from '../types';

export class StatusController {
  /**
   * POST /statuses
   * Crée un nouveau Status pour un utilisateur ou un club.
   */
  static async createStatus(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const validation = validateCreateStatusInput(req.body);

    if (!validation.valid || !validation.data) {
      return res.status(400).json({ error: validation.error || 'Données invalides.' });
    }

    try {
      const status = await StatusService.createStatus(user.id, user.role, validation.data);
      return res.status(201).json(status);
    } catch (error: any) {
      if (error instanceof StatusServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erreur createStatus:', error);
      return res.status(500).json({ error: 'Erreur lors de la création du status.' });
    }
  }

  /**
   * GET /statuses/feed
   * Récupère le fil des Stories actives accessibles à l'utilisateur connecté ou au visiteur.
   */
  static async getFeed(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser | undefined;
    const userId = user?.id || '';
    const userRole = user?.role || 'VISITOR';

    try {
      const feed = await StatusService.getFeed(userId, userRole);
      return res.json(feed);
    } catch (error: any) {
      console.error('Erreur getFeed:', error);
      return res.status(500).json({ error: 'Impossible de charger le fil des Stories.' });
    }
  }

  /**
   * GET /statuses/:id
   * Récupère les informations d'un Status spécifique.
   */
  static async getStatus(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser | undefined;
    const { id } = req.params;

    try {
      const status = await StatusService.getStatus(id, user?.id ?? '', user?.role ?? 'VISITOR');
      return res.json(status);
    } catch (error: any) {
      if (error instanceof StatusServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erreur lors de la récupération du status.' });
    }
  }

  /**
   * DELETE /statuses/:id
   * Supprime un Status.
   */
  static async deleteStatus(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const { id } = req.params;

    try {
      const result = await StatusService.deleteStatus(id, user.id, user.role);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StatusServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erreur lors de la suppression du status.' });
    }
  }

  /**
   * POST /statuses/:id/view
   * Enregistre une vue sur un Status (non dupliquée).
   */
  static async markAsViewed(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser | undefined;
    const { id } = req.params;

    // Visiteur non-connecte : acquittement sans ecriture en DB
    if (!user?.id) {
      return res.json({ viewed: true, anonymous: true });
    }

    try {
      const result = await StatusService.markAsViewed(id, user.id, user.role);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StatusServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erreur vue status.' });
    }
  }

  /**
   * GET /statuses/:id/views
   * Récupère la liste des viewers du Status (réservé au propriétaire).
   */
  static async getViewers(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const { id } = req.params;

    try {
      const viewers = await StatusService.getViewers(id, user.id, user.role);
      return res.json(viewers);
    } catch (error: any) {
      if (error instanceof StatusServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erreur lors de la récupération des spectateurs.' });
    }
  }

  /**
   * POST /statuses/:id/reactions
   * Ajoute ou met à jour une réaction sur un Status.
   */
  static async addReaction(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const { id } = req.params;
    const validation = validateReactionInput(req.body);

    if (!validation.valid || !validation.data) {
      return res.status(400).json({ error: validation.error || 'Réaction invalide.' });
    }

    try {
      const reaction = await StatusService.addReaction(id, user.id, validation.data.type, user.role);
      return res.json(reaction);
    } catch (error: any) {
      if (error instanceof StatusServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erreur lors de l’enregistrement de la réaction.' });
    }
  }

  /**
   * DELETE /statuses/:id/reactions
   * Supprime la réaction active de l'utilisateur.
   */
  static async removeReaction(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const { id } = req.params;

    try {
      const result = await StatusService.removeReaction(id, user.id);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StatusServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erreur lors de la suppression de la réaction.' });
    }
  }

  /**
   * POST /statuses/:id/replies
   * Ajoute une réponse à un Status.
   */
  static async replyToStatus(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const { id } = req.params;
    const validation = validateReplyInput(req.body);

    if (!validation.valid || !validation.data) {
      return res.status(400).json({ error: validation.error || 'Contenu de réponse invalide.' });
    }

    try {
      const reply = await StatusService.replyToStatus(id, user.id, validation.data.content, user.role);
      return res.status(201).json(reply);
    } catch (error: any) {
      if (error instanceof StatusServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erreur lors de l’envoi de la réponse.' });
    }
  }

  /**
   * DELETE /statuses/:id/replies/:replyId
   * Supprime une réponse.
   */
  static async deleteReply(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const { id, replyId } = req.params;

    try {
      const result = await StatusService.deleteReply(id, replyId, user.id, user.role);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StatusServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erreur lors de la suppression de la réponse.' });
    }
  }

  /**
   * POST /statuses/cleanup
   * Déclenche manuellement la purge des status expirés (maintenance/admin).
   */
  static async cleanupExpiredStatuses(_req: Request, res: Response) {
    try {
      const result = await StatusCleanupService.cleanupExpiredStatuses();
      return res.json({
        success: true,
        message: `${result.purgedCount} status expiré(s) purgé(s).`,
        data: result,
      });
    } catch (error: any) {
      console.error('Erreur cleanupExpiredStatuses:', error);
      return res.status(500).json({ error: 'Erreur lors du nettoyage des status.' });
    }
  }
  /**
 * GET /statuses/:id/insights
 * Détails complets d'une story pour son auteur : vues, réactions, réponses.
 * Réservé au propriétaire du status.
 */
  static async getInsights(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const { id } = req.params;

    try {
      const insights = await StatusService.getInsights(id, user.id, user.role);
      return res.json(insights);
    } catch (error: any) {
      if (error instanceof StatusServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erreur getInsights:', error);
      return res.status(500).json({ error: 'Erreur lors du chargement des insights.' });
    }
  }

}
