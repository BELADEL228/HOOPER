import { Request, Response } from 'express';
import { MarketplaceService } from '../services/marketplace.service';

export class MarketplaceController {
  static getProducts(req: Request, res: Response) {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const products = MarketplaceService.getProducts(category);
    return res.json(products);
  }

  static getTicketingMatches(_req: Request, res: Response) {
    const matches = MarketplaceService.getTicketingMatches();
    return res.json(matches);
  }

  static checkout(req: Request, res: Response) {
    try {
      const result = MarketplaceService.processCheckout(req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      const status = error.status || 400;
      return res.status(status).json({ error: error.message || 'Erreur lors de la commande.' });
    }
  }

  static verifyTicket(req: Request, res: Response) {
    const { ticketCode } = req.params;
    const result = MarketplaceService.verifyTicket(ticketCode);
    return res.json(result);
  }

  static validateTicket(req: Request, res: Response) {
    const { ticketCode, stadierName } = req.body ?? {};
    try {
      const result = MarketplaceService.validateTicketAtGate(ticketCode, stadierName);
      return res.json(result);
    } catch (error: any) {
      const status = error.status || 400;
      return res.status(status).json({
        error: error.message || 'Erreur lors de la validation.',
        alreadyUsed: Boolean(error.alreadyUsed),
      });
    }
  }
}
