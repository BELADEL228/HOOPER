/**
 * File d'attente hors-ligne (Offline Mutation Queue) pour HOOPER PWA.
 * Permet de différer et synchroniser les actions utilisateurs effectuées
 * en zone de connectivité instable (likes, candidatures, inscriptions).
 */

export interface QueuedAction {
  id: string;
  url: string;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  description: string;
  createdAt: number;
  retries: number;
}

const STORAGE_KEY = 'hooper_offline_action_queue';

/**
 * Récupère la liste des requêtes en attente de synchronisation.
 */
export function getQueuedActions(): QueuedAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Sauvegarde la file d'attente.
 */
function saveQueue(queue: QueuedAction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    // Déclencher un événement global pour que l'UI sache qu'il y a des actions en attente
    window.dispatchEvent(new CustomEvent('hooper:offline-queue-change', { detail: { count: queue.length } }));
  } catch (err) {
    console.warn('[OfflineQueue] Erreur de sauvegarde locale :', err);
  }
}

/**
 * Ajoute une action à rejouer dès le retour de la connexion.
 */
export function enqueueAction(
  url: string,
  method: QueuedAction['method'],
  body?: any,
  description = 'Action utilisateur',
  headers?: Record<string, string>
): QueuedAction {
  const action: QueuedAction = {
    id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    url,
    method,
    body,
    headers,
    description,
    createdAt: Date.now(),
    retries: 0,
  };

  const queue = getQueuedActions();
  queue.push(action);
  saveQueue(queue);

  // Enregistrer pour background sync du Service Worker si supporté
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((reg) => {
      return (reg as any).sync?.register('sync-offline-actions');
    }).catch(() => undefined);
  }

  return action;
}

/**
 * Supprime une action de la file.
 */
export function dequeueAction(id: string): void {
  const queue = getQueuedActions().filter((a) => a.id !== id);
  saveQueue(queue);
}

/**
 * Exécute et vide la file d'attente d'actions dès que le réseau est disponible.
 */
export async function flushOfflineQueue(): Promise<{ succeeded: number; failed: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { succeeded: 0, failed: 0 };
  }

  const queue = getQueuedActions();
  if (queue.length === 0) return { succeeded: 0, failed: 0 };

  let succeeded = 0;
  let failed = 0;
  const remaining: QueuedAction[] = [];

  for (const action of queue) {
    try {
      const res = await fetch(action.url, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
          ...(action.headers || {}),
        },
        body: action.body ? JSON.stringify(action.body) : undefined,
      });

      if (res.ok || res.status === 400 || res.status === 409) {
        // Succès ou erreur client définitive (ex: déjà liké ou doublon) -> on retire de la file
        succeeded++;
      } else {
        // Erreur temporaire 5xx ou réseau
        if (action.retries < 5) {
          remaining.push({ ...action, retries: action.retries + 1 });
        }
        failed++;
      }
    } catch {
      // Échec réseau, on garde l'action
      if (action.retries < 5) {
        remaining.push({ ...action, retries: action.retries + 1 });
      }
      failed++;
    }
  }

  saveQueue(remaining);
  return { succeeded, failed };
}

// Écoute automatique du retour en ligne
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineQueue] Réseau rétabli → Vidage de la file d’attente...');
    void flushOfflineQueue();
  });
}
