import { Request, Response } from 'express';
import { LiveService } from '../services/live.service';
import { AuthenticatedUser } from '../types';

export class LiveController {

  // POST /lives
  static async createSession(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    try {
      const session = await LiveService.createSession(user.id, req.body);
      return res.status(201).json(session);
    } catch (err: any) {
      console.error('[LiveController.createSession]', err);
      return res.status(err.statusCode || 500).json({ error: err.message || 'Erreur serveur.' });
    }
  }

  // GET /lives
  static async listSessions(req: Request, res: Response) {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const clubId = typeof req.query.clubId === 'string' ? req.query.clubId : undefined;
      const hostId = typeof req.query.hostId === 'string' ? req.query.hostId : undefined;
      const limit = Number(req.query.limit) || 20;
      const offset = Number(req.query.offset) || 0;

      const sessions = await LiveService.listSessions({ status, clubId, hostId, limit, offset });
      return res.json(sessions);
    } catch (err: any) {
      console.error('[LiveController.listSessions]', err);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  // GET /lives/:id
  static async getSession(req: Request, res: Response) {
    try {
      const session = await LiveService.getSession(req.params.id);
      return res.json(session);
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  // PATCH /lives/:id/start
  static async startSession(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    try {
      const session = await LiveService.startSession(req.params.id, user.id);
      return res.json(session);
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  // PATCH /lives/:id/end
  static async endSession(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    try {
      const { playbackUrl } = req.body || {};
      const session = await LiveService.endSession(req.params.id, user.id, playbackUrl);
      return res.json(session);
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  // GET /lives/:id/comments
  static async getComments(req: Request, res: Response) {
    try {
      const limit = Number(req.query.limit) || 50;
      const before = typeof req.query.before === 'string' ? req.query.before : undefined;
      const comments = await LiveService.getComments(req.params.id, limit, before);
      return res.json(comments);
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  // POST /lives/:id/comments
  static async addComment(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const { text } = req.body || {};
    if (!text?.trim()) {
      return res.status(400).json({ error: 'Le message ne peut pas être vide.' });
    }
    try {
      const comment = await LiveService.addComment(req.params.id, user.id, text);
      return res.status(201).json(comment);
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}
