import { useEffect, useRef, useState } from 'react';

interface AudioPlayerProps {
    /** URL du fichier (.mp4, .mp3, .m4a…) */
    src: string;
    /** Volume 0 à 1 */
    volume?: number;
    /** Boucler la piste */
    loop?: boolean;
    /** Si true → fondu de sortie puis stop */
    stop?: boolean;
    /** Durée du fondu en secondes */
    fadeOutDuration?: number;
    /** Callback quand le son est coupé */
    onStopped?: () => void;
    /** Si true → lance la lecture immédiatement (car un clic utilisateur
     *  a déjà eu lieu, ex. le bouton "Démarrer") */
    autoStart?: boolean;
}

export const AudioPlayer = ({
    src,
    volume = 0.5,
    loop = true,
    stop = false,
    fadeOutDuration = 1.5,
    onStopped,
    autoStart = false,
}: AudioPlayerProps) => {
    const mediaRef = useRef<HTMLVideoElement>(null);
    const stoppedRef = useRef(false);
    const rafRef = useRef<number | null>(null);
    const [hasInteracted, setHasInteracted] = useState(autoStart);

    /* ─── Détection de la première interaction ─────────────────────── */
    useEffect(() => {
        if (autoStart) return; // déjà déclenché par le parent

        const handleInteraction = () => {
            setHasInteracted(true);
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
            document.removeEventListener('pointerdown', handleInteraction);
        };

        document.addEventListener('click', handleInteraction);
        document.addEventListener('keydown', handleInteraction);
        document.addEventListener('touchstart', handleInteraction);
        document.addEventListener('pointerdown', handleInteraction);

        return () => {
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
            document.removeEventListener('pointerdown', handleInteraction);
        };
    }, [autoStart]);

    /* ─── Démarrage ────────────────────────────────────────────────── */
    useEffect(() => {
        const media = mediaRef.current;
        if (!hasInteracted || !media || stoppedRef.current) return;

        media.volume = volume;
        media.muted = false;

        const promise = media.play();
        if (promise && typeof promise.catch === 'function') {
            promise.catch((err) => {
                console.warn('[AudioPlayer] Lecture bloquée :', err);
            });
        }
    }, [hasInteracted, volume]);

    /* ─── Fondu de sortie ──────────────────────────────────────────── */
    useEffect(() => {
        const media = mediaRef.current;
        if (!stop || !media || stoppedRef.current) return;

        stoppedRef.current = true;
        const startVolume = media.volume;
        const startTime = performance.now();
        const duration = Math.max(fadeOutDuration, 0) * 1000;

        if (duration <= 0) {
            media.pause();
            media.currentTime = 0;
            media.volume = 0;
            onStopped?.();
            return;
        }

        const fade = () => {
            const elapsed = performance.now() - startTime;
            const t = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            media.volume = Math.max(0, startVolume * (1 - eased));

            if (t < 1) {
                rafRef.current = requestAnimationFrame(fade);
            } else {
                media.pause();
                media.currentTime = 0;
                media.volume = 0;
                onStopped?.();
            }
        };

        rafRef.current = requestAnimationFrame(fade);

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [stop, fadeOutDuration, onStopped]);

    /* ─── Cleanup au démontage ─────────────────────────────────────── */
    useEffect(() => {
        return () => {
            const media = mediaRef.current;
            if (media) {
                try {
                    media.pause();
                    media.currentTime = 0;
                    media.removeAttribute('src');
                    media.load();
                } catch {
                    /* noop */
                }
            }
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <video
            ref={mediaRef}
            src={src}
            loop={loop}
            preload="auto"
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            style={{
                position: 'fixed',
                width: 1,
                height: 1,
                opacity: 0,
                pointerEvents: 'none',
                left: -9999,
                top: -9999,
            }}
            aria-hidden="true"
        />
    );
};