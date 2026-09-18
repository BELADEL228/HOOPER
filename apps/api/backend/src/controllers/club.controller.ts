import { Request, Response } from 'express';
import { ClubService } from '../services/club.service';
import { BrandingService } from '../services/branding.service';
import { validateCreateClubInput } from '../validators/club.validator';
import { AuthenticatedUser } from '../types';
import { prisma } from '../config/database';

export class ClubController {
  static async listClubs(req: Request, res: Response) {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const city = typeof req.query.city === 'string' ? req.query.city : undefined;
      const country = typeof req.query.country === 'string' ? req.query.country : undefined;

      const clubs = await ClubService.listClubs({ search, city, country });
      return res.json(clubs);
    } catch (error: any) {
      console.error('List clubs error:', error);
      return res.status(500).json({ error: 'Impossible de récupérer la liste des clubs.' });
    }
  }

  static async getClub(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const club = await ClubService.getClubByIdOrSlug(id);
      if (!club) {
        return res.status(404).json({ error: 'Club introuvable.' });
      }
      return res.json(club);
    } catch (error: any) {
      console.error('Get club error:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération du club.' });
    }
  }

  static async createClub(req: Request, res: Response) {
    const validation = validateCreateClubInput(req.body);
    if (!validation.valid || !validation.data) {
      return res.status(400).json({ error: validation.error || 'Données invalides.' });
    }

    try {
      const user = (req as any).user as AuthenticatedUser | undefined;
      const club = await ClubService.createClub(validation.data, user?.id);
      return res.status(201).json(club);
    } catch (error: any) {
      console.error('Create club error:', error);
      return res.status(500).json({ error: error.message || 'Erreur lors de la création du club.' });
    }
  }

  static async patchTheme(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const updated = await ClubService.updateClubTheme(id, req.body);
      return res.json({ success: true, club: updated });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Impossible de mettre à jour le thème.' });
    }
  }

  static async analyzeLogo(req: Request, res: Response) {
    const { logo, name } = req.body ?? {};
    try {
      const tokens = await BrandingService.extractThemeFromLogo(logo || '', name || 'Club');
      return res.json({ tokens });
    } catch (error: any) {
      return res.status(500).json({ error: 'Échec de l’analyse du logo.' });
    }
  }

  static async getClubRoster(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teamId = typeof req.query.teamId === 'string' ? req.query.teamId : undefined;
      const roster = await ClubService.getClubRoster(id, teamId);
      return res.json(roster);
    } catch (error: any) {
      console.error('Get club roster error:', error);
      return res.status(500).json({ error: 'Impossible de récupérer l’effectif du club.' });
    }
  }

  static async getClubMatches(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teamId = typeof req.query.teamId === 'string' ? req.query.teamId : undefined;
      const matches = await ClubService.getClubMatches(id, teamId);
      return res.json(matches);
    } catch (error: any) {
      console.error('Get club matches error:', error);
      return res.status(500).json({ error: 'Impossible de récupérer les matchs du club.' });
    }
  }

  static async getClubNews(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const news = await ClubService.getClubNews(id);
      return res.json(news);
    } catch (error: any) {
      console.error('Get club news error:', error);
      return res.status(500).json({ error: 'Impossible de récupérer les actualités du club.' });
    }
  }

  static async getClubStats(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const stats = await ClubService.getClubStats(id);
      return res.json(stats);
    } catch (error: any) {
      console.error('Get club stats error:', error);
      return res.status(500).json({ error: 'Impossible de récupérer les statistiques du club.' });
    }
  }

  static async getClubMembers(req: Request, res: Response) {
    try { return res.json(await ClubService.getClubMembers(req.params.id)); }
    catch (error: any) { return res.status(500).json({ error: error.message || 'Impossible de récupérer les membres.' }); }
  }

  static async updateClubMemberRole(req: Request, res: Response) {
    try { return res.json(await ClubService.updateClubMemberRole(req.params.id, req.params.userId, req.body?.role)); }
    catch (error: any) { return res.status(400).json({ error: error.message || 'Impossible de modifier le rôle du membre.' }); }
  }

  static async toggleFollow(req: Request, res: Response) {
    try {
      const { id: clubId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      const club = await prisma.club.findUnique({
        where: { id: clubId },
      });

      if (!club) {
        return res.status(404).json({ error: 'Club non trouvé' });
      }

      const existingFollow = await prisma.clubFollow.findUnique({
        where: {
          userId_clubId: {
            userId,
            clubId,
          },
        },
      });

      let following = false;

      if (existingFollow) {
        await prisma.clubFollow.delete({
          where: { id: existingFollow.id },
        });
        following = false;
      } else {
        await prisma.clubFollow.create({
          data: {
            userId,
            clubId,
          },
        });
        following = true;
      }

      return res.json({ following });
    } catch (error) {
      console.error('[ClubController.toggleFollow]', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  static async getFollowStats(req: Request, res: Response) {
    try {
      const { id: clubId } = req.params;
      const userId = (req as any).user?.id;

      const followersCount = await prisma.clubFollow.count({
        where: { clubId },
      });

      let isFollowing = false;
      if (userId) {
        const follow = await prisma.clubFollow.findUnique({
          where: {
            userId_clubId: {
              userId,
              clubId,
            },
          },
        });
        isFollowing = !!follow;
      }

      return res.json({
        followers: followersCount,
        isFollowing,
      });
    } catch (error) {
      console.error('[ClubController.getFollowStats]', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}
