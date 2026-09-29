// ═══════════════════════════════════════════════════════════════════════════
// RÔLES UTILISATEUR
// ═══════════════════════════════════════════════════════════════════════════

export type UserRole =
  | 'SUPER_ADMIN'
  | 'CLUB_ADMIN'
  | 'TREASURER'
  | 'COACH'
  | 'PLAYER'
  | 'SPONSOR'
  | 'ACADEMY_CANDIDATE'
  | 'SUPPORTER'
  | 'VISITOR';

export const userRoles: UserRole[] = [
  'SUPER_ADMIN',
  'CLUB_ADMIN',
  'TREASURER',
  'COACH',
  'PLAYER',
  'SPONSOR',
  'ACADEMY_CANDIDATE',
  'SUPPORTER',
  'VISITOR',
];

// ─── Rôles SCOPÉS au club (assignables via ClubMember.role) ─────────────────
export type ClubScopedRole =
  | 'PRESIDENT'
  | 'CLUB_ADMIN'
  | 'TREASURER'
  | 'COACH'
  | 'PLAYER'
  | 'MEMBER';

export const clubScopedRoles: ClubScopedRole[] = [
  'PRESIDENT',
  'CLUB_ADMIN',
  'TREASURER',
  'COACH',
  'PLAYER',
  'MEMBER',
];

// ─── Status ClubMember ──────────────────────────────────────────────────────
export type ClubMemberStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED';

export const clubMemberStatuses: ClubMemberStatus[] = [
  'PENDING',
  'ACTIVE',
  'REJECTED',
  'SUSPENDED',
];

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSIONS RBAC (format resource:action)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convention de nommage :
 *   resource:action        → action générale
 *   resource:action:self   → action limitée à ses propres ressources
 *   resource:action:any    → action sur n'importe quelle ressource
 *
 * Le scope club est géré séparément (voir PermissionContext).
 */
export type Permission =
  // ─── Admin plateforme ─────────────────────────────────────────────────
  | 'admin:read'
  | 'admin:write'

  // ─── Club ─────────────────────────────────────────────────────────────
  | 'club:read'
  | 'club:write'
  | 'club:delete'

  // ─── Membres du club (workflow d'approbation) ─────────────────────────
  | 'members:read'
  | 'members:approve'
  | 'members:reject'
  | 'members:suspend'
  | 'members:invite'
  | 'members:remove'
  | 'members:role:write'

  // ─── Joueurs ──────────────────────────────────────────────────────────
  | 'players:read'
  | 'players:write'
  | 'players:write:self'
  | 'players:approve'

  // ─── Matchs & tactiques ───────────────────────────────────────────────
  | 'matches:read'
  | 'matches:write'
  | 'tactics:read'
  | 'tactics:write'

  // ─── Académie ─────────────────────────────────────────────────────────
  | 'academy:read'
  | 'academy:write'
  | 'academy:apply'
  | 'academy:approve'
  | 'academy:reject'

  // ─── Finances ─────────────────────────────────────────────────────────
  | 'finance:read'
  | 'finance:write'

  // ─── Sponsors ─────────────────────────────────────────────────────────
  | 'sponsors:read'
  | 'sponsors:write'
  | 'sponsors:write:self'
  | 'sponsorships:read'
  | 'sponsorships:follow'

  // ─── Social ───────────────────────────────────────────────────────────
  | 'posts:read'
  | 'posts:write'
  | 'posts:write:self'
  | 'posts:comment'
  | 'posts:like'
  | 'statuses:read'
  | 'statuses:write:self'

  // ─── Messagerie ───────────────────────────────────────────────────────
  | 'messaging:read'
  | 'messaging:write'
  | 'messaging:rw'

  // ─── Billetterie ──────────────────────────────────────────────────────
  | 'tickets:read'
  | 'tickets:buy'
  | 'tickets:scan'

  // ─── Marketplace ──────────────────────────────────────────────────────
  | 'products:read'
  | 'products:write'
  | 'orders:read'
  | 'orders:write'
  | 'cart:write:self';

// ═══════════════════════════════════════════════════════════════════════════
// MAP RÔLE → PERMISSIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ IMPORTANT :
 * Ce map définit les permissions GLOBALES par rôle.
 * Les permissions "scoped club" sont vérifiées via `ClubMember`
 * (voir `hasPermission` dans `permission.service.ts`).
 *
 * Règle de décision :
 *   1. SUPER_ADMIN → accès total
 *   2. CLUB_ADMIN, TREASURER, COACH, PLAYER → doivent avoir un ClubMember ACTIVE
 *   3. SUPPORTER, VISITOR, SPONSOR, ACADEMY_CANDIDATE → pas de scope club
 */
export const rolePermissionMap: Record<UserRole, Permission[]> = {
  // ─── SUPER_ADMIN : tout ──────────────────────────────────────────────
  SUPER_ADMIN: [
    'admin:read',
    'admin:write',
    'club:read',
    'club:write',
    'club:delete',
    'members:read',
    'members:approve',
    'members:reject',
    'members:suspend',
    'members:invite',
    'members:remove',
    'members:role:write',
    'players:read',
    'players:write',
    'players:approve',
    'matches:read',
    'matches:write',
    'tactics:read',
    'tactics:write',
    'academy:read',
    'academy:write',
    'academy:apply',
    'academy:approve',
    'academy:reject',
    'finance:read',
    'finance:write',
    'sponsors:read',
    'sponsors:write',
    'sponsorships:read',
    'posts:read',
    'posts:write',
    'posts:comment',
    'posts:like',
    'statuses:read',
    'statuses:write:self',
    'messaging:read',
    'messaging:write',
    'messaging:rw',
    'tickets:read',
    'tickets:buy',
    'tickets:scan',
    'products:read',
    'products:write',
    'orders:read',
    'orders:write',
    'cart:write:self',
  ],

  // ─── CLUB_ADMIN : tout pour SON club ─────────────────────────────────
  CLUB_ADMIN: [
    'club:read',
    'club:write',
    'members:read',
    'members:approve',
    'members:reject',
    'members:suspend',
    'members:invite',
    'members:remove',
    'members:role:write',
    'players:read',
    'players:write',
    'players:approve',
    'matches:read',
    'matches:write',
    'tactics:read',
    'tactics:write',
    'academy:read',
    'academy:write',
    'academy:approve',
    'academy:reject',
    'finance:read',
    'finance:write',
    'sponsors:read',
    'sponsors:write',
    'sponsorships:read',
    'posts:read',
    'posts:write',
    'posts:comment',
    'posts:like',
    'statuses:read',
    'statuses:write:self',
    'messaging:read',
    'messaging:write',
    'messaging:rw',
    'tickets:read',
    'tickets:buy',
    'tickets:scan',
    'products:read',
    'products:write',
    'orders:read',
    'orders:write',
    'cart:write:self',
  ],

  // ─── TREASURER : finances + lecture club ─────────────────────────────
  TREASURER: [
    'club:read',
    'members:read',
    'players:read',
    'matches:read',
    'finance:read',
    'finance:write',
    'sponsors:read',
    'sponsorships:read',
    'posts:read',
    'posts:comment',
    'posts:like',
    'statuses:read',
    'messaging:read',
    'messaging:write',
    'messaging:rw',
    'tickets:read',
    'orders:read',
  ],

  // ─── COACH : joueurs, matchs, tactiques, académie ────────────────────
  COACH: [
    'club:read',
    'members:read',
    'players:read',
    'players:write',
    'matches:read',
    'matches:write',
    'tactics:read',
    'tactics:write',
    'academy:read',
    'academy:write',
    'sponsors:read',
    'posts:read',
    'posts:write:self',
    'posts:comment',
    'posts:like',
    'statuses:read',
    'statuses:write:self',
    'messaging:read',
    'messaging:write',
    'messaging:rw',
    'tickets:read',
    'tickets:buy',
    'products:read',
    'cart:write:self',
  ],

  // ─── PLAYER : son profil, lecture club, messagerie ───────────────────
  PLAYER: [
    'club:read',
    'members:read',
    'players:read',
    'players:write:self',
    'matches:read',
    'tactics:read',
    'posts:read',
    'posts:write:self',
    'posts:comment',
    'posts:like',
    'statuses:read',
    'statuses:write:self',
    'messaging:read',
    'messaging:write',
    'messaging:rw',
    'tickets:read',
    'tickets:buy',
    'products:read',
    'cart:write:self',
  ],

  // ─── SPONSOR : son profil sponsor + lecture ──────────────────────────
  SPONSOR: [
    'club:read',
    'players:read',
    'matches:read',
    'sponsors:read',
    'sponsors:write:self',
    'sponsorships:read',
    'sponsorships:follow',
    'posts:read',
    'posts:comment',
    'posts:like',
    'statuses:read',
    'messaging:read',
    'messaging:write',
    'messaging:rw',
    'tickets:read',
    'tickets:buy',
    'products:read',
    'cart:write:self',
  ],

  // ─── ACADEMY_CANDIDATE : postuler à l'académie ───────────────────────
  ACADEMY_CANDIDATE: [
    'club:read',
    'academy:read',
    'academy:apply',
    'posts:read',
    'posts:comment',
    'posts:like',
    'statuses:read',
    'messaging:read',
    'messaging:write',
    'tickets:read',
    'tickets:buy',
    'products:read',
    'cart:write:self',
  ],

  // ─── SUPPORTER : social + lecture + achats ───────────────────────────
  SUPPORTER: [
    'club:read',
    'matches:read',
    'posts:read',
    'posts:comment',
    'posts:like',
    'statuses:read',
    'messaging:read',
    'messaging:write',
    'tickets:read',
    'tickets:buy',
    'products:read',
    'sponsorships:follow',
    'cart:write:self',
  ],

  // ─── VISITOR : non connecté, lecture publique uniquement ─────────────
  VISITOR: [
    'club:read',
    'posts:read',
    'matches:read',
    'products:read',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXTE DE VÉRIFICATION (scope club)
// ═══════════════════════════════════════════════════════════════════════════

export interface PermissionContext {
  /** Club concerné par l'action. Si absent, la vérification est globale. */
  clubId?: string;
  /** ID de la ressource concernée (pour les `:self`). */
  resourceOwnerId?: string;
}

export interface PermissionActor {
  userId: string;
  role: UserRole;
  /** IDs des clubs où l'utilisateur est membre ACTIVE. */
  activeClubIds?: string[];
  /** Rôles dans chaque club (map clubId → role). */
  clubRoles?: Record<string, ClubScopedRole>;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS DE VÉRIFICATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vérifie qu'un acteur possède une permission.
 *
 * Règles :
 *   1. SUPER_ADMIN → toujours autorisé
 *   2. Si la permission finit par `:self` → il faut que
 *      `resourceOwnerId === actor.userId`
 *   3. Si `context.clubId` est fourni → l'acteur doit être membre ACTIVE
 *      de ce club (via `activeClubIds`)
 *   4. Sinon → vérifie juste que le rôle a la permission
 */
export function hasPermission(
  actor: PermissionActor,
  permission: Permission,
  context: PermissionContext = {}
): boolean {
  // 1. SUPER_ADMIN bypasse tout
  if (actor.role === 'SUPER_ADMIN') return true;

  // 2. Permission de type `:self`
  const isSelfPermission = permission.endsWith(':self');
  if (isSelfPermission) {
    if (!context.resourceOwnerId) return false;
    if (context.resourceOwnerId !== actor.userId) return false;
    // Retire le suffixe pour retrouver la permission de base
    const basePermission = permission.replace(':self', '') as Permission;
    return rolePermissionMap[actor.role]?.includes(basePermission) ?? false;
  }

  // 3. Scope club : si un clubId est fourni, l'acteur doit y être membre
  if (context.clubId) {
    const isMember = actor.activeClubIds?.includes(context.clubId);
    if (!isMember) return false;
  }

  // 4. Vérification du rôle
  return rolePermissionMap[actor.role]?.includes(permission) ?? false;
}

/**
 * Vérifie qu'un acteur a une permission sur un club donné.
 * Raccourci pratique.
 */
export function hasClubPermission(
  actor: PermissionActor,
  permission: Permission,
  clubId: string,
  resourceOwnerId?: string
): boolean {
  return hasPermission(actor, permission, { clubId, resourceOwnerId });
}

/**
 * Renvoie toutes les permissions d'un rôle (utile pour le frontend).
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return rolePermissionMap[role] ?? [];
}

// ═══════════════════════════════════════════════════════════════════════════
// SEED DATA (développement uniquement)
// ═══════════════════════════════════════════════════════════════════════════

export const defaultSeedUsers = [
  { email: 'superadmin@firestone.com', password: 'FireStone2026!', name: 'Super Administrateur', role: 'SUPER_ADMIN' as UserRole },
  { email: 'clubadmin@firestone.com', password: 'FireStone2026!', name: 'Administrateur Club', role: 'CLUB_ADMIN' as UserRole },
  { email: 'coach@firestone.com', password: 'FireStone2026!', name: 'Coach Vance', role: 'COACH' as UserRole },
  { email: 'marcus.vance@firestone.com', password: 'FireStone2026!', name: 'Marcus Vance', role: 'PLAYER' as UserRole },
  { email: 'sophie.laurent@firestone.com', password: 'FireStone2026!', name: 'Sophie Laurent', role: 'TREASURER' as UserRole },
  { email: 'supporter@firestone.com', password: 'FireStone2026!', name: 'Supporter Club', role: 'SUPPORTER' as UserRole },
  { email: 'visitor@firestone.com', password: 'FireStone2026!', name: 'Visiteur', role: 'VISITOR' as UserRole },
] as const;

export const defaultBadges = [
  { code: 'TOP_SCORER', name: 'Top Scorer', description: 'Meilleur marqueur de la saison.', icon: '🎯', color: '#FF2A3B' },
  { code: 'MVP', name: 'MVP', description: 'Élu joueur le plus utile d’une compétition.', icon: '🏆', color: '#FFB800' },
  { code: 'BEST_DEFENDER', name: 'Best Defender', description: 'Référence défensive du groupe.', icon: '🛡️', color: '#22C55E' },
  { code: 'RISING_STAR', name: 'Rising Star', description: 'Talent en progression remarquable.', icon: '⭐', color: '#38BDF8' },
];

export const defaultVenues = [
  {
    name: "Terrain du Lycée d'Adétikopé",
    city: 'Lomé',
    region: 'Maritime',
    address: 'Quartier Adétikopé, Lomé — Togo',
    latitude: 6.255,
    longitude: 1.185,
    owner: 'FIRE STONE Basketball Club',
    surface: 'Terrain synthétique / gazon renforcé',
    capacity: 1200,
    status: 'AVAILABLE',
    indoor: false,
    lighting: true,
    lockerRooms: true,
    parking: true,
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80',
    description: 'Principal terrain d’entraînement et de matches à domicile du club.',
    rating: 4.9,
  },
  {
    name: 'Complexe Sportif d’Atakpamé',
    city: 'Atakpamé',
    region: 'Plateau',
    address: 'Route Nationale 1, Atakpamé — Togo',
    latitude: 7.53,
    longitude: 1.12,
    owner: 'Ministère des Sports',
    surface: 'Terrain semi-gazonné',
    capacity: 800,
    status: 'RESERVED',
    indoor: false,
    lighting: true,
    lockerRooms: true,
    parking: true,
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&auto=format&fit=crop&q=80',
    description: 'Site de préparation régional pour les rencontres et camps jeunes.',
    rating: 4.7,
  },
  {
    name: 'Court National de Kara',
    city: 'Kara',
    region: 'Kara',
    address: 'Boulevard de la République, Kara — Togo',
    latitude: 9.55,
    longitude: 1.19,
    owner: 'Fédération Togolaise de Basket',
    surface: 'Indoor + extérieur',
    capacity: 600,
    status: 'AVAILABLE',
    indoor: true,
    lighting: true,
    lockerRooms: true,
    parking: false,
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
    description: 'Terrain polyvalent pour stages, compétitions et entraînements régionaux.',
    rating: 4.6,
  },
  {
    name: 'Salle Omnisports de Dapaong',
    city: 'Dapaong',
    region: 'Savanes',
    address: 'Zone sportive, Dapaong — Togo',
    latitude: 10.86,
    longitude: 0.21,
    owner: 'Direction Régionale des Sports',
    surface: 'Salle intérieure',
    capacity: 500,
    status: 'MAINTENANCE',
    indoor: true,
    lighting: true,
    lockerRooms: true,
    parking: true,
    imageUrl: 'https://images.unsplash.com/photo-1521417531038-928ec6d4d6d9?w=1200&auto=format&fit=crop&q=80',
    description: 'Complexe destiné aux entraînements intérieurs et rencontres interrégionales.',
    rating: 4.4,
  },
];

export interface ProductRecord {
  id: string;
  name: string;
  slug: string;
  category: 'JERSEYS' | 'GEAR' | 'LIFESTYLE' | 'ACCESSORIES';
  priceXOF: number;
  description: string;
  imageUrl: string;
  isOfficial: boolean;
  customizable: boolean;
  sizes?: string[];
  inStock: boolean;
  rating: number;
  reviewsCount: number;
  badge?: string;
}

export const DEFAULT_PRODUCTS: ProductRecord[] = [
  {
    id: 'prod-001',
    name: 'Maillot Officiel Domicile FIRE STONE 2026',
    slug: 'maillot-domicile-fire-stone-2026',
    category: 'JERSEYS',
    priceXOF: 18000,
    description: 'Le maillot officiel de match porté au Terrain du Lycée d’Adétikopé. Tissu technique respirant micro-perforé, liserés or solaire et rouge feu. Flocage nom & numéro personnalisé inclus.',
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    isOfficial: true,
    customizable: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    inStock: true,
    rating: 4.9,
    reviewsCount: 38,
    badge: 'BEST-SELLER',
  },
  {
    id: 'prod-002',
    name: 'Maillot Officiel Extérieur Éperviers BBC 2026',
    slug: 'maillot-exterieur-eperviers-2026',
    category: 'JERSEYS',
    priceXOF: 18000,
    description: 'Maillot de match officiel extérieur aux couleurs vert émeraude et or solaire. Flocage personnalisé disponible.',
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
    isOfficial: true,
    customizable: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    inStock: true,
    rating: 4.8,
    reviewsCount: 21,
    badge: 'NOUVEAU',
  },
  {
    id: 'prod-003',
    name: 'Ballon Officiel FIBA FIRE STONE All-Court',
    slug: 'ballon-fiba-fire-stone-taille-7',
    category: 'GEAR',
    priceXOF: 22500,
    description: 'Ballon de match officiel en cuir composite haute adhérence taille 7. Optimisé pour terrains extérieurs en béton et parquets intérieurs.',
    imageUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=800&q=80',
    isOfficial: true,
    customizable: false,
    inStock: true,
    rating: 5.0,
    reviewsCount: 44,
    badge: 'HOMOLOGUÉ FIBA',
  },
  {
    id: 'prod-004',
    name: 'Hoodie Club Ultras FIRE STONE Noir & Or',
    slug: 'hoodie-ultras-fire-stone',
    category: 'LIFESTYLE',
    priceXOF: 24000,
    description: 'Sweat à capuche premium 380g coton biologique lourd avec broderie haute densité de la flamme et slogan officiel sur la manche.',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    isOfficial: true,
    customizable: false,
    sizes: ['M', 'L', 'XL'],
    inStock: true,
    rating: 4.9,
    reviewsCount: 19,
  },
  {
    id: 'prod-005',
    name: 'Gourde Isotherme Pro Athlète 1L',
    slug: 'gourde-isotherme-fire-stone-1l',
    category: 'ACCESSORIES',
    priceXOF: 9500,
    description: 'Gourde inox double paroi maintenant l’eau fraîche pendant 24h sous le climat ouest-africain. Bouchon sport ergonomique.',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    isOfficial: true,
    customizable: false,
    inStock: true,
    rating: 4.7,
    reviewsCount: 15,
  },
  {
    id: 'prod-006',
    name: 'Casquette Snapback Broderie 3D FIRE STONE',
    slug: 'casquette-snapback-fire-stone',
    category: 'ACCESSORIES',
    priceXOF: 8500,
    description: 'Casquette 6 panneaux visière plate avec broderie 3D haute précision du logo flamme et fermeture ajustable.',
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    isOfficial: true,
    customizable: false,
    inStock: true,
    rating: 4.8,
    reviewsCount: 27,
  },
];

export interface TicketTier {
  id: string;
  tierName: string;
  priceXOF: number;
  description: string;
  availableSeats: number;
  totalSeats: number;
  perks: string[];
}

export interface TicketingMatchRecord {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  competition: string;
  date: string;
  time: string;
  arenaName: string;
  arenaCity: string;
  isHotMatch: boolean;
  tiers: TicketTier[];
}

export const DEFAULT_TICKETING_MATCHES: TicketingMatchRecord[] = [
  {
    id: 'match-tkt-001',
    homeTeamName: 'FIRE STONE Elite',
    awayTeamName: 'Éperviers BBC',
    competition: 'Championnat National D1 Togo — J1',
    date: '2026-09-12',
    time: '16:00',
    arenaName: 'Terrain du Lycée d’Adétikopé',
    arenaCity: 'Lomé',
    isHotMatch: true,
    tiers: [
      {
        id: 'tier-pop-1',
        tierName: 'Tribune Populaire',
        priceXOF: 1000,
        description: 'Accès gradins extérieurs avec ambiance des supporters et buvette.',
        availableSeats: 280,
        totalSeats: 300,
        perks: ['Entrée générale', 'Placement libre gradins', 'Ambiance Ultras FS'],
      },
      {
        id: 'tier-vip-1',
        tierName: 'Tribune Couverte Courtside VIP',
        priceXOF: 3500,
        description: 'Sièges réservés au bord du terrain, boisson offerte et accès vestiaires à la mi-temps.',
        availableSeats: 42,
        totalSeats: 50,
        perks: ['Siège réservé premier rang', '1 Boisson fraîche au choix', 'Accès zone presse & vestiaires', 'Badge collector'],
      },
      {
        id: 'tier-pass-1',
        tierName: 'Pass Saison VIP 2026',
        priceXOF: 25000,
        description: 'Accès à tous les 14 matchs à domicile de la saison + 1 maillot officiel domicile offert.',
        availableSeats: 18,
        totalSeats: 25,
        perks: ['Accès illimité 14 matchs', 'Maillot officiel floqué offert', 'Place réservée VIP', 'Rencontre privée joueurs'],
      },
    ],
  },
  {
    id: 'match-tkt-002',
    homeTeamName: 'FIRE STONE Elite',
    awayTeamName: 'Swallows BBC',
    competition: 'Coupe du Togo — Quart de Finale',
    date: '2026-09-26',
    time: '18:30',
    arenaName: 'Terrain du Lycée d’Adétikopé',
    arenaCity: 'Lomé',
    isHotMatch: true,
    tiers: [
      {
        id: 'tier-pop-2',
        tierName: 'Tribune Populaire',
        priceXOF: 1500,
        description: 'Choc éliminatoire de coupe de nuit sous les projecteurs.',
        availableSeats: 190,
        totalSeats: 300,
        perks: ['Entrée générale', 'Placement libre gradins', 'Ambiance Ultras'],
      },
      {
        id: 'tier-vip-2',
        tierName: 'Tribune Couverte Courtside VIP',
        priceXOF: 4500,
        description: 'Place de choix au centre du terrain avec cocktail de bienvenue.',
        availableSeats: 25,
        totalSeats: 40,
        perks: ['Siège VIP réservé', 'Cocktail de bienvenue', 'Accès coupe-file'],
      },
    ],
  },
];