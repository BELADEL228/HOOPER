import {
  STATUS_CONFIG,
  StatusVisibility,
  StatusReactionType,
  StatusMediaType,
} from '../config/status.config';

export interface StatusMediaInput {
  type: StatusMediaType;
  url: string;
  width?: number;
  height?: number;
  size?: number;
  duration?: number;
  mimeType?: string;
  position: number;
}

export interface StatusMentionInput {
  userId?: string;
  clubId?: string;
}

export interface CreateStatusInput {
  clubId?: string;
  text?: string;
  visibility?: StatusVisibility;
  media?: StatusMediaInput[];
  mentions?: StatusMentionInput[];
  audienceUserIds?: string[];
}

export interface ValidationResult<T> {
  valid: boolean;
  error?: string;
  data?: T;
}

export const validateCreateStatusInput = (body: any): ValidationResult<CreateStatusInput> => {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Données de requête invalides.' };
  }

  const { clubId, text, visibility = 'PUBLIC', media, mentions, audienceUserIds } = body;

  // Validation texte
  let cleanedText: string | undefined;
  if (text !== undefined && text !== null) {
    if (typeof text !== 'string') {
      return { valid: false, error: 'Le champ text doit être une chaîne de caractères.' };
    }
    cleanedText = text.trim();
    if (cleanedText.length > STATUS_CONFIG.MAX_TEXT_LENGTH) {
      return { valid: false, error: `Le texte ne peut dépasser ${STATUS_CONFIG.MAX_TEXT_LENGTH} caractères.` };
    }
  }

  // Validation visibilité
  if (!STATUS_CONFIG.VISIBILITIES.includes(visibility)) {
    return { valid: false, error: `Visibilité invalide. Choix acceptés : ${STATUS_CONFIG.VISIBILITIES.join(', ')}.` };
  }

  // Validation médias
  const cleanedMedia: StatusMediaInput[] = [];
  if (media !== undefined && media !== null) {
    if (!Array.isArray(media)) {
      return { valid: false, error: 'Le champ media doit être une liste.' };
    }
    if (media.length > STATUS_CONFIG.MAX_MEDIA_COUNT) {
      return { valid: false, error: `Un status ne peut contenir plus de ${STATUS_CONFIG.MAX_MEDIA_COUNT} médias.` };
    }

    const seenPositions = new Set<number>();
    for (let i = 0; i < media.length; i++) {
      const item = media[i];
      if (!item || typeof item !== 'object') {
        return { valid: false, error: `Média #${i + 1} invalide.` };
      }

      const type = String(item.type || '').toUpperCase() as StatusMediaType;
      if (type !== 'IMAGE' && type !== 'VIDEO') {
        return { valid: false, error: `Média #${i + 1} : le type doit être 'IMAGE' ou 'VIDEO'.` };
      }

      if (!item.url || typeof item.url !== 'string' || !item.url.trim()) {
        return { valid: false, error: `Média #${i + 1} : URL manquante ou invalide.` };
      }

      const position = typeof item.position === 'number' ? item.position : i;
      if (position < 0) {
        return { valid: false, error: `Média #${i + 1} : la position doit être positive.` };
      }
      if (seenPositions.has(position)) {
        return { valid: false, error: `Média #${i + 1} : la position ${position} est dupliquée.` };
      }
      seenPositions.add(position);

      // Validation taille & MIME pour les images
      if (type === 'IMAGE') {
        if (typeof item.size === 'number' && item.size > STATUS_CONFIG.MAX_IMAGE_SIZE_BYTES) {
          return { valid: false, error: `Média #${i + 1} : l’image dépasse la taille maximale autorisée (15 Mo).` };
        }
        if (item.mimeType && !STATUS_CONFIG.ALLOWED_IMAGE_MIME_TYPES.includes(item.mimeType.toLowerCase() as any)) {
          return { valid: false, error: `Média #${i + 1} : type MIME d’image '${item.mimeType}' non supporté.` };
        }
      }

      // Validation taille, durée & MIME pour les vidéos
      if (type === 'VIDEO') {
        if (typeof item.size === 'number' && item.size > STATUS_CONFIG.MAX_VIDEO_SIZE_BYTES) {
          return { valid: false, error: `Média #${i + 1} : la vidéo dépasse la taille maximale autorisée (50 Mo).` };
        }
        if (typeof item.duration === 'number' && item.duration > STATUS_CONFIG.MAX_VIDEO_DURATION_SECONDS) {
          return { valid: false, error: `Média #${i + 1} : la durée de la vidéo dépasse ${STATUS_CONFIG.MAX_VIDEO_DURATION_SECONDS} secondes.` };
        }
        if (item.mimeType && !STATUS_CONFIG.ALLOWED_VIDEO_MIME_TYPES.includes(item.mimeType.toLowerCase() as any)) {
          return { valid: false, error: `Média #${i + 1} : format vidéo '${item.mimeType}' non supporté.` };
        }
      }

      cleanedMedia.push({
        type,
        url: item.url.trim(),
        position,
        width: typeof item.width === 'number' ? item.width : undefined,
        height: typeof item.height === 'number' ? item.height : undefined,
        size: typeof item.size === 'number' ? item.size : undefined,
        duration: typeof item.duration === 'number' ? item.duration : undefined,
        mimeType: item.mimeType ? String(item.mimeType).toLowerCase().trim() : undefined,
      });
    }
  }

  // Doit contenir au moins du texte ou un média
  if (!cleanedText && cleanedMedia.length === 0) {
    return { valid: false, error: 'Un Status doit contenir au moins du texte ou un média.' };
  }

  // Validation mentions
  const cleanedMentions: StatusMentionInput[] = [];
  if (mentions !== undefined && mentions !== null) {
    if (!Array.isArray(mentions)) {
      return { valid: false, error: 'Le champ mentions doit être une liste.' };
    }
    for (let i = 0; i < mentions.length; i++) {
      const m = mentions[i];
      if (!m || typeof m !== 'object') continue;
      const targetUserId = m.userId ? String(m.userId).trim() : undefined;
      const targetClubId = m.clubId ? String(m.clubId).trim() : undefined;

      if ((targetUserId && targetClubId) || (!targetUserId && !targetClubId)) {
        return { valid: false, error: `Mention #${i + 1} : doit cibler soit un utilisateur soit un club, pas les deux.` };
      }
      cleanedMentions.push({ userId: targetUserId, clubId: targetClubId });
    }
  }

  // Validation audience personnalisée (CUSTOM)
  const cleanedAudience: string[] = [];
  if (visibility === 'CUSTOM') {
    if (!Array.isArray(audienceUserIds) || audienceUserIds.length === 0) {
      return { valid: false, error: 'La visibilité CUSTOM nécessite de fournir au moins un utilisateur dans audienceUserIds.' };
    }
    for (const uid of audienceUserIds) {
      if (typeof uid === 'string' && uid.trim()) {
        cleanedAudience.push(uid.trim());
      }
    }
    if (cleanedAudience.length === 0) {
      return { valid: false, error: 'audienceUserIds ne contient aucun identifiant valide.' };
    }
  }

  return {
    valid: true,
    data: {
      clubId: clubId ? String(clubId).trim() : undefined,
      text: cleanedText,
      visibility,
      media: cleanedMedia.sort((a, b) => a.position - b.position),
      mentions: cleanedMentions,
      audienceUserIds: cleanedAudience.length > 0 ? Array.from(new Set(cleanedAudience)) : undefined,
    },
  };
};

export const validateReactionInput = (body: any): ValidationResult<{ type: StatusReactionType }> => {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Données de requête invalides.' };
  }

  const rawType = String(body.type || '').toUpperCase() as StatusReactionType;
  if (!STATUS_CONFIG.REACTION_TYPES.includes(rawType)) {
    return {
      valid: false,
      error: `Réaction invalide. Choix autorisés : ${STATUS_CONFIG.REACTION_TYPES.join(', ')}.`,
    };
  }

  return { valid: true, data: { type: rawType } };
};

export const validateReplyInput = (body: any): ValidationResult<{ content: string }> => {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Données de requête invalides.' };
  }

  const rawContent = (body.content || body.text || '');
  if (typeof rawContent !== 'string' || !rawContent.trim()) {
    return { valid: false, error: 'Le contenu de la réponse ne peut pas être vide.' };
  }

  const content = rawContent.trim();
  if (content.length > STATUS_CONFIG.MAX_REPLY_LENGTH) {
    return { valid: false, error: `La réponse ne peut dépasser ${STATUS_CONFIG.MAX_REPLY_LENGTH} caractères.` };
  }

  return { valid: true, data: { content } };
};
