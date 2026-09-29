import type { ClubScopedRole } from '../config/constants';
import { clubScopedRoles } from '../config/constants';

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST JOIN (auto-inscription à un club)
// ═══════════════════════════════════════════════════════════════════════════

export interface RequestJoinInput {
    role?: ClubScopedRole;
    message?: string;
}

const DEFAULT_REQUEST_ROLE: ClubScopedRole = 'PLAYER';

/**
 * Rôles autorisés pour une DEMANDE (auto-inscription).
 * Un user ne peut pas demander à devenir PRESIDENT ou CLUB_ADMIN directement.
 */
const REQUESTABLE_ROLES: ClubScopedRole[] = ['PLAYER', 'COACH', 'TREASURER', 'MEMBER'];

export const validateRequestJoinInput = (
    body: any
): { valid: boolean; error?: string; data?: RequestJoinInput } => {
    const { role, message } = body ?? {};

    // Rôle optionnel (défaut PLAYER)
    let requestedRole: ClubScopedRole = DEFAULT_REQUEST_ROLE;
    if (role !== undefined) {
        if (typeof role !== 'string') {
            return { valid: false, error: 'Le rôle demandé est invalide.' };
        }
        const normalized = role.toUpperCase() as ClubScopedRole;
        if (!REQUESTABLE_ROLES.includes(normalized)) {
            return {
                valid: false,
                error: `Rôle non autorisé pour une demande. Valeurs possibles : ${REQUESTABLE_ROLES.join(', ')}.`,
            };
        }
        requestedRole = normalized;
    }

    const trimmedMessage =
        typeof message === 'string' ? message.trim().slice(0, 500) : undefined;

    return {
        valid: true,
        data: {
            role: requestedRole,
            message: trimmedMessage || undefined,
        },
    };
};

// ═══════════════════════════════════════════════════════════════════════════
// INVITE MEMBER (invitation par admin club)
// ═══════════════════════════════════════════════════════════════════════════

export interface InviteMemberInput {
    email: string;
    name: string;
    role: ClubScopedRole;
    /** Optionnel : numéro de maillot si role = PLAYER */
    jerseyNumber?: number;
    /** Optionnel : position si role = PLAYER */
    position?: string;
    /** Optionnel : message d'accompagnement */
    message?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateInviteMemberInput = (
    body: any
): { valid: boolean; error?: string; data?: InviteMemberInput } => {
    const { email, name, role, jerseyNumber, position, message } = body ?? {};

    // ─── Email ────────────────────────────────────────────────────────────
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        return { valid: false, error: 'Email valide obligatoire.' };
    }

    // ─── Nom ──────────────────────────────────────────────────────────────
    if (!name || typeof name !== 'string' || !name.trim()) {
        return { valid: false, error: 'Le nom complet est obligatoire.' };
    }

    // ─── Rôle ─────────────────────────────────────────────────────────────
    if (!role || typeof role !== 'string') {
        return { valid: false, error: 'Rôle obligatoire.' };
    }
    const normalizedRole = role.toUpperCase() as ClubScopedRole;
    if (!clubScopedRoles.includes(normalizedRole)) {
        return {
            valid: false,
            error: `Rôle invalide. Valeurs possibles : ${clubScopedRoles.join(', ')}.`,
        };
    }

    // ─── Champs joueur (optionnels) ───────────────────────────────────────
    let parsedJerseyNumber: number | undefined;
    if (jerseyNumber !== undefined && jerseyNumber !== null && jerseyNumber !== '') {
        const num = Number(jerseyNumber);
        if (!Number.isInteger(num) || num < 0 || num > 99) {
            return { valid: false, error: 'Le numéro de maillot doit être entre 0 et 99.' };
        }
        parsedJerseyNumber = num;
    }

    const trimmedPosition =
        typeof position === 'string' ? position.trim().slice(0, 50) : undefined;

    const trimmedMessage =
        typeof message === 'string' ? message.trim().slice(0, 500) : undefined;

    return {
        valid: true,
        data: {
            email: email.trim().toLowerCase(),
            name: name.trim(),
            role: normalizedRole,
            jerseyNumber: parsedJerseyNumber,
            position: trimmedPosition || undefined,
            message: trimmedMessage || undefined,
        },
    };
};

// ═══════════════════════════════════════════════════════════════════════════
// REJECT / SUSPEND
// ═══════════════════════════════════════════════════════════════════════════

export interface ReasonInput {
    reason: string;
}

export const validateReasonInput = (
    body: any
): { valid: boolean; error?: string; data?: ReasonInput } => {
    const { reason } = body ?? {};

    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
        return {
            valid: false,
            error: 'Une raison valide (min. 3 caractères) est obligatoire.',
        };
    }

    return {
        valid: true,
        data: { reason: reason.trim().slice(0, 500) },
    };
};