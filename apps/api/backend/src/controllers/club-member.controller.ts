import { Request, Response } from 'express';
import { ClubMemberService } from '../services/club-member.service';
import {
    validateRequestJoinInput,
    validateInviteMemberInput,
    validateReasonInput,
} from '../validators/club-member.validator';
import { AuthenticatedUser } from '../types';
import { AppError } from '../utils/errors';
import Logger from '../utils/logger';
import type { ClubMemberStatus } from '../config/constants';

const VALID_STATUSES: ClubMemberStatus[] = [
    'PENDING',
    'ACTIVE',
    'REJECTED',
    'SUSPENDED',
];

export class ClubMemberController {
    /**
     * POST /clubs/:id/members/request
     * Auto-inscription : n'importe quel user connecté peut demander à rejoindre un club.
     */
    static async requestJoin(req: Request, res: Response) {
        const user = (req as any).user as AuthenticatedUser;
        const { id: clubId } = req.params;

        const validation = validateRequestJoinInput(req.body);
        if (!validation.valid || !validation.data) {
            return res.status(400).json({ error: validation.error || 'Données invalides.' });
        }

        try {
            const member = await ClubMemberService.requestJoin(clubId, user.id, validation.data);
            return res.status(201).json({
                member,
                message: 'Votre demande a été transmise aux administrateurs du club.',
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            Logger.error('requestJoin error', 'ClubMemberController', { error: error.message });
            return res.status(500).json({ error: 'Erreur lors de la demande d’adhésion.' });
        }
    }

    /**
     * GET /clubs/:id/members
     * Liste tous les membres avec filtre par status (query ?status=ACTIVE).
     */
    static async listMembers(req: Request, res: Response) {
        const { id: clubId } = req.params;
        const statusQuery = req.query.status;

        let filterStatus: ClubMemberStatus | undefined;
        if (typeof statusQuery === 'string') {
            const upper = statusQuery.toUpperCase() as ClubMemberStatus;
            if (VALID_STATUSES.includes(upper)) filterStatus = upper;
        }

        try {
            const members = await ClubMemberService.listMembers(clubId, {
                status: filterStatus,
            });
            return res.json(members);
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            Logger.error('listMembers error', 'ClubMemberController', { error: error.message });
            return res.status(500).json({ error: 'Erreur lors du chargement des membres.' });
        }
    }

    /**
     * GET /clubs/:id/members/pending
     * Liste uniquement les demandes en attente.
     */
    static async listPending(req: Request, res: Response) {
        const { id: clubId } = req.params;
        try {
            const members = await ClubMemberService.listPendingRequests(clubId);
            return res.json(members);
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            Logger.error('listPending error', 'ClubMemberController', { error: error.message });
            return res.status(500).json({ error: 'Erreur lors du chargement des demandes.' });
        }
    }

    /**
     * PATCH /clubs/:id/members/:userId/approve
     */
    static async approve(req: Request, res: Response) {
        const user = (req as any).user as AuthenticatedUser;
        const { id: clubId, userId } = req.params;

        try {
            const updated = await ClubMemberService.approveMember(clubId, userId, user.id);
            return res.json(updated);
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            Logger.error('approve error', 'ClubMemberController', { error: error.message });
            return res.status(500).json({ error: 'Erreur lors de l’approbation.' });
        }
    }

    /**
     * PATCH /clubs/:id/members/:userId/reject
     */
    static async reject(req: Request, res: Response) {
        const user = (req as any).user as AuthenticatedUser;
        const { id: clubId, userId } = req.params;

        const validation = validateReasonInput(req.body);
        if (!validation.valid || !validation.data) {
            return res.status(400).json({ error: validation.error || 'Raison obligatoire.' });
        }

        try {
            const updated = await ClubMemberService.rejectMember(
                clubId,
                userId,
                validation.data.reason,
                user.id
            );
            return res.json(updated);
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            Logger.error('reject error', 'ClubMemberController', { error: error.message });
            return res.status(500).json({ error: 'Erreur lors du rejet.' });
        }
    }

    /**
     * PATCH /clubs/:id/members/:userId/suspend
     */
    static async suspend(req: Request, res: Response) {
        const user = (req as any).user as AuthenticatedUser;
        const { id: clubId, userId } = req.params;

        const validation = validateReasonInput(req.body);
        if (!validation.valid || !validation.data) {
            return res.status(400).json({ error: validation.error || 'Raison obligatoire.' });
        }

        try {
            const updated = await ClubMemberService.suspendMember(
                clubId,
                userId,
                validation.data.reason,
                user.id
            );
            return res.json(updated);
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            Logger.error('suspend error', 'ClubMemberController', { error: error.message });
            return res.status(500).json({ error: 'Erreur lors de la suspension.' });
        }
    }

    /**
     * DELETE /clubs/:id/members/:userId
     */
    static async remove(req: Request, res: Response) {
        const user = (req as any).user as AuthenticatedUser;
        const { id: clubId, userId } = req.params;

        try {
            const result = await ClubMemberService.removeMember(clubId, userId, user.id);
            return res.json(result);
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            Logger.error('remove error', 'ClubMemberController', { error: error.message });
            return res.status(500).json({ error: 'Erreur lors du retrait.' });
        }
    }

    /**
     * POST /clubs/:id/members/invite
     * L'admin invite un nouveau membre. Retourne un mot de passe temporaire
     * à afficher UNE SEULE FOIS.
     */
    static async invite(req: Request, res: Response) {
        const user = (req as any).user as AuthenticatedUser;
        const { id: clubId } = req.params;

        const validation = validateInviteMemberInput(req.body);
        if (!validation.valid || !validation.data) {
            return res.status(400).json({ error: validation.error || 'Données invalides.' });
        }

        try {
            const result = await ClubMemberService.inviteMember(
                clubId,
                user.id,
                validation.data
            );
            return res.status(201).json({
                member: result.member,
                isNewUser: result.isNewUser,
                // ⚠️ À afficher une seule fois côté UI
                tempPassword: result.tempPassword,
                message: result.isNewUser
                    ? 'Utilisateur créé et ajouté au club. Transmettez le mot de passe temporaire.'
                    : 'Utilisateur existant ajouté au club.',
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            Logger.error('invite error', 'ClubMemberController', { error: error.message });
            return res.status(500).json({ error: 'Erreur lors de l’invitation.' });
        }
    }
}