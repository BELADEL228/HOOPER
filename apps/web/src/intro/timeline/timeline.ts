/* ═══════════════════════════════════════════════════════════════════════════
 *  TIMELINE — 21 s @ 30 FPS
 * ═══════════════════════════════════════════════════════════════════════════ */

export const TOTAL_DURATION = 21;
export const FPS = 30;

export const SCENES = {
    S01: { start: 0, end: 1.6 },
    S02: { start: 1.6, end: 3.2 },
    S03: { start: 3.2, end: 5.0 },
    S04: { start: 5.0, end: 6.8 },
    S05: { start: 6.8, end: 8.6 },
    S06: { start: 8.6, end: 11.0 },
    S07: { start: 11.0, end: 13.0 },
    S08: { start: 13.0, end: 15.5 },
    S09: { start: 15.5, end: 18.0 },
    S10: { start: 18.0, end: 19.0 },
    S11: { start: 19.0, end: 21.0 },
} as const;

export const COLORS_HEX = {
    BLACK: 0x050505,
    RED: 0xff2a3b,
    GOLD: 0xffb800,
    WHITE: 0xffffff,
    GREY: 0xa0a0a0,
} as const;

/* ─── Helpers ────────────────────────────────────────────────────────── */
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