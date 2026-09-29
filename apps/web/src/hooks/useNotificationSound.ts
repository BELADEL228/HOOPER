import { useCallback, useRef } from 'react';

/**
 * Hook pour jouer un son de notification via l'API Web Audio.
 * Pas de fichier requis, génère un "ding" programmatique.
 */
export function useNotificationSound() {
    const audioCtxRef = useRef<AudioContext | null>(null);

    const play = useCallback(() => {
        try {
            // Crée un AudioContext (unique par session)
            if (!audioCtxRef.current) {
                const Ctx =
                    window.AudioContext ||
                    (window as any).webkitAudioContext;
                if (!Ctx) return;
                audioCtxRef.current = new Ctx();
            }
            const ctx = audioCtxRef.current;
            if (!ctx) return;

            // ✅ Reprend l'AudioContext si suspendu (Chrome autoplay policy)
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => undefined);
            }

            const now = ctx.currentTime;

            // ─── Créer 2 oscillateurs pour un "ding-dong" ────────────────
            // Note 1 (haute) : 880 Hz (La5)
            const osc1 = ctx.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.value = 880;

            // Note 2 (basse, légèrement décalée) : 660 Hz (Mi5)
            const osc2 = ctx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.value = 660;

            // Enveloppe de volume (fondu)
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

            // Connecte tout
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            // Joue : première note immédiatement, seconde 150ms après
            osc1.start(now);
            osc1.stop(now + 0.25);
            osc2.start(now + 0.15);
            osc2.stop(now + 0.5);
        } catch (err) {
            console.warn('[NotificationSound] Play failed:', err);
        }
    }, []);

    /** À appeler au premier clic utilisateur pour "débloquer" le son */
    const unlock = useCallback(() => {
        try {
            if (!audioCtxRef.current) {
                const Ctx = window.AudioContext || (window as any).webkitAudioContext;
                if (Ctx) audioCtxRef.current = new Ctx();
            }
            audioCtxRef.current?.resume?.().catch(() => undefined);
        } catch {
            /* ignore */
        }
    }, []);

    return { play, unlock };
}