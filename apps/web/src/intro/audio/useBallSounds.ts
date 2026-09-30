import { useEffect, useRef, type MutableRefObject } from 'react';
import { IMPACT_TIMES, IMPACT_STRENGTH } from '../timeline/ballMotion';

interface Options {
    timeRef: MutableRefObject<number>;
    /** Doit passer à true APRÈS un geste utilisateur (le clic « Démarrer »). */
    enabled: boolean;
    volume?: number;
    bounceSrc?: string;
    /** Instant (s) du hit final ; null pour le désactiver. */
    logoHitAt?: number | null;
    /** Décalage manuel en secondes (+ = son plus tard). */
    offset?: number;
}

const LOOKAHEAD = 0.1;
/** Un son en retard de moins de 0,5 s est joué tout de suite ; au-delà il est ignoré. */
const LATE_TOLERANCE = 0.5;

const makeNoise = (ctx: AudioContext, seconds = 0.12): AudioBuffer => {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
};

const synthBounce = (ctx: AudioContext, out: AudioNode, noise: AudioBuffer, when: number, strength: number) => {
    const osc = ctx.createOscillator();
    const body = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(170, when);
    osc.frequency.exponentialRampToValueAtTime(52, when + 0.13);
    body.gain.setValueAtTime(0.0001, when);
    body.gain.exponentialRampToValueAtTime(0.95 * strength, when + 0.004);
    body.gain.exponentialRampToValueAtTime(0.0001, when + 0.24);
    osc.connect(body).connect(out);
    osc.start(when);
    osc.stop(when + 0.26);

    const src = ctx.createBufferSource();
    const bp = ctx.createBiquadFilter();
    const click = ctx.createGain();
    src.buffer = noise;
    bp.type = 'bandpass';
    bp.frequency.value = 1400 + 900 * strength;
    bp.Q.value = 0.7;
    click.gain.setValueAtTime(0.0001, when);
    click.gain.exponentialRampToValueAtTime(0.35 * strength, when + 0.002);
    click.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
    src.connect(bp).connect(click).connect(out);
    src.start(when);
    src.stop(when + 0.1);
};

const synthLogoHit = (ctx: AudioContext, out: AudioNode, when: number) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, when);
    osc.frequency.exponentialRampToValueAtTime(40, when + 1.2);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.7, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.6);
    osc.connect(g).connect(out);
    osc.start(when);
    osc.stop(when + 1.7);

    const sh = ctx.createOscillator();
    const sg = ctx.createGain();
    sh.type = 'triangle';
    sh.frequency.setValueAtTime(1760, when);
    sg.gain.setValueAtTime(0.0001, when);
    sg.gain.exponentialRampToValueAtTime(0.06, when + 0.01);
    sg.gain.exponentialRampToValueAtTime(0.0001, when + 0.7);
    sh.connect(sg).connect(out);
    sh.start(when);
    sh.stop(when + 0.75);
};

export const useBallSounds = ({
    timeRef, enabled, volume = 0.8, bounceSrc, logoHitAt = 25.0, offset = 0,
}: Options) => {
    const volumeRef = useRef(volume);
    volumeRef.current = volume;

    useEffect(() => {
        if (!enabled) return;
        const AC: typeof AudioContext | undefined =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;

        const ctx = new AC();
        void ctx.resume().catch(() => undefined);

        /* ═══════════════════════════════════════════════════════════════
         *  CHAÎNE AUDIO :  source → master → compressor → destination
         *
         *  Le compresseur rend les rebonds plus "punchy" et homogènes :
         *  - threshold bas → attrape même les sons faibles
         *  - ratio élevé   → écrase les pics pour un rendu dense
         *  - attack rapide → garde le "transient" (le claquant)
         * ═══════════════════════════════════════════════════════════════ */
        const master = ctx.createGain();
        master.gain.value = volumeRef.current;

        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.knee.value = 10;
        compressor.ratio.value = 6;
        compressor.attack.value = 0.002;
        compressor.release.value = 0.15;

        master.connect(compressor);
        compressor.connect(ctx.destination);

        const noise = makeNoise(ctx);
        let sample: AudioBuffer | null = null;
        let cancelled = false;

        if (bounceSrc) {
            fetch(bounceSrc)
                .then((r) => r.arrayBuffer())
                .then((ab) => ctx.decodeAudioData(ab))
                .then((buf) => { if (!cancelled) sample = buf; })
                .catch((e) => console.warn('[Intro] Sample illisible → son synthétique.', e));
        }

        /* ═══════════════════════════════════════════════════════════════
         *  LECTURE D'UN REBOND
         * ═══════════════════════════════════════════════════════════════ */
        const playBounce = (when: number, strength: number) => {
            if (sample) {
                // ─── Sample utilisateur + click synthétique par-dessus ──
                const src = ctx.createBufferSource();
                const g = ctx.createGain();
                src.buffer = sample;
                src.playbackRate.value = 0.92 + 0.16 * strength;

                // ⚡ Gain plus élevé et moins "creux"
                g.gain.value = 0.75 + 0.25 * strength;

                src.connect(g).connect(master);
                src.start(when);

                // ⚡ Click aigu superposé pour rendre l'impact net
                const clickOsc = ctx.createOscillator();
                const clickGain = ctx.createGain();
                clickOsc.type = 'square';
                clickOsc.frequency.value = 2200;
                clickGain.gain.setValueAtTime(0.0001, when);
                clickGain.gain.exponentialRampToValueAtTime(0.14 * strength, when + 0.001);
                clickGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.025);
                clickOsc.connect(clickGain).connect(master);
                clickOsc.start(when);
                clickOsc.stop(when + 0.03);
            } else {
                // ─── Fallback synthétique ─────────────────────────────
                synthBounce(ctx, master, noise, when, strength);
            }
        };

        const fired = new Array<boolean>(IMPACT_TIMES.length).fill(false);
        let logoFired = false;
        let raf = 0;

        const loop = () => {
            const t = timeRef.current;
            master.gain.value = volumeRef.current;

            for (let i = 0; i < IMPACT_TIMES.length; i++) {
                const ti = IMPACT_TIMES[i] + offset;
                if (t < ti - 0.3) fired[i] = false;
                if (!fired[i] && t >= ti - LOOKAHEAD && t < ti + LATE_TOLERANCE) {
                    fired[i] = true;
                    playBounce(ctx.currentTime + Math.max(0, ti - t), IMPACT_STRENGTH[i]);
                }
            }
            if (logoHitAt !== null) {
                const tl = logoHitAt + offset;
                if (t < tl - 0.3) logoFired = false;
                if (!logoFired && t >= tl - LOOKAHEAD && t < tl + LATE_TOLERANCE) {
                    logoFired = true;
                    synthLogoHit(ctx, master, ctx.currentTime + Math.max(0, tl - t));
                }
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        return () => {
            cancelled = true;
            cancelAnimationFrame(raf);
            master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
            window.setTimeout(() => {
                compressor.disconnect();
                void ctx.close().catch(() => undefined);
            }, 300);
        };
    }, [enabled, bounceSrc, logoHitAt, offset, timeRef]);
};