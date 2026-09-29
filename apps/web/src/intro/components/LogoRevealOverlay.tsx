import { useMemo } from 'react';
import {
    localProgress,
    SCENES,
    easeOutQuart,
    easeOutCubic,
} from '../timeline/timeline';

interface LogoRevealOverlayProps {
    time: number;
    logoSrc?: string;
    title?: string;
    subtitle?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  LOGO FINAL — overlay HTML par-dessus le Canvas
 *  Utilise le favicon.ico réel + typographie HOOPERS
 * ═══════════════════════════════════════════════════════════════════════════ */

export const LogoRevealOverlay = ({
    time,
    logoSrc = '/favicon.ico',
    title = 'HOOPERS',
    subtitle = 'Dribbler avec intention.',
}: LogoRevealOverlayProps) => {
    const p = localProgress(time, SCENES.S11.start, SCENES.S11.end);

    const logoIn = useMemo(
        () => easeOutQuart(Math.min(p / 0.4, 1)),
        [p],
    );
    const titleIn = useMemo(
        () => easeOutCubic(clamp01((p - 0.25) / 0.35)),
        [p],
    );
    const dividerIn = useMemo(
        () => easeOutCubic(clamp01((p - 0.5) / 0.25)),
        [p],
    );
    const sloganIn = useMemo(
        () => easeOutCubic(clamp01((p - 0.6) / 0.35)),
        [p],
    );

    if (p <= 0.001) return null;

    return (
        <div
            className="hoopers-logo-overlay"
            style={{
                opacity: 1,
                pointerEvents: 'none',
            }}
        >
            {/* Logo rond (favicon) */}
            <div
                className="hoopers-logo-frame"
                style={{
                    opacity: logoIn,
                    transform: `scale(${0.6 + logoIn * 0.4})`,
                }}
            >
                <img
                    src={logoSrc}
                    alt={title}
                    className="hoopers-logo-image"
                    draggable={false}
                />
            </div>

            {/* Titre principal */}
            <h1
                className="hoopers-logo-title"
                style={{
                    opacity: titleIn,
                    transform: `translateY(${(1 - titleIn) * 24}px)`,
                }}
            >
                {title}
            </h1>

            {/* Barre accent */}
            <div
                className="hoopers-logo-divider"
                style={{
                    opacity: dividerIn,
                    transform: `scaleX(${dividerIn})`,
                }}
            />

            {/* Slogan */}
            <p
                className="hoopers-logo-slogan"
                style={{
                    opacity: sloganIn,
                    transform: `translateY(${(1 - sloganIn) * 16}px)`,
                }}
            >
                {subtitle}
            </p>
        </div>
    );
};

/* ─── Helper local ───────────────────────────────────────────────────── */
function clamp01(x: number): number {
    return Math.max(0, Math.min(1, x));
}