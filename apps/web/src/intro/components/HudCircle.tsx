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

/* ⚠️ CORRECTIF PERF : l'opacité changeait à chaque frame et faisait
 *    reconstruire géométrie + matériau + LineLoop à chaque fois.
 *    Géométrie et matériau sont maintenant créés une seule fois ;
 *    seule l'opacité est mise à jour. */
export const HudCircle = ({
    radius,
    color = 0xFFB800,
    opacity = 0.7,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    segments = 96,
}: HudCircleProps) => {
    const geometry = useMemo(() => {
        const pts: number[] = [];
        for (let i = 0; i < segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            pts.push(Math.cos(a) * radius, Math.sin(a) * radius, 0);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        return g;
    }, [radius, segments]);

    const material = useMemo(
        () =>
            new THREE.LineBasicMaterial({
                color,
                transparent: true,
                opacity: 1,
                depthWrite: false,
            }),
        [color],
    );

    const line = useMemo(() => new THREE.LineLoop(geometry, material), [geometry, material]);

    material.opacity = opacity;

    useEffect(() => () => {
        geometry.dispose();
        material.dispose();
    }, [geometry, material]);

    return <primitive object={line} position={position} rotation={rotation} />;
};
