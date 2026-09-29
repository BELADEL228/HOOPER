import { useCallback, useEffect, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
 *  useIntroSeen — détermine si l'utilisateur a déjà vu l'intro complète
 *
 *  ⚠️ Toutes les fonctions sont mémorisées avec useCallback
 *     pour éviter les re-renders infinis (bug du "useEffect qui se relance").
 * ═══════════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'hoopers-intro-seen';
const INTRO_VERSION = 'v1';

interface IntroSeenResult {
    hasSeenIntro: boolean;
    markIntroAsSeen: () => void;
    resetIntro: () => void;
}

export const useIntroSeen = (): IntroSeenResult => {
    const [hasSeenIntro, setHasSeenIntro] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        try {
            return window.localStorage.getItem(STORAGE_KEY) === INTRO_VERSION;
        } catch {
            return false;
        }
    });

    // ✅ useCallback avec deps vides → référence stable
    const markIntroAsSeen = useCallback(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, INTRO_VERSION);
            setHasSeenIntro(true);
        } catch {
            /* noop */
        }
    }, []);

    const resetIntro = useCallback(() => {
        try {
            window.localStorage.removeItem(STORAGE_KEY);
            setHasSeenIntro(false);
        } catch {
            /* noop */
        }
    }, []);

    /* Sync entre onglets */
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key !== STORAGE_KEY) return;
            setHasSeenIntro(e.newValue === INTRO_VERSION);
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    return { hasSeenIntro, markIntroAsSeen, resetIntro };
};