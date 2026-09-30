// components/HudLine.tsx
import * as THREE from 'three';
import { useEffect, useMemo } from 'react';

interface HudLineProps {
    from: [number, number, number];
    to: [number, number, number];
    color?: number | string;
    opacity?: number;
}

/* ⚠️ CORRECTIF PERF : l'ancien useMemo dépendait de [from, to] — des tableaux
 *    recréés à CHAQUE rendu → une nouvelle géométrie GPU par frame, jamais
 *    libérée (fuite mémoire + saccades). On dépend maintenant des valeurs
 *    numériques, et la géométrie est libérée au démontage. */
export const HudLine = ({
    from,
    to,
    color = 0xFFB800,
    opacity = 0.8,
}: HudLineProps) => {
    const [fx, fy, fz] = from;
    const [tx, ty, tz] = to;

    const geometry = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute(
            'position',
            new THREE.Float32BufferAttribute([fx, fy, fz, tx, ty, tz], 3),
        );
        return g;
    }, [fx, fy, fz, tx, ty, tz]);

    useEffect(() => () => geometry.dispose(), [geometry]);

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
