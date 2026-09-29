import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { IntroProvider, useIntroState } from './timeline/IntroContext';
import { TOTAL_DURATION, COLORS_HEX } from './timeline/timeline';
import { useResponsive } from './timeline/useResponsive';
import { useIntroSeen } from './timeline/useIntroSeen';
import { CameraRig } from './camera/CameraRig';
import { EnvSetup } from './components/EnvSetup';
import { Basketball } from './components/Basketball';
import { BasketballCourt } from './components/BasketballCourt';
import { LogoRevealOverlay } from './components/LogoRevealOverlay';
import { IntroLoader } from './components/IntroLoader';
import { AudioPlayer } from './components/AudioPlayer';
import { OnboardingFlow } from './components/OnboardingFlow';
import { QuickLogoIntro } from './components/QuickLogoIntro';
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
    showOnboarding?: boolean;
    forceFullIntro?: boolean;
    forceQuickIntro?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  WRAPPER COURT
 * ═══════════════════════════════════════════════════════════════════════════ */

const BasketballCourtSynced = ({ time }: { time: number }) => {
    const shared = useIntroState();
    const [ballPos, setBallPos] = useState({ x: 0, z: 0 });

    useEffect(() => {
        const id = window.setInterval(() => {
            setBallPos({
                x: shared.current.ballX,
                z: shared.current.ballZ,
            });
        }, 33);
        return () => window.clearInterval(id);
    }, [shared]);

    return <BasketballCourt time={time} ballX={ballPos.x} ballZ={ballPos.z} />;
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
    musicStopAt = 19.5,
    showOnboarding = true,
    forceFullIntro = false,
    forceQuickIntro = false,
}) => {
    /* ─── Détection visite ──────────────────────────────────────────── */
    const { hasSeenIntro, markIntroAsSeen } = useIntroSeen();

    /* ─── Décision ──────────────────────────────────────────────────── */
    const shouldPlayFullIntro =
        forceFullIntro || (!forceQuickIntro && !hasSeenIntro);

    /* ─── États ──────────────────────────────────────────────────────── */
    const [onboardingDone, setOnboardingDone] = useState(!showOnboarding);
    const [ready, setReady] = useState(false);
    const [time, setTime] = useState(0);
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

    /* ─── Timeline principale ────────────────────────────────────────
     *  ⚠️ Dépendances volontairement minimales :
     *     - shouldPlayFullIntro (booléen stable)
     *     - onboardingDone (booléen stable)
     *     - ready (booléen stable)
     *     - musicStopAt (nombre stable)
     *
     *  ❌ PAS de markIntroAsSeen (via ref)
     *  ❌ PAS de onComplete (via ref)
     * ═══════════════════════════════════════════════════════════════════ */
    useEffect(() => {
        if (!shouldPlayFullIntro) return;
        if (!onboardingDone || !ready) return;

        startTimeRef.current = performance.now();
        completedRef.current = false;

        const tick = () => {
            const elapsed = (performance.now() - startTimeRef.current) / 1000;
            const t = Math.min(elapsed, TOTAL_DURATION);
            setTime(t);

            if (t >= musicStopAt) {
                setStopMusic((prev) => (prev ? prev : true));
            }

            if (t >= TOTAL_DURATION) {
                if (!completedRef.current) {
                    completedRef.current = true;
                    markIntroAsSeenRef.current(); // ✅ via ref
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
    }, [shouldPlayFullIntro, onboardingDone, ready, musicStopAt]);

    /* ─── Intro courte : marque comme vue après 3.2 s ────────────────── */
    const handleQuickComplete = () => {
        markIntroAsSeenRef.current();
        onCompleteRef.current?.();
    };

    const dpr: [number, number] = isMobile ? [1, 1.5] : [1, 2];

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
                    {musicSrc && (
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
                            antialias: !isMobile,
                            alpha: false,
                            powerPreference: 'high-performance',
                            stencil: false,
                        }}
                        dpr={dpr}
                        shadows={!isMobile}
                        onCreated={({ scene, gl }) => {
                            scene.background = new THREE.Color(COLORS_HEX.BLACK);
                            gl.toneMapping = THREE.ACESFilmicToneMapping;
                            gl.toneMappingExposure = 1.05;
                            gl.outputColorSpace = THREE.SRGBColorSpace;
                            handleCanvasCreated();
                        }}
                    >
                        <EnvSetup />

                        <IntroProvider>
                            <PerspectiveCamera makeDefault position={[0, 1, 15]} fov={50} />

                            <ambientLight intensity={0.55} color={0x99aabb} />
                            <hemisphereLight args={[0xaabbdd, 0x1a2530, 0.65]} />

                            <directionalLight
                                position={[5, 9, 7]}
                                intensity={2.2}
                                color={0xfff0dd}
                                castShadow={!isMobile}
                                shadow-mapSize-width={isMobile ? 512 : 2048}
                                shadow-mapSize-height={isMobile ? 512 : 2048}
                            />

                            <directionalLight position={[-6, 5, -5]} intensity={0.75} color={0x8aaadd} />
                            <directionalLight position={[-3, 4, -8]} intensity={1.0} color={0xffaa66} />

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

                            <BasketballCourtSynced time={time} />
                            <Basketball time={time} quality={quality} />

                            <Scene02 time={time} />
                            <Scene04 time={time} />
                            <Scene05 time={time} />
                            <Scene06 time={time} />
                            <Scene07 time={time} />
                            <Scene08 time={time} />
                            <Scene09 time={time} />
                            <Scene10 time={time} />

                            <CameraRig time={time} isMobile={isMobile} aspect={aspect} />
                        </IntroProvider>
                    </Canvas>

                    <IntroLoader visible={!ready} label="PRÉPARATION DU TERRAIN" />

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