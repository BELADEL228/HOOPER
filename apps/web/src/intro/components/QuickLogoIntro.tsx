import { useEffect, useState } from 'react';
import { clamp01, easeOutQuart, easeOutCubic } from '../timeline/timeline';

interface QuickLogoIntroProps {
    logoSrc?: string;
    title?: string;
    subtitle?: string;
    onComplete?: () => void;
    /** Durée totale en ms (défaut : 3200) */
    duration?: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  QUICK LOGO INTRO — version courte pour les visites répétées
 *  Logo + titre + slogan, sans 3D, sans onboarding, sans musique.
 *  ~3 secondes puis onComplete().
 * ═══════════════════════════════════════════════════════════════════════════ */

export const QuickLogoIntro = ({
    logoSrc = '/favicon.ico',
    title = 'HOOPERS',
    subtitle = 'Dribbler avec intention.',
    onComplete,
    duration = 3200,
}: QuickLogoIntroProps) => {
    const [t, setT] = useState(0);

    useEffect(() => {
        const start = performance.now();
        let raf: number;

        const tick = () => {
            const elapsed = performance.now() - start;
            const sec = elapsed / 1000;
            setT(sec);

            if (elapsed >= duration) {
                onComplete?.();
                return;
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [duration, onComplete]);

    /* ─── Timings internes ─────────────────────────────────────────────
     *  0.0 → 0.4 s : logo zoom + fade in
     *  0.3 → 0.7 s : titre
     *  0.5 → 0.9 s : divider
     *  0.6 → 1.0 s : slogan
     *  2.6 → 3.2 s : fade out global
     * ─────────────────────────────────────────────────────────────── */

    const logoIn = easeOutQuart(clamp01((t - 0.0) / 0.4));
    const titleIn = easeOutCubic(clamp01((t - 0.3) / 0.4));
    const dividerIn = easeOutCubic(clamp01((t - 0.5) / 0.4));
    const sloganIn = easeOutCubic(clamp01((t - 0.6) / 0.4));
    const fadeOut = 1 - easeOutCubic(clamp01((t - 2.6) / 0.6));

    return (
        <div
            className="hoopers-quick-intro"
            style={{ opacity: fadeOut }}
            role="dialog"
            aria-label="HOOPERS"
        >
            <div className="hoopers-quick-intro__frame">
                <img
                    src={logoSrc}
                    alt=""
                    className="hoopers-quick-intro__logo"
                    draggable={false}
                    style={{
                        opacity: logoIn,
                        transform: `scale(${0.85 + logoIn * 0.15})`,
                    }}
                />
            </div>

            <h1
                className="hoopers-quick-intro__title"
                style={{
                    opacity: titleIn,
                    transform: `translateY(${(1 - titleIn) * 16}px)`,
                }}
            >
                {title}
            </h1>

            <div
                className="hoopers-quick-intro__divider"
                style={{
                    opacity: dividerIn,
                    transform: `scaleX(${dividerIn})`,
                }}
            />

            <p
                className="hoopers-quick-intro__slogan"
                style={{
                    opacity: sloganIn,
                    transform: `translateY(${(1 - sloganIn) * 12}px)`,
                }}
            >
                {subtitle}
            </p>
        </div>
    );
};