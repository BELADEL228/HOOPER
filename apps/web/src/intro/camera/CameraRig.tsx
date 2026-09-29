import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { lerp } from '../timeline/timeline';

type Keyframe = readonly [
    number,
    number, number, number,   // pos xyz
    number, number, number,   // look xyz
    number,                    // fov
];

/* Nouvelle timeline 21s */
const KEYFRAMES: readonly Keyframe[] = [
    [0, 0.0, 1.0, 15.0, 0, 1.0, 0, 50],  // S01 début
    [1.6, 0.0, 1.1, 8.0, 0, 1.1, 0, 50],  // S01 fin
    [3.2, 0.0, 1.4, 5.0, 0, 1.2, 0, 48],  // S02 fin
    [5.0, 3.2, 3.2, 6.5, 0, 0.6, 0, 48],  // S03 fin
    [6.8, 0.0, 8.0, 1.2, 0, 0.0, 0, 50],  // S04 fin (top-down)
    [8.6, 0.0, 4.6, 4.2, 0, 0.5, 0, 50],  // S05 fin
    [11.0, 2.4, 3.2, 5.0, 0, 0.5, 0, 48],  // S06 fin
    [13.0, 1.2, 2.6, 6.0, 0, 0.6, 0, 48],  // S07 fin
    [15.5, 0.6, 2.2, 5.6, 0, 0.6, 0, 48],  // S08 fin
    [18.0, 0.0, 1.9, 5.0, 0, 0.5, 0, 48],  // S09 fin
    [19.0, 0.0, 1.0, 4.2, 0, 0.3, 0, 46],  // S10 fin
    [21.0, 0.0, 0.0, 3.5, 0, 0.0, 0, 46],  // S11 fin
];

const findKeyframes = (time: number): [Keyframe, Keyframe, number] => {
    for (let i = 0; i < KEYFRAMES.length - 1; i++) {
        const a = KEYFRAMES[i];
        const b = KEYFRAMES[i + 1];
        if (time >= a[0] && time <= b[0]) {
            const t = (time - a[0]) / (b[0] - a[0] || 1);
            return [a, b, t];
        }
    }
    const last = KEYFRAMES[KEYFRAMES.length - 1];
    return [last, last, 0];
};

interface CameraRigProps {
    time: number;
    isMobile?: boolean;
    aspect?: number;
}

export const CameraRig = ({
    time,
    isMobile = false,
    aspect = 16 / 9,
}: CameraRigProps) => {
    const { camera } = useThree();
    const posRef = useRef(new THREE.Vector3());
    const lookRef = useRef(new THREE.Vector3());

    const pullback = isMobile ? 1.35 : aspect < 1.2 ? 1.15 : 1;
    const fovBoost = isMobile ? 1.28 : aspect < 1.2 ? 1.1 : 1;

    useFrame(() => {
        const [a, b, t] = findKeyframes(time);

        posRef.current.set(
            lerp(a[1], b[1], t),
            lerp(a[2], b[2], t),
            lerp(a[3], b[3], t) * pullback,
        );
        camera.position.copy(posRef.current);

        lookRef.current.set(
            lerp(a[4], b[4], t),
            lerp(a[5], b[5], t),
            lerp(a[6], b[6], t),
        );
        camera.lookAt(lookRef.current);

        const persp = camera as THREE.PerspectiveCamera;
        const newFov = lerp(a[7], b[7], t) * fovBoost;
        if (Math.abs(persp.fov - newFov) > 0.01) {
            persp.fov = newFov;
            persp.updateProjectionMatrix();
        }
    });

    return null;
};