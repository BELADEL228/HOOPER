import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface HudCircleProps {
    radius: number;
    color?: number | string;
    opacity?: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
    segments?: number;
}

export const HudCircle = ({
    radius,
    color = 0xFFB800,
    opacity = 0.7,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    segments = 96,
}: HudCircleProps) => {
    /* ─── Objet Three.js complet via useMemo ────────────────────────── */
    const line = useMemo(() => {
        // Cercle fermé → LineLoop
        const pts: number[] = [];
        for (let i = 0; i < segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            pts.push(Math.cos(a) * radius, Math.sin(a) * radius, 0);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));

        const material = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity,
            depthWrite: false,
        });

        return new THREE.LineLoop(geometry, material);
    }, [radius, segments, color, opacity]);

    /* ─── Dispose au démontage ──────────────────────────────────────── */
    useEffect(() => {
        return () => {
            line.geometry.dispose();
            (line.material as THREE.Material).dispose();
        };
    }, [line]);

    /* ─── Rendu via <primitive> (contourne le conflit de typage JSX) ── */
    return (
        <primitive
            object={line}
            position={position}
            rotation={rotation}
        />
    );
};