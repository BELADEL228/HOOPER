export interface CreatePostInput {
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  clubId?: string;
}

export const validateCreatePostInput = (body: any): { valid: boolean; error?: string; data?: CreatePostInput } => {
  const { content, mediaUrl, mediaType, clubId } = body ?? {};

  if (!content || typeof content !== 'string' || !content.trim()) {
    return { valid: false, error: 'Le contenu de la publication est obligatoire.' };
  }

  return {
    valid: true,
    data: {
      content: content.trim(),
      mediaUrl: mediaUrl ? String(mediaUrl).trim() : undefined,
      mediaType: mediaType === 'video' ? 'video' : 'image',
      clubId: clubId ? String(clubId).trim() : undefined,
    },
  };
};
