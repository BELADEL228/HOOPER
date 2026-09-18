import { DEFAULT_PRODUCTS, DEFAULT_TICKETING_MATCHES, ProductRecord, TicketingMatchRecord } from '../config/constants';

interface StoredTicket {
  ticketCode: string;
  qrCodeData: string;
  matchTitle: string;
  ticketTierName: string;
  priceXOF: number;
  customerName: string;
  customerPhone: string;
  isUsed: boolean;
  usedAt?: string;
  usedBy?: string;
  createdAt: string;
}

const memoryTickets = new Map<string, StoredTicket>();
let orderCounter = 1000;
let ticketCounter = 10000;

export class MarketplaceService {
  static getProducts(category?: string): ProductRecord[] {
    if (!category || category === 'ALL') return DEFAULT_PRODUCTS;
    return DEFAULT_PRODUCTS.filter((p) => p.category === category);
  }

  static getTicketingMatches(): TicketingMatchRecord[] {
    return DEFAULT_TICKETING_MATCHES;
  }

  static processCheckout(data: any) {
    const { items, customerName, customerPhone } = data ?? {};

    if (!customerName || !customerPhone) {
      throw { status: 400, message: 'Nom et numéro de téléphone requis.' };
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw { status: 400, message: 'Le panier ne peut pas être vide.' };
    }

    orderCounter += 1;
    const orderNumber = `FS-ORD-2026-${String(orderCounter).padStart(4, '0')}`;

    let totalAmountXOF = 0;
    const generatedTickets: StoredTicket[] = [];

    for (const item of items) {
      const price = Number(item.priceXOF) || 0;
      const qty = Math.max(1, Number(item.quantity) || 1);
      totalAmountXOF += price * qty;

      if (item.itemType === 'ticket') {
        for (let i = 0; i < qty; i++) {
          ticketCounter += 1;
          const ticketCode = `FS-TKT-2026-${String(ticketCounter).padStart(5, '0')}`;
          const qrCodeData = `FIRESTONE-VALID:${ticketCode}:${item.id || 'match'}:${customerName}`;

          const ticket: StoredTicket = {
            ticketCode,
            qrCodeData,
            matchTitle: item.title || 'Match Officiel',
            ticketTierName: item.ticketTierName || 'Tribune Générale',
            priceXOF: price,
            customerName,
            customerPhone,
            isUsed: false,
            createdAt: new Date().toISOString(),
          };

          memoryTickets.set(ticketCode, ticket);
          generatedTickets.push(ticket);
        }
      }
    }

    const order = {
      orderNumber,
      customerName,
      customerPhone,
      totalAmountXOF,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      order,
      tickets: generatedTickets,
      message: `Commande #${orderNumber} confirmée avec succès.`,
    };
  }

  static verifyTicket(ticketCode: string) {
    const code = (ticketCode || '').trim();
    const ticket = memoryTickets.get(code);

    if (!ticket) {
      return { isValid: false, message: 'Billet introuvable.' };
    }

    return {
      isValid: !ticket.isUsed,
      isUsed: ticket.isUsed,
      ticket,
    };
  }

  static validateTicketAtGate(ticketCode: string, stadierName?: string) {
    const code = (ticketCode || '').trim();
    const ticket = memoryTickets.get(code);

    if (!ticket) {
      throw { status: 404, message: 'Billet introuvable.' };
    }

    if (ticket.isUsed) {
      throw {
        status: 409,
        alreadyUsed: true,
        message: `Billet déjà composté le ${new Date(ticket.usedAt || '').toLocaleTimeString('fr-FR')}.`,
        ticket,
      };
    }

    ticket.isUsed = true;
    ticket.usedAt = new Date().toISOString();
    ticket.usedBy = stadierName || 'Agent Portique';

    return {
      valid: true,
      success: true,
      ticket,
      message: `Accès autorisé pour ${ticket.customerName}.`,
    };
  }
}
