import { Request, Response } from 'express';
import { MatchService } from '../services/match.service';
import { AuthenticatedUser } from '../types';

export class MatchController {
  static async listMatches(req: Request, res: Response) {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const matches = await MatchService.listMatches(status);
      return res.json(matches);
    } catch (error: any) {
      console.error('List matches error:', error);
      return res.status(500).json({ error: 'Impossible de charger les matchs.' });
    }
  }

  static async createMatch(req: Request, res: Response) {
    try {
      const match = await MatchService.createMatch(req.body);
      return res.status(201).json(match);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erreur lors de la création du match.' });
    }
  }

  static async updateMatch(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const updated = await MatchService.updateMatch(id, req.body);
      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du match.' });
    }
  }

  static async deleteMatch(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await MatchService.deleteMatch(id);
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erreur lors de la suppression.' });
    }
  }

  static async listEvents(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const events = await MatchService.listEvents(id);
      return res.json(events);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erreur lors du chargement des événements.' });
    }
  }

  static async addEvent(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const event = await MatchService.addEvent(id, req.body);
      return res.status(201).json(event);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erreur lors de l’ajout de l’événement.' });
    }
  }

  static async listMatchRequests(req: Request, res: Response) {
    try {
      const user = (req as any).user as AuthenticatedUser;
      const requests = await MatchService.listMatchRequestsForUser(user.id, user.role);
      return res.json(requests);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erreur lors du chargement des demandes.' });
    }
  }

  static async createMatchRequest(req: Request, res: Response) {
    try {
      const request = await MatchService.createMatchRequest(req.body);
      return res.status(201).json(request);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erreur lors de la création de la demande.' });
    }
  }

  static async updateMatchRequestStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body ?? {};
    try {
      const updated = await MatchService.updateMatchRequestStatus(id, status || 'CONFIRMED');
      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour de la demande.' });
    }
  }
}
