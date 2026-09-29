import { useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
 *  ONBOARDING — 4 étapes avant l'intro
 *  Design plat, sombre, sans halo, sans dégradé.
 *  Le dernier "Continuer" déclenche l'intro + l'audio.
 * ═══════════════════════════════════════════════════════════════════════════ */

interface OnboardingFlowProps {
    onComplete: () => void;
    logoSrc?: string;
}

/* ─── Icônes vectorielles simples ─────────────────────────────────────── */

const IconBall = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none">
        <circle cx="60" cy="60" r="42" stroke="#FFFFFF" strokeWidth="2.5" />
        <path d="M18 60 H102" stroke="#FFFFFF" strokeWidth="2.5" />
        <path d="M60 18 V102" stroke="#FFFFFF" strokeWidth="2.5" />
        <path d="M28 30 Q60 60 92 30" stroke="#FF2A3B" strokeWidth="2.5" />
        <path d="M28 90 Q60 60 92 90" stroke="#FF2A3B" strokeWidth="2.5" />
    </svg>
);

const IconStats = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none">
        <rect x="20" y="70" width="16" height="30" rx="2" fill="#FFFFFF" />
        <rect x="48" y="50" width="16" height="50" rx="2" fill="#FFFFFF" />
        <rect x="76" y="30" width="16" height="70" rx="2" fill="#FF2A3B" />
        <path d="M16 108 H104" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 60 L56 38 L96 18" stroke="#FFB800" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="96" cy="18" r="4" fill="#FFB800" />
    </svg>
);

const IconClub = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none">
        <path
            d="M60 14 L96 28 V60 C96 82 80 98 60 106 C40 98 24 82 24 60 V28 Z"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinejoin="round"
        />
        <path
            d="M60 34 L70 48 H86 L74 58 L78 74 L60 64 L42 74 L46 58 L34 48 H50 Z"
            fill="#FF2A3B"
        />
    </svg>
);

const IconCommunity = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none">
        <path
            d="M20 40 Q20 30 30 30 H62 Q72 30 72 40 V60 Q72 70 62 70 H38 L24 82 V70 H30 Q20 70 20 60 Z"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinejoin="round"
        />
        <path
            d="M52 68 Q52 58 62 58 H90 Q100 58 100 68 V86 Q100 96 90 96 H96 L82 108 V96 H62 Q52 96 52 86 Z"
            stroke="#FF2A3B"
            strokeWidth="2.5"
            strokeLinejoin="round"
        />
    </svg>
);

/* ─── Données des étapes ──────────────────────────────────────────────── */

interface OnboardingStep {
    id: string;
    Icon: React.ComponentType;
    eyebrow: string;
    title: string;
    description: string;
    accent?: 'gold' | 'red';
}

const STEPS: OnboardingStep[] = [
    {
        id: 'welcome',
        Icon: IconBall,
        eyebrow: 'BIENVENUE',
        title: 'HOOPERS',
        description: 'Le réseau social du basketball togolais. Une seule app pour jouer, suivre et partager.',
    },
    {
        id: 'stats',
        Icon: IconStats,
        eyebrow: 'ANALYSE',
        title: 'TES PERFORMANCES',
        description: 'Points, passes, rebonds. Suis ta progression match après match.',
    },
    {
        id: 'clubs',
        Icon: IconClub,
        eyebrow: 'CLUBS',
        title: 'TA LIGUE',
        description: 'Rejoins ton club, consulte les matchs et connecte-toi à la communauté locale.',
    },
    {
        id: 'community',
        Icon: IconCommunity,
        eyebrow: 'COMMUNAUTÉ',
        title: 'TON TERRAIN',
        description: 'Posts, stories, messages. Partage tes moments de basket avec tes coéquipiers.',
    },
];

/* ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSANT
 * ═══════════════════════════════════════════════════════════════════════════ */

export const OnboardingFlow = ({ onComplete, logoSrc }: OnboardingFlowProps) => {
    const [step, setStep] = useState(0);
    const [animKey, setAnimKey] = useState(0);

    const isLast = step === STEPS.length - 1;
    const current = STEPS[step];

    const handleNext = () => {
        if (isLast) {
            onComplete();
            return;
        }
        setStep((s) => s + 1);
        setAnimKey((k) => k + 1);
    };

    const handleBack = () => {
        if (step === 0) return;
        setStep((s) => s - 1);
        setAnimKey((k) => k + 1);
    };

    const { Icon } = current;

    return (
        <div className="hoopers-onboarding">
            {/* ─── Barre supérieure : logo + bouton retour ─────────────── */}
            <div className="hoopers-onboarding__topbar">
                <div className="hoopers-onboarding__brand">
                    {logoSrc && (
                        <img
                            src={logoSrc}
                            alt=""
                            className="hoopers-onboarding__brand-logo"
                            draggable={false}
                        />
                    )}
                    <span className="hoopers-onboarding__brand-name">HOOPERS</span>
                </div>
                {step > 0 && (
                    <button
                        type="button"
                        className="hoopers-onboarding__back"
                        onClick={handleBack}
                        aria-label="Retour"
                    >
                        ← RETOUR
                    </button>
                )}
            </div>

            {/* ─── Contenu central ─────────────────────────────────────── */}
            <div className="hoopers-onboarding__content" key={animKey}>
                <div className="hoopers-onboarding__icon">
                    <Icon />
                </div>

                <div className="hoopers-onboarding__eyebrow">{current.eyebrow}</div>
                <h1 className="hoopers-onboarding__title">{current.title}</h1>
                <p className="hoopers-onboarding__description">{current.description}</p>
            </div>

            {/* ─── Bas : progression + bouton ──────────────────────────── */}
            <div className="hoopers-onboarding__bottom">
                <div className="hoopers-onboarding__dots" role="tablist" aria-label="Étapes">
                    {STEPS.map((s, i) => (
                        <button
                            key={s.id}
                            type="button"
                            role="tab"
                            aria-selected={i === step}
                            aria-label={`Étape ${i + 1} sur ${STEPS.length}`}
                            className={`hoopers-onboarding__dot ${i === step ? 'hoopers-onboarding__dot--active' : ''
                                }`}
                            onClick={() => {
                                setStep(i);
                                setAnimKey((k) => k + 1);
                            }}
                        />
                    ))}
                </div>

                <button
                    type="button"
                    className="hoopers-onboarding__cta"
                    onClick={handleNext}
                >
                    {isLast ? "DÉMARRER L'EXPÉRIENCE" : 'CONTINUER'}
                    <span aria-hidden="true">›</span>
                </button>

                <div className="hoopers-onboarding__counter">
                    {String(step + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
                </div>
            </div>
        </div>
    );
};