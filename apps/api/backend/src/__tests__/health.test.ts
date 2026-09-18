/**
 * Tests d'intégration de l'endpoint GET /health
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server';

describe('GET /health', () => {
  it('retourne status 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('retourne { status: "OK" }', async () => {
    const res = await request(app).get('/health');
    expect(res.body.status).toMatch(/ok/i);
  });

  it('retourne le Content-Type JSON', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/json/);
  });
});

describe('GET /api/health', () => {
  it('retourne status 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toMatch(/ok/i);
  });
});
