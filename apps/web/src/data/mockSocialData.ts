import type { StoryGroup, SocialPost } from '../types';

export const mockStoryGroups: StoryGroup[] = [
  {
    id: 'club_firestone',
    clubId: 'club_firestone',
    authorName: 'Fire Stone Lomé',
    authorAvatar: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&auto=format&fit=crop&q=80',
    isClub: true,
    clubBadge: 'Élite Lomé',
    hasUnseen: true,
    statuses: [
      {
        id: 'st_1',
        clubId: 'club_firestone',
        text: 'Séance d’échauffement intensif avant le choc de samedi contre Étoile Filante ! 🔥🏀',
        visibility: 'PUBLIC',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 22 * 3600 * 1000).toISOString(),
        media: [
          {
            id: 'm_1',
            type: 'IMAGE',
            url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1080&auto=format&fit=crop&q=80',
            order: 1,
          },
        ],
        viewsCount: 142,
        hasViewed: false,
      },
      {
        id: 'st_2',
        clubId: 'club_firestone',
        text: 'Le nouveau maillot domicile officiel saison 2026 est disponible à la boutique du club !',
        visibility: 'PUBLIC',
        createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 23 * 3600 * 1000).toISOString(),
        media: [
          {
            id: 'm_2',
            type: 'IMAGE',
            url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1080&auto=format&fit=crop&q=80',
            order: 1,
          },
        ],
        viewsCount: 89,
        hasViewed: false,
      },
    ],
  },
  {
    id: 'user_koffi_mensah',
    authorId: 'user_koffi_mensah',
    authorName: 'Koffi Mensah',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    authorRole: 'PLAYER',
    isClub: false,
    hasUnseen: true,
    statuses: [
      {
        id: 'st_3',
        userId: 'user_koffi_mensah',
        text: '500 tirs à 3-points ce matin. La constance forge les champions. 🎯',
        visibility: 'PUBLIC',
        createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
        media: [
          {
            id: 'm_3',
            type: 'IMAGE',
            url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=1080&auto=format&fit=crop&q=80',
            order: 1,
          },
        ],
        viewsCount: 230,
        hasViewed: false,
      },
    ],
  },
  {
    id: 'club_etoile',
    clubId: 'club_etoile',
    authorName: 'Étoile Filante Basketball',
    authorAvatar: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&auto=format&fit=crop&q=80',
    isClub: true,
    clubBadge: 'Club Rivaux',
    hasUnseen: false,
    statuses: [
      {
        id: 'st_4',
        clubId: 'club_etoile',
        text: 'Retour sur les meilleurs dunks de notre meneur lors du match amical d’hier.',
        visibility: 'PUBLIC',
        createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 16 * 3600 * 1000).toISOString(),
        media: [
          {
            id: 'm_4',
            type: 'IMAGE',
            url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1080&auto=format&fit=crop&q=80',
            order: 1,
          },
        ],
        viewsCount: 310,
        hasViewed: true,
      },
    ],
  },
  {
    id: 'user_amina_t',
    authorId: 'user_amina_t',
    authorName: 'Amina Touré',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    authorRole: 'COACH',
    isClub: false,
    hasUnseen: false,
    statuses: [
      {
        id: 'st_5',
        userId: 'user_amina_t',
        text: 'Analyse vidéo de la défense de zone 2-3. Rendez-vous à la salle à 16h.',
        visibility: 'PUBLIC',
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
        media: [
          {
            id: 'm_5',
            type: 'IMAGE',
            url: 'https://images.unsplash.com/photo-1505666287802-931dc83948e9?w=1080&auto=format&fit=crop&q=80',
            order: 1,
          },
        ],
        viewsCount: 195,
        hasViewed: true,
      },
    ],
  },
];

export const mockSocialFeedPosts: SocialPost[] = [
  {
    id: 'post_1',
    authorName: 'David Vance',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    authorRole: 'COACH',
    timestamp: 'Il y a 35 min',
    content: 'Grande victoire ce soir 88 - 74 ! Une intensité défensive exemplaire dans le 4e quart-temps. Mention spéciale à toute l’équipe pour le repli et le partage du ballon. On garde ce tempo pour les phases finales ! 🏀🔥 #LigueHoopers #TeamFirst #BasketballTogo',
    mediaUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80',
    likesCount: 54,
    hasLiked: false,
    comments: [
      {
        id: 'c_1',
        authorName: 'Koffi Mensah',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
        text: 'La passe décisive dans le corner était parfaite Coach ! 💪',
        timestamp: 'Il y a 20 min',
      },
      {
        id: 'c_2',
        authorName: 'Étoile Filante Basketball',
        authorAvatar: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100',
        text: 'Beau match, rendez-vous au match retour !',
        timestamp: 'Il y a 10 min',
      },
    ],
    reactions: [],
  },
  {
    id: 'post_2',
    authorName: 'Fire Stone Lomé',
    authorAvatar: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&auto=format&fit=crop&q=80',
    authorRole: 'CLUB_MANAGER',
    timestamp: 'Il y a 2h',
    content: '📋 PLANNING DES MATCHS DU WEEK-END :\n\n• Samedi 16h30 : Seniors Masculins vs Racing Club (Terrain Municipal)\n• Dimanche 10h00 : U18 Juniors vs Phoenix Academy\n\nVenez nombreux soutenir les couleurs rouge et or ! Entrée libre pour les licenciés.',
    mediaUrl: 'https://images.unsplash.com/photo-1505666287802-931dc83948e9?w=1200&auto=format&fit=crop&q=80',
    likesCount: 38,
    hasLiked: true,
    comments: [],
    reactions: [],
  },
  {
    id: 'post_3',
    authorName: 'Amina Touré',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    authorRole: 'PLAYER',
    timestamp: 'Il y a 5h',
    content: 'La discipline commence quand personne ne regarde. 6h du matin sur le terrain d’Adétikopé. Prête pour le stage de détection nationale. ⚡💪',
    mediaUrl: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=1200&auto=format&fit=crop&q=80',
    likesCount: 91,
    hasLiked: false,
    comments: [
      {
        id: 'c_3',
        authorName: 'Coach Eric',
        authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
        text: 'Excellente mentalité Amina !',
        timestamp: 'Il y a 4h',
      },
    ],
    reactions: [],
  },
];

export const mockTrendingTopics = [
  { tag: '#HoopersFinals2026', postsCount: '1.4k posts', category: 'Compétition' },
  { tag: '#LigueLomé', postsCount: '890 posts', category: 'Championnat' },
  { tag: '#DraftProspects', postsCount: '620 posts', category: 'Scouting' },
  { tag: '#ClutchShot', postsCount: '410 posts', category: 'Highlights' },
];

export const mockSuggestedClubs = [
  {
    id: 'club_dynamos',
    name: 'Dynamos de Lomé',
    city: 'Lomé, Togo',
    category: 'SENIOR',
    followersCount: 1420,
    logoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'club_phoenix',
    name: 'Phoenix Academy',
    city: 'Kpalimé, Togo',
    category: 'JUNIOR',
    followersCount: 980,
    logoUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&auto=format&fit=crop&q=80',
  },
];
