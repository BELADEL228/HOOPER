import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIntroState } from '../timeline/IntroContext';

/* ═══════════════════════════════════════════════════════════════════════════
 *  CONTACT SHADOW — ombre douce sous le ballon
 *
 *  C'est le repère n°1 qui « pose » un objet dans une scène 3D. Elle suit le
 *  ballon : petite, nette et sombre au contact ; large, floue et pâle quand
 *  le ballon monte. Aucune shadow-map nécessaire → gratuit sur mobile.
 * ═══════════════════════════════════════════════════════════════════════════ */

const createBlobTexture = (): THREE.CanvasTexture => {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0.0, 'rgba(0,0,0,1)');
    g.addColorStop(0.35, 'rgba(0,0,0,0.78)');
    g.addColorStop(0.7, 'rgba(0,0,0,0.22)');
    g.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
};

export const ContactShadow = () => {
    const shared = useIntroState();
    const meshRef = useRef<THREE.Mesh>(null);
    const matRef = useRef<THREE.MeshBasicMaterial>(null);
    const tex = useMemo(createBlobTexture, []);

    useEffect(() => () => tex.dispose(), [tex]);

    useFrame(() => {
        const m = meshRef.current;
        const mat = matRef.current;
        if (!m || !mat) return;
        const s = shared.current;
        const r = s.ballScale * (1.15 + s.ballGap * 0.6);
        m.position.set(s.ballX, 0.012, s.ballZ);
        m.scale.set(r, r, 1);
        mat.opacity = (0.85 * s.ballOpacity) / (1 + s.ballGap * 2.4);
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
            <planeGeometry args={[2, 2]} />
            <meshBasicMaterial
                ref={matRef}
                map={tex}
                transparent
                depthWrite={false}
                toneMapped={false}
                color={0x000000}
            />
        </mesh>
    );
};
