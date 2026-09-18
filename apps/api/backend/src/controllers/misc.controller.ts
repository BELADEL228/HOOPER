import { Request, Response } from 'express';
import { MiscService } from '../services/misc.service';
import { AuthenticatedUser } from '../types';

export class MiscController {
  static async listNotifications(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    try {
      const notifs = await MiscService.listNotifications(user.id);
      return res.json(notifs);
    } catch {
      return res.status(500).json({ error: 'Erreur lors du chargement des notifications.' });
    }
  }

  static async markAllNotificationsRead(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    try {
      await MiscService.markAllNotificationsRead(user.id);
      return res.json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour des notifications.' });
    }
  }

  static async listGeneralMessages(req: Request, res: Response) {
    try {
      const messages = await MiscService.listGeneralMessages(String(req.query.clubId));
      return res.json(messages);
    } catch {
      return res.status(500).json({ error: 'Erreur lors du chargement des messages.' });
    }
  }

  static async sendGeneralMessage(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const { text, mediaUrl } = req.body ?? {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Le message ne peut pas être vide.' });
    }
    try {
      const msg = await MiscService.sendGeneralMessage(user.id, String(req.body.clubId), text.trim(), mediaUrl);
      return res.status(201).json(msg);
    } catch {
      return res.status(500).json({ error: 'Erreur lors de l’envoi du message.' });
    }
  }

  static async listTournaments(_req: Request, res: Response) {
    try {
      const tournaments = await MiscService.listTournaments();
      return res.json(tournaments);
    } catch {
      return res.status(500).json({ error: 'Erreur lors du chargement des tournois.' });
    }
  }

  static async createTournament(req: Request, res: Response) {
    try {
      const tournament = await MiscService.createTournament(req.body);
      return res.status(201).json(tournament);
    } catch {
      return res.status(500).json({ error: 'Erreur lors de la création du tournoi.' });
    }
  }

  static async listRecruitment(_req: Request, res: Response) {
    try {
      const posts = await MiscService.listRecruitmentPosts();
      return res.json(posts);
    } catch {
      return res.status(500).json({ error: 'Erreur lors du chargement des annonces.' });
    }
  }

  static async createRecruitment(req: Request, res: Response) {
    try {
      const post = await MiscService.createRecruitmentPost(req.body);
      return res.status(201).json(post);
    } catch {
      return res.status(500).json({ error: 'Erreur lors de la création de l’annonce.' });
    }
  }

  static async applyRecruitment(req: Request, res: Response) {
    const { id } = req.params;
    const { playerProfileId, message } = req.body ?? {};
    try {
      const app = await MiscService.applyToRecruitment(id, playerProfileId, message);
      return res.status(201).json(app);
    } catch {
      return res.status(500).json({ error: 'Erreur lors de la candidature.' });
    }
  }

  static async listScoutShortlist(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    try {
      const list = await MiscService.listScoutShortlist(user.id);
      return res.json(list);
    } catch {
      return res.status(500).json({ error: 'Erreur lors du chargement de la shortlist.' });
    }
  }

  static async addToScoutShortlist(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const { playerProfileId, notes } = req.body ?? {};
    try {
      const entry = await MiscService.addToScoutShortlist(user.id, playerProfileId, notes);
      return res.status(201).json(entry);
    } catch {
      return res.status(500).json({ error: 'Erreur lors de l’ajout à la shortlist.' });
    }
  }

  static async removeFromScoutShortlist(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const { playerProfileId } = req.params;
    try {
      await MiscService.removeFromScoutShortlist(user.id, playerProfileId);
      return res.json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Erreur lors de la suppression.' });
    }
  }

  static async listBadges(_req: Request, res: Response) {
    try {
      const badges = await MiscService.listBadges();
      return res.json(badges);
    } catch {
      return res.status(500).json({ error: 'Erreur lors du chargement des badges.' });
    }
  }

  static async listPlayerBadges(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const badges = await MiscService.listPlayerBadges(id);
      return res.json(badges);
    } catch {
      return res.status(500).json({ error: 'Erreur lors du chargement des badges.' });
    }
  }

  static async awardBadge(req: Request, res: Response) {
    const { id } = req.params;
    const { badgeId, note } = req.body ?? {};
    try {
      const awarded = await MiscService.awardBadge(id, badgeId, note);
      return res.status(201).json(awarded);
    } catch {
      return res.status(500).json({ error: 'Erreur lors de l’attribution du badge.' });
    }
  }

  static async listVenues(req: Request, res: Response) {
    const city = typeof req.query.city === 'string' ? req.query.city : undefined;
    try {
      const venues = await MiscService.listVenues(city);
      return res.json(venues);
    } catch {
      return res.status(500).json({ error: 'Erreur lors du chargement des terrains.' });
    }
  }

  static async createVenue(req: Request, res: Response) {
    try {
      const venue = await MiscService.createVenue(req.body);
      return res.status(201).json(venue);
    } catch {
      return res.status(500).json({ error: 'Erreur lors de la création du terrain.' });
    }
  }

  static async listPlayers(_req: Request, res: Response) {
    try {
      const players = await MiscService.listPlayers();
      return res.json(players);
    } catch {
      return res.status(500).json({ error: 'Erreur lors du chargement des joueurs.' });
    }
  }

  static async createPlayer(req: Request, res: Response) {
    try {
      const player = await MiscService.createPlayerProfile(req.body);
      return res.status(201).json(player);
    } catch {
      return res.status(500).json({ error: 'Erreur lors de la création du joueur.' });
    }
  }

  static async updatePlayer(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const updated = await MiscService.updatePlayerProfile(id, req.body);
      return res.json(updated);
    } catch {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
    }
  }

  static async deletePlayer(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await MiscService.deletePlayerProfile(id);
      return res.json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Erreur lors de la suppression.' });
    }
  }

  static async listAcademyApplications(_req: Request, res: Response) {
    try {
      const apps = await MiscService.listAcademyApplications();
      return res.json(apps);
    } catch {
      return res.status(500).json({ error: 'Erreur lors du chargement des candidatures.' });
    }
  }

  static async applyToAcademy(req: Request, res: Response) {
    try {
      const app = await MiscService.applyToAcademy(req.body);
      return res.status(201).json(app);
    } catch {
      return res.status(500).json({ error: 'Erreur lors de la candidature.' });
    }
  }

  static async listSponsors(_req: Request, res: Response) {
    try {
      const sponsors = await MiscService.listSponsors();
      return res.json(sponsors);
    } catch {
      return res.status(500).json({ error: 'Erreur lors du chargement des sponsors.' });
    }
  }

  static async createSponsorshipRequest(req: Request, res: Response) {
    const { sponsorId, teamId, ...data } = req.body ?? {};
    try {
      const request = await MiscService.createSponsorshipRequest(sponsorId, teamId, data);
      return res.status(201).json(request);
    } catch {
      return res.status(500).json({ error: 'Erreur lors de la création de la demande de sponsoring.' });
    }
  }

  static async updateApplicationStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body ?? {};
    if (!status || !['PENDING', 'ACCEPTED', 'DECLINED'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide.' });
    }
    try {
      const app = await MiscService.updateApplicationStatus(id, status);
      return res.json(app);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erreur lors de la mise à jour de la candidature.' });
    }
  }

  static async toggleFollow(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const { id } = req.params;
    try {
      const result = await MiscService.toggleFollow(user.id, id);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Erreur lors du suivi.' });
    }
  }

  static async createReport(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    try {
      const report = await MiscService.createReport(user.id, req.body ?? {});
      return res.status(201).json({ success: true, report, message: 'Signalement enregistré pour modération.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erreur lors de l’enregistrement du signalement.' });
    }
  }

  static async listClubFinances(req: Request, res: Response) {
    const clubId = req.params.id || req.query.clubId;
    if (!clubId) return res.status(400).json({ error: 'ClubId manquant.' });
    try {
      const transactions = await MiscService.listClubTransactions(String(clubId));
      return res.json(transactions);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erreur lors du chargement des transactions.' });
    }
  }

  static async createClubFinance(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const clubId = req.params.id || req.body?.clubId;
    if (!clubId) return res.status(400).json({ error: 'ClubId manquant.' });
    try {
      const tx = await MiscService.createClubTransaction(String(clubId), user?.id || null, req.body ?? {});
      return res.status(201).json(tx);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erreur lors de la création de la transaction.' });
    }
  }

  static async listClubEvents(req: Request, res: Response) {
    const clubId = req.params.id || req.query.clubId;
    if (!clubId) return res.status(400).json({ error: 'ClubId manquant.' });
    try {
      const events = await MiscService.listClubEvents(String(clubId));
      return res.json(events);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erreur lors du chargement des événements.' });
    }
  }

  static async createClubEvent(req: Request, res: Response) {
    const clubId = req.params.id || req.body?.clubId;
    if (!clubId) return res.status(400).json({ error: 'ClubId manquant.' });
    try {
      const event = await MiscService.createClubEvent(String(clubId), req.body ?? {});
      return res.status(201).json(event);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erreur lors de la création de l’événement.' });
    }
  }
}
