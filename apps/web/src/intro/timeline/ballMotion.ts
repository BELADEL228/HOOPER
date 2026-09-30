import * as THREE from 'three';
import { clamp01, easeOutCubic, easeInOutCubic, easeOutQuad } from './timeline';

/* ═══════════════════════════════════════════════════════════════════════════
 *  BALL MOTION — trajectoire du ballon, fonction PURE du temps
 *
 *  Acte 1 (0 → ~2.7 s) : le ballon tombe, rebondit 3 fois (gravité réelle,
 *          restitution ~0.76) tout en avançant vers la caméra. Il roule
 *          (rotation liée à la distance parcourue) et se déforme à l'impact.
 *  Acte 2 (~2.7 s → 18 s) : le dernier rebond s'arrête à son apogée et le
 *          ballon passe en lévitation douce au-dessus du parquet (l'ombre de
 *          contact rend la hauteur lisible). Rotation sur axe incliné.
 *  Acte 3 (18 → 21 s) : il monte légèrement, rétrécit et s'efface.
 * ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
 *  ÉCHELLE DU BALLON — contrôle la taille visuelle par rapport au terrain
 *
 *  Ratio réel : diamètre ballon / largeur terrain = 0.24 m / 28 m ≈ 0.86 %
 *  Notre terrain fait 28 unités → le ballon devrait faire ~0.24 de diamètre.
 *
 *  Réglages :
 *    0.115 → très réaliste (ballon petit, comme à la TV)
 *    0.18  → compromis cinéma (recommandé)
 *    0.25  → ballon bien visible, un peu gros
 *    1.00  → taille d'origine (trop gros)
 * ═══════════════════════════════════════════════════════════════════════════ */
const BALL_SIZE = 0.85;

/* ═══════════════════════════════════════════════════════════════════════════
 *  PHYSIQUE
 * ═══════════════════════════════════════════════════════════════════════════ */

const G = 10;            // gravité (unités monde / s²)
const H0 = 2.2;          // hauteur de lâcher
const RESTITUTION = 0.76;
const V0 = Math.sqrt(2 * G * H0);
const FIRST_IMPACT = V0 / G;

interface Impact {
    t: number;       // instant de l'impact
    vIn: number;     // vitesse d'arrivée
    vUp: number;     // vitesse de rebond
}

const IMPACTS: Impact[] = (() => {
    const list: Impact[] = [];
    let t = FIRST_IMPACT;
    let vIn = V0;
    for (let i = 0; i < 3; i++) {
        const vUp = vIn * RESTITUTION;
        list.push({ t, vIn, vUp });
        t += (2 * vUp) / G;
        vIn = vUp;
    }
    return list;
})();

const LAST = IMPACTS[IMPACTS.length - 1];

export const IMPACT_TIMES: readonly number[] = IMPACTS.map((i) => i.t);
export const IMPACT_STRENGTH: readonly number[] = IMPACTS.map((i) => i.vIn / V0);
/** Instant où le dernier rebond atteint son apogée (vitesse verticale nulle) */
export const APEX_TIME = LAST.t + LAST.vUp / G;
const APEX_H = (LAST.vUp * LAST.vUp) / (2 * G);
/** Hauteur de lévitation stable (espace visible entre ballon et parquet) */
const HOVER_H = 0.16;

/* ═══════════════════════════════════════════════════════════════════════════
 *  ÉCHELLE — la balle reste stable pendant tout le carrousel,
 *  puis disparaît APRÈS les cards (S10 : 24.0 → 25.0 s).
 * ═══════════════════════════════════════════════════════════════════════════ */

export const ballScale = (time: number): number => {
    if (time < 1.6) return BALL_SIZE * (0.35 + 0.2 * easeOutCubic(time / 1.6));
    if (time < 3.2) return BALL_SIZE * (0.55 + 0.4 * easeOutCubic((time - 1.6) / 1.6));
    if (time < 5.0) return BALL_SIZE * (0.95 + 0.1 * easeInOutCubic((time - 3.2) / 1.8));
    if (time < 8.6) return BALL_SIZE * 1.05;
    if (time < 11.0) return BALL_SIZE * (1.05 - 0.15 * easeInOutCubic((time - 8.6) / 2.4));
    /* ⚡ Stable de 11 s à 24 s : la balle reste visible pendant tout le
     *    carrousel (S07, S08, S09). */
    if (time < 24.0) return BALL_SIZE * 0.9;
    /* ⚡ S10 : la balle disparaît progressivement — APRÈS les cards. */
    if (time < 25.0) return BALL_SIZE * (0.9 - 0.5 * easeInOutCubic(time - 24.0));
    return BALL_SIZE * (0.4 * (1 - clamp01((time - 25.0) / 1.0)));
};

export const ballOpacity = (time: number): number => {
    /* ⚡ Reste à 1 jusqu'à 24 s (fin de S09 = disparition des cards). */
    if (time < 24.0) return 1;
    /* ⚡ S10 : fade out pendant 1 s, APRÈS la dispersion des cards. */
    if (time < 25.0) return 1 - 0.85 * easeInOutCubic(time - 24.0);
    return 0.15 * (1 - clamp01((time - 25.0) / 1.0));
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  HAUTEUR AU-DESSUS DU SOL + VITESSE VERTICALE
 * ═══════════════════════════════════════════════════════════════════════════ */

const heightAbove = (time: number): { h: number; vy: number } => {
    if (time < FIRST_IMPACT) {
        return { h: H0 - 0.5 * G * time * time, vy: -G * time };
    }
    if (time < APEX_TIME) {
        let cur = IMPACTS[0];
        for (const imp of IMPACTS) if (time >= imp.t) cur = imp;
        const tau = time - cur.t;
        return { h: cur.vUp * tau - 0.5 * G * tau * tau, vy: cur.vUp - G * tau };
    }

    const k = easeInOutCubic(clamp01((time - APEX_TIME) / 2.3));
    const bobIn = clamp01((time - APEX_TIME) / 1.2);
    const bob = 0.035 * bobIn * (1 - Math.cos((time - APEX_TIME) * 1.7)) * 0.5 * 2;
    let h = APEX_H + (HOVER_H - APEX_H) * k + bob;

    /* ⚡ La montée "finale" commence à 24 s (S10), pas à 18 s. */
    if (time > 24.0) h += 0.35 * easeOutQuad(clamp01(time - 24.0));

    return { h, vy: 0 };
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  POSE
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface BallPose {
    x: number; y: number; z: number;
    scale: number;
    /** facteurs de déformation (squash & stretch) */
    sx: number; sy: number; sz: number;
    opacity: number;
    /** espace entre le bas du ballon et le sol (pour l'ombre) */
    gap: number;
    quaternion: THREE.Quaternion;
}

const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);
const AXIS_Z = new THREE.Vector3(0, 0, 1);
const qRoll = new THREE.Quaternion();
const qTilt = new THREE.Quaternion();
const qSpin = new THREE.Quaternion();

/** Écrit la pose dans `out` (aucune allocation par frame). */
export const computeBallPose = (time: number, out: BallPose): BallPose => {
    const scale = ballScale(time);
    const { h, vy } = heightAbove(time);

    // Déformation à l'impact (gaussienne courte) + léger étirement en vol
    let squash = 0;
    for (const imp of IMPACTS) {
        const dt = time - imp.t;
        if (Math.abs(dt) < 0.16) {
            squash = Math.max(squash, 0.22 * (imp.vIn / V0) * Math.exp(-((dt / 0.035) ** 2)));
        }
    }
    const stretch = 0.05 * Math.min(1, Math.abs(vy) / V0);
    const sy = 1 - squash + stretch;
    const sxz = 1 / Math.sqrt(sy);

    // Avancée vers la caméra pendant les rebonds (vitesse nulle à l'apogée)
    const p = clamp01(time / APEX_TIME);
    const z = -3 + 3 * easeOutQuad(p);
    /* ⚡ x réduit à 0.15 pour que le ballon reste centré (avant : 0.5) */
    const x = 0.15 * Math.pow(1 - p, 2);

    out.x = x;
    out.z = z;
    out.scale = scale;
    out.sx = sxz; out.sy = sy; out.sz = sxz;
    /* ⚡ +0.008 au lieu de +0.012 : le ballon est plus petit maintenant,
     *    donc l'offset peut être réduit. Le bas du ballon reste juste
     *    au-dessus des lignes du terrain (situées à 0.002). */
    out.y = scale * sy + h + 0.008;
    out.gap = Math.max(0, h);
    out.opacity = ballOpacity(time);

    // Rotation : roulement pendant l'approche, puis rotation sur axe incliné
    const roll = (z + 3) / 0.5;          // distance / rayon apparent
    const spin = 0.55 * time + (1.05 / 0.9) * (1 - Math.exp(-0.9 * time));
    qRoll.setFromAxisAngle(AXIS_X, roll);
    qTilt.setFromAxisAngle(AXIS_Z, 0.41);
    qSpin.setFromAxisAngle(AXIS_Y, spin);
    out.quaternion.copy(qRoll).multiply(qTilt).multiply(qSpin);
    return out;
};

export const createBallPose = (): BallPose => ({
    x: 0, y: 1, z: 0, scale: 1, sx: 1, sy: 1, sz: 1, opacity: 1, gap: 0,
    quaternion: new THREE.Quaternion(),
});