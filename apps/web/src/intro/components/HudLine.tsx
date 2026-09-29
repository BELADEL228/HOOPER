// components/HudLine.tsx
import * as THREE from 'three';
import { useMemo } from 'react';

interface HudLineProps {
    from: [number, number, number];
    to: [number, number, number];
    color?: number | string;
    opacity?: number;
}

export const HudLine = ({
    from,
    to,
    color = 0xFFB800,
    opacity = 0.8,
}: HudLineProps) => {
    const geometry = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute(
            'position',
            new THREE.Float32BufferAttribute([...from, ...to], 3),
        );
        return g;
    }, [from, to]);

    return (
        <line>
            <primitive object={geometry} attach="geometry" />
            <lineBasicMaterial
                color={color}
                transparent
                opacity={opacity}
                depthWrite={false}
            />
        </line>
    );
};