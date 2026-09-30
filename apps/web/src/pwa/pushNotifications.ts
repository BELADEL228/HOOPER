/**
 * Gestionnaire des Notifications Push pour HOOPER.
 * Permet l'abonnement du navigateur pour recevoir les alertes de score,
 * convocations de match et annonces de club.
 */

export interface NotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
}

const STORAGE_KEY_SUBSCRIBED = 'hooper_push_subscribed';

/**
 * Vérifie le statut de support et de permission des notifications.
 */
export function getNotificationStatus(): NotificationStatus {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return {
      isSupported: false,
      permission: 'unsupported',
      isSubscribed: false,
    };
  }

  const isSubscribed = localStorage.getItem(STORAGE_KEY_SUBSCRIBED) === 'true';
  return {
    isSupported: true,
    permission: Notification.permission,
    isSubscribed,
  };
}

/**
 * Demande la permission d'envoi des notifications à l'utilisateur.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem(STORAGE_KEY_SUBSCRIBED, 'true');
    }
    return permission;
  } catch (err) {
    console.warn('[Push] Erreur lors de la demande de permission :', err);
    return 'denied';
  }
}

/**
 * Envoie une notification locale immédiate (utile pour tests ou alertes locales).
 */
export async function showLocalNotification(title: string, options?: NotificationOptions): Promise<boolean> {
  const status = getNotificationStatus();
  if (!status.isSupported || status.permission !== 'granted') {
    return false;
  }

  const defaultOptions: NotificationOptions = {
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    ...options,
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, defaultOptions);
      return true;
    } else {
      new Notification(title, defaultOptions);
      return true;
    }
  } catch (err) {
    console.warn('[Push] Erreur affichage notification locale :', err);
    return false;
  }
}
