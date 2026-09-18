/**
 * Tests d'intégration des routes Marketplace & Billetterie QR.
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./dev.db';

const { app } = await import('../server');

describe('GET /api/marketplace/products', () => {
  it('retourne 200 avec la liste des produits', async () => {
    const res = await request(app).get('/api/marketplace/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('chaque produit possède un nom, prix en FCFA et catégorie', async () => {
    const res = await request(app).get('/api/marketplace/products');
    const first = res.body[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('priceXOF');
    expect(first).toHaveProperty('category');
    expect(typeof first.priceXOF).toBe('number');
  });

  it('permet de filtrer par catégorie JERSEYS', async () => {
    const res = await request(app).get('/api/marketplace/products?category=JERSEYS');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    for (const prod of res.body) {
      expect(prod.category).toBe('JERSEYS');
    }
  });
});

describe('GET /api/tickets/matches', () => {
  it('retourne les matchs ouverts à la billetterie avec leurs paliers de sièges', async () => {
    const res = await request(app).get('/api/tickets/matches');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const match = res.body[0];
    expect(match).toHaveProperty('homeTeamName');
    expect(match).toHaveProperty('arenaName');
    expect(match).toHaveProperty('tiers');
    expect(Array.isArray(match.tiers)).toBe(true);
    expect(match.tiers[0]).toHaveProperty('priceXOF');
  });
});

describe('POST /api/marketplace/checkout & Billetterie', () => {
  it('retourne 400 si les informations client sont incomplètes', async () => {
    const res = await request(app)
      .post('/api/marketplace/checkout')
      .send({ customerName: 'Abel' });
    expect(res.status).toBe(400);
  });

  it('retourne 400 si le panier est vide', async () => {
    const res = await request(app)
      .post('/api/marketplace/checkout')
      .send({
        customerName: 'Koffi Mensah',
        customerEmail: 'koffi@example.com',
        customerPhone: '+228 90 12 34 56',
        items: [],
      });
    expect(res.status).toBe(400);
  });

  it('crée une commande de tickets avec QR code et référence unique', async () => {
    const checkoutPayload = {
      customerName: 'Koffi Mensah',
      customerEmail: 'koffi@example.com',
      customerPhone: '+228 90 12 34 56',
      paymentMethod: 'TMONEY',
      items: [
        {
          id: 'match-tkt-001',
          itemType: 'ticket',
          title: 'FIRE STONE Elite vs Éperviers BBC',
          priceXOF: 3500,
          quantity: 2,
          ticketTierName: 'Tribune Couverte Courtside VIP',
          matchDate: '12 Septembre 2026',
        },
      ],
    };

    const res = await request(app)
      .post('/api/marketplace/checkout')
      .send(checkoutPayload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('order');
    expect(res.body).toHaveProperty('tickets');
    expect(res.body.order.orderNumber).toMatch(/^FS-ORD-2026-\d{4}$/);
    expect(res.body.order.totalAmountXOF).toBe(7000);
    expect(res.body.tickets.length).toBe(2);

    const ticket = res.body.tickets[0];
    expect(ticket.ticketCode).toMatch(/^FS-TKT-2026-\d{5}$/);
    expect(ticket.qrCodeData).toContain('FIRESTONE-VALID');
    expect(ticket.isUsed).toBe(false);

    // Vérifier la validation du billet
    const verifyRes = await request(app).get(`/api/tickets/verify/${ticket.ticketCode}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.isValid).toBe(true);

    // Valider par le stadier
    const validateRes = await request(app)
      .post('/api/tickets/validate')
      .send({ ticketCode: ticket.ticketCode, stadierName: 'Agent Portique 1' });
    expect(validateRes.status).toBe(200);
    expect(validateRes.body.valid).toBe(true);

    // Deuxième validation = refus
    const secondValidation = await request(app)
      .post('/api/tickets/validate')
      .send({ ticketCode: ticket.ticketCode });
    expect(secondValidation.status).toBe(409);
    expect(secondValidation.body.alreadyUsed).toBe(true);
  });
});
