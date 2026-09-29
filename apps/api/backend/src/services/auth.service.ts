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

    let feedbackMessage = 'Compte créé avec succès. Bienvenue sur HOOPER !';
    let membershipStatus: string | undefined = undefined;
    let targetClubId: string | undefined = input.clubId;

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
      return {
        token,
        user: sanitizeUser(user),
        message: feedbackMessage,
        clubMembershipStatus: membershipStatus,
        clubId: targetClubId,
      };
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

    // ─── 1. DIRIGEANT (Club Admin) : Création club OU Rejoint club existant ────────
    if (role === 'CLUB_ADMIN') {
      if (input.createClub && input.newClubData?.name) {
        const { ClubService } = await import('./club.service');
        const club = await ClubService.createClub({
          name: input.newClubData.name,
          city: input.newClubData.city || input.city || 'Lomé',
          country: input.newClubData.country || input.country || 'Togo',
          address: input.newClubData.address || input.newClubData.arena,
          logoUrl: input.newClubData.logoUrl,
          description: input.newClubData.description || (input.newClubData.arena ? `Club officiel ${input.newClubData.name} - Salle: ${input.newClubData.arena}` : `Club officiel de basketball ${input.newClubData.name}`),
        }, user.id);

        targetClubId = club.id;
        membershipStatus = 'ACTIVE';
        feedbackMessage = `Bravo! Votre club ${club.name} a été créé. Vous êtes administrateur. Logo importé & design system généré.`;
      } else if (input.clubId) {
        await prisma.clubMember.create({
          data: {
            clubId: input.clubId,
            userId: user.id,
            role: 'CLUB_ADMIN',
            status: 'PENDING',
          },
        });
        membershipStatus = 'PENDING';
        feedbackMessage = `Votre demande d'adhésion en tant que DIRIGEANT a été envoyée au club pour approbation.`;
      }
    }

    // ─── 2. COACH : Sélection club + Expérience ─────────────────────────────
    else if (role === 'COACH') {
      if (input.clubId) {
        await prisma.clubMember.create({
          data: {
            clubId: input.clubId,
            userId: user.id,
            role: 'COACH',
            status: 'PENDING',
          },
        });
        membershipStatus = 'PENDING';
        feedbackMessage = `Votre inscription en tant que COACH a été envoyée au club pour approbation.`;

        // Notification aux administrateurs du club
        try {
          const admins = await prisma.clubMember.findMany({
            where: { clubId: input.clubId, role: { in: ['PRESIDENT', 'CLUB_ADMIN'] }, status: 'ACTIVE' },
          });
          for (const admin of admins) {
            await prisma.notification.create({
              data: {
                userId: admin.userId,
                type: 'CLUB_APPLICATION',
                title: 'Nouvelle candidature Coach',
                text: `${user.name} a postulé en tant que Coach pour votre club.`,
              },
            });
          }
        } catch {
          // ignore notification error
        }
      } else {
        feedbackMessage = `Compte Coach créé avec succès. Vous pouvez maintenant rejoindre un club.`;
      }
    }

    // ─── 3. JOUEUR : Fiche sportive + Club PENDING ──────────────────────────
    else if (role === 'PLAYER') {
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

      if (input.clubId) {
        await prisma.clubMember.create({
          data: {
            clubId: input.clubId,
            userId: user.id,
            role: 'PLAYER',
            status: 'PENDING',
          },
        });
        membershipStatus = 'PENDING';
        feedbackMessage = `Votre candidature a été envoyée au club. Vous serez notifié de la décision.`;
      } else {
        feedbackMessage = `Compte Joueur créé avec succès.`;
      }
    }

    // ─── 4. SPONSOR : Profil Sponsor & Annonce 24h ──────────────────────────
    else if (role === 'SPONSOR') {
      try {
        await prisma.sponsorProfile.create({
          data: {
            userId: user.id,
            companyName: input.name,
            description: `Secteur: ${input.sponsorDomain || 'Sport & Lifestyle'} | Budget: ${input.sponsorBudget ? `${input.sponsorBudget.toLocaleString()} XOF` : 'À définir'} | Type: ${input.sponsorType || 'FINANCIAL'}`,
            website: input.bio || undefined,
            logoUrl: avatarUrl,
          },
        });
      } catch (err) {
        console.warn('Initial sponsor profile creation skipped:', err);
      }

      if (input.clubId && input.sponsorTeam) {
        membershipStatus = 'ACTIVE';
        feedbackMessage = `Vous êtes maintenant sponsor officiel du club. Une notification d'annonce a été envoyée aux membres.`;

        // Notification d'annonce 24h au club
        try {
          const club = await prisma.club.findUnique({ where: { id: input.clubId } });
          const clubMembers = await prisma.clubMember.findMany({
            where: { clubId: input.clubId, status: 'ACTIVE' },
          });
          for (const member of clubMembers) {
            await prisma.notification.create({
              data: {
                userId: member.userId,
                type: 'SPONSOR_NEW',
                title: 'Nouveau Sponsor Officiel !',
                text: `${input.name} devient partenaire officiel de ${club?.name || 'votre club'}.`,
              },
            });
          }
        } catch {
          // ignore notification error
        }
      } else {
        feedbackMessage = `Votre profil Partenaire / Sponsor a été créé avec succès.`;
      }
    }

    // ─── 5. CANDIDAT ACADÉMIE : Profil Candidat + Club PENDING ──────────────
    else if (role === 'ACADEMY_CANDIDATE') {
      if (input.clubId) {
        await prisma.clubMember.create({
          data: {
            clubId: input.clubId,
            userId: user.id,
            role: 'MEMBER',
            status: 'PENDING',
          },
        });
        membershipStatus = 'PENDING';
        feedbackMessage = `Votre candidature à l'académie a été envoyée au club. Vous serez notifié de la décision.`;
      } else {
        feedbackMessage = `Candidature enregistrée avec succès.`;
      }
    }

    // ─── 6. SUPPORTER / FAN ──────────────────────────────────────────────────
    else if (role === 'SUPPORTER') {
      feedbackMessage = `Bienvenue sur HOOPER ! Votre compte Supporter est actif.`;
    }

    // ─── 7. VISITEUR ────────────────────────────────────────────────────────
    else {
      feedbackMessage = `Compte créé avec succès. Bienvenue sur la plateforme HOOPER.`;
    }

    const token = this.signToken({ id: user.id, email: user.email, role: toRole(user.role) });
    return {
      token,
      user: sanitizeUser(user),
      message: feedbackMessage,
      clubMembershipStatus: membershipStatus,
      clubId: targetClubId,
    };
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
