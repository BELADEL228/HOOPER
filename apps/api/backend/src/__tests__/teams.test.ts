/**
 * Tests d'intégration des endpoints équipes FIRE STONE.
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./dev.db';

const { app } = await import('../server');

describe('GET /api/teams', () => {
  it('retourne 200 avec un tableau', async () => {
    const res = await request(app).get('/api/teams');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('retourne le Content-Type JSON', async () => {
    const res = await request(app).get('/api/teams');
    expect(res.headers['content-type']).toMatch(/json/);
  });

  it('chaque équipe a les champs obligatoires', async () => {
    const res = await request(app).get('/api/teams');
    if (res.body.length > 0) {
      const team = res.body[0];
      expect(team).toHaveProperty('id');
      expect(team).toHaveProperty('name');
      expect(team).toHaveProperty('slug');
    }
  });
});

describe('GET /api/teams/:id', () => {
  it('retourne 404 pour un ID inexistant', async () => {
    const res = await request(app).get('/api/teams/nonexistent-team-id-xyz');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/teams/:id/theme', () => {
  it('retourne 401 sans authentification', async () => {
    const res = await request(app)
      .patch('/api/teams/some-team-id/theme')
      .send({ primaryColor: '#FF2A3B' });
    expect(res.status).toBe(401);
  });

  it('retourne 401 avec un token invalide', async () => {
    const res = await request(app)
      .patch('/api/teams/some-team-id/theme')
      .set('Authorization', 'Bearer invalid.jwt.token')
      .send({ primaryColor: '#FF2A3B' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/teams', () => {
  it('retourne 401 sans authentification', async () => {
    const res = await request(app)
      .post('/api/teams')
      .send({ name: 'Test Team', slug: 'test-team' });
    expect(res.status).toBe(401);
  });
});
