/* ═══════════════════════════════════════════════════════════════════════════
 *  TIMELINE — 28 s @ 30 FPS
 * ═══════════════════════════════════════════════════════════════════════════ */

export const FPS = 30;
export const TOTAL_DURATION = 28;

export const SCENES = {
    S01: { start: 0, end: 1.0 },
    S02: { start: 1.0, end: 2.4 },
    S03: { start: 2.4, end: 3.8 },
    S04: { start: 3.8, end: 5.2 },
    S05: { start: 5.2, end: 6.8 },
    S06: { start: 6.8, end: 9.5 },
    S07: { start: 9.5, end: 12.5 },
    S08: { start: 12.5, end: 15.5 },
    S09: { start: 15.5, end: 24.0 },   // carrousel 8.5 s
    S10: { start: 24.0, end: 25.0 },   // balle s'efface (1 s)
    S11: { start: 25.0, end: 28.0 },   // logo (3 s)
} as const;

export const COLORS_HEX = {
    BLACK: 0x050505,
    RED: 0xff2a3b,
    GOLD: 0xffb800,
    WHITE: 0xffffff,
    GREY: 0xa0a0a0,
} as const;

export const localProgress = (time: number, start: number, end: number): number => {
    if (time <= start) return 0;
    if (time >= end) return 1;
    return (time - start) / (end - start);
};

export const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

export const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeInOutCubic = (x: number) =>
    x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);
export const easeOutExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const smoothstep = (x: number) => x * x * (3 - 2 * x);

export const interp = (a: number, b: number, t: number, easing = easeInOutCubic): number =>
    a + (b - a) * easing(clamp01(t));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const easeOutQuad = (x: number) => 1 - (1 - x) * (1 - x);
export const easeOutBack = (x: number, s = 1.70158) => {
    const c3 = s + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
};
export const smootherstep = (x: number) => {
    const t = clamp01(x);
    return t * t * t * (t * (t * 6 - 15) + 10);
};
export const noise1 = (t: number, seed = 0): number =>
    Math.sin(t * 1.31 + seed * 12.9898) * 0.5 +
    Math.sin(t * 2.73 + seed * 78.233) * 0.3 +
    Math.sin(t * 5.17 + seed * 37.719) * 0.2;