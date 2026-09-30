import {
    useLayoutEffect,
    useMemo,
    useRef,
    type ReactNode,
    type MutableRefObject,
} from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp01, easeOutCubic } from '../timeline/timeline';

/* ═══════════════════════════════════════════════════════════════════════════
 *  GLASS CARD — glassmorphism premium (v2.1)
 *
 *  v2.1 (cette version) :
 *   • [FIX PERF]  Le `useLayoutEffect` qui gère le fondu global ne se
 *                 redéclenche plus que quand `opacity` change, au lieu de
 *                 tourner à 30 Hz (une passe par render React).
 *   • [FIX SCRUB] Le reflet (sheen) accepte un `timeRef` optionnel : si tu
 *                 scrub l'intro (mode debugTime / Remotion), le sheen reste
 *                 synchro au lieu d'utiliser une horloge murale.
 *   • [FIX PERF]  `timeRef` évite un accès à `clock.getElapsedTime()` par
 *                 frame et par card (6 cards × 30 fps = 180 appels/s).
 *   • [CLEAN]     Typage strict, variables renommées pour lisibilité.
 *
 *  v2.0 (existant, conservé) :
 *   • CACHE textures (verre, glow, mask, sheen, shadow) → une seule canvas
 *     par combinaison (taille, accent) au lieu d'une par card.
 *   • FONDU GLOBAL automatique des éléments opaques (barres, avatars,
 *     pastilles, zones image…) → suit l'opacité de la card sans modif.
 *   • REFLET (sheen) diagonal qui balaye le verre au passage en focus.
 *   • OMBRE PORTÉE douce + LISERÉ INTÉRIEUR (2ᵉ bordure fine).
 *   • GRAIN déterministe (seed fixe) → rendu identique à chaque lecture.
 * ═══════════════════════════════════════════════════════════════════════════ */

interface GlassCardProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    width?: number;
    height?: number;
    opacity?: number;
    /** Couleur d'accent : or ou rouge (identité HOOPERS) */
    accentColor?: string;
    /** Active le balayage de lumière au focus */
    sheen?: boolean;
    /**
     * Ref vers le temps global de l'intro.
     * Si fourni, le sheen l'utilise au lieu de `clock.getElapsedTime()`
     * — indispensable pour le scrubbing (debugTime) et Remotion.
     */
    timeRef?: MutableRefObject<number>;
    children?: ReactNode;
}

/* ─── Réglages ───────────────────────────────────────────────────────── */
const SHEEN_DURATION = 0.85;      // durée du balayage (s)
const SHEEN_INTENSITY = 0.5;      // intensité max du balayage
const SHEEN_ARM_ABOVE = 0.88;     // déclenche quand l'opacité dépasse ça…
const SHEEN_REARM_BELOW = 0.7;    // …et se ré-arme sous ce seuil

/* ─── Helper : hex (#FFB800) → rgba(...) ────────────────────────────── */
const hexAlpha = (hex: string, alpha: number): string => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/* ─── Helper : rectangle arrondi ────────────────────────────────────── */
const traceRoundRect = (
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
) => {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
};

const makeCanvas = (w: number, h: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return { canvas, ctx: canvas.getContext('2d')! };
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  TEXTURES (toutes mises en cache → une seule canvas par combinaison)
 * ═══════════════════════════════════════════════════════════════════════════ */

const glassCache = new Map<string, THREE.CanvasTexture>();
const glowCache = new Map<string, THREE.CanvasTexture>();
const maskCache = new Map<string, THREE.CanvasTexture>();
let sheenBase: THREE.CanvasTexture | null = null;
let shadowTex: THREE.CanvasTexture | null = null;

/** Verre : fond, voile accent, grain, bordure, highlights, reflets. */
const getGlassTexture = (W: number, H: number, accent: string) => {
    const key = `${W}x${H}|${accent}`;
    const hit = glassCache.get(key);
    if (hit) return hit;

    const { canvas, ctx } = makeCanvas(W, H);
    const radius = Math.min(W, H) * 0.06;

    /* 1. Fond sombre translucide */
    ctx.clearRect(0, 0, W, H);
    traceRoundRect(ctx, 0, 0, W, H, radius);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, 'rgba(22, 22, 30, 0.84)');
    bgGrad.addColorStop(0.5, 'rgba(12, 12, 18, 0.80)');
    bgGrad.addColorStop(1, 'rgba(8, 8, 12, 0.88)');
    ctx.fillStyle = bgGrad;
    ctx.fill();

    /* 2. Voile accent */
    ctx.save();
    traceRoundRect(ctx, 0, 0, W, H, radius);
    ctx.clip();
    const accentGrad = ctx.createRadialGradient(
        W * 0.15, H * 0.15, 0,
        W * 0.15, H * 0.15, W * 0.9,
    );
    accentGrad.addColorStop(0, hexAlpha(accent, 0.10));
    accentGrad.addColorStop(0.6, hexAlpha(accent, 0.02));
    accentGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = accentGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    /* 3. Grain fin déterministe (seed fixe → rendu identique) */
    ctx.save();
    traceRoundRect(ctx, 0, 0, W, H, radius);
    ctx.clip();
    let seed = 1337;
    const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
    };
    for (let i = 0; i < W * H * 0.008; i++) {
        const a = rnd() * 0.035;
        ctx.fillStyle = rnd() > 0.5
            ? `rgba(255,255,255,${a})`
            : `rgba(0,0,0,${a})`;
        ctx.fillRect(rnd() * W, rnd() * H, 1, 1);
    }
    ctx.restore();

    /* 4. Bordure lumineuse (dégradé blanc → accent) */
    ctx.save();
    traceRoundRect(ctx, 0.5, 0.5, W - 1, H - 1, radius);
    const borderGrad = ctx.createLinearGradient(0, 0, W, H);
    borderGrad.addColorStop(0, 'rgba(255, 255, 255, 0.46)');
    borderGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.16)');
    borderGrad.addColorStop(0.7, hexAlpha(accent, 0.38));
    borderGrad.addColorStop(1, hexAlpha(accent, 0.62));
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();

    /* 5. Liseré intérieur (2e bordure fine) → effet d'épaisseur */
    ctx.save();
    traceRoundRect(ctx, 3.5, 3.5, W - 7, H - 7, Math.max(2, radius - 3));
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    /* 6. Highlight haut */
    ctx.save();
    traceRoundRect(ctx, 0, 0, W, H, radius);
    ctx.clip();
    const topHighlight = ctx.createLinearGradient(0, 0, 0, H * 0.08);
    topHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
    topHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = topHighlight;
    ctx.fillRect(0, 0, W, H * 0.08);
    ctx.restore();

    /* 7. Inner glow coin haut-gauche */
    ctx.save();
    traceRoundRect(ctx, 0, 0, W, H, radius);
    ctx.clip();
    const innerGlow = ctx.createRadialGradient(
        W * 0.1, H * 0.1, 0,
        W * 0.1, H * 0.1, W * 0.55,
    );
    innerGlow.addColorStop(0, hexAlpha(accent, 0.18));
    innerGlow.addColorStop(0.5, hexAlpha(accent, 0.05));
    innerGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = innerGlow;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    /* 8. Reflet incurvé (fausse réfraction) */
    ctx.save();
    traceRoundRect(ctx, 0, 0, W, H, radius);
    ctx.clip();
    const refraction = ctx.createLinearGradient(0, 0, W, H * 0.5);
    refraction.addColorStop(0, 'rgba(255, 255, 255, 0.09)');
    refraction.addColorStop(0.35, 'rgba(255, 255, 255, 0.02)');
    refraction.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = refraction;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W * 0.7, H * 0.35);
    ctx.lineTo(W * 0.3, H * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    /* 9. Ombre basse */
    ctx.save();
    traceRoundRect(ctx, 0, 0, W, H, radius);
    ctx.clip();
    const bottomShadow = ctx.createLinearGradient(0, H * 0.7, 0, H);
    bottomShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
    bottomShadow.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = bottomShadow;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    glassCache.set(key, tex);
    return tex;
};

/** Halo radial doux derrière la card. */
const getGlowTexture = (accent: string) => {
    const hit = glowCache.get(accent);
    if (hit) return hit;
    const S = 256;
    const { canvas, ctx } = makeCanvas(S, S);
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, hexAlpha(accent, 0.35));
    g.addColorStop(0.5, hexAlpha(accent, 0.12));
    g.addColorStop(1, hexAlpha(accent, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    glowCache.set(accent, tex);
    return tex;
};

/** Masque rectangle arrondi (blanc sur noir) → sert d'alphaMap au reflet. */
const getMaskTexture = (W: number, H: number) => {
    const key = `${W}x${H}`;
    const hit = maskCache.get(key);
    if (hit) return hit;
    const { canvas, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    traceRoundRect(ctx, 0, 0, W, H, Math.min(W, H) * 0.06);
    ctx.fill();
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    maskCache.set(key, tex);
    return tex;
};

/** Bande de lumière diagonale (une seule, partagée). */
const getSheenBase = () => {
    if (sheenBase) return sheenBase;
    const W = 512;
    const H = 322;
    const { canvas, ctx } = makeCanvas(W, H);
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(W * 0.42, 0, W * 0.58, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.setTransform(1, 0, -0.4, 1, H * 0.2, 0);
    ctx.fillStyle = g;
    ctx.fillRect(-W, 0, W * 3, H);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    sheenBase = tex;
    return tex;
};

/** Ombre portée : ellipse sombre très floue. */
const getShadowTexture = () => {
    if (shadowTex) return shadowTex;
    const S = 256;
    const { canvas, ctx } = makeCanvas(S, S);
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(0,0,0,0.75)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    shadowTex = tex;
    return tex;
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSANT
 * ═══════════════════════════════════════════════════════════════════════════ */

export const GlassCard = ({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    width = 1.5,
    height = 0.95,
    opacity = 1,
    accentColor = '#FFB800',
    sheen = true,
    timeRef,
    children,
}: GlassCardProps) => {
    const textureW = 1024;
    const textureH = Math.round((textureW * height) / width);

    const glassTexture = useMemo(
        () => getGlassTexture(textureW, textureH, accentColor),
        [textureW, textureH, accentColor],
    );
    const glowTexture = useMemo(() => getGlowTexture(accentColor), [accentColor]);
    const shadowTexture = useMemo(() => getShadowTexture(), []);
    const maskTexture = useMemo(() => getMaskTexture(512, 322), []);

    /* Clone du sheen par instance : seul l'offset change, la source est
     * partagée. */
    const sheenMap = useMemo(() => {
        const t = getSheenBase().clone();
        t.repeat.set(0.5, 1);
        t.offset.set(0.7, 0);
        t.needsUpdate = true;
        return t;
    }, []);
    useLayoutEffect(() => () => sheenMap.dispose(), [sheenMap]);

    const rootRef = useRef<THREE.Group>(null);
    const sheenMatRef = useRef<THREE.MeshBasicMaterial>(null);
    const opacityRef = useRef(opacity);
    opacityRef.current = opacity;
    const sweep = useRef({ start: -1, armed: true });

    /* ─── FONDU GLOBAL des éléments opaques ─────────────────────────────
     * [FIX v2.1] Dépend de `[opacity]` → ne traverse l'arbre que quand
     * l'opacité change réellement, au lieu de 30×/s.
     *
     * Règle : un matériau qui n'est PAS `transparent` à sa première
     * apparition n'a aucun moyen de suivre l'opacité de la card → on le
     * prend en charge (opacité = base × opacity de la card).
     * Les matériaux déjà `transparent` (ceux qui multiplient déjà `o`) et
     * les textes troika (fillOpacity) restent gérés par leurs props.        */
    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        root.traverse((obj) => {
            if ('fillOpacity' in obj) return; // texte troika : géré par HudText
            const mat = (obj as THREE.Mesh).material as
                | THREE.Material
                | THREE.Material[]
                | undefined;
            if (!mat || Array.isArray(mat)) return;

            let d = mat.userData.__glassFade as
                | { managed: boolean; base: number }
                | undefined;
            if (!d) {
                d = mat.userData.__glassFade = {
                    managed: !mat.transparent,
                    base: mat.opacity,
                };
                if (d.managed) {
                    mat.transparent = true;
                    mat.depthWrite = false;
                    mat.needsUpdate = true;
                }
            }
            if (d.managed) mat.opacity = d.base * opacity;
        });
    }, [opacity]); // ← FIX v2.1

    /* ─── Reflet : se déclenche quand la card passe en focus ─────────── */
    useFrame(({ clock }) => {
        const m = sheenMatRef.current;
        if (!m || !sheen) return;

        /* [FIX v2.1] Priorité au timeRef (scrubbing / Remotion).
         * Fallback sur l'horloge murale si absent. */
        const now = timeRef?.current ?? clock.getElapsedTime();
        const op = opacityRef.current;
        const s = sweep.current;

        if (op > SHEEN_ARM_ABOVE && s.armed) {
            s.start = now;
            s.armed = false;
        }
        if (op < SHEEN_REARM_BELOW) s.armed = true;

        const p = s.start < 0
            ? 1
            : clamp01((now - s.start) / SHEEN_DURATION);

        sheenMap.offset.x = 0.64 - 0.78 * easeOutCubic(p);
        m.opacity = p < 1
            ? SHEEN_INTENSITY * Math.sin(Math.PI * p) * op
            : 0;
    });

    return (
        <group
            ref={rootRef}
            position={position}
            rotation={rotation}
            scale={scale}
        >
            {/* ═══ −1. Ombre portée ═══════════════════════════════════ */}
            <mesh position={[0, -0.05, -0.02]}>
                <planeGeometry args={[width * 1.3, height * 1.35]} />
                <meshBasicMaterial
                    map={shadowTexture}
                    transparent
                    opacity={0.5 * opacity}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            {/* ═══ 0. Aura extérieure ═════════════════════════════════ */}
            <mesh position={[0, 0, -0.012]}>
                <planeGeometry args={[width * 1.35, height * 1.35]} />
                <meshBasicMaterial
                    map={glowTexture}
                    transparent
                    opacity={0.55 * opacity}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                />
            </mesh>

            {/* ═══ 1. Corps de verre ══════════════════════════════════ */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial
                    map={glassTexture}
                    transparent
                    opacity={opacity}
                    depthWrite={false}
                    toneMapped={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* ═══ 2. Contenu ═════════════════════════════════════════ */}
            {children}

            {/* ═══ 3. Reflet balayant (au-dessus du contenu) ══════════ */}
            {sheen && (
                <mesh position={[0, 0, 0.011]}>
                    <planeGeometry args={[width, height]} />
                    <meshBasicMaterial
                        ref={sheenMatRef}
                        map={sheenMap}
                        alphaMap={maskTexture}
                        transparent
                        opacity={0}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                        toneMapped={false}
                    />
                </mesh>
            )}
        </group>
    );
};