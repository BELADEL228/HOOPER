import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';

const app = express();
const PORT = Number(process.env.PORT || 5000);
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fire_stone_super_secret_jwt_key_2026';
const passwordResetTokens = new Map<string, { email: string; expiresAt: number }>();

const fallbackUsers: Array<{
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
}> = [];

const rolePermissionMap: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['club:read', 'club:write', 'players:read', 'players:write', 'finance:read', 'finance:write', 'academy:read', 'academy:write', 'admin:read', 'admin:write'],
  ADMIN: ['club:read', 'club:write', 'players:read', 'players:write', 'finance:read', 'finance:write', 'academy:read', 'academy:write', 'admin:read'],
  TREASURER: ['club:read', 'finance:read', 'finance:write'],
  COACH: ['club:read', 'players:read', 'players:write', 'academy:read', 'academy:write'],
  PLAYER: ['club:read', 'players:read'],
  SPONSOR: ['club:read'],
  ACADEMY_CANDIDATE: ['club:read', 'academy:read'],
  VISITOR: ['club:read'],
};

const defaultSeedUsers = [
  { email: 'superadmin@firestone.com', password: 'FireStone2026!', name: 'Super Administrateur', role: 'SUPER_ADMIN' },
  { email: 'admin@firestone.com', password: 'FireStone2026!', name: 'Administrateur Club', role: 'ADMIN' },
  { email: 'coach@firestone.com', password: 'FireStone2026!', name: 'Coach Vance', role: 'COACH' },
  { email: 'marcus.vance@firestone.com', password: 'FireStone2026!', name: 'Marcus Vance', role: 'PLAYER' },
  { email: 'sophie.laurent@firestone.com', password: 'FireStone2026!', name: 'Sophie Laurent', role: 'TREASURER' },
  { email: 'supporter@firestone.com', password: 'FireStone2026!', name: 'Supporter Club', role: 'VISITOR' },
] as const;

const sanitizeUser = (user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  bio?: string | null;
  country?: string | null;
  city?: string | null;
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  avatarUrl: user.avatarUrl ?? null,
  phoneNumber: user.phoneNumber ?? null,
  address: user.address ?? null,
  emergencyContact: user.emergencyContact ?? null,
  bio: user.bio ?? null,
  country: user.country ?? 'Togo',
  city: user.city ?? null,
});

const signToken = (user: { id: string; email: string; role: UserRole }) => jwt.sign(
  { sub: user.id, email: user.email, role: user.role },
  JWT_SECRET,
  { expiresIn: '7d' }
);

const getUserPermissions = (role: UserRole) => rolePermissionMap[role] ?? ['club:read'];

const toRole = (input: string): UserRole => {
  const normalized = input?.toUpperCase();
  return Object.values(UserRole).includes(normalized as UserRole)
    ? (normalized as UserRole)
    : 'VISITOR';
};

const ensureDatabaseAndSeed = async () => {
  try {
    await prisma.$connect();
    const count = await prisma.user.count();

    if (count === 0) {
      for (const seed of defaultSeedUsers) {
        await prisma.user.create({
          data: {
            email: seed.email,
            name: seed.name,
            role: toRole(seed.role),
            passwordHash: await bcrypt.hash(seed.password, 10),
            avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed.name)}`,
          },
        });
      }
    }

    console.log('✅ Prisma connected to PostgreSQL and seed users are ready.');
    return true;
  } catch (error) {
    console.warn('⚠️ PostgreSQL unavailable. Falling back to in-memory auth storage.');
    for (const seed of defaultSeedUsers) {
      fallbackUsers.push({
        id: `fallback-${seed.email}`,
        email: seed.email,
        name: seed.name,
        role: toRole(seed.role),
        passwordHash: bcrypt.hashSync(seed.password, 10),
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed.name)}`,
      });
    }
    return false;
  }
};

const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide.' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role: UserRole };
    let userRecord: { id: string; email: string; name: string; role: UserRole; avatarUrl?: string | null } | null = null;

    if (fallbackUsers.length > 0) {
      userRecord = fallbackUsers.find((user) => user.id === payload.sub || user.email === payload.email) ?? null;
    } else {
      userRecord = await prisma.user.findUnique({ where: { id: payload.sub } });
    }

    if (!userRecord) {
      return res.status(401).json({ error: 'Utilisateur inconnu.' });
    }

    (req as any).user = sanitizeUser(userRecord);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Session expirée ou token invalide.' });
  }
};

const requireRole = (allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as { role?: UserRole } | undefined;
  if (!user?.role || !allowedRoles.includes(user.role)) {
    return res.status(403).json({ error: 'Accès refusé : autorisation insuffisante pour cette action.' });
  }
  next();
};

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', system: 'FIRE STONE API Engine v1.0', time: new Date().toISOString() });
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body ?? {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nom, email et mot de passe sont obligatoires.' });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
  }

  const safeRole = toRole(role || 'PLAYER');

  try {
    if (fallbackUsers.length > 0) {
      const existing = fallbackUsers.find((user) => user.email.toLowerCase() === String(email).toLowerCase());
      if (existing) {
        return res.status(409).json({ error: 'Un compte existe déjà pour cet email.' });
      }

      const user = {
        id: `fallback-${Date.now()}`,
        email: String(email).toLowerCase(),
        name: String(name),
        role: safeRole,
        passwordHash: await bcrypt.hash(String(password), 10),
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(String(name))}`,
      };

      fallbackUsers.push(user);
      const token = signToken({ id: user.id, email: user.email, role: user.role });
      return res.status(201).json({ token, user: sanitizeUser(user) });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({ error: 'Un compte existe déjà pour cet email.' });
    }

    const user = await prisma.user.create({
      data: {
        email: String(email).toLowerCase(),
        name: String(name),
        role: safeRole,
        passwordHash: await bcrypt.hash(String(password), 10),
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(String(name))}`,
      },
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Register error', error);
    return res.status(500).json({ error: 'Erreur lors de la création du compte.' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  try {
    let userRecord: { id: string; email: string; name: string; role: UserRole; passwordHash: string; avatarUrl?: string | null } | null = null;

    if (fallbackUsers.length > 0) {
      userRecord = fallbackUsers.find((u) => u.email.toLowerCase() === String(email).toLowerCase()) ?? null;
    } else {
      userRecord = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    }

    if (!userRecord) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const passwordMatch = await bcrypt.compare(String(password), userRecord.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const token = signToken({ id: userRecord.id, email: userRecord.email, role: userRecord.role });
    return res.json({ token, user: sanitizeUser(userRecord) });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ error: 'Erreur interne lors de la connexion.' });
  }
});

app.get('/api/auth/me', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string; email: string; role: UserRole; name: string; avatarUrl?: string | null };
  res.json({ user });
});

app.put('/api/auth/profile', requireAuth, async (req: Request, res: Response) => {
  const { name, email, avatarUrl, phoneNumber, address, emergencyContact, bio, country, city } = req.body ?? {};
  const user = (req as any).user as {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    emergencyContact?: string | null;
    bio?: string | null;
    country?: string | null;
    city?: string | null;
  };

  const updated = fallbackUsers.length > 0
    ? fallbackUsers.find((entry) => entry.id === user.id || entry.email === user.email)
    : await prisma.user.findUnique({ where: { id: user.id } });

  if (!updated) {
    return res.status(404).json({ error: 'Utilisateur introuvable.' });
  }

  const nextName = typeof name === 'string' && name.trim() ? name.trim() : user.name;
  const nextEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : user.email;
  const nextAvatar = typeof avatarUrl === 'string' && avatarUrl.trim() ? avatarUrl.trim() : user.avatarUrl ?? null;
  const nextPhone = typeof phoneNumber === 'string' ? phoneNumber.trim() : user.phoneNumber ?? null;
  const nextAddress = typeof address === 'string' ? address.trim() : user.address ?? null;
  const nextEmergency = typeof emergencyContact === 'string' ? emergencyContact.trim() : user.emergencyContact ?? null;
  const nextBio = typeof bio === 'string' ? bio.trim() : user.bio ?? null;
  const nextCountry = typeof country === 'string' && country.trim() ? country.trim() : user.country ?? 'Togo';
  const nextCity = typeof city === 'string' ? city.trim() : user.city ?? null;

  if (fallbackUsers.length > 0) {
    const target = fallbackUsers.findIndex((entry) => entry.id === user.id || entry.email === user.email);
    if (target >= 0) {
      fallbackUsers[target] = {
        ...fallbackUsers[target],
        name: nextName,
        email: nextEmail,
        avatarUrl: nextAvatar ?? undefined,
        phoneNumber: nextPhone || undefined,
        address: nextAddress || undefined,
        emergencyContact: nextEmergency || undefined,
        bio: nextBio || undefined,
        country: nextCountry,
        city: nextCity || undefined,
      };
    }
    return res.json({ user: sanitizeUser(fallbackUsers[target >= 0 ? fallbackUsers[target] : updated]) });
  }

  const stored = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: nextName,
      email: nextEmail,
      avatarUrl: nextAvatar ?? undefined,
      phoneNumber: nextPhone || null,
      address: nextAddress || null,
      emergencyContact: nextEmergency || null,
      bio: nextBio || null,
      country: nextCountry,
      city: nextCity || null,
    },
  });

  return res.json({ user: sanitizeUser(stored) });
});

app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Adresse email requise.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = fallbackUsers.length > 0
    ? fallbackUsers.find((user) => user.email.toLowerCase() === normalizedEmail)
    : await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!existingUser) {
    return res.status(200).json({ message: 'Si un compte correspond à cet email, un code de réinitialisation a été généré.' });
  }

  const resetToken = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  passwordResetTokens.set(resetToken, {
    email: normalizedEmail,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });

  return res.status(200).json({
    message: 'Un code de réinitialisation a été généré. Vérifiez votre boîte mail.',
    resetToken,
    expiresInMinutes: 15,
  });
});

app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body ?? {};

  if (!token || !newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'Code de réinitialisation et mot de passe valide requis.' });
  }

  const resetEntry = passwordResetTokens.get(String(token));
  if (!resetEntry) {
    return res.status(400).json({ error: 'Code de réinitialisation invalide ou expiré.' });
  }

  if (Date.now() > resetEntry.expiresAt) {
    passwordResetTokens.delete(String(token));
    return res.status(410).json({ error: 'Le code de réinitialisation a expiré.' });
  }

  const normalizedEmail = resetEntry.email;

  if (fallbackUsers.length > 0) {
    const match = fallbackUsers.find((user) => user.email.toLowerCase() === normalizedEmail);
    if (!match) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }
    match.passwordHash = await bcrypt.hash(String(newPassword), 10);
  } else {
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash: await bcrypt.hash(String(newPassword), 10) },
    });
  }

  passwordResetTokens.delete(String(token));
  return res.json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });
});

app.post('/api/auth/change-password', requireAuth, async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body ?? {};
  const user = (req as any).user as { id: string; email: string; name: string; role: UserRole; avatarUrl?: string | null };

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
  }

  if (!oldPassword || typeof oldPassword !== 'string') {
    return res.status(400).json({ error: 'L’ancien mot de passe est requis.' });
  }

  let currentUser: { id: string; email: string; passwordHash: string; name: string; role: UserRole; avatarUrl?: string | null } | null = null;

  if (fallbackUsers.length > 0) {
    currentUser = fallbackUsers.find((entry) => entry.id === user.id || entry.email === user.email) ?? null;
  } else {
    currentUser = await prisma.user.findUnique({ where: { id: user.id } });
  }

  if (!currentUser) {
    return res.status(404).json({ error: 'Utilisateur introuvable.' });
  }

  const matchesOld = await bcrypt.compare(String(oldPassword), currentUser.passwordHash);
  if (!matchesOld) {
    return res.status(401).json({ error: 'L’ancien mot de passe est incorrect.' });
  }

  const nextHash = await bcrypt.hash(String(newPassword), 10);

  if (fallbackUsers.length > 0) {
    const index = fallbackUsers.findIndex((entry) => entry.id === currentUser!.id || entry.email === currentUser!.email);
    if (index >= 0) {
      fallbackUsers[index].passwordHash = nextHash;
    }
  } else {
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { passwordHash: nextHash },
    });
  }

  return res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
});

app.post('/api/auth/logout', requireAuth, (req: Request, res: Response) => {
  res.json({ success: true, message: 'Déconnexion réussie.' });
});

app.get('/api/auth/permissions', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as { role: UserRole };
  res.json({ role: user.role, permissions: getUserPermissions(user.role) });
});

const db = {
  players: [
    { id: 'p1', name: 'Marcus Vance', number: 7, position: 'Meneur', ppg: 22.4, apg: 8.9, rpg: 4.8 },
    { id: 'p2', name: 'Darius Jackson', number: 15, position: 'Pivot', ppg: 18.6, apg: 2.1, rpg: 12.3 },
    { id: 'p3', name: 'Lucas Dubois', number: 11, position: 'Arrière', ppg: 19.8, apg: 3.5, rpg: 4.2 },
  ],
  academyApplications: [
    { id: 'app1', candidateName: 'Thomas Morel', email: 'thomas@gmail.com', age: 18, position: 'Arrière', status: 'EN_ATTENTE' },
  ],
  championsDay: {
    year: 2026,
    mvp: 'Marcus "Apex" Vance',
    dunkWinner: 'Yannis "Skywalker" Konda',
    threePtWinner: 'Lucas "Flash" Dubois',
  },
};

app.get('/api/players', requireAuth, (req: Request, res: Response) => {
  res.json(db.players);
});

app.post('/api/players', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'COACH']), (req: Request, res: Response) => {
  const newPlayer = { id: `p_${Date.now()}`, ...req.body };
  db.players.push(newPlayer);
  res.status(201).json({ message: 'Joueur ajouté à l\'équipe avec succès', player: newPlayer });
});

app.delete('/api/players/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'COACH']), (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.players.findIndex((p) => p.id === id);
  if (idx !== -1) {
    db.players.splice(idx, 1);
    return res.json({ message: 'Joueur supprimé du roster.' });
  }
  res.status(404).json({ error: 'Joueur introuvable.' });
});

app.get('/api/academy/applications', requireAuth, (req: Request, res: Response) => {
  res.json(db.academyApplications);
});

app.post('/api/academy/apply', requireAuth, (req: Request, res: Response) => {
  const appItem = { id: `app_${Date.now()}`, ...req.body, status: 'EN_ATTENTE' };
  db.academyApplications.push(appItem);
  res.status(201).json({ message: 'Candidature enregistrée avec succès.', application: appItem });
});

app.get('/api/champions-day', requireAuth, (req: Request, res: Response) => {
  res.json(db.championsDay);
});

app.put('/api/champions-day', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'COACH']), (req: Request, res: Response) => {
  db.championsDay = { ...db.championsDay, ...req.body };
  res.json({ message: 'Mise à jour de La Journée des Champions effectuée.', data: db.championsDay });
});

const startServer = async () => {
  await ensureDatabaseAndSeed();
  app.listen(PORT, () => {
    console.log(`🔥 FIRE STONE Backend API running on http://localhost:${PORT}`);
  });
};

startServer();
