import { Router } from 'express';
import { MarketplaceController } from '../controllers/marketplace.controller';

export const marketplaceRouter = Router();

marketplaceRouter.get('/products', MarketplaceController.getProducts);
marketplaceRouter.post('/checkout', MarketplaceController.checkout);

export const ticketingRouter = Router();
ticketingRouter.get('/matches', MarketplaceController.getTicketingMatches);
ticketingRouter.get('/verify/:ticketCode', MarketplaceController.verifyTicket);
ticketingRouter.post('/validate', MarketplaceController.validateTicket);
