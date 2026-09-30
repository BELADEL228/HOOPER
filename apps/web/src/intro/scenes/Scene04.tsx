// scenes/Scene04.tsx — Lignes tactiques top-down (3.8-5.2 s)
import { useMemo } from 'react';
import { localProgress, SCENES, easeOutCubic } from '../timeline/timeline';
import { useSafeWidth } from '../timeline/useSafeWidth';
import { HudLine } from '../components/HudLine';
import { HudText } from '../components/HudText';

export const Scene04 = ({ time }: { time: number }) => {
    const p = localProgress(time, SCENES.S04.start, SCENES.S04.end);
    const appear = easeOutCubic(Math.min(p / 0.5, 1));
    const fade = p > 0.8 ? 1 - (p - 0.8) / 0.2 : 1;
    const opacity = appear * fade;

    /* ⚡ Adaptation mobile */
    const safeW = useSafeWidth(0.85);
    const s = Math.min(1, safeW / 5.5);

    const trajectories = useMemo(
        () => [
            { from: [-4, 0.02, -2] as const, to: [3, 0.02, 1] as const, c: 0xFFB800 },
            { from: [-3, 0.02, 3] as const, to: [4, 0.02, -1] as const, c: 0xFFB800 },
            { from: [2, 0.02, 3] as const, to: [5, 0.02, 0] as const, c: 0xFF2A3B },
            { from: [-5, 0.02, 0] as const, to: [1, 0.02, 4] as const, c: 0xFFB800 },
        ],
        [],
    );

    const scaleVec = (v: readonly [number, number, number]): [number, number, number] =>
        [v[0] * s, v[1], v[2] * s];

    return (
        <group visible={opacity > 0.01}>
            {trajectories.map((t, i) => (
                <HudLine
                    key={i}
                    from={scaleVec(t.from)}
                    to={scaleVec(t.to)}
                    color={t.c}
                    opacity={opacity * 0.7}
                />
            ))}

            <HudText
                position={[-6 * s, 0.02, -3.5]}
                fontSize={0.14 * s}
                color="#FFB800"
                opacity={opacity * 0.9}
                letterSpacing={0.24}
                fontWeight={700}
            >
                MOTION MAP
            </HudText>

            <HudText
                position={[-6 * s, 0.02, -3.2]}
                fontSize={0.08 * s}
                color="#A0A0A0"
                opacity={opacity * 0.75}
                letterSpacing={0.2}
            >
                FRAME 0042 · TACTICAL VIEW
            </HudText>
        </group>
    );
};