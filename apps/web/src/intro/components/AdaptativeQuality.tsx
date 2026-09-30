import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';

interface Props {
    timeRef: MutableRefObject<number>;
    onDecline: () => void;
    minFps?: number;
    warmup?: number;
    strikesNeeded?: number;
}

export const AdaptiveQuality = ({ timeRef, onDecline, minFps = 45, warmup = 1.0, strikesNeeded = 2 }: Props) => {
    const acc = useRef(0);
    const frames = useRef(0);
    const strikes = useRef(0);
    const declineRef = useRef(onDecline);
    declineRef.current = onDecline;

    useFrame((_, delta) => {
        if (timeRef.current < warmup) { acc.current = 0; frames.current = 0; return; }
        acc.current += delta;
        frames.current += 1;
        if (acc.current < 1.0) return;

        const fps = frames.current / acc.current;
        acc.current = 0;
        frames.current = 0;

        strikes.current = fps < minFps ? strikes.current + 1 : 0;
        if (strikes.current >= strikesNeeded) {
            strikes.current = 0;
            declineRef.current();
        }
    });
    return null;
};