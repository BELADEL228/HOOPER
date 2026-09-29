import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { clamp01, easeOutCubic, lerp } from '../timeline/timeline';

/* ═══════════════════════════════════════════════════════════════════════════
 *  HELPERS
 * ═══════════════════════════════════════════════════════════════════════════ */

const releaseCanvas = (canvas: HTMLCanvasElement) => {
    canvas.width = 1;
    canvas.height = 1;
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  TEXTURE PARQUET — identique, sert de base sous la vignette
 * ═══════════════════════════════════════════════════════════════════════════ */

const createWoodDiffuseTexture = (): THREE.CanvasTexture => {
    const W = 1024, H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    const base = ctx.createLinearGradient(0, 0, 0, H);
    base.addColorStop(0, '#8E5E2E');
    base.addColorStop(0.45, '#A8763C');
    base.addColorStop(1, '#7C4A22');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    const plankH = 20;
    const plankCount = Math.floor(H / plankH);

    for (let i = 0; i < plankCount; i++) {
        const y = i * plankH;
        const tint = Math.sin(i * 1.7) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(${(60 + tint * 30) | 0}, ${(30 + tint * 20) | 0}, ${(10 + tint * 12) | 0}, ${0.08 + tint * 0.05})`;
        ctx.fillRect(0, y, W, plankH - 1);

        ctx.strokeStyle = `rgba(50, 25, 8, ${0.08 + Math.random() * 0.08})`;
        ctx.lineWidth = 0.8;
        for (let g = 0; g < 6; g++) {
            const gy = y + Math.random() * plankH;
            ctx.beginPath();
            for (let x = 0; x <= W; x += 32) {
                const dy = Math.sin(x * 0.008 + g * 0.7) * 1.2;
                if (x === 0) ctx.moveTo(x, gy + dy);
                else ctx.lineTo(x, gy + dy);
            }
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(30, 15, 5, 0.55)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, y + plankH - 0.5);
        ctx.lineTo(W, y + plankH - 0.5);
        ctx.stroke();
    }

    // Grain fin
    const imgData = ctx.getImageData(0, 0, W, H);
    const px = imgData.data;
    for (let i = 0; i < px.length; i += 4) {
        if (Math.random() < 0.04) {
            const n = (Math.random() - 0.5) * 22;
            px[i] = Math.max(0, Math.min(255, px[i] + n));
            px[i + 1] = Math.max(0, Math.min(255, px[i + 1] + n));
            px[i + 2] = Math.max(0, Math.min(255, px[i + 2] + n));
        }
    }
    ctx.putImageData(imgData, 0, 0);

    // Lignes du terrain
    ctx.strokeStyle = 'rgba(250, 245, 235, 0.88)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.beginPath();
    ctx.moveTo(W / 2, 20);
    ctx.lineTo(W / 2, H - 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(20, H / 2 - 110, 190, 220);
    ctx.strokeRect(W - 210, H / 2 - 110, 190, 220);
    ctx.beginPath();
    ctx.arc(210, H / 2, 65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W - 210, H / 2, 65, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(W - 20, 55);
    ctx.lineTo(W - 120, 55);
    ctx.arc(W - 20, H / 2, 230, -1.42, 1.42, true);
    ctx.lineTo(W - 20, H - 55);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(20, 55);
    ctx.lineTo(120, 55);
    ctx.arc(20, H / 2, 230, 1.72, -1.72, false);
    ctx.lineTo(20, H - 55);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    releaseCanvas(canvas);
    return tex;
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  TEXTURE VIGNETTE — gradient radial transparent au centre → noir opaque
 *  C'est le "cercle de lumière" qui crée l'effet spot studio.
 * ═══════════════════════════════════════════════════════════════════════════ */

const createRadialVignetteTexture = (): THREE.CanvasTexture => {
    const SIZE = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;

    // ─── Cercle lumineux central (transparent) ────────────────────────
    //    Le gradient part du centre transparent → bords opaques noirs.
    //    On dessine d'abord un remplissage noir complet, puis on
    //    "creuse" un trou transparent au centre via composite 'destination-out'.

    // Remplissage noir plein
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Rayon du "trou" lumineux (en % du canvas)
    const centerX = SIZE / 2;
    const centerY = SIZE / 2;
    const innerRadius = SIZE * 0.08;   // zone 100% transparente
    const midRadius = SIZE * 0.28;   // transition douce
    const outerRadius = SIZE * 0.48;   // bord du canvas → 100% noir

    // Composite pour effacer (rendre transparent) le centre
    ctx.globalCompositeOperation = 'destination-out';

    const grad = ctx.createRadialGradient(
        centerX, centerY, innerRadius,
        centerX, centerY, outerRadius,
    );
    grad.addColorStop(0, 'rgba(0,0,0,1)');                    // centre : 100% effacé
    grad.addColorStop((midRadius - innerRadius) / (outerRadius - innerRadius), 'rgba(0,0,0,0.85)');
    grad.addColorStop(0.85, 'rgba(0,0,0,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');                    // bord : 0% effacé

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.fill();

    // Reset composite
    ctx.globalCompositeOperation = 'source-over';

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    releaseCanvas(canvas);
    return tex;
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  ROUGHNESS MAP
 * ═══════════════════════════════════════════════════════════════════════════ */

const createWoodRoughnessTexture = (): THREE.CanvasTexture => {
    const W = 256, H = 128;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 120; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const r = Math.random() * 20 + 6;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const v = (Math.random() * 40 + 60) | 0;
        g.addColorStop(0, `rgba(${v},${v},${v}, 0.25)`);
        g.addColorStop(1, `rgba(${v},${v},${v}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    releaseCanvas(canvas);
    return tex;
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSANT TERRAIN
 * ═══════════════════════════════════════════════════════════════════════════ */

interface BasketballCourtProps {
    time: number;
    /** Suit la position X du ballon pour recentrer le cercle lumineux */
    ballX?: number;
    /** Suit la position Z du ballon */
    ballZ?: number;
}

export const BasketballCourt = ({
    time,
    ballX = 0,
    ballZ = 0,
}: BasketballCourtProps) => {
    const diffuse = useMemo(() => createWoodDiffuseTexture(), []);
    const roughness = useMemo(() => createWoodRoughnessTexture(), []);
    const vignette = useMemo(() => createRadialVignetteTexture(), []);

    // Plan parquet complet (28×15)
    const courtGeo = useMemo(() => new THREE.PlaneGeometry(28, 15), []);
    // Vignette radiale par-dessus (même taille pour couvrir la court)
    const vignetteGeo = useMemo(() => new THREE.PlaneGeometry(28, 15), []);
    // Halo lumineux très léger juste sous le ballon (ajoute de la "chaleur")
    const haloGeo = useMemo(() => new THREE.CircleGeometry(3.2, 48), []);

    useEffect(() => () => {
        diffuse.dispose();
        roughness.dispose();
        vignette.dispose();
        courtGeo.dispose();
        vignetteGeo.dispose();
        haloGeo.dispose();
    }, [diffuse, roughness, vignette, courtGeo, vignetteGeo, haloGeo]);

    // Apparition : 2.5 s → 4.2 s
    const appear = clamp01(easeOutCubic((time - 2.5) / 1.7));

    // Le halo sous le ballon pulse légèrement
    const haloPulse = 0.55 + Math.sin(time * 1.8) * 0.06;

    return (
        <group visible={appear > 0.001}>
            {/* ═══ 1) Parquet principal ══════════════════════════════════ */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <primitive object={courtGeo} attach="geometry" />
                <meshPhysicalMaterial
                    map={diffuse}
                    color={0xffffff}
                    roughnessMap={roughness}
                    roughness={0.4}
                    metalness={0.05}
                    clearcoat={0.85}
                    clearcoatRoughness={0.18}
                    envMapIntensity={1.1}
                    transparent
                    opacity={appear}
                />
            </mesh>

            {/* ═══ 2) Vignette radiale NOIRE par-dessus le parquet ═══════
       *     Seule la zone autour du centre reste visible.
       *     La vignette suit le ballon (position X/Z).           */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[ballX, 0.004, ballZ]}
            >
                <primitive object={vignetteGeo} attach="geometry" />
                <meshBasicMaterial
                    map={vignette}
                    transparent
                    opacity={appear * 0.96}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </mesh>

            {/* ═══ 3) Halo lumineux chaud sous le ballon ═══════════════ */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[ballX, 0.006, ballZ]}
            >
                <primitive object={haloGeo} attach="geometry" />
                <meshBasicMaterial
                    color={0xFFB800}
                    transparent
                    opacity={0.09 * haloPulse * appear}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                />
            </mesh>

            {/* ═══ 4) Second halo plus large (diffusion atmosphérique) ═══ */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[ballX, 0.008, ballZ]}
            >
                <circleGeometry args={[5.5, 64]} />
                <meshBasicMaterial
                    color={0xFFA040}
                    transparent
                    opacity={0.035 * appear}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
};