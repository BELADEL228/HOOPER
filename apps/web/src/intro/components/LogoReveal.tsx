import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { localProgress, SCENES, easeOutCubic, easeOutQuart } from '../timeline/timeline';

/* ═══════════════════════════════════════════════════════════════════════════
 *  LOGO + SLOGAN — Scène 11
 *  Rendu directement dans la scène 3D, plan frontal face caméra
 * ═══════════════════════════════════════════════════════════════════════════ */

export const LogoReveal = ({ time }: { time: number }) => {
    const groupRef = useRef<THREE.Group>(null);

    const p = localProgress(time, SCENES.S11.start, SCENES.S11.end);

    // Logo : entrée 0 → 0.35, stabilisation, léger maintien
    const logoIn = easeOutQuart(Math.min(p / 0.35, 1));
    const sloganIn = easeOutCubic(Math.max(0, Math.min((p - 0.35) / 0.35, 1)));

    // Sous-ligne animée après le slogan
    const lineIn = easeOutCubic(Math.max(0, Math.min((p - 0.65) / 0.2, 1)));

    const logoOpacity = logoIn;
    const sloganOpacity = sloganIn * 0.9;

    return (
        <group ref={groupRef} position={[0, 0.3, 1.5]}>
            {/* Logo HOOPERS — lettrage large, blanc, espacé */}
            <Text
                position={[0, 0.25, 0]}
                fontSize={0.9}
                color="#FFFFFF"
                fillOpacity={logoOpacity}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.22}
                fontWeight={800}
            >
                HOOPERS
            </Text>

            {/* Barre accent OR sous le logo */}
            <mesh position={[0, -0.28, 0]} scale={[logoIn, 1, 1]}>
                <planeGeometry args={[1.6, 0.012]} />
                <meshBasicMaterial color={0xFFB800} transparent opacity={logoIn} />
            </mesh>

            {/* Slogan */}
            <Text
                position={[0, -0.62, 0]}
                fontSize={0.16}
                color="#FFB800"
                fillOpacity={sloganOpacity}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.28}
                fontWeight={500}
            >
                Dribbler avec intention.
            </Text>

            {/* Fine ligne sous le slogan */}
            <mesh position={[0, -0.82, 0]} scale={[lineIn * 0.6, 1, 1]}>
                <planeGeometry args={[1, 0.006]} />
                <meshBasicMaterial color={0xFF2A3B} transparent opacity={lineIn * 0.7} />
            </mesh>
        </group>
    );
};