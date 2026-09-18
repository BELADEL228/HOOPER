export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TREASURER' | 'COACH' | 'PLAYER' | 'SPONSOR' | 'ACADEMY_CANDIDATE' | 'VISITOR' | 'CLUB_MANAGER';

export const userRoles: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'TREASURER',
  'COACH',
  'PLAYER',
  'SPONSOR',
  'ACADEMY_CANDIDATE',
  'VISITOR',
  'CLUB_MANAGER',
];

export const rolePermissionMap: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['club:read', 'club:write', 'players:read', 'players:write', 'finance:read', 'finance:write', 'academy:read', 'academy:write', 'admin:read', 'admin:write'],
  ADMIN: ['club:read', 'club:write', 'players:read', 'players:write', 'finance:read', 'finance:write', 'academy:read', 'academy:write', 'admin:read'],
  CLUB_MANAGER: ['club:read', 'club:write', 'players:read', 'players:write', 'finance:read', 'finance:write'],
  TREASURER: ['club:read', 'finance:read', 'finance:write'],
  COACH: ['club:read', 'players:read', 'players:write', 'academy:read', 'academy:write'],
  PLAYER: ['club:read', 'players:read'],
  SPONSOR: ['club:read'],
  ACADEMY_CANDIDATE: ['club:read', 'academy:read'],
  VISITOR: ['club:read'],
};

export const defaultSeedUsers = [
  { email: 'superadmin@firestone.com', password: 'FireStone2026!', name: 'Super Administrateur', role: 'SUPER_ADMIN' as UserRole },
  { email: 'admin@firestone.com', password: 'FireStone2026!', name: 'Administrateur Club', role: 'ADMIN' as UserRole },
  { email: 'coach@firestone.com', password: 'FireStone2026!', name: 'Coach Vance', role: 'COACH' as UserRole },
  { email: 'marcus.vance@firestone.com', password: 'FireStone2026!', name: 'Marcus Vance', role: 'PLAYER' as UserRole },
  { email: 'sophie.laurent@firestone.com', password: 'FireStone2026!', name: 'Sophie Laurent', role: 'TREASURER' as UserRole },
  { email: 'supporter@firestone.com', password: 'FireStone2026!', name: 'Supporter Club', role: 'VISITOR' as UserRole },
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
