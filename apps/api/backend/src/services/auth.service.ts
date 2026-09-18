import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma, fallbackUsers, isDatabaseAvailable } from '../config/database';
import { JWT_SECRET } from '../config/env';
import { rolePermissionMap, UserRole } from '../config/constants';
import { sanitizeUser, toRole } from '../middlewares/auth.middleware';
import { RegisterInput } from '../validators/auth.validator';
import { AuthenticatedUser, AuthSession } from '../types';
import { ConflictError, UnauthorizedError, ValidationError, NotFoundError } from '../utils/errors';
import Logger from '../utils/logger';

export const passwordResetTokens = new Map<string, { email: string; expiresAt: number }>();

export class AuthService {
  static signToken(user: { id: string; email: string; role: UserRole }): string {
    return jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  static async register(input: RegisterInput): Promise<AuthSession> {
    const role: UserRole = input.role ? toRole(input.role) : 'VISITOR';
    const email = input.email.toLowerCase();

    if (!isDatabaseAvailable()) {
      Logger.warn('Inscription en mode fallback : données non persistées', 'AuthService', { email });
      const existing = fallbackUsers.find((u) => u.email.toLowerCase() === email);
      if (existing) {
        throw new ConflictError('Un compte existe déjà pour cet email.');
      }

      const user = {
        id: `fallback-${Date.now()}`,
        email,
        name: input.name,
        role,
        passwordHash: await bcrypt.hash(input.password, 10),
        avatarUrl: input.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(input.name)}`,
        phoneNumber: input.phoneNumber,
        city: input.city,
        country: input.country || 'Togo',
        bio: input.bio,
      };

      fallbackUsers.push(user);
      const token = this.signToken({ id: user.id, email: user.email, role: user.role });
      return { token, user: sanitizeUser(user) };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('Un compte existe déjà pour cet email.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const avatarUrl = input.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(input.name)}`;

    const user = await prisma.user.create({
      data: {
        email,
        name: input.name,
        role,
        passwordHash,
        avatarUrl,
        phoneNumber: input.phoneNumber,
        city: input.city,
        country: input.country || 'Togo',
        bio: input.bio,
      },
    });

    // Si inscription d'un joueur, créer son profil sportif initial
    if (role === 'PLAYER' || input.jerseyNumber !== undefined || input.position) {
      try {
        await prisma.playerProfile.create({
          data: {
            userId: user.id,
            jerseyNumber: input.jerseyNumber ?? 0,
            position: input.position ?? 'Ailier',
            heightCm: input.heightCm ?? 185,
            weightKg: input.weightKg ?? 78,
            age: input.age ?? 20,
            experienceYears: input.experienceYears ?? 1,
            category: 'SENIOR',
            gender: 'MASCULIN',
            photoUrl: avatarUrl,
          },
        });
      } catch (err) {
        console.warn('Initial player profile creation skipped:', err);
      }
    }

    // Si rattaché à un club
    if (input.clubId) {
      try {
        await prisma.clubMember.create({
          data: {
            clubId: input.clubId,
            userId: user.id,
            role: role === 'COACH' ? 'COACH' : role === 'PLAYER' ? 'PLAYER' : 'MEMBER',
          },
        });
      } catch (err) {
        console.warn('Initial club membership skipped:', err);
      }
    }

    const token = this.signToken({ id: user.id, email: user.email, role: toRole(user.role) });
    return { token, user: sanitizeUser(user) };
  }

  static async login(emailInput: string, passwordInput: string): Promise<AuthSession> {
    const email = emailInput.toLowerCase();
    let userRecord: any = null;

    if (!isDatabaseAvailable()) {
      Logger.warn('Connexion en mode fallback', 'AuthService', { email });
      userRecord = fallbackUsers.find((u) => u.email.toLowerCase() === email) ?? null;
    } else {
      userRecord = await prisma.user.findUnique({ where: { email } });
    }

    if (!userRecord) {
      throw new UnauthorizedError('Identifiants invalides.');
    }

    const passwordMatch = await bcrypt.compare(passwordInput, userRecord.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Identifiants invalides.');
    }

    if (userRecord.isSuspended) {
      if (userRecord.suspendedUntil && new Date(userRecord.suspendedUntil) < new Date()) {
        if (isDatabaseAvailable()) {
          await prisma.user.update({
            where: { id: userRecord.id },
            data: { isSuspended: false, suspendReason: null, suspendedUntil: null },
          });
        }
        userRecord.isSuspended = false;
        userRecord.suspendReason = null;
        userRecord.suspendedUntil = null;
      } else {
        throw new UnauthorizedError(`Compte suspendu : ${userRecord.suspendReason || 'Non précisé'}`);
      }
    }

    const token = this.signToken({
      id: userRecord.id,
      email: userRecord.email,
      role: toRole(userRecord.role),
    });

    return { token, user: sanitizeUser(userRecord) };
  }

  static async getProfile(userId: string): Promise<AuthenticatedUser> {
    if (!isDatabaseAvailable()) {
      const user = fallbackUsers.find((u) => u.id === userId);
      if (!user) throw new NotFoundError('Utilisateur');
      return sanitizeUser(user);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Utilisateur');
    return sanitizeUser(user);
  }

  static async updateProfile(userId: string, data: Partial<AuthenticatedUser>): Promise<AuthenticatedUser> {
    if (!isDatabaseAvailable()) {
      Logger.warn('Mise à jour profil en mode fallback : données non persistées', 'AuthService', { userId });
      const user = fallbackUsers.find((u) => u.id === userId);
      if (!user) throw new NotFoundError('Utilisateur');
      if (data.name) user.name = data.name;
      if (data.phoneNumber !== undefined) user.phoneNumber = data.phoneNumber;
      if (data.address !== undefined) user.address = data.address;
      if (data.emergencyContact !== undefined) user.emergencyContact = data.emergencyContact;
      if (data.bio !== undefined) user.bio = data.bio;
      if (data.city !== undefined) user.city = data.city;
      if (data.country !== undefined) user.country = data.country;
      if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
      return sanitizeUser(user);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
        address: data.address,
        emergencyContact: data.emergencyContact,
        bio: data.bio,
        city: data.city,
        country: data.country,
        avatarUrl: data.avatarUrl,
      },
    });

    return sanitizeUser(updated);
  }

  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    if (!isDatabaseAvailable()) {
      const user = fallbackUsers.find((u) => u.id === userId);
      if (!user) throw new NotFoundError('Utilisateur');
      const valid = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!valid) throw new UnauthorizedError('L\'ancien mot de passe est incorrect.');
      user.passwordHash = await bcrypt.hash(newPassword, 10);
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Utilisateur');

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedError('L\'ancien mot de passe est incorrect.');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  static getPermissions(role: UserRole): string[] {
    return rolePermissionMap[role] ?? ['club:read'];
  }
}
