import { useThree } from '@react-three/fiber';

/* ═══════════════════════════════════════════════════════════════════════════
 *  useSafeWidth — demi-largeur visible à z=0, ajustée pour mobile
 *
 *  Retourne la distance (en unités monde) entre le centre de l'écran et
 *  le bord, SANS que le contenu soit coupé.
 *
 *  `padding` : marge de sécurité (0.85 = 15 % de marge de chaque côté).
 * ═══════════════════════════════════════════════════════════════════════════ */

export const useSafeWidth = (padding = 0.85): number => {
    const { viewport } = useThree();
    return (viewport.width / 2) * padding;
};