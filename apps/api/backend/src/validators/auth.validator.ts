export interface NewClubDataInput {
  name: string;
  logoUrl?: string;
  arena?: string;
  address?: string;
  city?: string;
  country?: string;
  description?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: string;
  phoneNumber?: string;
  city?: string;
  country?: string;
  bio?: string;
  avatarUrl?: string;
  // Données profil sportif optionnelles si inscription Joueur / Académie
  jerseyNumber?: number;
  position?: string;
  heightCm?: number;
  weightKg?: number;
  age?: number;
  experienceYears?: number;
  clubId?: string;
  // Spécifications HOOPER : Dirigeant créant son club
  createClub?: boolean;
  newClubData?: NewClubDataInput;
  // Coach
  certificates?: string;
  // Sponsor
  sponsorType?: string;
  sponsorBudget?: number;
  sponsorDomain?: string;
  sponsorTeam?: boolean;
  // Candidat Académie
  candidateCvUrl?: string;
  candidateVideoUrl?: string;
}

const VALID_POSITIONS = ['Meneur', 'Arrière', 'Ailier', 'Ailier Fort', 'Pivot'];

export const validateSportData = (data: any): { valid: boolean; error?: string } => {
  if (data.jerseyNumber !== undefined && (typeof data.jerseyNumber !== 'number' || data.jerseyNumber < 0 || data.jerseyNumber > 99)) {
    return { valid: false, error: 'Le numéro de maillot doit être entre 0 et 99.' };
  }

  if (data.position && !VALID_POSITIONS.includes(data.position)) {
    return { valid: false, error: 'Position invalide. Positions valides: ' + VALID_POSITIONS.join(', ') };
  }

  if (data.heightCm !== undefined && (typeof data.heightCm !== 'number' || data.heightCm < 150 || data.heightCm > 250)) {
    return { valid: false, error: 'La taille doit être entre 150cm et 250cm.' };
  }

  if (data.weightKg !== undefined && (typeof data.weightKg !== 'number' || data.weightKg < 40 || data.weightKg > 200)) {
    return { valid: false, error: 'Le poids doit être entre 40kg et 200kg.' };
  }

  if (data.age !== undefined && (typeof data.age !== 'number' || data.age < 14 || data.age > 50)) {
    return { valid: false, error: 'L\'âge doit être entre 14 et 50 ans.' };
  }

  if (data.experienceYears !== undefined && (typeof data.experienceYears !== 'number' || data.experienceYears < 0 || data.experienceYears > 30)) {
    return { valid: false, error: 'Les années d\'expérience doivent être entre 0 et 30.' };
  }

  return { valid: true };
};

export const validateRegisterInput = (body: any): { valid: boolean; error?: string; data?: RegisterInput } => {
  const {
    name,
    email,
    password,
    role,
    phoneNumber,
    city,
    country,
    bio,
    avatarUrl,
    jerseyNumber,
    position,
    heightCm,
    weightKg,
    age,
    experienceYears,
    clubId,
    createClub,
    newClubData,
    certificates,
    sponsorType,
    sponsorBudget,
    sponsorDomain,
    sponsorTeam,
    candidateCvUrl,
    candidateVideoUrl,
  } = body ?? {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return { valid: false, error: 'Le nom complet est obligatoire.' };
  }

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return { valid: false, error: 'Une adresse email valide est obligatoire.' };
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return { valid: false, error: 'Le mot de passe doit comporter au moins 8 caractères.' };
  }

  // Normalisation du rôle selon les 7 profils du cahier des charges HOOPER
  let normalizedRole = role ? String(role).toUpperCase().trim() : 'VISITOR';
  if (normalizedRole === 'DIRIGEANT' || normalizedRole === 'CLUB_MANAGER') {
    normalizedRole = 'CLUB_ADMIN';
  } else if (normalizedRole === 'CANDIDAT' || normalizedRole === 'ACADEMY') {
    normalizedRole = 'ACADEMY_CANDIDATE';
  } else if (normalizedRole === 'FAN') {
    normalizedRole = 'SUPPORTER';
  }

  const PUBLIC_REGISTRATION_ROLES = [
    'COACH',
    'CLUB_ADMIN',
    'PLAYER',
    'SPONSOR',
    'ACADEMY_CANDIDATE',
    'SUPPORTER',
    'VISITOR',
  ];

  if (!PUBLIC_REGISTRATION_ROLES.includes(normalizedRole)) {
    return { valid: false, error: 'Le rôle sélectionné n\'est pas autorisé pour l\'inscription publique.' };
  }

  // Validation Dirigeant créant un club
  if (normalizedRole === 'CLUB_ADMIN' && createClub) {
    if (!newClubData || !newClubData.name || typeof newClubData.name !== 'string' || !newClubData.name.trim()) {
      return { valid: false, error: 'Le nom du nouveau club est obligatoire pour la création de club.' };
    }
  }

  // Validation des données sportives si présentes
  const sportValidation = validateSportData({ jerseyNumber, position, heightCm, weightKg, age, experienceYears });
  if (!sportValidation.valid) {
    return sportValidation;
  }

  return {
    valid: true,
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: normalizedRole,
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : undefined,
      city: city ? String(city).trim() : undefined,
      country: country ? String(country).trim() : 'Togo',
      bio: bio ? String(bio).trim() : undefined,
      avatarUrl: avatarUrl ? String(avatarUrl).trim() : undefined,
      jerseyNumber: jerseyNumber !== undefined && jerseyNumber !== null ? Number(jerseyNumber) : undefined,
      position: position ? String(position).trim() : undefined,
      heightCm: heightCm !== undefined && heightCm !== null ? Number(heightCm) : undefined,
      weightKg: weightKg !== undefined && weightKg !== null ? Number(weightKg) : undefined,
      age: age !== undefined && age !== null ? Number(age) : undefined,
      experienceYears: experienceYears !== undefined && experienceYears !== null ? Number(experienceYears) : undefined,
      clubId: clubId ? String(clubId).trim() : undefined,
      createClub: Boolean(createClub),
      newClubData: newClubData ? {
        name: String(newClubData.name).trim(),
        logoUrl: newClubData.logoUrl ? String(newClubData.logoUrl).trim() : undefined,
        arena: newClubData.arena ? String(newClubData.arena).trim() : undefined,
        address: newClubData.address ? String(newClubData.address).trim() : undefined,
        city: newClubData.city ? String(newClubData.city).trim() : 'Lomé',
        country: newClubData.country ? String(newClubData.country).trim() : 'Togo',
        description: newClubData.description ? String(newClubData.description).trim() : undefined,
      } : undefined,
      certificates: certificates ? String(certificates).trim() : undefined,
      sponsorType: sponsorType ? String(sponsorType).trim() : undefined,
      sponsorBudget: sponsorBudget !== undefined && sponsorBudget !== null ? Number(sponsorBudget) : undefined,
      sponsorDomain: sponsorDomain ? String(sponsorDomain).trim() : undefined,
      sponsorTeam: Boolean(sponsorTeam),
      candidateCvUrl: candidateCvUrl ? String(candidateCvUrl).trim() : undefined,
      candidateVideoUrl: candidateVideoUrl ? String(candidateVideoUrl).trim() : undefined,
    },
  };
};

export const validateLoginInput = (body: any): { valid: boolean; error?: string; email?: string; password?: string } => {
  const { email, password } = body ?? {};
  if (!email || !password) {
    return { valid: false, error: 'Email et mot de passe requis.' };
  }
  return { valid: true, email: String(email).trim().toLowerCase(), password: String(password) };
};
