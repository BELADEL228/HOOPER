// scenes/Scene04.tsx — Lignes tactiques top-down (9-12s)
import { useMemo } from 'react';
import * as THREE from 'three';
import { localProgress, SCENES, easeOutCubic } from '../timeline/timeline';
import { HudLine } from '../components/HudLine';
import { HudText } from '../components/HudText';

export const Scene04 = ({ time }: { time: number }) => {
    const p = localProgress(time, SCENES.S04.start, SCENES.S04.end);
    const appear = easeOutCubic(Math.min(p / 0.5, 1));
    const fade = p > 0.8 ? 1 - (p - 0.8) / 0.2 : 1;
    const opacity = appear * fade;

    // 4 trajectoires tactiques (déterministes, sans random)
    const trajectories = useMemo(
        () => [
            { from: [-4, 0.02, -2] as const, to: [3, 0.02, 1] as const, c: 0xFFB800 },
            { from: [-3, 0.02, 3] as const, to: [4, 0.02, -1] as const, c: 0xFFB800 },
            { from: [2, 0.02, 3] as const, to: [5, 0.02, 0] as const, c: 0xFF2A3B },
            { from: [-5, 0.02, 0] as const, to: [1, 0.02, 4] as const, c: 0xFFB800 },
        ],
        [],
    );

    return (
        <group visible={opacity > 0.01}>
            {trajectories.map((t, i) => (
                <HudLine
                    key={i}
                    from={t.from as unknown as [number, number, number]}
                    to={t.to as unknown as [number, number, number]}
                    color={t.c}
                    opacity={opacity * 0.7}
                />
            ))}

            <HudText
                position={[-6, 0.02, -3.5]}
                fontSize={0.14}
                color="#FFB800"
                opacity={opacity * 0.9}
                letterSpacing={0.24}
                fontWeight={700}
            >
                MOTION MAP
            </HudText>

            <HudText
                position={[-6, 0.02, -3.2]}
                fontSize={0.08}
                color="#A0A0A0"
                opacity={opacity * 0.75}
                letterSpacing={0.2}
            >
                FRAME 0042 · TACTICAL VIEW
            </HudText>
        </group>
    );
};