/**
 * Module de retour haptique (vibrations tactiles) pour mobile PWA.
 * Conçu pour enrichir l'expérience sur smartphone lors des interactions clés
 * (changement d'onglet, tir de panier, like, pull-to-refresh, validation).
 */

export type HapticPattern =
  | 'selection'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'buzzer';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  selection: 8,                    // Micro-clic ultra léger (tabs, filtres)
  light: 15,                       // Clic classique
  medium: 30,                      // Action importante (candidature, achat)
  heavy: 55,                       // Déclenchement lourd
  success: [15, 60, 25],           // Double vibration validation (panier marqué)
  warning: [30, 40, 30],           // Avertissement faute / alerte
  error: [50, 40, 50, 40, 50],     // Triple vibration échec
  buzzer: [120, 60, 150, 60, 300], // Vibration longue coup de sifflet final
};

/**
 * Déclenche un retour tactile si l'appareil supporte navigator.vibrate.
 * @param pattern Type de vibration
 */
export function triggerHaptic(pattern: HapticPattern = 'selection'): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  if (!('vibrate' in navigator)) {
    return false;
  }

  try {
    const sequence = PATTERNS[pattern];
    return navigator.vibrate(sequence);
  } catch {
    return false;
  }
}

/**
 * Déclenche une vibration de succès de scoring (tir réussi).
 */
export function hapticBasketScore(): void {
  triggerHaptic('success');
}

/**
 * Déclenche une vibration de sélection rapide pour les boutons et onglets.
 */
export function hapticSelection(): void {
  triggerHaptic('selection');
}
