/**
 * Configuration centralisée pour le système de Status / Stories temporaires (24h)
 */

export const STATUS_CONFIG = {
  // Durée de vie par défaut d'un status : 24 heures (en millisecondes)
  LIFETIME_MS: 24 * 60 * 60 * 1000,

  // Nombre maximum de médias par Status
  MAX_MEDIA_COUNT: 10,

  // Limite de taille par fichier (en octets)
  MAX_IMAGE_SIZE_BYTES: 15 * 1024 * 1024, // 15 Mo
  MAX_VIDEO_SIZE_BYTES: 50 * 1024 * 1024, // 50 Mo (conforme au projet)

  // Durée maximale d'une vidéo (en secondes)
  MAX_VIDEO_DURATION_SECONDS: 60,

  // Types MIME acceptés
  ALLOWED_IMAGE_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ] as const,

  ALLOWED_VIDEO_MIME_TYPES: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ] as const,

  // Visibilités supportées
  VISIBILITIES: ['PUBLIC', 'FOLLOWERS', 'FRIENDS', 'PRIVATE', 'CUSTOM'] as const,

  // Réactions supportées
  REACTION_TYPES: [
    'LIKE',
    'LOVE',
    'HAHA',
    'WOW',
    'SAD',
    'ANGRY',
    'FIRE',
    'CLAP',
  ] as const,

  // Rôles de ClubMember autorisés à gérer (créer / supprimer) les status au nom d'un Club
  CLUB_STATUS_MANAGER_ROLES: ['PRESIDENT', 'CLUB_ADMIN'] as const,

  // Longueur maximale du texte d'un status
  MAX_TEXT_LENGTH: 2000,

  // Longueur maximale d'une réponse
  MAX_REPLY_LENGTH: 1000,
} as const;

export type StatusVisibility = typeof STATUS_CONFIG.VISIBILITIES[number];
export type StatusReactionType = typeof STATUS_CONFIG.REACTION_TYPES[number];
export type StatusMediaType = 'IMAGE' | 'VIDEO';
