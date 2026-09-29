import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { CloudinaryService } from '../services/cloudinary.service';

describe('Cloudinary & Upload API (/api/upload)', () => {
  it('CloudinaryService détecte la configuration des clés d\'environnement', () => {
    // Les clés de test sont présentes dans .env ou injectées
    expect(typeof CloudinaryService.cloudName).toBe('string');
    expect(typeof CloudinaryService.apiKey).toBe('string');
    expect(typeof CloudinaryService.apiSecret).toBe('string');
    expect(CloudinaryService.isConfigured()).toBe(true);
  });

  it('POST /api/upload renvoie 400 si aucun fichier n\'est fourni', async () => {
    const res = await request(app)
      .post('/api/upload')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/upload accepte une URL distante et renvoie une réponse normalisée', async () => {
    const sampleUrl = 'https://res.cloudinary.com/dq7albiwo/image/upload/sample.jpg';
    const res = await request(app)
      .post('/api/upload')
      .send({
        file: sampleUrl,
        folder: 'firestone/test',
        resourceType: 'image',
      });

    // Remote URLs are handled or uploaded
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('url');
    expect(res.body).toHaveProperty('secure_url');
    expect(res.body).toHaveProperty('provider');
  });

  it('POST /api/upload gère les uploads avec succès et renvoie un provider valide', async () => {
    // Mock ou test unitaire du service
    const mockUpload = vi.spyOn(CloudinaryService, 'uploadMedia').mockResolvedValueOnce({
      url: 'https://res.cloudinary.com/dq7albiwo/image/upload/v12345/test.png',
      secure_url: 'https://res.cloudinary.com/dq7albiwo/image/upload/v12345/test.png',
      publicId: 'firestone/test/test',
      resourceType: 'image',
      format: 'png',
      bytes: 1024,
    });

    const res = await request(app)
      .post('/api/upload')
      .send({
        file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        folder: 'firestone/test',
      });

    expect(res.status).toBe(201);
    expect(res.body.secure_url).toContain('https://res.cloudinary.com');
    expect(res.body.provider).toBe('cloudinary');
    mockUpload.mockRestore();
  });
});
