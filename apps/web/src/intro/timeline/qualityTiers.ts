export interface QualityTier {
    name: 'ultra' | 'high' | 'medium' | 'low';
    dpr: number;
    msaa: number;
    dof: boolean;
    dofHeight: number;
    chromatic: boolean;
    noise: boolean;
    reflective: boolean;
    shadows: boolean;
    sparkles: number;
}

export const TIERS: readonly QualityTier[] = [
    { name: 'ultra', dpr: 2, msaa: 4, dof: true, dofHeight: 540, chromatic: true, noise: true, reflective: true, shadows: true, sparkles: 55 },
    { name: 'high', dpr: 1.5, msaa: 2, dof: true, dofHeight: 400, chromatic: false, noise: true, reflective: true, shadows: true, sparkles: 40 },
    { name: 'medium', dpr: 1.25, msaa: 0, dof: false, dofHeight: 300, chromatic: false, noise: false, reflective: false, shadows: true, sparkles: 24 },
    { name: 'low', dpr: 1, msaa: 0, dof: false, dofHeight: 300, chromatic: false, noise: false, reflective: false, shadows: false, sparkles: 12 },
];

const STORAGE_KEY = 'hoopers:intro-quality';

export const readInitialTier = (isMobile: boolean): number => {
    const fallback = isMobile ? 2 : 0;
    try {
        const q = new URLSearchParams(window.location.search).get('q');   // ?q=0..3 pour tester
        if (q !== null && /^[0-3]$/.test(q)) return Number(q);
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved !== null && /^[0-3]$/.test(saved)) return Math.max(Number(saved), fallback);
    } catch { /* stockage bloqué → défaut */ }
    return fallback;
};

export const saveTier = (tier: number): void => {
    try { window.localStorage.setItem(STORAGE_KEY, String(tier)); } catch { /* ignore */ }
};