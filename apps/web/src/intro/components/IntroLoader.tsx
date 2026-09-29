import { useEffect, useState } from 'react';

interface IntroLoaderProps {
    visible: boolean;
    label?: string;
}

export const IntroLoader = ({
    visible,
    label = 'CHARGEMENT',
}: IntroLoaderProps) => {
    const [progress, setProgress] = useState(0);
    const [mounted, setMounted] = useState(true);

    useEffect(() => {
        if (!visible) return;
        const start = performance.now();
        const DURATION = 3000;
        let raf: number;

        const tick = () => {
            const elapsed = performance.now() - start;
            const t = Math.min(elapsed / DURATION, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setProgress(eased * 90);
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [visible]);

    useEffect(() => {
        if (visible) {
            setMounted(true);
            return;
        }
        setProgress(100);
        const t = window.setTimeout(() => setMounted(false), 700);
        return () => window.clearTimeout(t);
    }, [visible]);

    if (!mounted) return null;

    return (
        <div
            className={`hoopers-loader ${!visible ? 'hoopers-loader--out' : ''}`}
            aria-hidden={!visible}
        >
            <div className="hoopers-loader__spinner">
                <svg viewBox="0 0 100 100" className="hoopers-loader__svg">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                    <circle
                        cx="50" cy="50" r="42"
                        fill="none" stroke="#FFB800" strokeWidth="2.5"
                        strokeLinecap="round" strokeDasharray="80 264"
                        className="hoopers-loader__arc"
                    />
                    <circle
                        cx="50" cy="50" r="42"
                        fill="none" stroke="#FF2A3B" strokeWidth="2.5"
                        strokeLinecap="round" strokeDasharray="30 264"
                        strokeDashoffset="120"
                        className="hoopers-loader__arc hoopers-loader__arc--reverse"
                    />
                </svg>
                <img
                    src="/favicon.ico"
                    alt=""
                    className="hoopers-loader__logo"
                    draggable={false}
                />
            </div>

            <div className="hoopers-loader__track">
                <div
                    className="hoopers-loader__bar"
                    style={{ transform: `scaleX(${progress / 100})` }}
                />
            </div>

            <div className="hoopers-loader__meta">
                <span className="hoopers-loader__label">{label}</span>
                <span className="hoopers-loader__pct">{Math.round(progress)}%</span>
            </div>
        </div>
    );
};