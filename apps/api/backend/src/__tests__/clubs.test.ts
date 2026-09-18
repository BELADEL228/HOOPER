import { describe, it, expect } from 'vitest';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./dev.db';

const { app } = await import('../server');

describe('GET /api/clubs', () => {
  it('retourne 200 avec la liste des clubs de basketball', async () => {
    const res = await request(app).get('/api/clubs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('chaque club possède un nom, slug, ville et identité visuelle', async () => {
    const res = await request(app).get('/api/clubs');
    expect(res.status).toBe(200);
    if (res.body.length > 0) {
      const club = res.body[0];
      expect(club).toHaveProperty('id');
      expect(club).toHaveProperty('name');
      expect(club).toHaveProperty('slug');
      expect(club).toHaveProperty('city');
      expect(club).toHaveProperty('primaryColor');
    }
  });

  it('GET /api/posts retourne le fil d’actualités multi-clubs', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
