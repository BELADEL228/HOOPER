import { Request, Response } from 'express';
import { AuthService, passwordResetTokens } from '../services/auth.service';
import { validateLoginInput, validateRegisterInput } from '../validators/auth.validator';
import { AuthenticatedUser } from '../types';
import { AppError } from '../utils/errors';
import Logger from '../utils/logger';

export class AuthController {
  static async register(req: Request, res: Response) {
    const validation = validateRegisterInput(req.body);
    if (!validation.valid || !validation.data) {
      return res.status(400).json({ error: validation.error || 'Données d\'inscription invalides.' });
    }
     try {
      const session = await AuthService.register(validation.data);
      return res.status(201).json(session);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      Logger.error('Erreur lors de la création du compte', 'AuthController', { error: error.message });
      return res.status(500).json({ error: error.message || 'Erreur lors de la création du compte.' });
    }
  }

  static async login(req: Request, res: Response) {
    const validation = validateLoginInput(req.body);
    if (!validation.valid || !validation.email || !validation.password) {
      return res.status(400).json({ error: validation.error || 'Email et mot de passe requis.' });
    }

    try {
      const session = await AuthService.login(validation.email, validation.password);
      return res.json(session);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      Logger.error('Erreur lors de la connexion', 'AuthController', { error: error.message });
      return res.status(401).json({ error: error.message || 'Identifiants invalides.' });
    }
  }

  static async me(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    return res.json({ user, permissions: AuthService.getPermissions(user.role) });
  }

  static async updateProfile(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    try {
      const updated = await AuthService.updateProfile(user.id, req.body);
      return res.json({ user: updated, message: 'Profil mis à jour avec succès.' });
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      Logger.error('Erreur lors de la mise à jour du profil', 'AuthController', { error: error.message });
      return res.status(500).json({ error: error.message || 'Erreur lors de la mise à jour.' });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body ?? {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email obligatoire.' });
    }

    const resetToken = `reset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    passwordResetTokens.set(resetToken, { email: email.toLowerCase(), expiresAt: Date.now() + 15 * 60 * 1000 });

    return res.json({
      message: 'Si cet email correspond à un compte, un lien de réinitialisation a été préparé.',
      resetToken,
    });
  }

  static async resetPassword(req: Request, res: Response) {
    const { token, newPassword } = req.body ?? {};
    if (!token || !newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'Token valide et mot de passe de 8 caractères minimum requis.' });
    }

    const item = passwordResetTokens.get(String(token));
    if (!item || item.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Code expiré ou invalide.' });
    }

    passwordResetTokens.delete(String(token));
    return res.json({ message: 'Mot de passe mis à jour avec succès.' });
  }

  static async changePassword(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    const { oldPassword, newPassword } = req.body ?? {};
    if (!oldPassword || !newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'Ancien mot de passe et nouveau mot de passe (8 car. min) requis.' });
    }
    try {
      await AuthService.changePassword(user.id, oldPassword, newPassword);
      return res.json({ message: 'Mot de passe modifié avec succès.' });
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      Logger.error('Erreur lors du changement de mot de passe', 'AuthController', { error: error.message });
      return res.status(500).json({ error: error.message || 'Erreur lors du changement de mot de passe.' });
    }
  }

  static logout(_req: Request, res: Response) {
    return res.json({ message: 'Déconnexion effectuée.' });
  }

  static permissions(req: Request, res: Response) {
    const user = (req as any).user as AuthenticatedUser;
    return res.json({ role: user.role, permissions: AuthService.getPermissions(user.role) });
  }
}
