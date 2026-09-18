import http from 'http';                                    // ✅ Ajout
import { app } from './app';
import { PORT, NODE_ENV } from './config/env';
import { ensureDatabaseAndSeed } from './config/database';
import { attachSocketIO } from './socket';                  // ✅ Ajout
import { StatusCleanupService } from './services/status-cleanup.service';

export { app };

const startServer = async () => {
  await ensureDatabaseAndSeed();

  // ✅ 1. Créer un serveur HTTP à partir de l'app Express
  const httpServer = http.createServer(app);

  // ✅ 2. Attacher Socket.IO au serveur HTTP
  const io = attachSocketIO(httpServer);

  // ✅ 3. Écouter sur le serveur HTTP (plus sur app directement)
  const server = httpServer.listen(PORT, () => {
    console.log(`🚀 Serveur FIRE STONE opérationnel sur http://localhost:${PORT} [${NODE_ENV}]`);
    console.log(`📡 API REST & Modular Routes : http://localhost:${PORT}/api`);
    console.log(`🩺 Health Check : http://localhost:${PORT}/health`);
    console.log(`🔌 Socket.IO prêt sur ws://localhost:${PORT}`);
  });

  // Purge périodique des status expirés (toutes les 15 minutes)
  const cleanupInterval = setInterval(() => {
    StatusCleanupService.cleanupExpiredStatuses().catch((err) => {
      console.warn('Erreur lors du nettoyage périodique des status:', err);
    });
  }, 15 * 60 * 1000);

  const gracefulShutdown = () => {
    console.log('Fermeture propre du serveur...');
    clearInterval(cleanupInterval);

    // ✅ Fermer Socket.IO proprement avant le serveur HTTP
    io.close(() => {
      console.log('Socket.IO fermé.');
      server.close(() => {
        console.log('Serveur arrêté.');
        process.exit(0);
      });
    });
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
};

// Si le script est exécuté directement
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    console.error('Échec critique au démarrage du serveur:', error);
    process.exit(1);
  });
}