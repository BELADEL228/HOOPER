import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIntroState } from '../timeline/IntroContext';
import { clamp01, easeOutCubic, easeInOutCubic } from '../timeline/timeline';
import { BasketballSeams } from './BasketballSeams';

const releaseCanvas = (canvas: HTMLCanvasElement) => {
    canvas.width = 1;
    canvas.height = 1;
};

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
    time: number;
    quality?: number;
}

export const Basketball = ({ time, quality = 1 }: BasketballProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
    const shared = useIntroState();

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

    useFrame((_, delta) => {
        if (!groupRef.current || !matRef.current) return;

        let x = 0, y = 1.1, z = 0, scale = 1, opacity = 1;

        if (time < 1.6) {
            const p = easeOutCubic(time / 1.6);
            z = -3 + 3 * p;
            scale = 0.35 + 0.2 * p;
            y = 1.1;
        } else if (time < 3.2) {
            const p = easeOutCubic((time - 1.6) / 1.6);
            scale = 0.55 + 0.4 * p;
            y = 1.1 + Math.sin((time - 1.6) * 1.6) * 0.05;
        } else if (time < 5.0) {
            const p = easeInOutCubic((time - 3.2) / 1.8);
            scale = 0.95 + 0.1 * p;
            y = 1.4 - 0.4 * p;
        } else if (time < 8.6) {
            scale = 1.05; y = 1.0;
        } else if (time < 11.0) {
            const p = easeInOutCubic((time - 8.6) / 2.4);
            scale = 1.05 - 0.15 * p; y = 1.0;
        } else if (time < 18.0) {
            scale = 0.9; y = 1.0;
        } else if (time < 19.0) {
            const p = easeInOutCubic((time - 18.0) / 1.0);
            scale = 0.9 - 0.5 * p;
            opacity = 1 - 0.8 * p;
            y = 1.0;
        } else {
            const p = clamp01((time - 19.0) / 2.0);
            scale = 0.4 * (1 - p);
            opacity = 0.2 * (1 - p);
            y = 1.0;
        }

        groupRef.current.position.set(x, y, z);
        groupRef.current.scale.setScalar(scale);
        groupRef.current.rotation.x += delta * 0.7;
        groupRef.current.rotation.y += delta * 0.5;

        matRef.current.opacity = opacity;
        matRef.current.transparent = opacity < 1;

        shared.current.ballX = x;
        shared.current.ballY = y;
        shared.current.ballZ = z;
        shared.current.ballScale = scale;
        shared.current.ballOpacity = opacity;
    });

    return (
        <group ref={groupRef}>
            <mesh castShadow receiveShadow>
                <primitive object={geo} attach="geometry" />
                <meshPhysicalMaterial
                    ref={matRef}
                    map={textures.diffuse}
                    color={0xffffff}          // ← force la couleur neutre (multiplie la map)
                    bumpMap={textures.bump}
                    bumpScale={0.03}
                    roughnessMap={textures.roughness}
                    roughness={0.72}          // ← réduit (moins mat = plus de lumière visible)
                    metalness={0.05}          // ← légèrement augmenté pour capter les reflets
                    clearcoat={0.35}          // ← plus de vernis = plus de reflets
                    clearcoatRoughness={0.45}
                    envMapIntensity={1.35}    // ← ↑ : capte plus de lumière de l'env map
                    reflectivity={0.5}
                    transparent={true}        // ← figé à true dès le départ
                    opacity={1}
                    depthWrite
                    side={THREE.FrontSide}
                />
            </mesh>

            <BasketballSeams />
        </group>
    );
};