/**
 * Tests d'intégration complets pour le système de Status / Stories temporaires (24h) de HOOPERS
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./dev.db';

const { app } = await import('../server');
const { prisma } = await import('../config/database');
const { JWT_SECRET } = await import('../config/env');
const { StatusCleanupService } = await import('../services/status-cleanup.service');

describe('Système de Status / Stories (24h) — HOOPERS', () => {
  let userA: any;
  let userB: any;
  let userC: any;
  let club: any;

  let tokenA: string;
  let tokenB: string;
  let tokenC: string;

  const createToken = (user: any) =>
    jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('TestPass123!', 8);

    // Création Utilisateur A (propriétaire)
    userA = await prisma.user.create({
      data: {
        email: `test_user_a_${Date.now()}@test.com`,
        name: 'User A',
        passwordHash,
        role: 'PLAYER',
      },
    });
    tokenA = createToken(userA);

    // Création Utilisateur B (follower/ami/visiteur)
    userB = await prisma.user.create({
      data: {
        email: `test_user_b_${Date.now()}@test.com`,
        name: 'User B',
        passwordHash,
        role: 'VISITOR',
      },
    });
    tokenB = createToken(userB);

    // Création Utilisateur C (non autorisé)
    userC = await prisma.user.create({
      data: {
        email: `test_user_c_${Date.now()}@test.com`,
        name: 'User C',
        passwordHash,
        role: 'VISITOR',
      },
    });
    tokenC = createToken(userC);

    // Création d'un Club de test
    club = await prisma.club.create({
      data: {
        name: `Club Test ${Date.now()}`,
        slug: `club-test-${Date.now()}`,
        city: 'Lomé',
        country: 'Togo',
      },
    });

    // User A est PRESIDENT du Club
    await prisma.clubMember.create({
      data: {
        clubId: club.id,
        userId: userA.id,
        role: 'PRESIDENT',
      },
    });

    // User C est simple MEMBER du Club (pas de rôle manager)
    await prisma.clubMember.create({
      data: {
        clubId: club.id,
        userId: userC.id,
        role: 'MEMBER',
      },
    });
  });

  afterAll(async () => {
    // Nettoyage des données de test
    try {
      if (userA) await prisma.user.delete({ where: { id: userA.id } }).catch(() => undefined);
      if (userB) await prisma.user.delete({ where: { id: userB.id } }).catch(() => undefined);
      if (userC) await prisma.user.delete({ where: { id: userC.id } }).catch(() => undefined);
      if (club) await prisma.club.delete({ where: { id: club.id } }).catch(() => undefined);
    } catch {
      // Ignorer
    }
  });

  // ── 1. CRÉATION USER VS CLUB ───────────────────────────────────────────────
  describe('1. Création User vs Club & Rôles', () => {
    it('User crée un Status personnel → SUCCESS (201)', async () => {
      const res = await request(app)
        .post('/statuses')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          text: 'Super entraînement aujourd’hui !',
          visibility: 'PUBLIC',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.userId).toBe(userA.id);
      expect(res.body.clubId).toBeNull();
      expect(res.body.text).toBe('Super entraînement aujourd’hui !');
      expect(res.body.author.type).toBe('USER');
    });

    it('Club Manager autorisé (PRESIDENT) crée un Status pour le club → SUCCESS (201)', async () => {
      const res = await request(app)
        .post('/statuses')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          clubId: club.id,
          text: 'Match décisif ce samedi à 20h !',
          visibility: 'PUBLIC',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.clubId).toBe(club.id);
      expect(res.body.userId).toBeNull();
      expect(res.body.author.type).toBe('CLUB');
      expect(res.body.author.id).toBe(club.id);
    });

    it('Membre non autorisé (User C = simple MEMBER) tente de publier pour le club → DENIED (403)', async () => {
      const res = await request(app)
        .post('/statuses')
        .set('Authorization', `Bearer ${tokenC}`)
        .send({
          clubId: club.id,
          text: 'Tentative non autorisée',
        });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error');
    });

    it('Rejette un status sans texte ni média → BAD REQUEST (400)', async () => {
      const res = await request(app)
        .post('/statuses')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ── 2. MÉDIAS & VIDÉOS ────────────────────────────────────────────────────
  describe('2. Multi-médias & Validations Vidéos', () => {
    it('Supporte plusieurs médias ordonnés (positions 0, 1, 2)', async () => {
      const res = await request(app)
        .post('/statuses')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          text: 'Highlights du match',
          media: [
            { type: 'IMAGE', url: 'https://example.com/img1.jpg', position: 0, mimeType: 'image/jpeg' },
            { type: 'VIDEO', url: 'https://example.com/vid1.mp4', position: 1, duration: 15, size: 1024000, mimeType: 'video/mp4' },
            { type: 'IMAGE', url: 'https://example.com/img2.jpg', position: 2, mimeType: 'image/png' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.media).toHaveLength(3);
      expect(res.body.media[0].position).toBe(0);
      expect(res.body.media[1].position).toBe(1);
      expect(res.body.media[2].position).toBe(2);
    });

    it('Rejette une vidéo dont la durée dépasse 60 secondes → BAD REQUEST (400)', async () => {
      const res = await request(app)
        .post('/statuses')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          media: [
            { type: 'VIDEO', url: 'https://example.com/long.mp4', duration: 75, mimeType: 'video/mp4' },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/durée/i);
    });

    it('Rejette une vidéo dont la taille dépasse 50 Mo → BAD REQUEST (400)', async () => {
      const res = await request(app)
        .post('/statuses')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          media: [
            { type: 'VIDEO', url: 'https://example.com/huge.mp4', size: 55 * 1024 * 1024, mimeType: 'video/mp4' },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/taille/i);
    });

    it('Rejette un média avec type MIME non accepté → BAD REQUEST (400)', async () => {
      const res = await request(app)
        .post('/statuses')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          media: [
            { type: 'IMAGE', url: 'https://example.com/file.exe', mimeType: 'application/x-msdownload' },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/type mime/i);
    });
  });

  // ── 3. EXPIRATION 24H ──────────────────────────────────────────────────────
  describe('3. Expiration 24 heures', () => {
    it('Status créé il y a moins de 24h apparaît dans le feed', async () => {
      const created = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Status récent',
          visibility: 'PUBLIC',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 10 * 3600 * 1000), // expire dans 10h
        },
      });

      const res = await request(app)
        .get('/statuses/feed')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      const allStatuses = res.body.flatMap((g: any) => g.statuses);
      expect(allStatuses.some((s: any) => s.id === created.id)).toBe(true);
    });

    it('Status expiré (> 24h) n’apparaît pas dans le feed et est refusé en lecture directe', async () => {
      const expired = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Status ancien et expiré',
          visibility: 'PUBLIC',
          createdAt: new Date(Date.now() - 30 * 3600 * 1000),
          expiresAt: new Date(Date.now() - 6 * 3600 * 1000), // expiré il y a 6h
        },
      });

      const feedRes = await request(app)
        .get('/statuses/feed')
        .set('Authorization', `Bearer ${tokenB}`);

      const allStatuses = feedRes.body.flatMap((g: any) => g.statuses);
      expect(allStatuses.some((s: any) => s.id === expired.id)).toBe(false);

      const directRes = await request(app)
        .get(`/statuses/${expired.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect([403, 404]).toContain(directRes.status);
    });

    it('Nettoyage des status expirés via StatusCleanupService purge la base', async () => {
      const expiredToPurge = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Status à purger',
          visibility: 'PUBLIC',
          createdAt: new Date(Date.now() - 36 * 3600 * 1000),
          expiresAt: new Date(Date.now() - 12 * 3600 * 1000),
        },
      });

      const cleanupResult = await StatusCleanupService.cleanupExpiredStatuses();
      expect(cleanupResult.purgedCount).toBeGreaterThan(0);
      expect(cleanupResult.purgedIds).toContain(expiredToPurge.id);

      const check = await prisma.status.findUnique({ where: { id: expiredToPurge.id } });
      expect(check).toBeNull();
    });
  });

  // ── 4. CONFIDENTIALITÉ & VISIBILITÉ ───────────────────────────────────────
  describe('4. Confidentialité & Visibilité', () => {
    it('PUBLIC → accessible à tout utilisateur connecté', async () => {
      const status = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Story publique',
          visibility: 'PUBLIC',
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      const res = await request(app)
        .get(`/statuses/${status.id}`)
        .set('Authorization', `Bearer ${tokenC}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(status.id);
    });

    it('PRIVATE → accessible uniquement au propriétaire', async () => {
      const status = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Journal intime',
          visibility: 'PRIVATE',
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      // Propriétaire A peut le voir
      const resOwner = await request(app)
        .get(`/statuses/${status.id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(resOwner.status).toBe(200);

      // Tiers B est refusé
      const resOther = await request(app)
        .get(`/statuses/${status.id}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(resOther.status).toBe(403);
    });

    it('FOLLOWERS → accessible uniquement aux abonnés réels', async () => {
      // User B suit User A
      await prisma.follow.upsert({
        where: { followerId_followedId: { followerId: userB.id, followedId: userA.id } },
        create: { followerId: userB.id, followedId: userA.id },
        update: {},
      });

      const status = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Story pour mes abonnés',
          visibility: 'FOLLOWERS',
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      // User B (follower) peut le voir
      const resFollower = await request(app)
        .get(`/statuses/${status.id}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(resFollower.status).toBe(200);

      // User C (non-follower) ne peut pas le voir
      const resNonFollower = await request(app)
        .get(`/statuses/${status.id}`)
        .set('Authorization', `Bearer ${tokenC}`);
      expect(resNonFollower.status).toBe(403);
    });

    it('FRIENDS → accessible uniquement en cas d’abonnement mutuel', async () => {
      // Pour l'instant B suit A, mais A ne suit pas B -> pas encore "amis"
      await prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: userA.id, followedId: userB.id },
            { followerId: userB.id, followedId: userA.id },
          ],
        },
      });

      await prisma.follow.create({
        data: { followerId: userB.id, followedId: userA.id },
      });

      const status = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Story amis proches',
          visibility: 'FRIENDS',
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      // B suit A mais pas réciproque : refusé
      const res1 = await request(app)
        .get(`/statuses/${status.id}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res1.status).toBe(403);

      // Réciprocité : A suit B en retour
      await prisma.follow.create({
        data: { followerId: userA.id, followedId: userB.id },
      });

      // Maintenant ils sont amis : accepté
      const res2 = await request(app)
        .get(`/statuses/${status.id}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res2.status).toBe(200);
    });

    it('CUSTOM → accessible uniquement aux utilisateurs figurant dans StatusAudience', async () => {
      const status = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Story pour une liste restreinte',
          visibility: 'CUSTOM',
          expiresAt: new Date(Date.now() + 3600 * 1000),
          audiences: {
            create: [{ userId: userB.id }],
          },
        },
      });

      // User B est dans l'audience : autorisé
      const resB = await request(app)
        .get(`/statuses/${status.id}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(resB.status).toBe(200);

      // User C n'est pas dans l'audience : refusé
      const resC = await request(app)
        .get(`/statuses/${status.id}`)
        .set('Authorization', `Bearer ${tokenC}`);
      expect(resC.status).toBe(403);
    });
  });

  // ── 5. VUES & VIEWS LIST ──────────────────────────────────────────────────
  describe('5. Vues uniques et consultation des spectateurs', () => {
    it('User B ouvre le status → 1 vue enregistrée', async () => {
      const status = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Test des vues',
          visibility: 'PUBLIC',
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      const res = await request(app)
        .post(`/statuses/${status.id}/view`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const views = await prisma.statusView.findMany({ where: { statusId: status.id } });
      expect(views).toHaveLength(1);
    });

    it('User B rouvre le status → toujours 1 seule vue unique (pas de doublon)', async () => {
      const status = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Test vue non dupliquée',
          visibility: 'PUBLIC',
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      // Première vue
      await request(app).post(`/statuses/${status.id}/view`).set('Authorization', `Bearer ${tokenB}`);
      // Seconde vue
      await request(app).post(`/statuses/${status.id}/view`).set('Authorization', `Bearer ${tokenB}`);

      const views = await prisma.statusView.findMany({ where: { statusId: status.id } });
      expect(views).toHaveLength(1);
    });

    it('Propriétaire User A peut consulter la liste des spectateurs', async () => {
      const status = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Inspecter les spectateurs',
          visibility: 'PUBLIC',
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      await request(app).post(`/statuses/${status.id}/view`).set('Authorization', `Bearer ${tokenB}`);

      const res = await request(app)
        .get(`/statuses/${status.id}/views`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.totalViews).toBe(1);
      expect(res.body.viewers[0].user.id).toBe(userB.id);
    });

    it('Utilisateur tiers User B ne peut pas voir les spectateurs du Status de User A → 403', async () => {
      const status = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Vues secrètes',
          visibility: 'PUBLIC',
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      const res = await request(app)
        .get(`/statuses/${status.id}/views`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ── 6. RÉACTIONS ──────────────────────────────────────────────────────────
  describe('6. Réactions & Remplacement unique', () => {
    it('Ajoute une réaction LIKE puis la remplace par FIRE → 1 seule réaction en base', async () => {
      const status = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Test réactions',
          visibility: 'PUBLIC',
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      // Réaction initiale LIKE
      const resLike = await request(app)
        .post(`/statuses/${status.id}/reactions`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ type: 'LIKE' });

      expect(resLike.status).toBe(200);
      expect(resLike.body.type).toBe('LIKE');

      // Modification en FIRE
      const resFire = await request(app)
        .post(`/statuses/${status.id}/reactions`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ type: 'FIRE' });

      expect(resFire.status).toBe(200);
      expect(resFire.body.type).toBe('FIRE');

      // Vérifier en base qu'il n'y a qu'une seule réaction pour ce user
      const reactions = await prisma.statusReaction.findMany({ where: { statusId: status.id } });
      expect(reactions).toHaveLength(1);
      expect(reactions[0].type).toBe('FIRE');
    });

    it('Supprime une réaction avec DELETE /statuses/:id/reactions', async () => {
      const status = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Test suppression réaction',
          visibility: 'PUBLIC',
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      await request(app)
        .post(`/statuses/${status.id}/reactions`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ type: 'LOVE' });

      const delRes = await request(app)
        .delete(`/statuses/${status.id}/reactions`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.removed).toBe(true);

      const reactions = await prisma.statusReaction.findMany({ where: { statusId: status.id } });
      expect(reactions).toHaveLength(0);
    });
  });

  // ── 7. RÉPONSES ───────────────────────────────────────────────────────────
  describe('7. Réponses aux Status', () => {
    it('User B répond au status de User A → SUCCESS (201)', async () => {
      const status = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Qui vient au match ?',
          visibility: 'PUBLIC',
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      const res = await request(app)
        .post(`/statuses/${status.id}/replies`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ content: 'Je serai là en tribune !' });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('Je serai là en tribune !');
      expect(res.body.userId).toBe(userB.id);
    });

    it('Auteur de la réponse peut la supprimer', async () => {
      const status = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Test suppression réponse',
          visibility: 'PUBLIC',
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      const replyRes = await request(app)
        .post(`/statuses/${status.id}/replies`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ content: 'Message temporaire' });

      const replyId = replyRes.body.id;

      const delRes = await request(app)
        .delete(`/statuses/${status.id}/replies/${replyId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
    });
  });

  // ── 8. PERMISSIONS & SUPPRESSION ──────────────────────────────────────────
  describe('8. Permissions & Contrôle de suppression', () => {
    it('User B ne peut PAS supprimer le Status de User A → 403', async () => {
      const status = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Status protégé',
          visibility: 'PUBLIC',
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      const res = await request(app)
        .delete(`/statuses/${status.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
    });

    it('Propriétaire User A peut supprimer son propre Status → 200', async () => {
      const status = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Status à supprimer',
          visibility: 'PUBLIC',
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      const res = await request(app)
        .delete(`/statuses/${status.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await prisma.status.findUnique({ where: { id: status.id } });
      expect(check).toBeNull();
    });
  });

  // ── 9. MENTIONS & NOTIFICATIONS ───────────────────────────────────────────
  describe('9. Mentions et Notifications', () => {
    it('Mentionner un utilisateur déclenche une Notification pour cet utilisateur', async () => {
      const res = await request(app)
        .post('/statuses')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          text: 'Super entraînement avec @UserB !',
          visibility: 'PUBLIC',
          mentions: [{ userId: userB.id }],
        });

      expect(res.status).toBe(201);

      const notif = await prisma.notification.findFirst({
        where: {
          userId: userB.id,
          type: 'STATUS_MENTION',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(notif).not.toBeNull();
      expect(notif?.title).toBe('Mention dans un Status');
    });
  });

  // ── 10. SIGNALEMENT (REPORT) ──────────────────────────────────────────────
  describe('10. Signalement & Modération', () => {
    it('Permet de signaler un Status via le système Report existant', async () => {
      const status = await prisma.status.create({
        data: {
          userId: userA.id,
          text: 'Contenu inapproprié à signaler',
          visibility: 'PUBLIC',
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          targetType: 'STATUS',
          targetId: status.id,
          reason: 'SPAM',
          details: 'Story publicitaire abusive',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.report.statusId).toBe(status.id);
      expect(res.body.report.targetType).toBe('STATUS');
    });
  });
});
