import { useMemo, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp01, noise1 } from '../timeline/timeline';

/* ═══════════════════════════════════════════════════════════════════════════
 *  CAMERA RIG — trajectoire lissée (spline monotone PCHIP) + handheld
 *
 *  ⚡ v2 : keyframes recalés sur la timeline 28 s
 *  ⚡ v2 : la caméra reste TOUJOURS au-dessus du sol (Y ≥ 0.9) et regarde
 *         TOUJOURS à hauteur du ballon ou au-dessus (lookY ≥ 0.9) pour
 *         ne jamais plonger sous la balle.
 *  ⚡ v2 : le pullback s'applique aussi à Y (vue mobile moins rasante)
 * ═══════════════════════════════════════════════════════════════════════════ */

type Keyframe = readonly [
    number,
    number, number, number,   // pos xyz
    number, number, number,   // look xyz
    number,                   // fov
];

/* ═══════════════════════════════════════════════════════════════════════════
 *  KEYFRAMES — recalés sur la timeline 28 s
 *
 *  Règle : Y ≥ 0.9 et lookY ≥ 0.9 partout, SAUF pendant la vue top-down
 *  (S04) où la caméra est à Y=8 mais regarde TOUJOURS à Y ≥ 1.
 * ═══════════════════════════════════════════════════════════════════════════ */

const KEYFRAMES: readonly Keyframe[] = [
    /*  t      pos.x  pos.y  pos.z    look.x  look.y  look.z    fov */
    [0, 0.0, 1.2, 15.0, 0, 1.2, 0, 50],  // S01 début
    [1.0, 0.0, 1.2, 12.0, 0, 1.2, 0, 50],  // S01 fin
    [2.4, 0.0, 1.4, 8.0, 0, 1.3, 0, 48],  // S02 fin
    [3.8, 0.0, 1.6, 6.0, 0, 1.2, 0, 48],  // S03 fin
    [5.2, 2.8, 3.0, 6.5, 0, 1.0, 0, 48],  // S04 fin
    [6.8, 0.0, 7.5, 1.5, 0, 1.2, 0, 50],  // S05 fin (top-down mais look ≥ 1)
    [9.5, 0.0, 4.2, 4.5, 0, 1.2, 0, 50],  // S06 fin
    [12.5, 2.0, 3.0, 5.5, 0, 1.2, 0, 48],  // S07 fin
    [15.5, 0.8, 2.6, 7.0, 0, 1.2, 0, 48],  // S08 fin
    [19.0, 0.4, 2.2, 6.4, 0, 1.2, 0, 48],  // S09 milieu (carrousel)
    [24.0, 0.0, 1.8, 5.6, 0, 1.2, 0, 48],  // S09 fin (carrousel)
    [25.0, 0.0, 1.4, 4.6, 0, 1.2, 0, 46],  // S10 fin (balle fade)
    [28.0, 0.0, 1.2, 4.0, 0, 1.2, 0, 46],  // S11 fin (logo)
];

const N = KEYFRAMES.length;
const CHANNELS = 7;

/** Pentes PCHIP (Fritsch–Carlson) pour un canal : monotone entre keyframes. */
const buildTangents = (c: number): number[] => {
    const h: number[] = [];
    const d: number[] = [];
    for (let i = 0; i < N - 1; i++) {
        h.push(KEYFRAMES[i + 1][0] - KEYFRAMES[i][0]);
        d.push((KEYFRAMES[i + 1][c + 1] - KEYFRAMES[i][c + 1]) / h[i]);
    }
    const m = new Array<number>(N).fill(0);
    for (let i = 1; i < N - 1; i++) {
        if (d[i - 1] * d[i] <= 0) {
            m[i] = 0;
        } else {
            const w1 = 2 * h[i] + h[i - 1];
            const w2 = h[i] + 2 * h[i - 1];
            m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
        }
    }
    m[0] = 0;
    m[N - 1] = 0;
    return m;
};

const TANGENTS: number[][] = Array.from({ length: CHANNELS }, (_, c) => buildTangents(c));

const sample = (time: number, out: number[]): void => {
    let i = 0;
    while (i < N - 2 && time > KEYFRAMES[i + 1][0]) i++;
    const a = KEYFRAMES[i];
    const b = KEYFRAMES[i + 1];
    const h = b[0] - a[0];
    const u = clamp01((time - a[0]) / h);
    const u2 = u * u;
    const u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1;
    const h10 = u3 - 2 * u2 + u;
    const h01 = -2 * u3 + 3 * u2;
    const h11 = u3 - u2;
    for (let c = 0; c < CHANNELS; c++) {
        out[c] =
            h00 * a[c + 1] +
            h10 * h * TANGENTS[c][i] +
            h01 * b[c + 1] +
            h11 * h * TANGENTS[c][i + 1];
    }
};

/** Intensité du tremblement : faible en vue de dessus et à la fin. */
const shakeAmount = (t: number): number => {
    if (t > 5.6 && t < 7.8) return 0.25;          // top-down S04-S05
    if (t > 24.4) return 0.25 * (1 - clamp01((t - 24.4) / 1.6)); // fin
    return 1;
};

interface CameraRigProps {
    timeRef: MutableRefObject<number>;
    isMobile?: boolean;
    aspect?: number;
}

export const CameraRig = ({
    timeRef,
    isMobile = false,
    aspect = 16 / 9,
}: CameraRigProps) => {
    const { camera } = useThree();
    const buf = useMemo(() => new Array<number>(CHANNELS).fill(0), []);
    const look = useMemo(() => new THREE.Vector3(), []);

    const pullback = isMobile ? 1.35 : aspect < 1.2 ? 1.15 : 1;
    const fovBoost = isMobile ? 1.28 : aspect < 1.2 ? 1.1 : 1;

    useFrame(() => {
        const t = timeRef.current;
        sample(t, buf);

        const s = shakeAmount(t);

        /* Handheld : très faible amplitude, basse fréquence */
        const px = noise1(t * 0.9, 1) * 0.012 * s;
        const py = noise1(t * 0.8, 2) * 0.010 * s;
        const pz = noise1(t * 0.7, 3) * 0.008 * s;
        const lx = noise1(t * 1.1, 4) * 0.010 * s;
        const ly = noise1(t * 1.0, 5) * 0.008 * s;

        /* ⚡ Le pullback s'applique aussi à Y → sur mobile, la caméra
         *    recule ET s'élève légèrement, ce qui évite la vue rasante.
         *    On ajoute +0.3 sur Y minimum pour garantir qu'on ne passe
         *    jamais sous le sol après le handheld. */
        const camY = Math.max(0.9, buf[1] * (1 + (pullback - 1) * 0.4)) + py;
        camera.position.set(
            buf[0] + px,
            camY,
            buf[2] * pullback + pz,
        );

        /* ⚡ Le look reste TOUJOURS au-dessus du sol et au niveau du ballon. */
        const lookY = Math.max(0.9, buf[4] + ly);
        look.set(buf[3] + lx, lookY, buf[5]);
        camera.lookAt(look);

        /* Micro-roulis (respiration de l'opérateur) */
        camera.rotateZ(noise1(t * 0.6, 6) * 0.0035 * s);

        const persp = camera as THREE.PerspectiveCamera;
        const fov = (buf[6] + noise1(t * 0.5, 7) * 0.12 * s) * fovBoost;
        if (Math.abs(persp.fov - fov) > 0.005) {
            persp.fov = fov;
            persp.updateProjectionMatrix();
        }
    });

    return null;
};