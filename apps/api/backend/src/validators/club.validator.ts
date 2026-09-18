export interface CreateClubInput {
  name: string;
  slug?: string;
  shortName?: string;
  description?: string;
  city: string;
  country?: string;
  address?: string;
  email?: string;
  phoneNumber?: string;
  website?: string;
  foundedYear?: number;
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  themeType?: string;
  themeJson?: any;
}

export const validateCreateClubInput = (body: any): { valid: boolean; error?: string; data?: CreateClubInput } => {
  const { name, shortName, description, city, country, address, email, phoneNumber, website, foundedYear, logoUrl, bannerUrl, primaryColor, secondaryColor, accentColor, themeType, themeJson } = body ?? {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return { valid: false, error: 'Le nom du club est obligatoire.' };
  }

  if (!city || typeof city !== 'string' || !city.trim()) {
    return { valid: false, error: 'La ville du club est obligatoire.' };
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
      name: name.trim(),
      slug,
      shortName: shortName ? String(shortName).trim() : undefined,
      description: description ? String(description).trim() : undefined,
      city: city.trim(),
      country: country ? String(country).trim() : 'Togo',
      address: address ? String(address).trim() : undefined,
      email: email ? String(email).trim() : undefined,
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : undefined,
      website: website ? String(website).trim() : undefined,
      foundedYear: foundedYear ? Number(foundedYear) : undefined,
      logoUrl: logoUrl ? String(logoUrl).trim() : undefined,
      bannerUrl: bannerUrl ? String(bannerUrl).trim() : undefined,
      // Keep these undefined when the form did not choose a colour: createClub
      // can then use the palette extracted from the supplied logo.
      primaryColor: primaryColor ? String(primaryColor).trim() : undefined,
      secondaryColor: secondaryColor ? String(secondaryColor).trim() : undefined,
      accentColor: accentColor ? String(accentColor).trim() : undefined,
      themeType: themeType ? String(themeType).trim() : undefined,
      themeJson: typeof themeJson === 'object' ? JSON.stringify(themeJson) : themeJson,
    },
  };
};
