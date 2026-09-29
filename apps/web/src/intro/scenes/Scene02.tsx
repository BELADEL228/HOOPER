// scenes/Scene02.tsx — HUD circulaire autour du ballon (3-6s)
import { useMemo } from 'react';
import { localProgress, SCENES, easeOutCubic } from '../timeline/timeline';
import { HudCircle } from '../components/HudCircle';
import { HudText } from '../components/HudText';
import { HudLine } from '../components/HudLine';

export const Scene02 = ({ time }: { time: number }) => {
    const p = localProgress(time, SCENES.S02.start, SCENES.S02.end);
    const appear = easeOutCubic(Math.min(p / 0.6, 1));
    const fade = p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1;
    const opacity = appear * fade;

    const items = useMemo(
        () => [
            { r: 1.35, rot: [0, 0, 0], spd: 1 },
            { r: 1.7, rot: [0, 0, 0.35], spd: -1 },
            { r: 2.1, rot: [0, 0, -0.2], spd: 1 },
        ],
        [],
    );

    return (
        <group visible={opacity > 0.01}>
            {items.map((it, i) => (
                <HudCircle
                    key={i}
                    radius={it.r}
                    position={[0, 1.1, 0]}
                    rotation={[0, 0, it.rot[2] + time * 0.12 * it.spd]}
                    color={i === 0 ? 0xFFB800 : 0xffffff}
                    opacity={opacity * (0.7 - i * 0.15)}
                />
            ))}

            {/* Repères cardinaux */}
            <HudLine
                from={[0, 1.1, 0]}
                to={[2.1, 1.1, 0]}
                color={0xFFB800}
                opacity={opacity * 0.35}
            />
            <HudLine
                from={[0, 1.1, 0]}
                to={[-2.1, 1.1, 0]}
                color={0xFFB800}
                opacity={opacity * 0.35}
            />

            {/* Textes techniques */}
            <HudText
                position={[2.25, 1.1, 0]}
                fontSize={0.09}
                color="#FFB800"
                opacity={opacity * 0.85}
                letterSpacing={0.12}
            >
                CAL-001
            </HudText>
            <HudText
                position={[-2.25, 1.1, 0]}
                fontSize={0.09}
                color="#A0A0A0"
                opacity={opacity * 0.7}
                anchorX="right"
                letterSpacing={0.12}
            >
                DRIBBLE
            </HudText>
            <HudText
                position={[0, 3.35, 0]}
                fontSize={0.1}
                color="#FFFFFF"
                opacity={opacity * 0.8}
                anchorX="center"
                letterSpacing={0.28}
                fontWeight={600}
            >
                BASKETBALL
            </HudText>
        </group>
    );
};