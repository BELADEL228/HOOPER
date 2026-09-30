import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIntroState } from '../timeline/IntroContext';
import { computeBallPose, createBallPose } from '../timeline/ballMotion';
import { BasketballSeams } from './BasketballSeams';

/* ⚠️ CORRECTIF : l'ancienne version réduisait le canvas à 1×1 juste après
 *    `new CanvasTexture(canvas)`. Or three.js n'envoie la texture au GPU qu'au
 *    premier rendu → il lisait un canvas vide et le ballon apparaissait NOIR.
 *    On garde le canvas intact (4 Mo max) ; la texture est libérée au démontage. */
const releaseCanvas = (_canvas: HTMLCanvasElement) => { /* volontairement vide */ };

interface BasketTextures {
    diffuse: THREE.CanvasTexture;
    bump: THREE.CanvasTexture;
    roughness: THREE.CanvasTexture;
}

const createBasketballTextures = (quality: number): BasketTextures => {
    const D_SIZE = quality >= 0.85 ? 1024 : quality >= 0.55 ? 768 : 512;
    const B_SIZE = quality >= 0.85 ? 512 : 384;
    const R_SIZE = 256;

    const D_PEBBLES = quality >= 0.85 ? 22000 : quality >= 0.55 ? 12000 : 6000;
    const B_DOTS = quality >= 0.85 ? 18000 : quality >= 0.55 ? 10000 : 5000;

    /* ── DIFFUSE ─────────────────────────────────────────────────── */
    const dCanvas = document.createElement('canvas');
    dCanvas.width = D_SIZE;
    dCanvas.height = D_SIZE;
    const dc = dCanvas.getContext('2d')!;

    const baseGrad = dc.createRadialGradient(
        D_SIZE * 0.42, D_SIZE * 0.38, D_SIZE * 0.05,
        D_SIZE * 0.5, D_SIZE * 0.5, D_SIZE * 0.92,
    );
    baseGrad.addColorStop(0, '#CE7134');
    baseGrad.addColorStop(0.35, '#A84F1B');
    baseGrad.addColorStop(0.7, '#8B3B10');
    baseGrad.addColorStop(1, '#5A2408');
    dc.fillStyle = baseGrad;
    dc.fillRect(0, 0, D_SIZE, D_SIZE);

    const scale = D_SIZE / 1024;
    dc.globalAlpha = 0.14;
    for (let i = 0; i < D_PEBBLES; i++) {
        const x = Math.random() * D_SIZE;
        const y = Math.random() * D_SIZE;
        const r = (Math.random() * 2.6 + 0.7) * scale;
        const kind = Math.random();
        dc.fillStyle = kind < 0.5 ? '#321405' : kind < 0.82 ? '#FFD296' : '#5A280C';
        dc.beginPath();
        dc.arc(x, y, r, 0, Math.PI * 2);
        dc.fill();
    }
    dc.globalAlpha = 1;

    // Grain fin via ImageData (rapide)
    const imgData = dc.getImageData(0, 0, D_SIZE, D_SIZE);
    const px = imgData.data;
    for (let i = 0; i < px.length; i += 4) {
        if (Math.random() < 0.05) {
            const noise = (Math.random() - 0.5) * 30;
            px[i] = Math.max(0, Math.min(255, px[i] + noise));
            px[i + 1] = Math.max(0, Math.min(255, px[i + 1] + noise));
            px[i + 2] = Math.max(0, Math.min(255, px[i + 2] + noise));
        }
    }
    dc.putImageData(imgData, 0, 0);

    const diffuse = new THREE.CanvasTexture(dCanvas);
    diffuse.colorSpace = THREE.SRGBColorSpace;
    diffuse.anisotropy = 8;
    diffuse.wrapS = THREE.RepeatWrapping;
    diffuse.wrapT = THREE.ClampToEdgeWrapping;
    diffuse.needsUpdate = true;
    releaseCanvas(dCanvas);

    /* ── BUMP ────────────────────────────────────────────────────── */
    const bCanvas = document.createElement('canvas');
    bCanvas.width = B_SIZE;
    bCanvas.height = B_SIZE;
    const bc = bCanvas.getContext('2d')!;
    bc.fillStyle = '#808080';
    bc.fillRect(0, 0, B_SIZE, B_SIZE);

    const bScale = B_SIZE / 512;
    for (let i = 0; i < B_DOTS; i++) {
        const x = Math.random() * B_SIZE;
        const y = Math.random() * B_SIZE;
        const r = (Math.random() * 2.4 + 0.6) * bScale;
        const v = (Math.random() * 100 + 100) | 0;
        bc.fillStyle = `rgb(${v},${v},${v})`;
        bc.beginPath();
        bc.arc(x, y, r, 0, Math.PI * 2);
        bc.fill();
    }

    const bump = new THREE.CanvasTexture(bCanvas);
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.ClampToEdgeWrapping;
    bump.needsUpdate = true;
    releaseCanvas(bCanvas);

    /* ── ROUGHNESS ───────────────────────────────────────────────── */
    const rCanvas = document.createElement('canvas');
    rCanvas.width = R_SIZE;
    rCanvas.height = R_SIZE;
    const rc = rCanvas.getContext('2d')!;
    rc.fillStyle = '#5a5a5a';
    rc.fillRect(0, 0, R_SIZE, R_SIZE);

    for (let i = 0; i < B_DOTS / 10; i++) {
        const x = Math.random() * R_SIZE;
        const y = Math.random() * R_SIZE;
        const v = (Math.random() * 90 + 50) | 0;
        rc.fillStyle = `rgb(${v},${v},${v})`;
        rc.fillRect(x, y, 2, 2);
    }

    const roughness = new THREE.CanvasTexture(rCanvas);
    roughness.wrapS = THREE.RepeatWrapping;
    roughness.wrapT = THREE.ClampToEdgeWrapping;
    roughness.needsUpdate = true;
    releaseCanvas(rCanvas);

    return { diffuse, bump, roughness };
};

interface BasketballProps {
    timeRef: MutableRefObject<number>;
    quality?: number;
}

export const Basketball = ({ timeRef, quality = 1 }: BasketballProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
    const shared = useIntroState();
    const pose = useMemo(() => createBallPose(), []);

    const textures = useMemo(() => createBasketballTextures(quality), [quality]);
    const segments = quality >= 0.85 ? 96 : quality >= 0.55 ? 64 : 48;
    const geo = useMemo(
        () => new THREE.SphereGeometry(1, segments, segments),
        [segments],
    );

    useEffect(() => () => {
        textures.diffuse.dispose();
        textures.bump.dispose();
        textures.roughness.dispose();
        geo.dispose();
    }, [textures, geo]);

    useFrame(() => {
        const g = groupRef.current;
        const m = matRef.current;
        if (!g || !m) return;

        computeBallPose(timeRef.current, pose);

        g.position.set(pose.x, pose.y, pose.z);
        g.scale.set(pose.scale * pose.sx, pose.scale * pose.sy, pose.scale * pose.sz);
        g.quaternion.copy(pose.quaternion);
        m.opacity = pose.opacity;

        const st = shared.current;
        st.ballX = pose.x;
        st.ballY = pose.y;
        st.ballZ = pose.z;
        st.ballScale = pose.scale;
        st.ballOpacity = pose.opacity;
        st.ballGap = pose.gap;
    });

    return (
        <group ref={groupRef}>
            <mesh castShadow receiveShadow>
                <primitive object={geo} attach="geometry" />
                <meshPhysicalMaterial
                    ref={matRef}
                    map={textures.diffuse}
                    color={0xffffff}
                    bumpMap={textures.bump}
                    bumpScale={0.012}
                    roughnessMap={textures.roughness}
                    roughness={0.86}
                    metalness={0.0}
                    clearcoat={0.06}
                    clearcoatRoughness={0.55}
                    envMapIntensity={0.95}
                    transparent
                    opacity={1}
                    depthWrite
                    side={THREE.FrontSide}
                />
            </mesh>

            <BasketballSeams />
        </group>
    );
};
