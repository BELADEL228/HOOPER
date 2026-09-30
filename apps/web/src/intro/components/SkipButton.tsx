import { useState } from 'react';
import { TOTAL_DURATION } from '../timeline/timeline';

/* ═══════════════════════════════════════════════════════════════════════════
 *  SKIP BUTTON — bouton discret en bas à droite
 *  Apparaît après un délai, disparaît automatiquement avant le logo final
 * ═══════════════════════════════════════════════════════════════════════════ */

interface SkipButtonProps {
    /** Le temps courant (state React, ~30 Hz) */
    time: number;
    /** Appelé quand l'utilisateur clique */
    onSkip: () => void;
    /** Délai (s) avant l'apparition. Défaut : 1.5 s */
    appearAt?: number;
    /** Ne pas afficher après ce temps (s). Défaut : TOTAL_DURATION - 2 s */
    hideAt?: number;
    /** Texte du bouton */
    label?: string;
}

export const SkipButton = ({
    time,
    onSkip,
    appearAt = 1.5,
    hideAt = TOTAL_DURATION - 2,
    label = "Passer l'intro",
}: SkipButtonProps) => {
    const [hovered, setHovered] = useState(false);

    // Hors de la plage d'affichage → pas de rendu
    if (time < appearAt || time > hideAt) return null;

    // Fondu d'entrée sur 0.4 s
    const fadeIn = Math.min(1, (time - appearAt) / 0.4);
    // Fondu de sortie sur 0.4 s
    const fadeOut = time > hideAt - 0.4 ? Math.max(0, (hideAt - time) / 0.4) : 1;
    const opacity = fadeIn * fadeOut;

    return (
        <button
            type="button"
            onClick={onSkip}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label={label}
            style={{
                position: 'absolute',
                bottom: '32px',
                right: '32px',
                zIndex: 50,
                opacity,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.9)',
                background: hovered
                    ? 'rgba(0, 0, 0, 0.65)'
                    : 'rgba(0, 0, 0, 0.42)',
                border: `1px solid rgba(255, 255, 255, ${hovered ? 0.45 : 0.22})`,
                borderRadius: '100px',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                pointerEvents: time > appearAt && time < hideAt ? 'auto' : 'none',
                transitionProperty: 'opacity, background, border-color',
                transitionDuration: '180ms',
                transitionTimingFunction: 'ease-out',
            }}
        >
            {label}
            <span
                aria-hidden="true"
                style={{
                    display: 'inline-block',
                    fontSize: '1.1em',
                    lineHeight: 1,
                    transform: hovered ? 'translateX(2px)' : 'translateX(0)',
                    transition: 'transform 180ms ease-out',
                    opacity: 0.75,
                }}
            >
                ›
            </span>
        </button>
    );
};