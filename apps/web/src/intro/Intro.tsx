import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { IntroProvider, useIntroState } from './timeline/IntroContext';
import { TOTAL_DURATION, COLORS_HEX, SCENES } from './timeline/timeline';
import { useResponsive } from './timeline/useResponsive';
import { useIntroSeen } from './timeline/useIntroSeen';
import { CameraRig } from './camera/CameraRig';
import { EnvSetup } from './components/EnvSetup';
import { BasketballCourt } from './components/BasketballCourt';
import { CourtLines } from './components/CourtLines';
import { ContactShadow } from './components/ContactShadow';
import { PostFX } from './components/PostFX';
import { BasketballAuto } from './components/BasketballModel';
import { AdaptiveQuality } from './components/AdaptativeQuality';
import { TIERS, readInitialTier, saveTier } from './timeline/qualityTiers';
import { useBallSounds } from './audio/useBallSounds';
import { LogoRevealOverlay } from './components/LogoRevealOverlay';
import { IntroLoader } from './components/IntroLoader';
import { AudioPlayer } from './components/AudioPlayer';
import { OnboardingFlow } from './components/OnboardingFlow';
import { QuickLogoIntro } from './components/QuickLogoIntro';
import { SkipButton } from './components/SkipButton';
import { Scene02 } from './scenes/Scene02';
import { Scene04 } from './scenes/Scene04';
import { Scene05 } from './scenes/Scene05';
import { Scene06 } from './scenes/Scene06';
import { Scene07 } from './scenes/Scene07';
import { Scene08 } from './scenes/Scene08';
import { Scene09 } from './scenes/Scene09';
import { Scene10 } from './scenes/Scene10';
import './styles/intro.css';
import './styles/onboarding.css';

/* ═══════════════════════════════════════════════════════════════════════════
 *  PROPS
 * ═══════════════════════════════════════════════════════════════════════════ */

interface IntroProps {
    onComplete?: () => void;
    logoSrc?: string;
    title?: string;
    subtitle?: string;
    musicSrc?: string;
    musicVolume?: number;
    musicStopAt?: number;
    musicStartAt?: number;
    /** URL d'un ballon .glb/.gltf (ex. '/models/basketball_nologo.glb') */
    ballModelUrl?: string;
    /** Correction d'orientation du modèle, en radians [x, y, z]. */
    ballModelRotation?: [number, number, number];
    /** Sample de rebond (.wav/.mp3). Sans → son de rebond synthétisé. */
    bounceSrc?: string;
    /** Volume des effets sonores 0..1 */
    sfxVolume?: number;
    /** Désactive tous les effets sonores */
    sfxEnabled?: boolean;
    showOnboarding?: boolean;
    forceFullIntro?: boolean;
    forceQuickIntro?: boolean;
    /** Fige l'intro à cet instant (en secondes) — utile pour régler une scène. */
    debugTime?: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  WRAPPER COURT — synchronise la vignette avec la position du ballon
 * ═══════════════════════════════════════════════════════════════════════════ */

const BasketballCourtSynced = ({
    time,
    reflective,
}: {
    time: number;
    reflective: boolean;
}) => {
    const shared = useIntroState();
    return (
        <BasketballCourt
            time={time}
            ballX={shared.current.ballX}
            ballZ={shared.current.ballZ}
            reflective={reflective}
        />
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  INTRO
 * ═══════════════════════════════════════════════════════════════════════════ */

export const Intro: React.FC<IntroProps> = ({
    onComplete,
    logoSrc = '/favicon.ico',
    title = 'HOOPERS',
    subtitle = 'Dribbler avec intention.',
    musicSrc,
    musicVolume = 0.45,
    musicStopAt = 26.0,
    musicStartAt = 2.6,
    ballModelUrl,
    ballModelRotation,
    bounceSrc,
    sfxVolume = 0.8,
    sfxEnabled = true,
    showOnboarding = true,
    forceFullIntro = false,
    forceQuickIntro = false,
    debugTime,
}) => {
    /* ─── Détection visite ──────────────────────────────────────────── */
    const { hasSeenIntro, markIntroAsSeen } = useIntroSeen();

    /* ─── Décision ──────────────────────────────────────────────────── */
    const shouldPlayFullIntro =
        forceFullIntro || (!forceQuickIntro && !hasSeenIntro);

    /* ─── États ──────────────────────────────────────────────────────── */
    const [onboardingDone, setOnboardingDone] = useState(!showOnboarding);
    const [ready, setReady] = useState(false);

    /* `timeRef` : horloge exacte, mise à jour à chaque frame (ballon, caméra,
     *  post-fx → mouvement parfaitement fluide).
     *  `time`    : état React, rafraîchi ~30×/s seulement (scènes HUD / cartes),
     *  ce qui évite de re-rendre tout l'arbre 60 fois par seconde. */
    const timeRef = useRef(debugTime ?? 0);
    const [time, setTime] = useState(debugTime ?? 0);
    const [stopMusic, setStopMusic] = useState(false);

    /* ─── Refs ───────────────────────────────────────────────────────── */
    const rafRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const completedRef = useRef(false);
    const onCompleteRef = useRef(onComplete);
    const markIntroAsSeenRef = useRef(markIntroAsSeen);

    /* ─── Callbacks stables via refs ─────────────────────────────────── */
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        markIntroAsSeenRef.current = markIntroAsSeen;
    }, [markIntroAsSeen]);

    const { isMobile, aspect, quality } = useResponsive();

    /* ─── Qualité adaptative ─────────────────────────────────────────── */
    const [tierIdx, setTierIdx] = useState(() => readInitialTier(window.innerWidth < 768));
    const tier = TIERS[tierIdx];
    const handleDecline = () =>
        setTierIdx((i) => {
            const next = Math.min(i + 1, TIERS.length - 1);
            if (next !== i) saveTier(next);
            return next;
        });

    /* ─── Ballon prêt (modèle GLB chargé, ou ballon procédural) ──────── */
    const [ballReady, setBallReady] = useState(false);
    const allReady = ready && ballReady;

    /* ─── Timeline principale ──────────────────────────────────────── */
    useEffect(() => {
        if (!shouldPlayFullIntro) return;
        if (!onboardingDone || !allReady) return;

        // Mode debug : temps figé, pas de boucle
        if (debugTime !== undefined) {
            timeRef.current = debugTime;
            setTime(debugTime);
            return;
        }

        startTimeRef.current = performance.now();
        completedRef.current = false;
        let lastPush = 0;

        const tick = () => {
            const now = performance.now();
            const elapsed = (now - startTimeRef.current) / 1000;
            const t = Math.min(elapsed, TOTAL_DURATION);
            timeRef.current = t;

            // Rendu React limité à ~30 Hz (sauf pendant le logo final)
            const minGap = t >= SCENES.S11.start ? 0 : 33;
            if (now - lastPush >= minGap || t >= TOTAL_DURATION) {
                lastPush = now;
                setTime(t);
            }

            if (t >= musicStopAt) {
                setStopMusic((prev) => (prev ? prev : true));
            }

            if (t >= TOTAL_DURATION) {
                if (!completedRef.current) {
                    completedRef.current = true;
                    markIntroAsSeenRef.current();
                    onCompleteRef.current?.();
                }
                return;
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [shouldPlayFullIntro, onboardingDone, allReady, musicStopAt, debugTime]);

    /* ─── Intro courte : marque comme vue après 3.2 s ────────────────── */
    const handleQuickComplete = () => {
        markIntroAsSeenRef.current();
        onCompleteRef.current?.();
    };

    /* ─── Skip : saute directement à la fin de l'intro ──────────────── */
    const handleSkip = () => {
        setStopMusic(true);
        timeRef.current = TOTAL_DURATION;
        setTime(TOTAL_DURATION);
        if (!completedRef.current) {
            completedRef.current = true;
            markIntroAsSeenRef.current();
            onCompleteRef.current?.();
        }
    };

    /* ─── Sons synchronisés (doit rester AVANT les return conditionnels) ─ */
    useBallSounds({
        timeRef,
        enabled: sfxEnabled && shouldPlayFullIntro && onboardingDone && allReady && debugTime === undefined,
        volume: sfxVolume,
        bounceSrc,
        logoHitAt: 25.0,
    });

    const handleCanvasCreated = () => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.setTimeout(() => setReady(true), 400);
            });
        });
    };

    /* ═══════════════════════════════════════════════════════════════════
     *  RENDU — INTRO COURTE (visite répétée)
     * ═══════════════════════════════════════════════════════════════════ */
    if (!shouldPlayFullIntro) {
        return (
            <QuickLogoIntro
                logoSrc={logoSrc}
                title={title}
                subtitle={subtitle}
                duration={3200}
                onComplete={handleQuickComplete}
            />
        );
    }

    /* ═══════════════════════════════════════════════════════════════════
     *  RENDU — INTRO COMPLÈTE
     * ═══════════════════════════════════════════════════════════════════ */
    return (
        <div className="hoopers-intro">
            {!onboardingDone && (
                <OnboardingFlow
                    onComplete={() => setOnboardingDone(true)}
                    logoSrc={logoSrc}
                />
            )}

            {onboardingDone && (
                <>
                    {musicSrc && time >= musicStartAt && (
                        <AudioPlayer
                            src={musicSrc}
                            volume={musicVolume}
                            loop
                            stop={stopMusic}
                            fadeOutDuration={1.8}
                            autoStart
                        />
                    )}

                    <Canvas
                        className="hoopers-canvas"
                        gl={{
                            antialias: false,
                            alpha: false,
                            powerPreference: 'high-performance',
                            stencil: false,
                        }}
                        dpr={tier.dpr}
                        shadows={!isMobile}
                        onCreated={({ scene, gl }) => {
                            scene.background = new THREE.Color(COLORS_HEX.BLACK);
                            gl.toneMapping = THREE.NoToneMapping;
                            gl.outputColorSpace = THREE.SRGBColorSpace;
                            handleCanvasCreated();
                        }}
                    >
                        <EnvSetup />

                        <IntroProvider>
                            <PerspectiveCamera makeDefault position={[0, 1, 15]} fov={50} />

                            <fog attach="fog" args={[COLORS_HEX.BLACK, 9, 26]} />

                            <ambientLight intensity={0.55} color={0x99aabb} />
                            <hemisphereLight args={[0xaabbdd, 0x1a2530, 0.65]} />

                            <directionalLight
                                position={[5, 9, 7]}
                                intensity={2.2}
                                color={0xfff0dd}
                                castShadow={!isMobile && tier.shadows}
                                shadow-mapSize-width={isMobile ? 512 : 2048}
                                shadow-mapSize-height={isMobile ? 512 : 2048}
                                shadow-bias={-0.0004}
                                shadow-normalBias={0.03}
                                shadow-radius={4}
                            />

                            <directionalLight position={[-6, 5, -5]} intensity={0.3} color={0x8aaadd} />
                            <directionalLight position={[-3, 4, -8]} intensity={0.45} color={0xffaa66} />

                            <spotLight
                                position={[0, 6, 3]}
                                angle={0.75}
                                penumbra={0.9}
                                intensity={3.0}
                                color={0xffe0b8}
                                distance={30}
                                decay={2}
                            />

                            <pointLight
                                position={[0, 0.5, 0]}
                                intensity={1.2}
                                color={0xffc070}
                                distance={6}
                                decay={2}
                            />

                            <BasketballCourtSynced time={time} reflective={!isMobile && tier.reflective} />
                            <CourtLines visible={true} />

                            <ContactShadow />
                            <BasketballAuto
                                timeRef={timeRef}
                                quality={quality}
                                modelUrl={ballModelUrl}
                                modelRotation={ballModelRotation}
                                onLoaded={() => setBallReady(true)}
                            />

                            <Sparkles
                                count={Math.min(tier.sparkles, isMobile ? 20 : 999)}
                                scale={[8, 3.5, 3]}
                                position={[0, 2.2, -2]}
                                size={isMobile ? 1.6 : 0.9}
                                speed={0.2}
                                opacity={0.3}
                                color="#ffd9a0"
                            />

                            <Scene02 time={time} />
                            <Scene04 time={time} />
                            <Scene05 time={time} />
                            <Scene06 time={time} />
                            <Scene07 time={time} />
                            <Scene08 time={time} />
                            <Scene09 time={time} timeRef={timeRef} />
                            <Scene10 time={time} />

                            <CameraRig timeRef={timeRef} isMobile={isMobile} aspect={aspect} />

                            <PostFX timeRef={timeRef} tier={tier} />
                            <AdaptiveQuality
                                key={tierIdx}
                                timeRef={timeRef}
                                onDecline={handleDecline}
                            />
                        </IntroProvider>
                    </Canvas>

                    <IntroLoader visible={!allReady} label="PRÉPARATION DU TERRAIN" />

                    {/* ⚡ Bouton "Passer l'intro" — apparaît à 1.5 s, disparaît à la fin */}
                    {allReady && (
                        <SkipButton
                            time={time}
                            onSkip={handleSkip}
                            appearAt={1.5}
                            label="Passer l'intro"
                        />
                    )}

                    {/* Fondu vers le noir : le logo final reste lisible sur fond sombre */}
                    <div
                        aria-hidden
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: '#030303',
                            pointerEvents: 'none',
                            opacity:
                                0.96 *
                                Math.min(1, Math.max(0, (time - 24.5) / 0.5)) ** 2,
                        }}
                    />

                    <LogoRevealOverlay
                        time={time}
                        logoSrc={logoSrc}
                        title={title}
                        subtitle={subtitle}
                    />
                </>
            )}
        </div>
    );
};

Intro.displayName = 'Intro';