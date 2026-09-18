import { Request, Response, NextFunction } from 'express';
import { ClubService } from '../services/club.service';
import { prisma } from '../config/database';
import { AuthenticatedUser } from '../types';

/** Grants club management only to the club PRESIDENT/CLUB_ADMIN or the platform SUPER_ADMIN. */
export const requireClubManager = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as AuthenticatedUser | undefined;
  const clubId = req.params.id || req.params.clubId || req.body?.clubId;
  if (!user || !clubId) return res.status(400).json({ error: 'Club cible manquant.' });
  try {
    if (await ClubService.isClubManager(clubId, user.id, user.role)) return next();
    return res.status(403).json({ error: 'Vous ne gérez pas ce club.' });
  } catch { return res.status(500).json({ error: 'Contrôle d’accès au club impossible.' }); }
};

const authorizeClub = async (req: Request, res: Response, next: NextFunction, clubId?: string | null) => {
  const user = (req as any).user as AuthenticatedUser | undefined;
  if (!user || !clubId) return res.status(400).json({ error: 'Cette action doit être rattachée à un club.' });
  try {
    if (await ClubService.isClubManager(clubId, user.id, user.role)) return next();
    return res.status(403).json({ error: 'Vous ne gérez pas le club concerné.' });
  } catch { return res.status(500).json({ error: 'Contrôle d’accès au club impossible.' }); }
};

/** Resolve a team (body.teamId for creation, :id for updates) to its owning club. */
export const requireTeamManager = async (req: Request, res: Response, next: NextFunction) => {
  const teamId = req.body?.teamId || req.body?.requesterTeamId || (req.method === 'POST' ? undefined : req.params.id);
  const explicitClubId = req.body?.clubId;
  if (explicitClubId) return authorizeClub(req, res, next, explicitClubId);
  if (!teamId) return res.status(400).json({ error: 'Équipe ou club cible manquant.' });
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { clubId: true } }).catch(() => null);
  return authorizeClub(req, res, next, team?.clubId);
};

/** Resolve an existing match or its team/club at creation time. */
export const requireMatchManager = async (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' && (req.body?.clubId || req.body?.teamId)) {
    if (req.body.clubId) return authorizeClub(req, res, next, req.body.clubId);
    const team = await prisma.team.findUnique({ where: { id: req.body.teamId }, select: { clubId: true } }).catch(() => null);
    return authorizeClub(req, res, next, team?.clubId);
  }
  const match = await prisma.match.findUnique({ where: { id: req.params.id }, select: { clubId: true, team: { select: { clubId: true } } } }).catch(() => null);
  return authorizeClub(req, res, next, match?.clubId || match?.team?.clubId);
};

/** A community post is unrestricted; a post published in a club requires managing that club. */
export const requireClubPublisher = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body?.clubId) return next();
  return authorizeClub(req, res, next, req.body.clubId);
};

/** Grants access to a club space to one of its members (or platform SUPER_ADMIN). */
export const requireClubMember = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as AuthenticatedUser | undefined;
  const clubId = req.params.clubId || req.query.clubId || req.body?.clubId;
  if (!user || typeof clubId !== 'string') return res.status(400).json({ error: 'Club cible manquant.' });
  if (user.role === 'SUPER_ADMIN') return next();
  const membership = await prisma.clubMember.findUnique({ where: { clubId_userId: { clubId, userId: user.id } } }).catch(() => null);
  return membership ? next() : res.status(403).json({ error: 'Vous n’appartenez pas à ce club.' });
};

/** Club posts are private to members for reactions and comments. Community posts stay public. */
export const requirePostClubMember = async (req: Request, res: Response, next: NextFunction) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id }, select: { clubId: true } }).catch(() => null);
  if (!post) return res.status(404).json({ error: 'Publication introuvable.' });
  if (!post.clubId) return next();
  req.params.clubId = post.clubId;
  return requireClubMember(req, res, next);
};
