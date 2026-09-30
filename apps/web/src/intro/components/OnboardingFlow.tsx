import { useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
 *  ONBOARDING — 4 étapes
 *
 *  Direction : le sujet du produit (basket) devient le visuel principal.
 *  Un plan de terrain se dessine progressivement, ligne par ligne. À la
 *  dernière étape, un ballon tombe dans le cercle central — l'unique
 *  moment orchestré de tout l'onboarding.
 *
 *  Pas d'eyebrow en CAPS, pas de dots génériques, pas de flèche sur le CTA.
 * ═══════════════════════════════════════════════════════════════════════════ */

interface OnboardingFlowProps {
    onComplete: () => void;
    logoSrc?: string;
}

/* ─── Plan de terrain qui se révèle ──────────────────────────────────── */

const CourtVisual = ({ step }: { step: number }) => (
    <svg
        viewBox="0 0 400 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        {/* Périmètre + ligne médiane — toujours visibles */}
        <g stroke="rgba(255,255,255,0.3)" strokeWidth="1.4">
            <rect x="10" y="10" width="380" height="200" rx="2" />
            <line x1="200" y1="10" x2="200" y2="210" />
        </g>

        {/* Cercle central — étape 1 */}
        <circle
            cx="200" cy="110" r="34"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.4"
            style={{
                opacity: step >= 1 ? 1 : 0,
                transition: 'opacity 700ms ease-out',
            }}
        />

        {/* Raquettes + cercles de lancer franc — étape 2 */}
        <g
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.4"
            style={{
                opacity: step >= 2 ? 1 : 0,
                transition: 'opacity 700ms ease-out',
            }}
        >
            <rect x="10" y="58" width="82" height="104" />
            <rect x="308" y="58" width="82" height="104" />
            <circle cx="92" cy="110" r="34" />
            <circle cx="308" cy="110" r="34" />
        </g>

        {/* Arcs à 3 points — étape 3 */}
        <g
            stroke="rgba(255,255,255,0.72)"
            strokeWidth="1.4"
            style={{
                opacity: step >= 3 ? 1 : 0,
                transition: 'opacity 700ms ease-out',
            }}
        >
            <path d="M 10 28 L 68 28 A 155 155 0 0 1 68 192 L 10 192" />
            <path d="M 390 28 L 332 28 A 155 155 0 0 0 332 192 L 390 192" />
        </g>

        {/* Ballon — chute au centre à l'étape 3 */}
        <g
            style={{
                opacity: step >= 3 ? 1 : 0,
                transform: `translateY(${step >= 3 ? 0 : -12}px)`,
                transformOrigin: '200px 110px',
                transition:
                    'opacity 400ms ease-out, transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
        >
            <circle cx="200" cy="110" r="9" fill="#FF6B14" />
            <path
                d="M 191 110 H 209 M 200 101 V 119"
                stroke="#1a0a04"
                strokeWidth="1"
            />
        </g>
    </svg>
);

/* ─── Contenu des 4 étapes ───────────────────────────────────────────── */

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
}

const STEPS: OnboardingStep[] = [
    {
        id: 'welcome',
        title: 'Bienvenue sur HOOPERS',
        description:
            "L'app du basketball togolais. Joueurs, clubs, matchs et communauté, réunis au même endroit.",
    },
    {
        id: 'stats',
        title: 'Suis chaque match',
        description:
            'Points, passes, rebonds. Tes statistiques se mettent à jour après chaque rencontre.',
    },
    {
        id: 'clubs',
        title: 'Rejoins ta ligue',
        description:
            'Trouve ton club, consulte le calendrier et suis les résultats de la communauté locale.',
    },
    {
        id: 'community',
        title: 'Prends le terrain',
        description:
            'Publie tes moments, échange avec tes coéquipiers et fais vivre le basket près de chez toi.',
    },
];

/* ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSANT
 * ═══════════════════════════════════════════════════════════════════════════ */

export const OnboardingFlow = ({ onComplete, logoSrc }: OnboardingFlowProps) => {
    const [step, setStep] = useState(0);

    const isLast = step === STEPS.length - 1;
    const current = STEPS[step];

    const handleNext = () => {
        if (isLast) {
            onComplete();
            return;
        }
        setStep((s) => s + 1);
    };

    const handleBack = () => {
        if (step === 0) return;
        setStep((s) => s - 1);
    };

    return (
        <div className="hoopers-onboarding">
            {/* ─── Barre supérieure ────────────────────────────────────── */}
            <header className="hoopers-onboarding__topbar">
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
                        aria-label="Étape précédente"
                    >
                        Retour
                    </button>
                )}
            </header>

            {/* ─── Corps : terrain + texte ─────────────────────────────── */}
            <main className="hoopers-onboarding__main">
                <div className="hoopers-onboarding__court">
                    <CourtVisual step={step} />
                </div>

                <div className="hoopers-onboarding__copy" key={current.id}>
                    <h1 className="hoopers-onboarding__title">
                        {current.title}
                    </h1>
                    <p className="hoopers-onboarding__description">
                        {current.description}
                    </p>
                </div>
            </main>

            {/* ─── Bas : progression + CTA ─────────────────────────────── */}
            <footer className="hoopers-onboarding__bottom">
                <div
                    className="hoopers-onboarding__progress"
                    role="tablist"
                    aria-label="Progression"
                >
                    {STEPS.map((s, i) => (
                        <button
                            key={s.id}
                            type="button"
                            role="tab"
                            aria-selected={i === step}
                            aria-label={`Étape ${i + 1} sur ${STEPS.length}`}
                            className={
                                'hoopers-onboarding__segment' +
                                (i <= step ? ' hoopers-onboarding__segment--filled' : '')
                            }
                            onClick={() => setStep(i)}
                        />
                    ))}
                </div>

                <button
                    type="button"
                    className="hoopers-onboarding__cta"
                    onClick={handleNext}
                >
                    {isLast ? "Démarrer l'expérience" : 'Continuer'}
                </button>
            </footer>
        </div>
    );
};