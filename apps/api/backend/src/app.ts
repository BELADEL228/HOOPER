import express, { Express } from 'express';
import cors from 'cors';
import { CORS_ORIGINS, MAX_JSON_BODY_SIZE } from './config/env';
import { apiRouter } from './routes';
import { statusRouter } from './routes/status.routes';
import { conversationRouter } from './routes/conversation.routes';
import { notFoundHandler, globalErrorHandler } from './middlewares/errorHandler.middleware';
import { userRouter } from './routes/user.routes';
import { notificationRouter } from './routes/notification.routes';

export const createApp = (): Express => {
  const app = express();

  const isDev = process.env.NODE_ENV !== 'production';

  // ─── CORS ───────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        // ✅ Autoriser les requêtes sans origine (curl, Postman, mobile natif)
        if (!origin) {
          callback(null, true);
          return;
        }

        // ✅ EN DEV : autoriser localhost + toutes les IP locales (192.168.x.x, 10.x.x.x, 172.x.x.x)
        // Peu importe HTTP ou HTTPS, peu importe le port
        if (isDev) {
          const isLocalhost = /^https?:\/\/localhost(:\d+)?$/.test(origin);
          const isLocalIP = /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin);
          const isViteNetwork = /^https?:\/\/[a-zA-Z0-9-]+\.local(:\d+)?$/.test(origin);

          if (isLocalhost || isLocalIP || isViteNetwork) {
            callback(null, true);
            return;
          }
        }

        // ✅ EN PROD : liste blanche stricte
        if (CORS_ORIGINS.includes(origin) || CORS_ORIGINS.includes('*')) {
          callback(null, true);
          return;
        }

        console.warn('[CORS] ❌ Origine refusée:', origin);
        callback(new Error('Origine CORS non autorisée.'));
      },
      credentials: true,
      // ✅ Autoriser les headers custom (Authorization, etc.)
      allowedHeaders: ['Content-Type', 'Authorization'],
      // ✅ Autoriser toutes les méthodes HTTP
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  );

  // Body parser
  app.use(express.json({ limit: MAX_JSON_BODY_SIZE }));

  // Root health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'OK',
      system: 'FIRE STONE API Engine v2.0 (Modular)',
      time: new Date().toISOString(),
    });
  });

  // Montage direct pour les Status (/statuses/...)
  app.use('/statuses', statusRouter);

  // ✅ Conversations
  app.use('/api/conversations', conversationRouter);

  // ✅ Users : recherche publique
  app.use('/api/users', userRouter);

  // ✅ Notifications
  app.use('/api/notifications', notificationRouter);

  // Montage des routes API sous /api
  app.use('/api', apiRouter);

  // 404 & Error handlers (toujours en dernier)
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};

export const app = createApp();