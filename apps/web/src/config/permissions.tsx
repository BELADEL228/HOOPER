import type { UserRole } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// GROUPES DE RÔLES RÉUTILISABLES
// ═══════════════════════════════════════════════════════════════════════════

/** Tous les rôles sans exception (inclut les rôles système). */
export const ALL_ROLES: UserRole[] = [
    'SUPER_ADMIN',
    'ADMIN',
    'CLUB_MANAGER',
    'TREASURER',
    'COACH',
    'PLAYER',
    'VISITOR',
    'SPONSOR',
    'ACADEMY_CANDIDATE',
];

/**
 * Tous les rôles qui peuvent s'inscrire et se connecter.
 * Utilisé pour les fonctionnalités sociales (DM, profil, paramètres...).
 * ⚠️ Ne pas confondre avec "authentifié" : ici c'est la liste exhaustive
 * des rôles "de base" pouvant exister côté utilisateur connecté.
 */
export const AUTHENTICATED_ROLES: UserRole[] = [
    'SUPER_ADMIN',
    'ADMIN',
    'CLUB_MANAGER',
    'TREASURER',
    'COACH',
    'PLAYER',
    'VISITOR',
    'SPONSOR',
    'ACADEMY_CANDIDATE',
];

/** Staff technique & direction d'un club (accès outils de gestion). */
export const CLUB_STAFF: UserRole[] = [
    'SUPER_ADMIN',
    'ADMIN',
    'CLUB_MANAGER',
    'TREASURER',
    'COACH',
];

/** Tous les membres d'un club (staff + joueurs). */
export const CLUB_MEMBERS: UserRole[] = [
    'SUPER_ADMIN',
    'ADMIN',
    'CLUB_MANAGER',
    'TREASURER',
    'COACH',
    'PLAYER',
];

/** Rôles ayant accès aux finances d'un club. */
export const CLUB_FINANCE_ROLES: UserRole[] = [
    'SUPER_ADMIN',
    'ADMIN',
    'CLUB_MANAGER',
    'TREASURER',
];

/** Rôles ayant accès à l'administration système de la plateforme. */
export const SYSTEM_ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN'];

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSIONS DU MODE SOCIAL (vitrine ligue, réseau communautaire)
// ═══════════════════════════════════════════════════════════════════════════
//
// 📌 Règles :
//   - Navigation publique (accueil, explorer, matchs, annuaire, etc.) : tous
//   - Fonctionnalités authentifiées (messagerie, profil, paramètres) : tout
//     utilisateur ayant un compte → un VISITOR inscrit PEUT envoyer des DM.
//   - Pas d'outils de gestion ici (finances, admin) : ces onglets n'existent
//     pas dans SocialLayout.
//
export const socialPermissions: Record<string, UserRole[]> = {
    // ── Navigation publique ────────────────────────────────────────────────
    accueil: ALL_ROLES,
    explorer: ALL_ROLES,
    stats: ALL_ROLES,
    annuaire: ALL_ROLES,
    equipes: ALL_ROLES,
    matchs: ALL_ROLES,
    tournois: ALL_ROLES,
    marketplace: ALL_ROLES,
    sponsors: ALL_ROLES,
    terrains: ALL_ROLES,
    badges: ALL_ROLES,
    scouting: ALL_ROLES,
    recrutement: ALL_ROLES,
    academie: ALL_ROLES,
    'journee-champions': ALL_ROLES,

    // ── Création de contenu (authentifié) ──────────────────────────────────
    create: AUTHENTICATED_ROLES,

    // ── Profil / compte (authentifié) ──────────────────────────────────────
    'mon-profil': AUTHENTICATED_ROLES,
    'user-profile': ALL_ROLES,
    parametres: AUTHENTICATED_ROLES,

    // ── Messagerie sociale ─────────────────────────────────────────────────
    messagerie: AUTHENTICATED_ROLES,

    // ── Pages de détail ────────────────────────────────────────────────────
    'club-profile': ALL_ROLES,
};

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSIONS DU MODE WORKSPACE (espace de gestion d'un club)
// ═══════════════════════════════════════════════════════════════════════════
//
// 📌 Règles :
//   - Outils de gestion (matchs, roster, agenda, finances...) : membres du club
//   - Messagerie interne club : membres du club UNIQUEMENT (un VISITOR externe
//     n'a rien à faire dans le canal privé du club)
//   - Finances : staff uniquement
//   - Admin plateforme : SUPER_ADMIN/ADMIN uniquement
//
export const workspacePermissions: Record<string, UserRole[]> = {
    // ── Accueil & outils club ──────────────────────────────────────────────
    accueil: CLUB_MEMBERS,
    matchs: CLUB_MEMBERS,
    stats: CLUB_MEMBERS,
    equipe: CLUB_MEMBERS,
    evenements: CLUB_MEMBERS,
    actu: CLUB_MEMBERS,
    terrains: CLUB_MEMBERS,
    marketplace: CLUB_MEMBERS,
    tournois: CLUB_MEMBERS,

    // ── Recrutement / scouting / formation ─────────────────────────────────
    recrutement: [
        'SUPER_ADMIN',
        'ADMIN',
        'CLUB_MANAGER',
        'COACH',
        'PLAYER',
        'VISITOR',
        'ACADEMY_CANDIDATE',
    ],
    scouting: ['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER', 'COACH', 'PLAYER', 'VISITOR'],
    badges: ['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER', 'COACH', 'PLAYER', 'VISITOR'],
    designer: ['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER', 'COACH', 'PLAYER'],
    academie: [
        'SUPER_ADMIN',
        'ADMIN',
        'CLUB_MANAGER',
        'COACH',
        'PLAYER',
        'ACADEMY_CANDIDATE',
        'VISITOR',
    ],
    'journee-champions': [
        'SUPER_ADMIN',
        'ADMIN',
        'CLUB_MANAGER',
        'COACH',
        'PLAYER',
        'VISITOR',
    ],

    // ── Messagerie INTERNE du club : membres uniquement ────────────────────
    // ⚠️ Contraste avec socialPermissions.messagerie qui est plus ouvert.
    messagerie: CLUB_MEMBERS,

    // ── Finances & sponsors ────────────────────────────────────────────────
    finances: CLUB_FINANCE_ROLES,
    sponsors: [
        'SUPER_ADMIN',
        'ADMIN',
        'CLUB_MANAGER',
        'TREASURER',
        'COACH',
        'PLAYER',
        'VISITOR',
        'SPONSOR',
    ],

    // ── Administration ─────────────────────────────────────────────────────
    admin: ['SUPER_ADMIN'],
    'club-admin': ['SUPER_ADMIN', 'ADMIN', 'CLUB_MANAGER'],

    // ── Profil / paramètres ────────────────────────────────────────────────
    'mon-profil': AUTHENTICATED_ROLES,
    parametres: AUTHENTICATED_ROLES,
};

// ═══════════════════════════════════════════════════════════════════════════
// ONGLETS PRIVÉS (nécessitent d'être connecté, quel que soit le mode)
// ═══════════════════════════════════════════════════════════════════════════

export const PRIVATE_TABS = new Set([
    'mon-profil',
    'parametres',
    'messagerie',
    'finances',
    'admin',
    'club-admin',
]);

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Type utilitaire : tous les modes de vue connus. */
export type PermissionMode =
    | 'social'
    | 'public'
    | 'club_workspace'
    | 'club_request'
    | 'super_admin';

/**
 * Renvoie la map de permissions associée à un mode de vue.
 * En l'absence de map dédiée (public, club_request, super_admin),
 * on retombe sur socialPermissions qui est la plus permissive.
 */
export const getPermissionsForMode = (
    mode: PermissionMode
): Record<string, UserRole[]> => {
    switch (mode) {
        case 'club_workspace':
            return workspacePermissions;
        case 'social':
        case 'public':
        case 'club_request':
        case 'super_admin':
        default:
            return socialPermissions;
    }
};

/**
 * Vérifie si un rôle a accès à un onglet donné dans un mode donné.
 * - Si l'onglet n'est pas déclaré → accès ouvert (fail-open).
 * - Sinon → le rôle doit figurer dans la liste.
 */
export const canAccessPage = (
    tab: string,
    role: UserRole,
    mode: PermissionMode = 'social',
    isAuthenticated = false
): boolean => {
    // Les onglets privés sont invisibles pour les utilisateurs non connectés
    if (PRIVATE_TABS.has(tab) && !isAuthenticated) {
        return false;
    }

    const permissions = getPermissionsForMode(mode);
    const allowed = permissions[tab];

    // Sécurité : un onglet non déclaré n'est pas accessible
    if (!allowed) {
        return false;
    }

    return allowed.includes(role);
};

/**
 * Filtre une liste d'onglets selon les permissions d'un rôle et d'un mode.
 *
 * ✅ Compatible avec n'importe quel type d'objet tab tant qu'on peut en
 *    extraire une clé. Par défaut : utilise `tab.key` OU `tab.id`.
 *
 * @example
 *   // Auto-détection de la clé (key en priorité, puis id)
 *   filterAccessibleTabs(tabs, role, 'social');
 *
 *   // Avec un extracteur custom
 *   filterAccessibleTabs(tabs, role, 'social', (t) => t.slug);
 */
export const filterAccessibleTabs = <T,>(
    tabs: T[],
    role: UserRole,
    mode: PermissionMode = 'social',
    isAuthenticated = false,
    getKey: (tab: T) => string = (tab: any) => tab.key ?? tab.id ?? ''
): T[] => {
    return tabs.filter((tab) =>
        canAccessPage(
            getKey(tab),
            role,
            mode,
            isAuthenticated
        )
    );
};