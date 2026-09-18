export interface CreateTeamInput {
  clubId?: string;
  name: string;
  slug?: string;
  description?: string;
  city?: string;
  category?: string;
  foundedYear?: number;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  themeType?: string;
  themeJson?: any;
}

export const validateCreateTeamInput = (body: any): { valid: boolean; error?: string; data?: CreateTeamInput } => {
  const { clubId, name, description, city, category, foundedYear, logoUrl, primaryColor, secondaryColor, accentColor, themeType, themeJson } = body ?? {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return { valid: false, error: 'Le nom de l’équipe est obligatoire.' };
  }

  const slug = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  return {
    valid: true,
    data: {
      clubId: clubId ? String(clubId).trim() : undefined,
      name: name.trim(),
      slug,
      description: description ? String(description).trim() : undefined,
      city: city ? String(city).trim() : 'Lomé',
      category: category ? String(category).trim().toUpperCase() : 'SENIOR',
      foundedYear: foundedYear ? Number(foundedYear) : undefined,
      logoUrl: logoUrl ? String(logoUrl).trim() : undefined,
      primaryColor: primaryColor ? String(primaryColor).trim() : '#FF2A3B',
      secondaryColor: secondaryColor ? String(secondaryColor).trim() : '#FFB800',
      accentColor: accentColor ? String(accentColor).trim() : '#38BDF8',
      themeType: themeType ? String(themeType).trim() : 'dark',
      themeJson: typeof themeJson === 'object' ? JSON.stringify(themeJson) : themeJson,
    },
  };
};
