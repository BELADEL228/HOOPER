import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ error: `Route non trouvée : ${req.method} ${req.originalUrl}` });
};

export const globalErrorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Une erreur interne est survenue sur le serveur.';
  res.status(status).json({ error: message });
};
