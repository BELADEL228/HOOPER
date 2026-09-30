// scenes/Scene09.tsx — Carrousel cinématographique (15.5 → 24.0 s)
import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import {
    SCENES, clamp01, easeOutCubic, smoothstep, smootherstep,
} from '../timeline/timeline';
import { useIntroState } from '../timeline/IntroContext';
import {
    PlayerCard, FeedCard, ClubCard, MessageCard, StoryCard, StatsCard,
} from '../components/cards';

/* ═══════════════════════════════════════════════════════════════════════════
 *  SCÈNE 09 — Carrousel cinématographique
 *
 *    A. ÉMERGENCE   Les cards spiralent vers l'anneau, une par une (stagger).
 *    B. ROTATION    Pause sur chaque card (hold) puis rotation douce vers la
 *                   suivante. Focus = f(distance angulaire) → continu.
 *    C. DISPERSION  Envol radial décalé, accélération, fondu anticipé.
 *
 *  Transformations animées à 60 fps via refs (useFrame).
 *  L'opacité passe par les props (30 Hz, largement suffisant pour un fondu).
 *
 *  ⚡ ORDRE RESPECTÉ : la dispersion des cards se termine à la FIN de S09
 *     (24.0 s). Ensuite seulement, S10 fait disparaître la balle, puis S11
 *     révèle le logo. Les cards s'en vont donc AVANT la balle.
 * ═══════════════════════════════════════════════════════════════════════════ */

const CARDS = [
    PlayerCard, FeedCard, ClubCard, MessageCard, StoryCard, StatsCard,
] as const;
const N = CARDS.length;

/* ─── Géométrie ──────────────────────────────────────────────────────── */
const RING_RADIUS = 2.3;
const BASE_SCALE = 0.72;
const FOCUS_Z_ADVANCE = 0.8;
const FOCUS_SCALE_MUL = 1.75;
const FOCUS_LIFT = 0.08;
const DISPERSE_DISTANCE = 12;

/* ─── Timings (dérivés de la timeline → plus jamais désynchronisés) ──── */
const DURATION = SCENES.S09.end - SCENES.S09.start;   // 8.5 s
const PHASE_A = 1.3;                                   // émergence
const PHASE_C = 1.5;                                   // dispersion
const PHASE_B = DURATION - PHASE_A - PHASE_C;          // 5.7 s
const STEP = PHASE_B / N;                              // durée par card
const HOLD_RATIO = 0.55;                               // % du step en pause
const STAGGER_A = 0.1;                                 // décalage émergence
const STAGGER_C = 0.07;                                // décalage dispersion
const RING_STEP = (Math.PI * 2) / N;

/* ─── Helpers ────────────────────────────────────────────────────────── */
const easeInCubic = (x: number) => x * x * x;

/** Progression fractionnaire de l'anneau : 0 → N-1, avec pauses. */
const ringProgress = (tB: number) => {
    const s = Math.max(0, tB) / STEP;
    const n = Math.floor(s);
    const f = s - n;
    const move = smootherstep((f - HOLD_RATIO) / (1 - HOLD_RATIO));
    return Math.min(n + move, N - 1);
};

interface CardState {
    x: number; y: number; z: number;
    scale: number; opacity: number; roll: number;
}

const layout = (i: number, t: number): CardState => {
    /* ─── ÉMERGENCE (décalée par card) ─────────────────────────────── */
    const eWin = PHASE_A - (N - 1) * STAGGER_A;
    const e = easeOutCubic(clamp01((t - i * STAGGER_A) / eWin));

    /* ─── ROTATION DE L'ANNEAU ─────────────────────────────────────── */
    const p = ringProgress(t - PHASE_A);
    const theta = (i - p) * RING_STEP;

    /* ─── FOCUS continu ────────────────────────────────────────────── */
    const delta = (((i - p) % N) + N) % N;
    const dist = Math.min(delta, N - delta);
    const focus = 1 - smoothstep(clamp01(dist / 0.75));

    /* ─── Spirale d'émergence ──────────────────────────────────────── */
    const inv = 1 - e;
    const r = RING_RADIUS * (1 + inv * 1.4);
    const thetaE = theta + inv * 0.8;

    let x = Math.sin(thetaE) * r;
    let z = Math.cos(thetaE) * r + focus * FOCUS_Z_ADVANCE * e;
    const bob = Math.sin(t * 0.9 + i * 1.3) * 0.05;
    let y = bob + focus * FOCUS_LIFT;

    /* ─── DISPERSION (décalée, accélérée) ──────────────────────────── */
    const dWin = PHASE_C - (N - 1) * STAGGER_C;
    const dl = clamp01((t - (PHASE_A + PHASE_B) - i * STAGGER_C) / dWin);
    const d = easeInCubic(dl);
    x += Math.sin(theta) * DISPERSE_DISTANCE * d;
    z += Math.cos(theta) * DISPERSE_DISTANCE * d;
    y += d * (i % 2 === 0 ? 1.1 : -0.6);

    /* ─── SCALE ────────────────────────────────────────────────────── */
    const scale = BASE_SCALE
        * (0.4 + 0.6 * e)
        * (1 + focus * (FOCUS_SCALE_MUL - 1))
        * (1 - d * 0.35);

    /* ─── OPACITÉ ──────────────────────────────────────────────────── */
    /* Les cards du fond sont plus sombres (profondeur) */
    const front = (Math.cos(theta) + 1) / 2;
    const rest = 0.18 + 0.22 * front;

    /* Fondu de dispersion : la card disparaît à 65 % de son envol */
    const fade = smoothstep(clamp01(dl / 0.65));

    /* ⚡ FONDU DE SÉCURITÉ : la card s'efface complètement sur les 0.2
     *    dernières secondes de S09, garantissant qu'elle est invisible
     *    AVANT que la balle ne s'efface (S10). */
    const safetyFade = clamp01((DURATION - t) / 0.2);

    const opacity = (rest + (1 - rest) * focus) * e * (1 - fade) * safetyFade;

    /* ─── ROLL : petit tangage suivant la position sur l'anneau ─────── */
    const roll = -Math.sin(theta) * 0.05 * (1 - focus);

    return { x, y, z, scale, opacity, roll };
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSANT
 * ═══════════════════════════════════════════════════════════════════════════ */

interface Scene09Props {
    time: number;
    /** Horloge exacte (60 fps). Sans → fallback sur `time` (30 Hz). */
    timeRef?: MutableRefObject<number>;
}

export const Scene09 = ({ time, timeRef }: Scene09Props) => {
    const outerRef = useRef<THREE.Group>(null);
    const groupRefs = useRef<(THREE.Group | null)[]>([]);
    const rollRefs = useRef<(THREE.Group | null)[]>([]);
    const shared = useIntroState();

    const localT = (now: number) =>
        Math.max(0, Math.min(DURATION, now - SCENES.S09.start));

    /* ─── Transformations à 60 fps ──────────────────────────────────── */
    useFrame(({ clock }) => {
        const outer = outerRef.current;
        if (!outer) return;

        /* ⚡ Priorité au timeRef (60 fps exact) → évite tout micro-saccade */
        const now = timeRef ? timeRef.current : time;
        const active = now >= SCENES.S09.start && now < SCENES.S09.end + 0.05;
        const t = localT(now);

        /* Balancement caméra "handheld" (faible amplitude) */
        const e = clock.getElapsedTime();
        outer.rotation.y = Math.sin(e * 0.32) * 0.10;
        outer.rotation.x = Math.sin(e * 0.41 + 0.6) * 0.03;
        outer.position.y = shared.current.ballY + Math.sin(e * 0.55) * 0.04;

        for (let i = 0; i < N; i++) {
            const g = groupRefs.current[i];
            if (!g) continue;
            const s = layout(i, t);
            g.visible = active && s.opacity > 0.01;
            if (!g.visible) continue;
            g.position.set(s.x, s.y, s.z);
            g.scale.setScalar(s.scale);
            const r = rollRefs.current[i];
            if (r) r.rotation.z = s.roll;
        }
    });

    /* ─── Opacité via props (30 Hz — largement suffisant) ───────────── */
    const t = localT(time);

    return (
        <group ref={outerRef}>
            {CARDS.map((Card, i) => (
                <group
                    key={i}
                    ref={(el) => { groupRefs.current[i] = el; }}
                    visible={false}
                >
                    <Billboard>
                        <group ref={(el) => { rollRefs.current[i] = el; }}>
                            <Card scale={1} opacity={layout(i, t).opacity} />
                        </group>
                    </Billboard>
                </group>
            ))}
        </group>
    );
};