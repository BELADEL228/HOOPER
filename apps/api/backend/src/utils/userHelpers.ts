import { AuthenticatedUser } from '../types';
import { toRole } from '../middlewares/auth.middleware';

/**
 * Convertit un utilisateur brut en format sanitisé pour les réponses API
 * Évite d'exposer des informations sensibles comme le mot de passe hash
 */
export const sanitizeUser = (user: {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  bio?: string | null;
  country?: string | null;
  city?: string | null;
  isSuspended?: boolean | null;
  suspendReason?: string | null;
  suspendedUntil?: Date | string | null;
  createdAt?: Date | string;
}): AuthenticatedUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: toRole(user.role),
  avatarUrl: user.avatarUrl ?? null,
  phoneNumber: user.phoneNumber ?? null,
  address: user.address ?? null,
  emergencyContact: user.emergencyContact ?? null,
  bio: user.bio ?? null,
  country: user.country ?? 'Togo',
  city: user.city ?? null,
  isSuspended: Boolean(user.isSuspended),
  suspendReason: user.suspendReason ?? null,
  suspendedUntil: user.suspendedUntil ? new Date(user.suspendedUntil).toISOString() : null,
  createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
});