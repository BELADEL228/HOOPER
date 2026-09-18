/**
 * Enregistrement et gestion du Service Worker FIRE STONE.
 * Fournit les helpers pour l'installation PWA, le statut hors-ligne et les notifications Push.
 */

export interface PwaRegistrationOptions {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * Enregistre le service worker du projet.
 */
export async function registerServiceWorker(options?: PwaRegistrationOptions): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Détection d'une nouvelle version disponible
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // Nouveau contenu disponible, déclencher le callback
            options?.onUpdate?.(registration);
          } else {
            // Contenu mis en cache pour la première fois
            options?.onSuccess?.(registration);
          }
        }
      };
    };

    return registration;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.warn('[PWA] Échec enregistrement Service Worker :', err.message);
    options?.onError?.(err);
    return null;
  }
}

/**
 * Vérifie si l'application est exécutée en mode Standalone (PWA installée).
 */
export function isPwaInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;
  const isIosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  return isStandaloneDisplay || isIosStandalone;
}

/**
 * Détecte si le périphérique est un appareil Apple iOS (iPhone, iPad, iPod).
 */
export function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) || (ua.includes('macintosh') && navigator.maxTouchPoints > 1);
}

/**
 * Demande l'autorisation des notifications Push du navigateur.
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}
