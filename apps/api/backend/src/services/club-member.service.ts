import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { pushNotificationToUser } from './socketServer.service';
import { ClubService } from './club.service';
import { AppError } from '../utils/errors';
import Logger from '../utils/logger';
import type {
    ClubScopedRole,
    ClubMemberStatus,
} from '../config/constants';
import type {
    RequestJoinInput,
    InviteMemberInput,
} from '../validators/club-member.validator';

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Sélection Prisma standard pour un membre avec son user. */
const MEMBER_INCLUDE = {
    user: {
        select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            isSuspended: true,
            createdAt: true,
        },
    },
} as const;

/** Génère un mot de passe temporaire (12 caractères). */
function generateTempPassword(): string {
    return randomBytes(6).toString('base64url').slice(0, 12);
}

/**
 * Crée une notification en DB et la pousse en temps réel.
 * Ne bloque jamais si le push échoue.
 */
async function notifyMember(
    userId: string,
    payload: {
        type: string;
        title: string;
        text: string;
        meta?: Record<string, unknown>;
    }
): Promise<void> {
    try {
        const notif = await prisma.notification.create({
            data: {
                userId,
                type: payload.type,
                title: payload.title,
                text: payload.text,
                read: false,
            },
        });
        pushNotificationToUser(userId, {
            id: notif.id,
            type: notif.type,
            title: notif.title,
            text: notif.text,
            read: notif.read,
            createdAt: notif.createdAt.toISOString(),
            meta: payload.meta,
        });
    } catch (err) {
        Logger.warn('[ClubMemberService] Notification échouée', 'notifyMember', {
            error: (err as Error).message,
        });
    }
}

/** Vérifie qu'un club existe, sinon throw 404. */
async function ensureClubExists(clubId: string) {
    const club = await prisma.club.findUnique({
        where: { id: clubId },
        select: { id: true, name: true },
    });
    if (!club) throw new AppError('Club introuvable.', 404);
    return club;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export class ClubMemberService {
    /**
     * CAS A — Auto-inscription : un user connecté demande à rejoindre un club.
     * Crée une entrée ClubMember avec status PENDING.
     * Notifie tous les admins du club.
     */
    static async requestJoin(clubId: string, userId: string, input: RequestJoinInput) {
        const club = await ensureClubExists(clubId);

        // Vérifier que l'user n'est pas déjà membre (peu importe le status)
        const existing = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId, userId } },
        });

        if (existing) {
            if (existing.status === 'PENDING') {
                throw new AppError('Vous avez déjà une demande en attente pour ce club.', 409);
            }
            if (existing.status === 'ACTIVE') {
                throw new AppError('Vous êtes déjà membre actif de ce club.', 409);
            }
            if (existing.status === 'REJECTED') {
                // On autorise une nouvelle demande après rejet : on update le statut
                const updated = await prisma.clubMember.update({
                    where: { id: existing.id },
                    data: {
                        status: 'PENDING',
                        role: input.role ?? 'PLAYER',
                        requestedAt: new Date(),
                        rejectionReason: null,
                        approvedAt: null,
                        approvedById: null,
                    },
                    include: MEMBER_INCLUDE,
                });
                await ClubMemberService._notifyClubAdmins(clubId, userId, input, club.name);
                return updated;
            }
            if (existing.status === 'SUSPENDED') {
                throw new AppError('Votre adhésion a été suspendue. Contactez un administrateur.', 403);
            }
        }

        // Création initiale
        const member = await prisma.clubMember.create({
            data: {
                clubId,
                userId,
                role: input.role ?? 'PLAYER',
                status: 'PENDING',
                requestedAt: new Date(),
            },
            include: MEMBER_INCLUDE,
        });

        await ClubMemberService._notifyClubAdmins(clubId, userId, input, club.name);

        return member;
    }

    /** Notifie tous les admins actifs du club d'une nouvelle demande. */
    private static async _notifyClubAdmins(
        clubId: string,
        requesterId: string,
        input: RequestJoinInput,
        clubName: string
    ) {
        const requester = await prisma.user.findUnique({
            where: { id: requesterId },
            select: { name: true },
        });

        const admins = await prisma.clubMember.findMany({
            where: {
                clubId,
                status: 'ACTIVE',
                role: { in: ['PRESIDENT', 'CLUB_ADMIN'] },
            },
            select: { userId: true },
        });

        const requesterName = requester?.name || 'Un utilisateur';
        const roleLabel = input.role ?? 'PLAYER';

        await Promise.all(
            admins.map((admin) =>
                notifyMember(admin.userId, {
                    type: 'MEMBERSHIP_REQUEST',
                    title: 'Nouvelle demande d’adhésion',
                    text: `${requesterName} souhaite rejoindre ${clubName} en tant que ${roleLabel}.`,
                    meta: { clubId, requesterId, requestedRole: roleLabel },
                })
            )
        );
    }

    /**
     * Liste les membres d'un club avec filtres optionnels.
     */
    static async listMembers(
        clubId: string,
        filters: { status?: ClubMemberStatus } = {}
    ) {
        await ensureClubExists(clubId);

        return prisma.clubMember.findMany({
            where: {
                clubId,
                ...(filters.status ? { status: filters.status } : {}),
            },
            orderBy: [
                { status: 'asc' },
                { requestedAt: 'desc' },
            ],
            include: MEMBER_INCLUDE,
        });
    }

    /** Raccourci : uniquement les PENDING. */
    static async listPendingRequests(clubId: string) {
        return ClubMemberService.listMembers(clubId, { status: 'PENDING' });
    }

    /**
     * Approuve une demande (PENDING → ACTIVE).
     */
    static async approveMember(
        clubId: string,
        targetUserId: string,
        approverId: string
    ) {
        await ensureClubExists(clubId);

        const member = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId, userId: targetUserId } },
        });
        if (!member) throw new AppError('Membre introuvable.', 404);
        if (member.status === 'ACTIVE') {
            throw new AppError('Ce membre est déjà actif.', 409);
        }

        const club = await prisma.club.findUnique({
            where: { id: clubId },
            select: { name: true },
        });

        const updated = await prisma.clubMember.update({
            where: { id: member.id },
            data: {
                status: 'ACTIVE',
                approvedAt: new Date(),
                approvedById: approverId,
                joinedAt: new Date(),
                rejectionReason: null,
            },
            include: MEMBER_INCLUDE,
        });

        await notifyMember(targetUserId, {
            type: 'MEMBERSHIP_APPROVED',
            title: 'Adhésion approuvée',
            text: `Votre demande pour rejoindre ${club?.name || 'le club'} a été approuvée. Bienvenue !`,
            meta: { clubId },
        });

        return updated;
    }

    /**
     * Rejette une demande (PENDING → REJECTED).
     */
    static async rejectMember(
        clubId: string,
        targetUserId: string,
        reason: string,
        approverId: string
    ) {
        await ensureClubExists(clubId);

        const member = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId, userId: targetUserId } },
        });
        if (!member) throw new AppError('Membre introuvable.', 404);
        if (member.status !== 'PENDING') {
            throw new AppError('Seules les demandes en attente peuvent être rejetées.', 409);
        }

        const club = await prisma.club.findUnique({
            where: { id: clubId },
            select: { name: true },
        });

        const updated = await prisma.clubMember.update({
            where: { id: member.id },
            data: {
                status: 'REJECTED',
                rejectionReason: reason,
                approvedAt: new Date(),
                approvedById: approverId,
            },
            include: MEMBER_INCLUDE,
        });

        await notifyMember(targetUserId, {
            type: 'MEMBERSHIP_REJECTED',
            title: 'Demande refusée',
            text: `Votre demande pour rejoindre ${club?.name || 'le club'} a été refusée. Raison : ${reason}`,
            meta: { clubId, reason },
        });

        return updated;
    }

    /**
     * Suspend un membre (ACTIVE → SUSPENDED).
     */
    static async suspendMember(
        clubId: string,
        targetUserId: string,
        reason: string,
        approverId: string
    ) {
        await ensureClubExists(clubId);

        const member = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId, userId: targetUserId } },
        });
        if (!member) throw new AppError('Membre introuvable.', 404);
        if (member.status !== 'ACTIVE') {
            throw new AppError('Seuls les membres actifs peuvent être suspendus.', 409);
        }

        const club = await prisma.club.findUnique({
            where: { id: clubId },
            select: { name: true },
        });

        const updated = await prisma.clubMember.update({
            where: { id: member.id },
            data: {
                status: 'SUSPENDED',
                rejectionReason: reason,
                approvedById: approverId,
            },
            include: MEMBER_INCLUDE,
        });

        await notifyMember(targetUserId, {
            type: 'MEMBERSHIP_SUSPENDED',
            title: 'Adhésion suspendue',
            text: `Votre adhésion à ${club?.name || 'le club'} a été suspendue. Raison : ${reason}`,
            meta: { clubId, reason },
        });

        return updated;
    }

    /**
     * Retire un membre (delete pur, toutes status confondus).
     */
    static async removeMember(
        clubId: string,
        targetUserId: string,
        approverId: string
    ) {
        await ensureClubExists(clubId);

        const member = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId, userId: targetUserId } },
        });
        if (!member) throw new AppError('Membre introuvable.', 404);

        // Empêcher l'auto-retrait du dernier PRESIDENT
        if (member.role === 'PRESIDENT') {
            const otherPresidents = await prisma.clubMember.count({
                where: {
                    clubId,
                    role: 'PRESIDENT',
                    status: 'ACTIVE',
                    userId: { not: targetUserId },
                },
            });
            if (otherPresidents === 0) {
                throw new AppError(
                    'Impossible de retirer le dernier président du club.',
                    403
                );
            }
        }

        await prisma.clubMember.delete({ where: { id: member.id } });

        const club = await prisma.club.findUnique({
            where: { id: clubId },
            select: { name: true },
        });

        await notifyMember(targetUserId, {
            type: 'MEMBERSHIP_REMOVED',
            title: 'Retrait du club',
            text: `Vous avez été retiré de ${club?.name || 'le club'}.`,
            meta: { clubId, removedBy: approverId },
        });

        return { success: true, message: 'Membre retiré.' };
    }

    /**
     * CAS B — Invitation par admin club.
     * - Si l'user existe → on ajoute juste le ClubMember ACTIVE.
     * - Sinon → on crée l'user avec un mot de passe temporaire.
     * Retourne aussi le mot de passe temporaire (en clair) UNE SEULE FOIS
     * pour que l'admin puisse le communiquer au nouveau membre.
     */
    static async inviteMember(
        clubId: string,
        inviterId: string,
        input: InviteMemberInput
    ) {
        const club = await ensureClubExists(clubId);

        // ─── 1. User déjà existant ? ─────────────────────────────────────────
        let user = await prisma.user.findUnique({
            where: { email: input.email },
            select: { id: true, name: true },
        });

        let tempPassword: string | null = null;

        if (!user) {
            // Créer un nouvel user avec mot de passe temporaire
            tempPassword = generateTempPassword();
            const passwordHash = await bcrypt.hash(tempPassword, 10);

            user = await prisma.user.create({
                data: {
                    email: input.email,
                    name: input.name,
                    passwordHash,
                    role: 'PLAYER', // rôle plateforme par défaut (sera affiné par l'invitation)
                    country: 'Togo',
                },
                select: { id: true, name: true },
            });

            Logger.info(
                `[ClubMemberService] Nouvel utilisateur créé via invitation : ${input.email}`,
                'inviteMember',
                { clubId, inviterId }
            );
        }

        // ─── 2. Vérifier qu'il n'est pas déjà membre ─────────────────────────
        const existing = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId, userId: user.id } },
        });
        if (existing) {
            throw new AppError(
                `Ce membre est déjà dans le club (statut : ${existing.status}).`,
                409
            );
        }

        // ─── 3. Créer le ClubMember ACTIVE (invitation = pré-approuvée) ──────
        const member = await prisma.clubMember.create({
            data: {
                clubId,
                userId: user.id,
                role: input.role,
                status: 'ACTIVE',
                requestedAt: new Date(),
                joinedAt: new Date(),
                approvedAt: new Date(),
                approvedById: inviterId,
            },
            include: MEMBER_INCLUDE,
        });

        // ─── 4. Notifier l'utilisateur ───────────────────────────────────────
        await notifyMember(user.id, {
            type: 'MEMBERSHIP_INVITED',
            title: 'Vous avez été invité dans un club',
            text: `Vous avez été ajouté à ${club.name} en tant que ${input.role}.`,
            meta: { clubId, invitedBy: inviterId },
        });

        return {
            member,
            /** ⚠️ À afficher UNE SEULE FOIS à l'admin — ne jamais logger. */
            tempPassword,
            isNewUser: Boolean(tempPassword),
        };
    }
}