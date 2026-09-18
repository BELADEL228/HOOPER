import { Request, Response } from 'express';
import { AuthenticatedUser } from '../types';
import { ClubRequestError, ClubRequestService } from '../services/club-request.service';

const userFrom = (req: Request) => (req as any).user as AuthenticatedUser;
const handle = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : 'Une erreur est survenue.';
  return res.status(error instanceof ClubRequestError ? error.status : 500).json({ error: message });
};

export class ClubRequestController {
  static async submit(req: Request, res: Response) {
    try { return res.status(201).json(await ClubRequestService.submitRequest(userFrom(req).id, req.body)); }
    catch (error) { return handle(res, error); }
  }
  static async list(req: Request, res: Response) {
    try { return res.json(await ClubRequestService.listRequests(typeof req.query.status === 'string' ? req.query.status : undefined)); }
    catch (error) { return handle(res, error); }
  }
  static async mine(req: Request, res: Response) {
    try { return res.json(await ClubRequestService.myRequests(userFrom(req).id)); }
    catch (error) { return handle(res, error); }
  }
  static async approve(req: Request, res: Response) {
    try { return res.json(await ClubRequestService.approveRequest(req.params.id, userFrom(req).id)); }
    catch (error) { return handle(res, error); }
  }
  static async reject(req: Request, res: Response) {
    try { return res.json(await ClubRequestService.rejectRequest(req.params.id, userFrom(req).id, req.body?.note)); }
    catch (error) { return handle(res, error); }
  }
}
