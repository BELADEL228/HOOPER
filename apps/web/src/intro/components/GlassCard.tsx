import { useMemo } from 'react';
import type { ReactNode } from 'react';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════════════
 *  GLASS CARD — fond translucide 3D + bordure lumineuse subtile
 *  Aucune transmission PBR (évite les render passes 3D)
 * ═══════════════════════════════════════════════════════════════════════════ */

interface GlassCardProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    width?: number;
    height?: number;
    opacity?: number;
    borderColor?: string;
    children?: ReactNode;
}

export const GlassCard = ({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    width = 1.4,
    height = 0.9,
    opacity = 0.9,
    borderColor = '#FFB800',
    children,
}: GlassCardProps) => {
    // Bordure (rectangle filaire)
    const borderGeo = useMemo(() => {
        const w = width / 2;
        const h = height / 2;
        const pts = new Float32Array([
            -w, -h, 0.002, w, -h, 0.002,
            w, -h, 0.002, w, h, 0.002,
            w, h, 0.002, -w, h, 0.002,
            -w, h, 0.002, -w, -h, 0.002,
        ]);
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
        return g;
    }, [width, height]);

    // Petite barre d'accent en haut de carte (identité HOOPERS)
    const accentGeo = useMemo(() => {
        const w = width / 2;
        const h = height / 2;
        const pts = new Float32Array([
            -w * 0.9, h - 0.04, 0.003, -w * 0.55, h - 0.04, 0.003,
        ]);
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
        return g;
    }, [width, height]);

    return (
        <group position={position} rotation={rotation} scale={scale}>
            {/* Corps de la carte */}
            <mesh>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial
                    color={0x0a0a0c}
                    transparent
                    opacity={0.72 * opacity}
                    roughness={0.32}
                    metalness={0.55}
                    depthWrite={false}
                />
            </mesh>

            {/* Voile clair (sensation verre) */}
            <mesh position={[0, 0, 0.001]}>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial
                    color={0xffffff}
                    transparent
                    opacity={0.045 * opacity}
                    depthWrite={false}
                />
            </mesh>

            {/* Bordure lumineuse */}
            <lineSegments>
                <primitive object={borderGeo} attach="geometry" />
                <lineBasicMaterial
                    color={borderColor}
                    transparent
                    opacity={0.35 * opacity}
                    depthWrite={false}
                />
            </lineSegments>

            {/* Accent haut */}
            <lineSegments>
                <primitive object={accentGeo} attach="geometry" />
                <lineBasicMaterial
                    color={borderColor}
                    transparent
                    opacity={0.9 * opacity}
                    depthWrite={false}
                />
            </lineSegments>

            {children}
        </group>
    );
};