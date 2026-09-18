import { Request, Response } from 'express';
import { TeamService } from '../services/team.service';
import { validateCreateTeamInput } from '../validators/team.validator';

export class TeamController {
  static async listTeams(req: Request, res: Response) {
    try {
      const clubId = typeof req.query.clubId === 'string' ? req.query.clubId : undefined;
      const city = typeof req.query.city === 'string' ? req.query.city : undefined;
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;

      const teams = await TeamService.listTeams({ clubId, city, category });
      return res.json(teams);
    } catch (error: any) {
      console.error('List teams error:', error);
      return res.status(500).json({ error: 'Impossible de charger les équipes.' });
    }
  }

  static async getTeam(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const team = await TeamService.getTeamById(id);
      if (!team) {
        return res.status(404).json({ error: 'Équipe introuvable.' });
      }
      return res.json(team);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erreur lors du chargement de l’équipe.' });
    }
  }

  static async createTeam(req: Request, res: Response) {
    const validation = validateCreateTeamInput(req.body);
    if (!validation.valid || !validation.data) {
      return res.status(400).json({ error: validation.error || 'Données invalides.' });
    }

    try {
      const team = await TeamService.createTeam(validation.data);
      return res.status(201).json(team);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Erreur lors de la création de l’équipe.' });
    }
  }

  static async patchTeamTheme(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const updated = await TeamService.patchTeamTheme(id, req.body);
      return res.json({ success: true, team: updated });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Impossible de mettre à jour le thème.' });
    }
  }
}
